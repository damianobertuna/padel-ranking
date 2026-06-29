'use server';

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logAction } from "@/lib/audit";
import { computeKingAndFanalino } from "@/lib/rankingCalc";
import dictAudit from "@/lib/i18n/dict-audit";

// Interfaccia per la struttura del set
export interface SetScore {
    team_a: number;
    team_b: number;
}

// ============================================================================
// HELPER SICUREZZA: Recupera identità utente (player o club_manager)
// ============================================================================
type UserIdentity = {
    type: 'player' | 'club_manager' | 'admin';
    userId: string;
    playerId?: number;
    displayName: string;
    preferredSide?: string;
};

async function resolveUserIdentity(supabase: any, authUserId: string): Promise<UserIdentity> {
    // 1. Check if user has a player profile
    const { data: player } = await supabase
        .from('players')
        .select('id, role, first_name, last_name, preferred_side')
        .eq('user_id', authUserId)
        .maybeSingle();

    if (player) {
        return {
            type: player.role === 'admin' ? 'admin' : 'player',
            userId: authUserId,
            playerId: player.id,
            displayName: `${player.first_name ?? ''} ${player.last_name ?? ''}`.trim() || 'Giocatore',
            preferredSide: player.preferred_side,
        };
    }

    // 2. No player profile — check if user is a club_manager
    const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authUserId)
        .maybeSingle();

        if (userRole?.role === 'club_manager') {
            // 3. Resolve real name from club_managers table (stored at invitation time)
            let displayName = 'Club Manager';
            const { data: manager } = await supabase
                .from('club_managers')
                .select('first_name, last_name')
                .eq('user_id', authUserId)
                .maybeSingle();

            if (manager?.first_name || manager?.last_name) {
                displayName = `${manager.first_name} ${manager.last_name}`.trim();
            }

            return {
                type: 'club_manager',
                userId: authUserId,
                displayName,
            };
        }

    throw new Error("ACCESSO NEGATO: Profilo utente non riconosciuto.");
}

// ============================================================================
// HELPER SICUREZZA: Verifica se l'utente è manager di un determinato circolo
// Note: utilizza auth.users ID (UUID), non player_id
// ============================================================================
async function isUserManagerOfClub(supabase: any, authUserId: string, clubId: number | null): Promise<boolean> {
    if (!clubId) return false;
    const { data } = await supabase
        .from('club_managers')
        .select('id')
        .eq('user_id', authUserId)
        .eq('club_id', clubId)
        .maybeSingle();
    return !!data;
}

/**
 * 1. CANCELLAZIONE DI UN MATCH IN PROGRAMMA
 */
export async function deletePendingMatch(matchId: string) {
    const supabase = await createClient();

        // Controlliamo l'autenticazione
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Utente non autenticato");

    // Risolvi identità (player o club_manager)
    const identity = await resolveUserIdentity(supabase, user.id);

    // Recuperiamo la partita per verificare lo stato e i partecipanti
    const { data: match } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();

    if (!match) throw new Error("Partita non trovata");
    if (match.status !== 'pending') throw new Error("Puoi cancellare solo partite in programma");

    // Sicurezza: Admin, Giocatore in campo, o Club Manager del circolo
    const isPlayerInMatch = identity.playerId
        ? [match.team_a_left_id, match.team_a_right_id, match.team_b_left_id, match.team_b_right_id].includes(identity.playerId)
        : false;

    const isManager = identity.type === 'club_manager'
        ? await isUserManagerOfClub(supabase, user.id, match.club_id)
        : false;

    if (identity.type !== 'admin' && !isPlayerInMatch && !isManager) {
        throw new Error("ACCESSO NEGATO: Non hai i permessi per cancellare questa partita.");
    }

    // Recuperiamo i nomi dei giocatori coinvolti per costruire la stringa di Log
    const { data: playersInMatch } = await supabase
        .from('players')
        .select('id, first_name, last_name')
        .in('id', [match.team_a_left_id, match.team_a_right_id, match.team_b_left_id, match.team_b_right_id].filter(Boolean));

    const getName = (id: number | null) => {
        if (id === null) return 'Slot Libero';
        const p = playersInMatch?.find(pl => pl.id === id);
        return p ? `${p.first_name} ${p.last_name}` : 'Sconosciuto';
    };

    const dettagliMatch = `${getName(match.team_a_left_id)}/${getName(match.team_a_right_id)} VS ${getName(match.team_b_left_id)}/${getName(match.team_b_right_id)}`;
    const operatore = identity.displayName;

    let qualifica: string = dictAudit.LABEL_QUALIFICA_PLAYER;
    if (identity.type === 'admin') qualifica = dictAudit.LABEL_QUALIFICA_ADMIN;
    else if (isManager) qualifica = dictAudit.LABEL_QUALIFICA_MANAGER;

    const tipoPartita = match.is_friendly ? 'Amichevole' : 'Classificata';
    const logDescription = `${qualifica} ${operatore} ha annullato la partita in programma: ${dettagliMatch}`;

    const { error: logError } = await logAction(
        'MATCH_DELETED',
        matchId,
        `[Match #${matchId.slice(0, 8)} - ${tipoPartita}] ${logDescription}`,
        {
            reason: 'Manuale',
            match_id: matchId,
            is_friendly: match.is_friendly,
            teams: {
                teamA: [match.team_a_left_id, match.team_a_right_id],
                teamB: [match.team_b_left_id, match.team_b_right_id]
            }
        }
    );

    if (logError) {
        console.error("❌ ERRORE CRITICO SCRITTURA AUDIT LOG CANCELLAZIONE:", logError.message);
        throw new Error(`Impossibile procedere: Errore nel registro delle attività`);
    }

    // Cancelliamo fisicamente il match e verifichiamo che sia stato rimosso
    const { data: deletedData, error: deleteError } = await supabase
        .from('matches')
        .delete()
        .eq('id', matchId)
        .select('id');

    if (deleteError) throw new Error(`Errore database: ${deleteError.message}`);

    // Se deletedData è vuoto/null, RLS ha bloccato la cancellazione senza errore
    if (!deletedData || deletedData.length === 0) {
        console.error("❌ RLS BLOCK: cancellazione match bloccata da Row Level Security per l'utente:", user.id);
        throw new Error("ACCESSO NEGATO: Impossibile cancellare la partita. Verifica i permessi (RLS).");
    }

    revalidatePath('/');
}

/**
 * 2. CREAZIONE DI UN NUOVO MATCH IN PROGRAMMA
 */
export async function createPendingMatch(data: {
    matchDate: string | null;
    matchType: 'male' | 'female' | 'mixed';
    teamALeft: number | null;
    teamARight: number | null;
    teamBLeft: number | null;
    teamBRight: number | null;
    clubId?: number | null;
    isFriendly?: boolean;
        courtType?: 'indoor' | 'outdoor';
}) {
    const supabase = await createClient();

        // Controlliamo l'autenticazione
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Utente non autenticato");

    // Risolvi identità (player o club_manager)
    const identity = await resolveUserIdentity(supabase, user.id);

    // --- ANTI-CLONING ---
    const rawPlayerIds = [data.teamALeft, data.teamARight, data.teamBLeft, data.teamBRight];
    const selectedPlayerIds = rawPlayerIds.filter((v): v is number => v !== null && v !== undefined);
    const uniquePlayerIds = new Set(selectedPlayerIds);
    if (uniquePlayerIds.size !== selectedPlayerIds.length) {
        throw new Error("ERRORE: Non puoi inserire lo stesso giocatore in più slot.");
    }

    // --- CALCOLO DINAMICO ORGANIZZATORE E SICUREZZA ---
    const isCreatorInMatch = identity.playerId ? selectedPlayerIds.includes(identity.playerId) : false;

    const isManager = identity.type === 'club_manager'
        ? await isUserManagerOfClub(supabase, user.id, data.clubId || null)
        : false;

    let matchOrganizerId = null;

    if (isCreatorInMatch) {
        matchOrganizerId = identity.playerId!;
    } else if (identity.type === 'admin') {
        matchOrganizerId = selectedPlayerIds.length > 0 ? selectedPlayerIds[0] : null;
    } else if (isManager) {
        // Il manager può creare partite vuote per il suo circolo: organizer = null
        matchOrganizerId = null;
    } else {
        throw new Error("OPERAZIONE NEGATA: Devi occupare almeno uno slot per creare una partita.");
    }

    // Inseriamo il match in stato pending includendo il flag amichevole
    const { data: matchId, error: matchError } = await supabase
        .from('matches')
        .insert([
            {
                match_date: data.matchDate || null,
                match_type: data.matchType,
                team_a_left_id: data.teamALeft,
                team_a_right_id: data.teamARight,
                team_b_left_id: data.teamBLeft,
                team_b_right_id: data.teamBRight,
                                club_id: data.clubId || null,
                status: 'pending',
                organizer_id: matchOrganizerId,
                is_friendly: data.isFriendly ?? false,
                court_type: data.courtType
            }
        ])
        .select('id')
        .single();

    if (matchError) throw new Error(`Errore database: ${matchError.message}`);

    // Recuperiamo i nomi per la compilazione del log
    const { data: playersInMatch } = await supabase
        .from('players')
        .select('id, first_name, last_name')
        .in('id', selectedPlayerIds);

    const getName = (id: number | null) => {
        if (id === null) return 'Slot Libero';
        const p = playersInMatch?.find(pl => pl.id === id);
        return p ? `${p.first_name} ${p.last_name}` : 'Sconosciuto';
    };

        const dettagliMatch = `${getName(data.teamALeft)}/${getName(data.teamARight)} VS ${getName(data.teamBLeft)}/${getName(data.teamBRight)}`;
    const operatore = identity.displayName;
    const tipoLabel = data.isFriendly ? "AMICHEVOLE" : "classificata";
    const tipoPartita = data.isFriendly ? 'Amichevole' : 'Classificata';

    let qualifica: string = dictAudit.LABEL_QUALIFICA_PLAYER;
    if (identity.type === 'admin') qualifica = dictAudit.LABEL_QUALIFICA_ADMIN;
    else if (isManager) qualifica = dictAudit.LABEL_QUALIFICA_MANAGER;

    const logDescription = `${qualifica} ${operatore} ha organizzato una nuova partita ${tipoLabel}: ${dettagliMatch} - ${data.matchType} - ${data.matchDate}`;

    // Scrittura Audit Log
    const { error: logError } = await logAction(
        'MATCH_CREATED',
        matchId.id,
        `[Match #${matchId.id.slice(0, 8)} - ${tipoPartita}] ${logDescription}`,
        {
            match_type: data.matchType,
            match_date: data.matchDate,
            club_id: data.clubId,
            organizer_id: matchOrganizerId,
            is_friendly: data.isFriendly ?? false,
            teams: {
                teamA: [data.teamALeft, data.teamARight],
                teamB: [data.teamBLeft, data.teamBRight]
            }
        }
    );

    if (logError) console.error("❌ ERRORE LOG CREAZIONE MATCH:", logError.message);

    revalidatePath('/');
}

/**
 * 3. RISOLUZIONE DI UN MATCH CON CALCOLO RANKING E AUDIT LOG
 */
export async function resolveMatchWithRanking(data: {
    matchId: string;
    score: SetScore[];
}) {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();

    try {
        console.log("🚀 Server Action avviata per Risoluzione Match ID:", data.matchId);

                // 1. Controllo Autenticazione ed Identità
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Utente non autenticato");

        // Risolvi identità (player o club_manager)
        const identity = await resolveUserIdentity(supabase, user.id);

        // 2. Recupero Match
        const { data: match } = await supabase.from('matches').select('*').eq('id', data.matchId).single();
        if (!match) throw new Error("Partita non trovata nel database");
        if (match.status !== 'pending') throw new Error("Questa partita è già stata risolta");

        // --- BLOCCO DI SICUREZZA ---
        const isPlayerInMatch = identity.playerId
            ? [match.team_a_left_id, match.team_a_right_id, match.team_b_left_id, match.team_b_right_id].includes(identity.playerId)
            : false;
        const isAdmin = identity.type === 'admin';
        const isManager = identity.type === 'club_manager'
            ? await isUserManagerOfClub(supabase, user.id, match.club_id)
            : false;

        if (!isAdmin && !isPlayerInMatch && !isManager) {
            throw new Error("VIOLAZIONE DI SICUREZZA: Non sei autorizzato a inserire il risultato per questa partita.");
        }
        // ----------------------------------------

                // 3. Validazione Score e Calcolo Vincitore
        const { finalWinningTeam, stringaPunteggio } = await evaluateMatchScore(data.score);

        // 4. Recupero e strutturazione Atleti
        const playerIds = [match.team_a_left_id, match.team_a_right_id, match.team_b_left_id, match.team_b_right_id];
        const { data: playersInMatch } = await supabase.from('players').select('*').in('id', playerIds);

        if (!playersInMatch || playersInMatch.length !== 4) {
            throw new Error("Impossibile risolvere: la partita non ha 4 giocatori validi.");
        }

        const teamA = playersInMatch.filter(p => p.id === match.team_a_left_id || p.id === match.team_a_right_id);
        const teamB = playersInMatch.filter(p => p.id === match.team_b_left_id || p.id === match.team_b_right_id);

        // 5. Calcolo Delta ELO
        let teamADelta = 0;
        let teamBDelta = 0;

        if (match.is_friendly) {
            console.log("🤝 Match Amichevole rilevato: Calcolo ELO e variazioni di punti ignorati.");
        } else {
            const deltas = await calculateCompetitiveDeltas(supabase, teamA, teamB, finalWinningTeam);
            teamADelta = deltas.teamADelta;
            teamBDelta = deltas.teamBDelta;
        }

        // 6. PREPARAZIONE SNAPSHOT RANKING
        const safeAdd = (rank: number, delta: number) => parseFloat((rank + delta).toFixed(2));

        const playerRankingDetails = [
            { id: teamA[0].id, name: `${teamA[0].first_name} ${teamA[0].last_name}`, old_ranking: teamA[0].ranking, new_ranking: safeAdd(teamA[0].ranking, teamADelta), delta: teamADelta },
            { id: teamA[1].id, name: `${teamA[1].first_name} ${teamA[1].last_name}`, old_ranking: teamA[1].ranking, new_ranking: safeAdd(teamA[1].ranking, teamADelta), delta: teamADelta },
            { id: teamB[0].id, name: `${teamB[0].first_name} ${teamB[0].last_name}`, old_ranking: teamB[0].ranking, new_ranking: safeAdd(teamB[0].ranking, teamBDelta), delta: teamBDelta },
            { id: teamB[1].id, name: `${teamB[1].first_name} ${teamB[1].last_name}`, old_ranking: teamB[1].ranking, new_ranking: safeAdd(teamB[1].ranking, teamBDelta), delta: teamBDelta }
        ];

        const rankingLogText = playerRankingDetails
            .map(p => `${p.name} (${p.old_ranking.toFixed(2)} ➡️ ${p.new_ranking.toFixed(2)})`)
            .join(' | ');

        // 7. AGGIORNAMENTO DATABASE
        const { error: matchError } = await supabaseAdmin
            .from('matches')
            .update({
                status: 'completed',
                winning_team: finalWinningTeam,
                score: data.score,
                team_a_delta: teamADelta,
                team_b_delta: teamBDelta,
                updated_at: new Date().toISOString()
            })
            .eq('id', data.matchId);

        if (matchError) throw new Error(`Errore chiusura partita: ${matchError.message}`);

        if (!match.is_friendly) {
            const playerUpdates = playerRankingDetails.map(p =>
                supabaseAdmin.from('players').update({ ranking: p.new_ranking }).eq('id', p.id)
            );
            await Promise.all(playerUpdates);
        }

        // 8. AUDIT LOG
        const nomeTeamA = `${teamA[0].first_name} ${teamA[0].last_name} / ${teamA[1].first_name} ${teamA[1].last_name}`;
        const nomeTeamB = `${teamB[0].first_name} ${teamB[0].last_name} / ${teamB[1].first_name} ${teamB[1].last_name}`;

        const esitoDescrizione = finalWinningTeam === 'A'
            ? `Vince il Team A (${nomeTeamA}) contro il Team B (${nomeTeamB})`
            : `Vince il Team B (${nomeTeamB}) contro il Team A (${nomeTeamA})`;

        const operatore = identity.displayName;
        const qualificaResolve = isAdmin ? dictAudit.QUALIFICA_ADMIN : (isManager ? dictAudit.QUALIFICA_MANAGER : dictAudit.QUALIFICA_PLAYER);

        const tipoPartita = match.is_friendly ? 'Amichevole' : 'Classificata';
        const logDetails = match.is_friendly
            ? `Il ${qualificaResolve} ${operatore} ha registrato l'AMICHEVOLE: ${esitoDescrizione} [${stringaPunteggio}]. Nessuna variazione.`
            : `Il ${qualificaResolve} ${operatore} ha chiuso il match: ${esitoDescrizione} [${stringaPunteggio}]. Elo: ${rankingLogText}`;

        const { error: logError } = await logAction('MATCH_RESOLVED', data.matchId, `[Match #${data.matchId.slice(0, 8)} - ${tipoPartita}] ${logDetails}`, {
            winning_team: finalWinningTeam,
            score: stringaPunteggio,
            is_completed: true,
            is_friendly: match.is_friendly,
            deltas: { team_a: teamADelta, team_b: teamBDelta },
            player_rankings: playerRankingDetails,
            resolved_at: new Date().toISOString()
        });

        if (logError) console.error("❌ ERRORE SCRITTURA LOG RISOLUZIONE MATCH:", logError.message);

        console.log("✅ Server Action completata con successo!");

        // 9. Pulizia Cache
        revalidatePath('/');
        revalidatePath('/admin/logs');
        playerIds.forEach((id) => {
            if (id) revalidatePath(`/player/${id}`);
        });

    } catch (globalError: any) {
        console.error("💥 ERRORE SERVER ACTION:", globalError.message);
        throw new Error(globalError.message || "Errore interno del server");
    }
}

/**
 * 4. AGGIORNAMENTO COMPONENTI IN LINEA (PARTITE APERTE)
 */
export async function updateMatchPlayers(matchId: string, updatedFields: {
    club_id?: number | null;
    team_a_left_id?: number | null;
    team_a_right_id?: number | null;
    team_b_left_id?: number | null;
    team_b_right_id?: number | null;
    match_type?: 'male' | 'female' | 'mixed';
    match_date?: string | null;
    court_type?: 'indoor' | 'outdoor';
    is_friendly?: boolean;
}) {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        throw new Error("Accesso negato: devi effettuare il login per modificare una partita.");
    }

    // Risolvi identità (player o club_manager)
    const identity = await resolveUserIdentity(supabase, user.id);

    const { data: oldMatch } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();

    if (!oldMatch) throw new Error("Match non trovato");

    const isUserInMatch = identity.playerId
        ? [oldMatch.team_a_left_id, oldMatch.team_a_right_id, oldMatch.team_b_left_id, oldMatch.team_b_right_id].includes(identity.playerId)
        : false;

    const isAdmin = identity.type === 'admin';
    const isOrganizer = identity.playerId ? identity.playerId === oldMatch.organizer_id : false;

    // Controlliamo se gestisce il circolo ATTUALE della partita
    const isManager = identity.type === 'club_manager'
        ? await isUserManagerOfClub(supabase, user.id, oldMatch.club_id)
        : false;

    // Se sta cercando di spostare la partita in un NUOVO circolo, deve avere i permessi anche per quello
    if (updatedFields.club_id !== undefined && updatedFields.club_id !== oldMatch.club_id && identity.type === 'club_manager') {
        const isManagerOfNewClub = await isUserManagerOfClub(supabase, user.id, updatedFields.club_id);
        if (!isManagerOfNewClub) {
            throw new Error("ACCESSO NEGATO: Non puoi spostare la partita in un circolo che non gestisci.");
        }
    }

    const canManage = isAdmin || isOrganizer || (!oldMatch.organizer_id && isUserInMatch) || isManager;

    if (!canManage) {
        throw new Error("ACCESSO NEGATO: Non hai i permessi per gestire questa partita.");
    }

    const { error } = await supabase
        .from('matches')
        .update(updatedFields)
        .eq('id', matchId);

    if (error) throw new Error(error.message);

    const modifiche: string[] = [];

    if (updatedFields.match_type !== undefined && updatedFields.match_type !== oldMatch.match_type) {
        modifiche.push(`Tipo match: da ${oldMatch.match_type} a ${updatedFields.match_type}`);
    }

    if (updatedFields.club_id !== undefined && updatedFields.club_id !== oldMatch.club_id) {
        const oldClubText = oldMatch.club_id ? `Club #${oldMatch.club_id}` : 'Nessuno';
        const newClubText = updatedFields.club_id ? `Club #${updatedFields.club_id}` : 'Nessuno';
        modifiche.push(`Campo: da ${oldClubText} a ${newClubText}`);
    }

    if (updatedFields.is_friendly !== undefined && updatedFields.is_friendly !== oldMatch.is_friendly) {
        modifiche.push(`Regolamento: da ${oldMatch.is_friendly ? 'Amichevole' : 'Classificata'} a ${updatedFields.is_friendly ? 'Amichevole' : 'Classificata'}`);
    }

    const slotKeys = ['team_a_left_id', 'team_a_right_id', 'team_b_left_id', 'team_b_right_id'] as const;
    // Collect all player IDs (old + new) to resolve names and scores
    const changedPlayerIds: number[] = [];
    slotKeys.forEach(key => {
        if (updatedFields[key] !== undefined && updatedFields[key] !== oldMatch[key]) {
            if (oldMatch[key] !== null) changedPlayerIds.push(oldMatch[key]);
            if (updatedFields[key] !== null) changedPlayerIds.push(updatedFields[key]);
        }
    });
    let playerInfoMap: Record<number, { name: string; score: number }> = {};
    if (changedPlayerIds.length > 0) {
        const { data: players } = await supabase
            .from('players')
            .select('id, first_name, last_name, ranking')
            .in('id', [...new Set(changedPlayerIds)]);
        if (players) {
            players.forEach(p => {
                playerInfoMap[p.id] = { name: `${p.first_name} ${p.last_name}`, score: p.ranking };
            });
        }
    }
    slotKeys.forEach(key => {
        if (updatedFields[key] !== undefined && updatedFields[key] !== oldMatch[key]) {
            const oldId = oldMatch[key];
            const newId = updatedFields[key];
            const oldName = oldId ? (playerInfoMap[oldId]?.name || `#${oldId}`) : 'Slot Libero';
            const newName = newId ? (playerInfoMap[newId]?.name || `#${newId}`) : 'Slot Libero';
            const newScore = newId && playerInfoMap[newId] ? `(p.${playerInfoMap[newId].score.toFixed(2)})` : '';
            modifiche.push(`${key}: ${oldName} ➡️ ${newName} ${newScore}`);
        }
    });

        if (modifiche.length > 0) {
        const operatore = identity.displayName;

        let qualifica: string = dictAudit.LABEL_QUALIFICA_GIOCATORE;
        if (isAdmin) qualifica = dictAudit.LABEL_QUALIFICA_ADMIN;
        else if (isManager) qualifica = dictAudit.LABEL_QUALIFICA_MANAGER;
        else if (isOrganizer) qualifica = dictAudit.LABEL_QUALIFICA_ORGANIZER;

        const tipoPartita = oldMatch.is_friendly ? 'Amichevole' : 'Classificata';
        await logAction(
            'MATCH_UPDATED',
            matchId,
            `[Match #${matchId.slice(0, 8)} - ${tipoPartita}] ${qualifica} ${operatore} ha modificato il match: ${modifiche.join('; ')}`,
            {
                previous_data: oldMatch,
                new_data: updatedFields
            }
        );
    }

    revalidatePath('/');
}

export async function leaveMatchAction(matchId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Utente non autenticato");

    // Solo i player con profilo possono lasciare una partita
    const identity = await resolveUserIdentity(supabase, user.id);
    if (!identity.playerId) {
        throw new Error("I Club Manager non possono abbandonare una partita perché non sono in campo.");
    }

    const { data: match, error: fetchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();

    if (fetchError || !match) throw new Error("Match non trovato");

        let slotToClear: string | null = null;
    if (match.team_a_left_id === identity.playerId) slotToClear = 'team_a_left_id';
    else if (match.team_a_right_id === identity.playerId) slotToClear = 'team_a_right_id';
    else if (match.team_b_left_id === identity.playerId) slotToClear = 'team_b_left_id';
    else if (match.team_b_right_id === identity.playerId) slotToClear = 'team_b_right_id';

    if (!slotToClear) {
        throw new Error("Impossibile uscire: non sei iscritto a questa partita.");
    }

    const allSlots = [
        match.team_a_left_id, match.team_a_right_id,
        match.team_b_left_id, match.team_b_right_id
    ];

    const remainingPlayers = allSlots.filter(id => id !== null && id !== identity.playerId);

    // Fetch own player details (first_name, last_name, ranking) for the audit log
    const { data: leaverPlayer } = await supabase
        .from('players')
        .select('first_name, last_name, ranking')
        .eq('id', identity.playerId)
        .maybeSingle();
    const leaverName = leaverPlayer ? `${leaverPlayer.first_name} ${leaverPlayer.last_name}` : identity.displayName;
    const leaverScore = leaverPlayer ? `(p.${leaverPlayer.ranking.toFixed(2)})` : '';

    let updatePayload: Record<string, any> = { [slotToClear]: null };
    let shouldDeleteMatch = false;
    let logMessage = `Il giocatore ${leaverName} ${leaverScore} ha lasciato la partita (slot ${slotToClear}).`;

    if (remainingPlayers.length === 0) {
        shouldDeleteMatch = true;
    } else if (match.organizer_id === identity.playerId) {
        const newOrganizerId = remainingPlayers[0];
        updatePayload.organizer_id = newOrganizerId;
        logMessage += ` Il ruolo di Organizzatore è passato automaticamente al giocatore ID: ${newOrganizerId}.`;
    }

    if (shouldDeleteMatch) {
        const { error: deleteError } = await supabase.from('matches').delete().eq('id', matchId);
        if (deleteError) throw new Error(`Errore eliminazione match vuoto: ${deleteError.message}`);

        const tipoPartitaAuto = match.is_friendly ? 'Amichevole' : 'Classificata';
        await logAction('MATCH_DELETED_AUTO', matchId, `[Match #${matchId.slice(0, 8)} - ${tipoPartitaAuto}] Match eliminato automaticamente perché vuoto dopo l'uscita dell'ultimo giocatore.`);
    } else {
        const { error: updateError } = await supabase
            .from('matches')
            .update(updatePayload)
            .eq('id', matchId);
        if (updateError) throw new Error(`Errore aggiornamento slot: ${updateError.message}`);

        const tipoPartitaLeft = match.is_friendly ? 'Amichevole' : 'Classificata';
        await logAction('PLAYER_LEFT_MATCH', matchId, `[Match #${matchId.slice(0, 8)} - ${tipoPartitaLeft}] ${logMessage}`);
    }

    revalidatePath('/');
}

export async function joinMatchAction(matchId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Utente non autenticato");

    // Solo i player con profilo possono unirsi a una partita
    const identity = await resolveUserIdentity(supabase, user.id);
    if (!identity.playerId) {
        throw new Error("I Club Manager non possono unirsi a una partita perché non hanno un profilo giocatore.");
    }

    const { data: match, error: fetchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();

    if (fetchError || !match) throw new Error("Match non trovato");

        const allSlots = [
        match.team_a_left_id, match.team_a_right_id,
        match.team_b_left_id, match.team_b_right_id
    ];

    if (allSlots.includes(identity.playerId)) {
        throw new Error("Sei già iscritto a questa partita.");
    }

    const preferredSide = identity.preferredSide || 'Both';
    const canPlayLeft = preferredSide === 'Left' || preferredSide === 'Both';
    const canPlayRight = preferredSide === 'Right' || preferredSide === 'Both';

    let slotToFill: string | null = null;

    if (canPlayLeft && !match.team_a_left_id) slotToFill = 'team_a_left_id';
    else if (canPlayLeft && !match.team_b_left_id) slotToFill = 'team_b_left_id';

    if (!slotToFill && canPlayRight && !match.team_a_right_id) slotToFill = 'team_a_right_id';
    else if (!slotToFill && canPlayRight && !match.team_b_right_id) slotToFill = 'team_b_right_id';

    if (!slotToFill) {
        throw new Error(`Impossibile unirsi: nessuno slot disponibile per la tua preferenza (${preferredSide}).`);
    }

    const { error: updateError } = await supabase
        .from('matches')
        .update({ [slotToFill]: identity.playerId })
        .eq('id', matchId);

    if (updateError) throw new Error(`Errore durante l'iscrizione: ${updateError.message}`);

    // Fetch own player details (first_name, last_name, ranking) for the audit log
    const { data: joinerPlayer } = await supabase
        .from('players')
        .select('first_name, last_name, ranking')
        .eq('id', identity.playerId)
        .maybeSingle();
    const joinerName = joinerPlayer ? `${joinerPlayer.first_name} ${joinerPlayer.last_name}` : identity.displayName;
    const joinerScore = joinerPlayer ? `(p.${joinerPlayer.ranking.toFixed(2)})` : '';

    const tipoPartitaJoin = match.is_friendly ? 'Amichevole' : 'Classificata';
    await logAction(
        'PLAYER_JOINED_MATCH',
        matchId,
        `[Match #${matchId.slice(0, 8)} - ${tipoPartitaJoin}] Il giocatore ${joinerName} ${joinerScore} si è unito alla partita nello slot ${slotToFill}.`
    );

    revalidatePath('/');
}

// ============================================================================
// HELPER FUNCTIONS (Logica di Business Estratta)
// ============================================================================

/**
 * Valida i punteggi e determina il team vincente
 */
export async function evaluateMatchScore(score: SetScore[]): Promise<{ finalWinningTeam: 'A' | 'B', stringaPunteggio: string }> {
    if (!score || score.length < 2) {
        throw new Error("I dati dei set sono incompleti. Almeno i primi 2 set sono obbligatori.");
    }

    let setsWonA = 0;
    let setsWonB = 0;

        for (let i = 0; i < score.length; i++) {
        const set = score[i];
        const index = i;
        const valid = await isSetValid(set.team_a, set.team_b, index);
        if (!valid) {
            throw new Error(
                `Punteggio non valido al Set ${index + 1}: [${set.team_a}-${set.team_b}]. ` +
                (index < 2
                    ? `I set normali finiscono a 6 (con 2 di scarto) o a 7 (7-5, 7-6).`
                    : `Il terzo set deve finire a 6, 7 oppure essere un Super Tie-Break a 10 (con 2 di scarto).`)
            );
        }

        if (set.team_a > set.team_b) setsWonA++;
        else if (set.team_b > set.team_a) setsWonB++;
    }

    if (setsWonA === setsWonB) {
        throw new Error("Pareggio nei set impossibile. Inserisci il terzo set per decretare il vincitore.");
    }

    return {
        finalWinningTeam: setsWonA > setsWonB ? 'A' : 'B',
        stringaPunteggio: score.map(s => `${s.team_a}-${s.team_b}`).join(" / ")
    };
}

/**
 * Calcola i delta applicando le regole complesse per King e Fanalino
 */
async function calculateCompetitiveDeltas(
    supabase: any,
    teamA: any[],
    teamB: any[],
    finalWinningTeam: 'A' | 'B'
): Promise<{ teamADelta: number, teamBDelta: number }> {

    const { data: allPlayers } = await supabase.from('players').select('*');

    const {
        kingLeftIds, kingRightIds, kingBothIds,
        lastPlaceLeftIds, lastPlaceRightIds, lastPlaceBothIds
    } = computeKingAndFanalino(allPlayers || []);

    const isKing = (p: any) => kingLeftIds.includes(p.id) || kingRightIds.includes(p.id) || kingBothIds.includes(p.id);
    const isFanalino = (p: any) => lastPlaceLeftIds.includes(p.id) || lastPlaceRightIds.includes(p.id) || lastPlaceBothIds.includes(p.id);

    const winners = finalWinningTeam === 'A' ? teamA : teamB;
    const losers = finalWinningTeam === 'A' ? teamB : teamA;

    const isStrictKing = (p: any) => isKing(p);
    const isStrictFanalino = (p: any) => isFanalino(p) && !isKing(p);

    const winnersHaveKing = winners.some(isStrictKing);
    const losersHaveKing = losers.some(isStrictKing);
    const bothTeamsHaveKing = winnersHaveKing && losersHaveKing;

    const winnersHaveFanalino = winners.some(isStrictFanalino);
    const losersHaveFanalino = losers.some(isStrictFanalino);
    const bothTeamsHaveFanalino = winnersHaveFanalino && losersHaveFanalino;

    let winnerDelta = 0.05;
    let loserDelta = -0.05;

    if (bothTeamsHaveKing || bothTeamsHaveFanalino) {
        winnerDelta = 0.05;
        loserDelta = -0.05;
    } else {
        if (losersHaveKing && !winnersHaveKing) winnerDelta = 0.10;
        if (losers.every(isStrictKing) && !winnersHaveKing) loserDelta = -0.10;
        if (winnersHaveFanalino) winnerDelta = 0.10;
    }

    return {
        teamADelta: finalWinningTeam === 'A' ? winnerDelta : loserDelta,
        teamBDelta: finalWinningTeam === 'B' ? winnerDelta : loserDelta
    };
}

// Funzione helper per validare un singolo set di Padel/Tennis
export async function isSetValid(teamA: number, teamB: number, setIndex: number): Promise<boolean> {
    if (teamA < 0 || teamB < 0) return false;
    if (teamA === teamB) return false;

    const winner = Math.max(teamA, teamB);
    const loser = Math.min(teamA, teamB);
    const diff = winner - loser;

    if (setIndex < 2) {
        if (winner === 6 && loser <= 4) return true;
        if (winner === 7 && (loser === 5 || loser === 6)) return true;
        return false;
    }

    if (setIndex === 2) {
        if (winner === 6 && loser <= 4) return true;
        if (winner === 7 && (loser === 5 || loser === 6)) return true;
        if (winner >= 10 && diff >= 2) {
            if (winner === 10 && loser <= 8) return true;
            if (winner > 10 && diff === 2) return true;
        }
        return false;
    }

    return false;
}
