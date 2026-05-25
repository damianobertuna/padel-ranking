'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logAction } from "@/lib/audit";

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

    // Inseriamo il match in stato pending
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
                status: 'pending'
            }
        ])
        .select('id')
        .single();

    if (matchError) throw new Error(`Errore database: ${matchError.message}`);

    // Recuperiamo i nomi per la compilazione del log
    const { data: playersInMatch } = await supabase
        .from('players')
        .select('id, first_name, last_name')
        .in('id', [data.teamALeft, data.teamARight, data.teamBLeft, data.teamBRight].filter(Boolean));

    const getName = (id: number | null) => {
        if (id === null) return 'Slot Libero';
        const p = playersInMatch?.find(pl => pl.id === id);
        return p ? `${p.first_name} ${p.last_name}` : 'Sconosciuto';
    };

    const dettagliMatch = `${getName(data.teamALeft)}/${getName(data.teamARight)} VS ${getName(data.teamBLeft)}/${getName(data.teamBRight)}`;
    const operatore = `${currentUserPlayer.first_name} ${currentUserPlayer.last_name}`;

    const logDescription = currentUserPlayer.role === 'admin'
        ? `L'admin ${operatore} ha creato una nuova partita in programma: ${dettagliMatch} - ${data.matchType} - ${data.matchDate}`
        : `Il giocatore ${operatore} ha organizzato una nuova partita in programma: ${dettagliMatch} - ${data.matchType} - ${data.matchDate}`;

    // Scrittura Audit Log
    const { error: logError } = await logAction(
        'MATCH_CREATED',
        matchId.id,
        logDescription,
        {
            match_type: data.matchType,
            match_date: data.matchDate,
            club_id: data.clubId,
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
 * 3. RISOLUZIONE DI UN MATCH CON CALCOLO RANKING, SET OBBLIGATORI E AUDIT LOG
 */
export async function resolveMatchWithRanking(data: {
    matchId: string;
    score: SetScore[];
}) {
    const supabase = await createClient();

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

        // Recupero info della partita da chiudere
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

        data.score.forEach(set => {
            if (set.team_a > set.team_b) setsWonA++;
            else if (set.team_b > set.team_a) setsWonB++;
        });

        if (setsWonA === setsWonB) {
            throw new Error("Pareggio nei set impossibile. Inserisci il terzo set per decretare il vincitore.");
        }

        const finalWinningTeam = setsWonA > setsWonB ? 'A' : 'B';
        const stringaPunteggio = data.score.map(s => `${s.team_a}-${s.team_b}`).join(" / ");

        // ========================================================
        // NUOVO ALGORITMO UFFICIALE: CALCOLO DEL RANKING SUL SERVER
        // ========================================================
        const playerIds = [match.team_a_left_id, match.team_a_right_id, match.team_b_left_id, match.team_b_right_id];
        const { data: playersInMatch } = await supabase.from('players').select('*').in('id', playerIds);

        if (!playersInMatch || playersInMatch.length !== 4) {
            throw new Error("Impossibile risolvere: la partita non ha 4 giocatori validi.");
        }

        // Troviamo i massimi (King) e minimi (Fanalino) globali
        const { data: allPlayers } = await supabase.from('players').select('preferred_side, ranking');
        const thresholds = {
            Left: { max: -Infinity, min: Infinity },
            Right: { max: -Infinity, min: Infinity },
            Both: { max: -Infinity, min: Infinity }
        };

        allPlayers?.forEach(p => {
            const side = p.preferred_side as 'Left' | 'Right' | 'Both';
            if (p.ranking > thresholds[side].max) thresholds[side].max = p.ranking;
            if (p.ranking < thresholds[side].min) thresholds[side].min = p.ranking;
        });

        const isKing = (p: any) => {
            const sideKey = p.preferred_side as 'Left' | 'Right' | 'Both';
            const side = thresholds[sideKey];
            if (!side) return false;
            return side.max !== side.min && p.ranking === side.max;
        };

        const isFanalino = (p: any) => {
            const sideKey = p.preferred_side as 'Left' | 'Right' | 'Both';
            const side = thresholds[sideKey];
            if (!side) return false;
            return side.max !== side.min && p.ranking === side.min;
        };

        // Dividiamo le squadre
        const teamA = playersInMatch.filter(p => p.id === match.team_a_left_id || p.id === match.team_a_right_id);
        const teamB = playersInMatch.filter(p => p.id === match.team_b_left_id || p.id === match.team_b_right_id);

        const winners = finalWinningTeam === 'A' ? teamA : teamB;
        const losers = finalWinningTeam === 'A' ? teamB : teamA;

        // Calcoliamo i Delta in base alle Regole Ufficiali
        let winnerDelta = 0.05;
        let loserDelta = -0.05;

        if (winners.some(isFanalino) || losers.some(isKing)) {
            winnerDelta = 0.10; // Bonus sconfiggere King o Fanalino vince
        }

        if (losers.every(isKing)) {
            loserDelta = -0.10; // Malus se vengono sconfitti due King in coppia
        }

        const teamADelta = finalWinningTeam === 'A' ? winnerDelta : loserDelta;
        const teamBDelta = finalWinningTeam === 'B' ? winnerDelta : loserDelta;

        const safeAdd = (rank: number, delta: number) => parseFloat((rank + delta).toFixed(2));

        // AGGIORNAMENTO RECORD DEL MATCH (Con salvataggio dei delta)
        const { error: matchError } = await supabase
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

        // AGGIORNAMENTO DEL RANKING GIOCATORI SUL DATABASE
        const playerUpdates = [
            supabase.from('players').update({ ranking: safeAdd(teamA[0].ranking, teamADelta) }).eq('id', teamA[0].id),
            supabase.from('players').update({ ranking: safeAdd(teamA[1].ranking, teamADelta) }).eq('id', teamA[1].id),
            supabase.from('players').update({ ranking: safeAdd(teamB[0].ranking, teamBDelta) }).eq('id', teamB[0].id),
            supabase.from('players').update({ ranking: safeAdd(teamB[1].ranking, teamBDelta) }).eq('id', teamB[1].id)
        ];
        await Promise.all(playerUpdates);

        // ========================================================
        // AUDIT LOG
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

        // Stringa Log arricchita con i Delta
        const logDetails = `L'operatore ${operatore} ha registrato il risultato: ${esitoDescrizione} [${stringaPunteggio}]. Delta Rank: Team A (${teamADelta > 0 ? '+':''}${teamADelta}) - Team B (${teamBDelta > 0 ? '+':''}${teamBDelta})`;

        const { error: logError } = await logAction(
            'MATCH_RESOLVED',
            data.matchId,
            logDetails,
            {
                winning_team: finalWinningTeam,
                score: stringaPunteggio,
                is_completed: true,
                deltas: {
                    team_a: teamADelta,
                    team_b: teamBDelta
                },
                teams: {
                    team_a: {
                        left_player_id: match.team_a_left_id,
                        right_player_id: match.team_a_right_id
                    },
                    team_b: {
                        left_player_id: match.team_b_left_id,
                        right_player_id: match.team_b_right_id
                    }
                },
                resolved_at: new Date().toISOString()
            }
        );

        if (logError) console.error("❌ ERRORE SCRITTURA LOG RISOLUZIONE MATCH:", logError.message);

        console.log("✅ Server Action completata con successo!");

        // Pulizia Cache per far ricaricare immediatamente le pagine interessate
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
}) {
    const supabase = await createClient();

    // 0. CONTROLLO DI SICUREZZA
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        throw new Error("Accesso negato: devi effettuare il login per modificare una partita.");
    }

    // 1. Recuperiamo il match attuale (per il confronto nel log)
    const { data: oldMatch } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();

    if (!oldMatch) throw new Error("Match non trovato");

    // 2. Eseguiamo l'update
    const { error } = await supabase
        .from('matches')
        .update(updatedFields)
        .eq('id', matchId);

    if (error) throw new Error(error.message);

    // 3. GENERIAMO IL LOG DI AUDIT
    const { data: admin } = await supabase.from('players').select('first_name, last_name').eq('user_id', user.id).single();

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
        await logAction(
            'MATCH_UPDATED',
            matchId,
            `Admin ${admin?.first_name || 'Sconosciuto'} ${admin?.last_name || ''} ha modificato il match ${matchId.slice(0, 8)}: ${modifiche.join('; ')}`,
            {
                previous_data: oldMatch,
                new_data: updatedFields
            }
        );
    }

    revalidatePath('/');
}
