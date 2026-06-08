'use server';

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logAction } from "@/lib/audit";
import { computeKingAndFanalino } from "@/lib/rankingCalc";

// Interfaccia per la struttura del set
export interface SetScore {
    team_a: number;
    team_b: number;
}

/**
 * 1. CANCELLAZIONE DI UN MATCH IN PROGRAMMA
 */
export async function deletePendingMatch(matchId: string) {
    const supabase = await createClient();

    // Controlliamo l'autenticazione
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Utente non autenticato");

    // Recuperiamo il profilo del giocatore operativo
    const { data: currentUserPlayer } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (!currentUserPlayer) throw new Error("Profilo giocatore non trovato");

    // Recuperiamo la partita per verificare lo stato e i partecipanti
    const { data: match } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();

    if (!match) throw new Error("Partita non trovata");
    if (match.status !== 'pending') throw new Error("Puoi cancellare solo partite in programma");

    // Sicurezza: Può cancellare solo l'admin o uno dei 4 giocatori scesi in campo
    const isPlayerInMatch =
        currentUserPlayer.id === match.team_a_left_id ||
        currentUserPlayer.id === match.team_a_right_id ||
        currentUserPlayer.id === match.team_b_left_id ||
        currentUserPlayer.id === match.team_b_right_id;

    if (currentUserPlayer.role !== 'admin' && !isPlayerInMatch) {
        throw new Error("Non hai i permessi per cancellare questa partita");
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
    const operatore = `${currentUserPlayer.first_name} ${currentUserPlayer.last_name}`;

    const logDescription = currentUserPlayer.role === 'admin'
        ? `L'admin ${operatore} ha annullato la partita in programma: ${dettagliMatch}`
        : `Il giocatore ${operatore} ha annullato la propria partita in programma: ${dettagliMatch}`;

    const { error: logError } = await logAction(
        'MATCH_DELETED',
        matchId,
        logDescription,
        {
            reason: 'Manuale',
            match_id: matchId,
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

    // Cancelliamo fisicamente il match
    const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', matchId);

    if (error) throw new Error(error.message);

    revalidatePath('/');
}

/**
 * 2. CREAZIONE DI UN NUOVO MATCH IN PROGRAMMA (Aggiornato con isFriendly)
 */
export async function createPendingMatch(data: {
    matchDate: string | null;
    matchType: 'male' | 'female' | 'mixed';
    teamALeft: number | null;
    teamARight: number | null;
    teamBLeft: number | null;
    teamBRight: number | null;
    clubId?: number | null;
    isFriendly?: boolean; // Nuovo campo opzionale
}) {
    const supabase = await createClient();

    // Controlliamo l'autenticazione
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Utente non autenticato");

    const { data: currentUserPlayer } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (!currentUserPlayer) throw new Error("Profilo giocatore non trovato");

    // --- CALCOLO DINAMICO ORGANIZZATORE E SICUREZZA ---
    const selectedPlayerIds = [data.teamALeft, data.teamARight, data.teamBLeft, data.teamBRight].filter(Boolean) as number[];
    const isCreatorInMatch = selectedPlayerIds.includes(currentUserPlayer.id);

    let matchOrganizerId = null;

    if (isCreatorInMatch) {
        // Regola A: Se chi crea gioca, è lui il dominus.
        matchOrganizerId = currentUserPlayer.id;
    } else if (currentUserPlayer.role === 'admin') {
        // Regola B: L'admin sta creando un match per terzi.
        matchOrganizerId = selectedPlayerIds.length > 0 ? selectedPlayerIds[0] : null;
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
                is_friendly: data.isFriendly ?? false // Mappatura a DB
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
    const operatore = `${currentUserPlayer.first_name} ${currentUserPlayer.last_name}`;
    const tipoLabel = data.isFriendly ? "AMICHEVOLE" : "classificata";

    const logDescription = currentUserPlayer.role === 'admin'
        ? `L'admin ${operatore} ha creato una nuova partita ${tipoLabel}: ${dettagliMatch} - ${data.matchType} - ${data.matchDate}`
        : `Il giocatore ${operatore} ha organizzato una nuova partita ${tipoLabel}: ${dettagliMatch} - ${data.matchType} - ${data.matchDate}`;

    // Scrittura Audit Log
    const { error: logError } = await logAction(
        'MATCH_CREATED',
        matchId.id,
        logDescription,
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
 * 3. RISOLUZIONE DI UN MATCH (Ottimizzato con bypass Ranking per Amichevoli)
 */
export async function resolveMatchWithRanking(data: {
    matchId: string;
    score: SetScore[];
}) {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();

    try {
        console.log("🚀 Server Action avviata per Risoluzione Match ID:", data.matchId);

        // Controllo Autenticazione ed Identità
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Utente non autenticato");

        const { data: currentUserPlayer } = await supabase
            .from('players')
            .select('*')
            .eq('user_id', user.id)
            .single();
        if (!currentUserPlayer) throw new Error("Profilo giocatore non trovato");

        // Recupero info della partita da chiudere (ci serve is_friendly)
        const { data: match } = await supabase
            .from('matches')
            .select('*')
            .eq('id', data.matchId)
            .single();

        if (!match) throw new Error("Partita non trovata nel database");
        if (match.status !== 'pending') throw new Error("Questa partita è già stata risolta");

        // VALIDAZIONE SET E VINCITORE
        if (!data.score || data.score.length < 2) {
            throw new Error("I dati dei set sono incompleti. Almeno i primi 2 set sono obbligatori.");
        }

        let setsWonA = 0;
        let setsWonB = 0;

        data.score.forEach((set, index) => {
            if (!isSetValid(set.team_a, set.team_b, index)) {
                throw new Error(
                    `Punteggio non valido al Set ${index + 1}: [${set.team_a}-${set.team_b}]. ` +
                    (index < 2
                        ? `I set normali finiscono a 6 (con 2 di scarto) o a 7 (7-5, 7-6).`
                        : `Il terzo set deve finire a 6, 7 oppure essere un Super Tie-Break a 10 (con 2 di scarto).`)
                );
            }

            if (set.team_a > set.team_b) setsWonA++;
            else if (set.team_b > set.team_a) setsWonB++;
        });

        if (setsWonA === setsWonB) {
            throw new Error("Pareggio nei set impossibile. Inserisci il terzo set per decretare il vincitore.");
        }

        const finalWinningTeam = setsWonA > setsWonB ? 'A' : 'B';
        const stringaPunteggio = data.score.map(s => `${s.team_a}-${s.team_b}`).join(" / ");

        // Recupero atleti per la strutturazione dei team
        const playerIds = [match.team_a_left_id, match.team_a_right_id, match.team_b_left_id, match.team_b_right_id];
        const { data: playersInMatch } = await supabase.from('players').select('*').in('id', playerIds);

        if (!playersInMatch || playersInMatch.length !== 4) {
            throw new Error("Impossibile risolvere: la partita non ha 4 giocatori validi.");
        }

        const teamA = playersInMatch.filter(p => p.id === match.team_a_left_id || p.id === match.team_a_right_id);
        const teamB = playersInMatch.filter(p => p.id === match.team_b_left_id || p.id === match.team_b_right_id);

        let teamADelta = 0;
        let teamBDelta = 0;

        // ========================================================
        // GESTIONE DEL RANKING: INTERRUTTORE DI FLUSSO
        // ========================================================
        if (match.is_friendly) {
            // Se il match è un'amichevole, i delta restano a zero assoluto.
            teamADelta = 0;
            teamBDelta = 0;
            console.log("🤝 Match Amichevole rilevato: Calcolo ELO e variazioni di punti ignorati.");
        } else {
            // Eseguiamo i calcoli complessi solo per i match competitivi
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

            teamADelta = finalWinningTeam === 'A' ? winnerDelta : loserDelta;
            teamBDelta = finalWinningTeam === 'B' ? winnerDelta : loserDelta;
        }

        // ========================================================
        // INSERIMENTO COMPRENSIVO SU DB (ADMIN CLIENT)
        // ========================================================

        // 1. CHIUDIAMO LA CARD DEL MATCH
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

        // 2. AGGIORNIAMO LE CLASSIFICHE REALI (Solo se NON amichevole)
        if (!match.is_friendly) {
            const safeAdd = (rank: number, delta: number) => parseFloat((rank + delta).toFixed(2));
            const playerUpdates = [
                supabaseAdmin.from('players').update({ ranking: safeAdd(teamA[0].ranking, teamADelta) }).eq('id', teamA[0].id),
                supabaseAdmin.from('players').update({ ranking: safeAdd(teamA[1].ranking, teamADelta) }).eq('id', teamA[1].id),
                supabaseAdmin.from('players').update({ ranking: safeAdd(teamB[0].ranking, teamBDelta) }).eq('id', teamB[0].id),
                supabaseAdmin.from('players').update({ ranking: safeAdd(teamB[1].ranking, teamBDelta) }).eq('id', teamB[1].id)
            ];
            await Promise.all(playerUpdates);
        }

        // ========================================================
        // AUDIT LOG CALIBRATO
        // ========================================================
        const getName = (id: number) => {
            const p = playersInMatch?.find(pl => pl.id === id);
            return p ? `${p.first_name} ${p.last_name}` : 'Sconosciuto';
        };

        const nomeTeamA = `${getName(match.team_a_left_id)} / ${getName(match.team_a_right_id)}`;
        const nomeTeamB = `${getName(match.team_b_left_id)} / ${getName(match.team_b_right_id)}`;

        const esitoDescrizione = finalWinningTeam === 'A'
            ? `Vince il Team A (${nomeTeamA}) contro il Team B (${nomeTeamB})`
            : `Vince il Team B (${nomeTeamB}) contro il Team A (${nomeTeamA})`;

        const operatore = `${currentUserPlayer.first_name} ${currentUserPlayer.last_name}`;

        const logDetails = match.is_friendly
            ? `L'operatore ${operatore} ha registrato il risultato dell'AMICHEVOLE: ${esitoDescrizione} [${stringaPunteggio}]. Nessuna variazione di punti applicata.`
            : `L'operatore ${operatore} ha registrato il risultato: ${esitoDescrizione} [${stringaPunteggio}]. Delta Rank: Team A (${teamADelta > 0 ? '+':''}${teamADelta}) - Team B (${teamBDelta > 0 ? '+':''}${teamBDelta})`;

        const { error: logError } = await logAction(
            'MATCH_RESOLVED',
            data.matchId,
            logDetails,
            {
                winning_team: finalWinningTeam,
                score: stringaPunteggio,
                is_completed: true,
                is_friendly: match.is_friendly,
                deltas: {
                    team_a: teamADelta,
                    team_b: teamBDelta
                },
                teams: {
                    team_a: { left_player_id: match.team_a_left_id, right_player_id: match.team_a_right_id },
                    team_b: { left_player_id: match.team_b_left_id, right_player_id: match.team_b_right_id }
                },
                resolved_at: new Date().toISOString()
            }
        );

        if (logError) console.error("❌ ERRORE SCRITTURA LOG RISOLUZIONE MATCH:", logError.message);

        console.log("✅ Server Action completata con successo!");

        // Pulizia Cache e Refresh Interfaccia
        revalidatePath('/');
        revalidatePath('/admin/logs');
        revalidatePath(`/player/${teamA[0].id}`);
        revalidatePath(`/player/${teamA[1].id}`);
        revalidatePath(`/player/${teamB[0].id}`);
        revalidatePath(`/player/${teamB[1].id}`);

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
}) {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        throw new Error("Accesso negato: devi effettuare il login per modificare una partita.");
    }

    const { data: currentPlayer } = await supabase
        .from('players')
        .select('id, role, first_name, last_name')
        .eq('user_id', user.id)
        .single();

    if (!currentPlayer) throw new Error("Profilo giocatore non trovato");

    const { data: oldMatch } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();

    if (!oldMatch) throw new Error("Match non trovato");

    const isUserInMatch = [
        oldMatch.team_a_left_id,
        oldMatch.team_a_right_id,
        oldMatch.team_b_left_id,
        oldMatch.team_b_right_id
    ].includes(currentPlayer.id);

    const isAdmin = currentPlayer.role === 'admin';
    const isOrganizer = currentPlayer.id === oldMatch.organizer_id;
    const canManage = isAdmin || isOrganizer || (!oldMatch.organizer_id && isUserInMatch);

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

    const slotKeys = ['team_a_left_id', 'team_a_right_id', 'team_b_left_id', 'team_b_right_id'] as const;
    slotKeys.forEach(key => {
        if (updatedFields[key] !== undefined && updatedFields[key] !== oldMatch[key]) {
            modifiche.push(`Slot ${key} aggiornato`);
        }
    });

    if (modifiche.length > 0) {
        const operatore = `${currentPlayer.first_name} ${currentPlayer.last_name}`;
        const qualifica = isAdmin ? "L'Admin" : (isOrganizer ? "L'Organizzatore" : "Il Giocatore");

        await logAction(
            'MATCH_UPDATED',
            matchId,
            `${qualifica} ${operatore} ha modificato il match ${matchId.slice(0, 8)}: ${modifiche.join('; ')}`,
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

    const { data: currentPlayer } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (!currentPlayer) throw new Error("Profilo giocatore non trovato");

    const { data: match, error: fetchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();

    if (fetchError || !match) throw new Error("Match non trovato");

    let slotToClear: string | null = null;
    if (match.team_a_left_id === currentPlayer.id) slotToClear = 'team_a_left_id';
    else if (match.team_a_right_id === currentPlayer.id) slotToClear = 'team_a_right_id';
    else if (match.team_b_left_id === currentPlayer.id) slotToClear = 'team_b_left_id';
    else if (match.team_b_right_id === currentPlayer.id) slotToClear = 'team_b_right_id';

    if (!slotToClear) {
        throw new Error("Impossibile uscire: non sei iscritto a questa partita.");
    }

    const allSlots = [
        match.team_a_left_id, match.team_a_right_id,
        match.team_b_left_id, match.team_b_right_id
    ];

    const remainingPlayers = allSlots.filter(id => id !== null && id !== currentPlayer.id);

    let updatePayload: Record<string, any> = { [slotToClear]: null };
    let shouldDeleteMatch = false;
    let logMessage = `Il giocatore ${currentPlayer.first_name} ha lasciato la partita.`;

    if (remainingPlayers.length === 0) {
        shouldDeleteMatch = true;
    } else if (match.organizer_id === currentPlayer.id) {
        const newOrganizerId = remainingPlayers[0];
        updatePayload.organizer_id = newOrganizerId;
        logMessage += ` Il ruolo di Organizzatore è passato automaticamente al giocatore ID: ${newOrganizerId}.`;
    }

    if (shouldDeleteMatch) {
        const { error: deleteError } = await supabase.from('matches').delete().eq('id', matchId);
        if (deleteError) throw new Error(`Errore eliminazione match vuoto: ${deleteError.message}`);

        await logAction('MATCH_DELETED_AUTO', matchId, `Match #${matchId.slice(0,6)} eliminato automaticamente perché vuoto dopo l'uscita dell'ultimo giocatore.`);
    } else {
        const { error: updateError } = await supabase
            .from('matches')
            .update(updatePayload)
            .eq('id', matchId);
        if (updateError) throw new Error(`Errore aggiornamento slot: ${updateError.message}`);

        await logAction('PLAYER_LEFT_MATCH', matchId, logMessage);
    }

    revalidatePath('/');
}

export async function joinMatchAction(matchId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Utente non autenticato");

    const { data: currentPlayer } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (!currentPlayer) throw new Error("Profilo giocatore non trovato");

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

    if (allSlots.includes(currentPlayer.id)) {
        throw new Error("Sei già iscritto a questa partita.");
    }

    const preferredSide = currentPlayer.preferred_side || 'Both';
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
        .update({ [slotToFill]: currentPlayer.id })
        .eq('id', matchId);

    if (updateError) throw new Error(`Errore durante l'iscrizione: ${updateError.message}`);

    await logAction(
        'PLAYER_JOINED_MATCH',
        matchId,
        `Il giocatore ${currentPlayer.first_name} ${currentPlayer.last_name} si è unito automaticamente alla partita nello slot ${slotToFill}.`
    );

    revalidatePath('/');
}

// Funzione helper per validare un singolo set di Padel/Tennis
function isSetValid(teamA: number, teamB: number, setIndex: number): boolean {
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
