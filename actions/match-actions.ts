'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Interfaccia per la struttura del set
export interface SetScore {
    team_a: number;
    team_b: number;
}

/**
 * 1. CANCELLAZIONE DI UN MATCH IN PROGRAMMA
 */
export async function deletePendingMatch(matchId: number) {
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
        .in('id', [match.team_a_left_id, match.team_a_right_id, match.team_b_left_id, match.team_b_right_id]);

    const getName = (id: number) => {
        const p = playersInMatch?.find(pl => pl.id === id);
        return p ? `${p.first_name} ${p.last_name}` : 'Sconosciuto';
    };

    const dettagliMatch = `${getName(match.team_a_left_id)}/${getName(match.team_a_right_id)} VS ${getName(match.team_b_left_id)}/${getName(match.team_b_right_id)}`;
    const operatore = `${currentUserPlayer.first_name} ${currentUserPlayer.last_name}`;

    const logDescription = currentUserPlayer.role === 'admin'
        ? `L'admin ${operatore} ha annullato la partita in programma: ${dettagliMatch}`
        : `Il giocatore ${operatore} ha annullato la propria partita in programma: ${dettagliMatch}`;

    // Scrittura nel registro delle attività (Audit Log)
    const { error: logError } = await supabase.from('audit_logs').insert([
        {
            admin_id: user.id,
            admin_name: operatore,
            action_type: 'MATCH_DELETED',
            target_player_id: null,
            details: logDescription
        }
    ]);

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
    teamALeft: number | null;
    teamARight: number | null;
    teamBLeft: number | null;
    teamBRight: number | null;
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
    const { error: matchError } = await supabase
        .from('matches')
        .insert([
            {
                match_date: data.matchDate || null,
                team_a_left_id: data.teamALeft,
                team_a_right_id: data.teamARight,
                team_b_left_id: data.teamBLeft,
                team_b_right_id: data.teamBRight,
                status: 'pending'
            }
        ]);

    if (matchError) throw new Error(`Errore database: ${matchError.message}`);

    // Recuperiamo i nomi per la compilazione del log
    const { data: playersInMatch } = await supabase
        .from('players')
        .select('id, first_name, last_name')
        .in('id', [data.teamALeft, data.teamARight, data.teamBLeft, data.teamBRight]);

    const getName = (id: number) => {
        const p = playersInMatch?.find(pl => pl.id === id);
        return p ? `${p.first_name} ${p.last_name}` : 'Sconosciuto';
    };

    const dettagliMatch = `${getName(data.teamALeft)}/${getName(data.teamARight)} VS ${getName(data.teamBLeft)}/${getName(data.teamBRight)}`;
    const operatore = `${currentUserPlayer.first_name} ${currentUserPlayer.last_name}`;

    const logDescription = currentUserPlayer.role === 'admin'
        ? `L'admin ${operatore} ha creato una nuova partita in programma: ${dettagliMatch}`
        : `Il giocatore ${operatore} ha organizzato una nuova partita in programma: ${dettagliMatch}`;

    // Scrittura Audit Log
    const { error: logError } = await supabase.from('audit_logs').insert([
        {
            admin_id: user.id,
            admin_name: operatore,
            action_type: 'MATCH_CREATED',
            target_player_id: null,
            details: logDescription
        }
    ]);

    if (logError) console.error("❌ ERRORE LOG CREAZIONE MATCH:", logError.message);

    revalidatePath('/');
}

/**
 * 3. RISOLUZIONE DI UN MATCH CON CALCOLO RANKING, SET OBBLIGATORI E AUDIT LOG
 */
export async function resolveMatchWithRanking(data: {
    matchId: string;
    score: SetScore[]; // <-- L'array dei set ora torna a essere il sovrano assoluto
    rankingUpdates: Record<number, number>;
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

        // VALIDAZIONE E CALCOLO AUTOMATICO DEL VINCITORE IN BASE AI SET
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

        // AGGIORNAMENTO DEL RANKING DEI SINGOLI GIOCATORI
        const allInvolvedIds = [
            match.team_a_left_id, match.team_a_right_id,
            match.team_b_left_id, match.team_b_right_id
        ];

        for (const id of allInvolvedIds) {
            const updateValue = data.rankingUpdates[id];
            if (updateValue !== undefined) {
                const { data: p } = await supabase.from('players').select('ranking').eq('id', id).single();
                if (p) {
                    const newRanking = p.ranking + updateValue;
                    await supabase.from('players').update({ ranking: newRanking }).eq('id', id);
                }
            }
        }

        // AGGIORNAMENTO RECORD DEL MATCH (Salvataggio in stato 'completed')
        const { error: matchError } = await supabase
            .from('matches')
            .update({
                status: 'completed',
                winning_team: finalWinningTeam,
                score: data.score // Scrittura sicura dentro il campo JSONB
            })
            .eq('id', data.matchId);

        if (matchError) throw new Error(`Errore chiusura partita: ${matchError.message}`);

        // GENERAZIONE STRINGHE E SCRITTURA NELL'AUDIT LOG
        const { data: playersInMatch } = await supabase
            .from('players')
            .select('id, first_name, last_name')
            .in('id', allInvolvedIds);

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
        const logDetails = `L'operatore ${operatore} ha registrato il risultato: ${esitoDescrizione} [${stringaPunteggio}]`;

        const { error: logError } = await supabase.from('audit_logs').insert([
            {
                admin_id: user.id,
                admin_name: operatore,
                action_type: 'MATCH_RESOLVED',
                target_player_id: null,
                details: logDetails
            }
        ]);

        if (logError) console.error("❌ ERRORE SCRITTURA LOG RISOLUZIONE MATCH:", logError.message);

        console.log("✅ Server Action completata con successo!");
        revalidatePath('/');
        revalidatePath('/admin/logs');

    } catch (globalError: any) {
        console.error("💥 ERRORE SERVER ACTION:", globalError.message);
        throw new Error(globalError.message || "Errore interno del server");
    }
}
