'use server';

import {createClient} from "@/lib/supabase/server";
import {revalidatePath} from "next/cache";
import { redirect } from 'next/navigation';

export async function deletePendingMatch(matchId: number) {
    const supabase = createClient();

    // 1. Controlliamo che l'utente sia loggato
    const { data: { user } } = await (await supabase).auth.getUser();
    if (!user) throw new Error("Utente non autenticato");

    // 2. Recuperiamo il suo profilo giocatore
    const { data: currentUserPlayer } = await (await supabase)
        .from('players')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (!currentUserPlayer) throw new Error("Profilo giocatore non trovato");

    // 3. Recuperiamo la partita per verificare lo stato e i partecipanti
    const { data: match } = await (await supabase)
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

    const { data: playersInMatch } = await (await supabase)
        .from('players')
        .select('id, first_name, last_name')
        .in('id', [match.team_a_left_id, match.team_a_right_id, match.team_b_left_id, match.team_b_right_id]);

    const getName = (id: number) => {
        const p = playersInMatch?.find(pl => pl.id === id);
        return p ? `${p.first_name} ${p.last_name}` : 'Sconosciuto';
    };

    const dettagliMatch = `${getName(match.team_a_left_id)}/${getName(match.team_a_right_id)} VS ${getName(match.team_b_left_id)}/${getName(match.team_b_right_id)}`;
    const operatore = `${currentUserPlayer.first_name} ${currentUserPlayer.last_name}`;

    // Costruiamo la descrizione in base al ruolo (se è l'admin a cancellare o un giocatore stesso)
    const logDescription = currentUserPlayer.role === 'admin'
        ? `L'admin ${operatore} ha annullato la partita in programma: ${dettagliMatch}`
        : `Il giocatore ${operatore} ha annullato la propria partita in programma: ${dettagliMatch}`;

    // === NUOVO: SCRITTURA NELL'AUDIT LOG ===
    const { error: logError } = await (await supabase).from('audit_logs').insert([
        {
            admin_id: user.id,
            admin_name: operatore,
            action_type: 'DELETE_MATCH',
            target_player_id: null, // Esplicitiamo a null visto che non è un update giocatore
            details: logDescription
        }
    ]);

    if (logError) {
        console.error("❌ ERRORE CRITICO SCRITTURA AUDIT LOG:", logError.message);
        throw new Error(`Impossibile procedere: Errore nel registro delle attività (${logError.message})`);
    }

    // 4. Cancelliamo il match dal database
    const { error } = await (await supabase)
        .from('matches')
        .delete()
        .eq('id', matchId);

    if (error) {
        console.error("Errore cancellazione match:", error);
        throw new Error(error.message);
    }

    // Resettiamo la cache della Home per far sparire la partita all'istante
    revalidatePath('/');
}

export async function createPendingMatch(data: {
    matchDate: string | null;
    teamALeft: number;
    teamARight: number;
    teamBLeft: number;
    teamBRight: number;
}) {
    const supabase = createClient();

    // 1. Controlliamo l'autenticazione dell'utente che crea il match
    const { data: { user } } = await (await supabase).auth.getUser();
    if (!user) throw new Error("Utente non autenticato");

    // 2. Recuperiamo il profilo di chi sta creando la partita
    const { data: currentUserPlayer } = await (await supabase)
        .from('players')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (!currentUserPlayer) throw new Error("Profilo giocatore non trovato");

    // 3. Inseriamo il nuovo match in stato 'pending'
    const { error: matchError } = await (await supabase)
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

    if (matchError) {
        console.error("Errore creazione match:", matchError.message);
        throw new Error(`Errore database: ${matchError.message}`);
    }

    // 4. RECUPERIAMO I NOMI DEI GIOCATORI COINVOLTI PER L'AUDIT LOG
    const { data: playersInMatch } = await (await supabase)
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

    // 5. SCRITTURA DEL LOG DI AUDIT
    const { error: logError } = await (await supabase)
        .from('audit_logs')
        .insert([
            {
                admin_id: user.id,
                admin_name: operatore,
                action_type: 'CREATE_MATCH',
                target_player_id: null,
                details: logDescription
            }
        ]);

    if (logError) {
        console.error("❌ ERRORE SCRITTURA LOG CREAZIONE MATCH:", logError.message);
        throw new Error(`Errore registro attività: ${logError.message}`);
    }

    // Svuota la cache della home in modo che veda la nuova partita al rientro
    revalidatePath('/');
}

export async function resolveMatchWithLog(data: {
    matchId: number;
    setsWonA: number;
    setsWonB: number;
}) {
    const supabase = createClient();

    // 1. Controlliamo l'autenticazione dell'utente
    const { data: { user } } = await (await supabase).auth.getUser();
    if (!user) throw new Error("Utente non autenticato");

    // 2. Recuperiamo il profilo di chi sta inserendo il risultato
    const { data: currentUserPlayer } = await (await supabase)
        .from('players')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (!currentUserPlayer) throw new Error("Profilo giocatore non trovato");

    // 3. Recuperiamo i dettagli del match prima di modificarlo per sapere chi ha giocato
    const { data: match } = await (await supabase)
        .from('matches')
        .select('*')
        .eq('id', data.matchId)
        .single();

    if (!match) throw new Error("Partita non trovata");
    if (match.status !== 'pending') throw new Error("Questa partita è già stata risolta");

    // 4. Aggiorniamo lo stato del match su Supabase con il risultato
    const winnerTeam = data.setsWonA > data.setsWonB ? 'A' : 'B';
    const { error: matchError } = await (await supabase)
        .from('matches')
        .update({
            sets_won_a: data.setsWonA,
            sets_won_b: data.setsWonB,
            winner_team: winnerTeam,
            status: 'completed',
            resolved_at: new Date().toISOString(),
            resolved_by_profile_id: currentUserPlayer.id
        })
        .eq('id', data.matchId);

    if (matchError) {
        console.error("Errore durante la risoluzione del match:", matchError.message);
        throw new Error(`Errore database: ${matchError.message}`);
    }

    // === RECUPERIAMO I NOMI DEI GIOCATORI PER IL LOG ===
    const { data: playersInMatch } = await (await supabase)
        .from('players')
        .select('id, first_name, last_name')
        .in('id', [match.team_a_left_id, match.team_a_right_id, match.team_b_left_id, match.team_b_right_id]);

    const getName = (id: number) => {
        const p = playersInMatch?.find(pl => pl.id === id);
        return p ? `${p.first_name} ${p.last_name}` : 'Sconosciuto';
    };

    const nomeTeamA = `${getName(match.team_a_left_id)}/${getName(match.team_a_right_id)}`;
    const nomeTeamB = `${getName(match.team_b_left_id)}/${getName(match.team_b_right_id)}`;

    // Costruiamo una stringa del risultato (es: 2 - 1)
    const punteggio = `${data.setsWonA}-${data.setsWonB}`;
    const esitoCampioni = winnerTeam === 'A'
        ? `Vince Team A (${nomeTeamA}) contro Team B (${nomeTeamB})`
        : `Vince Team B (${nomeTeamB}) contro Team A (${nomeTeamA})`;

    const operatore = `${currentUserPlayer.first_name} ${currentUserPlayer.last_name}`;
    const logDescription = currentUserPlayer.role === 'admin'
        ? `L'admin ${operatore} ha registrato il risultato: ${esitoCampioni} con punteggio ${punteggio}`
        : `Il giocatore ${operatore} ha registrato il risultato del suo match: ${esitoCampioni} con punteggio ${punteggio}`;

    // === SCRITTURA DEL LOG DI AUDIT ===
    const { error: logError } = await (await supabase)
        .from('audit_logs')
        .insert([
            {
                admin_id: user.id,
                admin_name: operatore,
                action_type: 'RESOLVE_MATCH', // Nuovo action type specifico
                target_player_id: null,
                details: logDescription
            }
        ]);

    if (logError) {
        console.error("❌ ERRORE SCRITTURA LOG RISOLUZIONE MATCH:", logError.message);
        throw new Error(`Errore registro attività: ${logError.message}`);
    }

    // Aggiorniamo le cache della Home e delle pagine admin/log
    revalidatePath('/');
    revalidatePath('/admin/logs');
}

export async function resolveMatchWithRanking(data: {
    matchId: string;
    winningTeam: 'A' | 'B';
    rankingUpdates: Record<number, number>; // Riceve la mappa degli incrementi/decrementi
}) {
    const supabase = createClient();

    // 1. Controlliamo l'autenticazione
    const { data: { user } } = await (await supabase).auth.getUser();
    if (!user) throw new Error("Utente non autenticato");

    // 2. Profilo dell'operatore
    const { data: currentUserPlayer } = await (await supabase)
        .from('players')
        .select('*')
        .eq('user_id', user.id)
        .single();
    if (!currentUserPlayer) throw new Error("Profilo giocatore non trovato");

    // 3. Recuperiamo il match prima di chiuderlo
    const { data: match } = await (await supabase)
        .from('matches')
        .select('*')
        .eq('id', data.matchId)
        .single();
    if (!match) throw new Error("Partita non trovata");
    if (match.status !== 'pending') throw new Error("Questa partita è già stata risolta");

    // 4. Aggiorniamo il ranking di tutti i giocatori coinvolti
    const allInvolvedIds = [
        match.team_a_left_id, match.team_a_right_id,
        match.team_b_left_id, match.team_b_right_id
    ];

    for (const id of allInvolvedIds) {
        const updateValue = data.rankingUpdates[id];
        if (updateValue !== undefined) {
            // Recuperiamo il ranking attuale sul server per evitare disallineamenti client/server
            const { data: p } = await (await supabase).from('players').select('ranking').eq('id', id).single();
            if (p) {
                const newRanking = p.ranking + updateValue;
                await (await supabase).from('players').update({ ranking: newRanking }).eq('id', id);
            }
        }
    }

    // 5. Chiudiamo la partita impostando il vincitore
    const { error: matchError } = await (await supabase)
        .from('matches')
        .update({
            status: 'completed',
            winning_team: data.winningTeam
        })
        .eq('id', data.matchId);

    if (matchError) throw new Error(`Errore chiusura partita: ${matchError.message}`);

    // 6. RECUPERIAMO I NOMI DEI GIOCATORI PER L'AUDIT LOG
    const { data: playersInMatch } = await (await supabase)
        .from('players')
        .select('id, first_name, last_name')
        .in('id', allInvolvedIds);

    const getName = (id: number) => {
        const p = playersInMatch?.find(pl => pl.id === id);
        return p ? `${p.first_name} ${p.last_name}` : 'Sconosciuto';
    };

    const nomeTeamA = `${getName(match.team_a_left_id)}/${getName(match.team_a_right_id)}`;
    const nomeTeamB = `${getName(match.team_b_left_id)}/${getName(match.team_b_right_id)}`;

    const esitoCampioni = data.winningTeam === 'A'
        ? `Vince Team A (${nomeTeamA}) contro Team B (${nomeTeamB})`
        : `Vince Team B (${nomeTeamB}) contro Team A (${nomeTeamA})`;

    const operatore = `${currentUserPlayer.first_name} ${currentUserPlayer.last_name}`;
    const logDescription = currentUserPlayer.role === 'admin'
        ? `L'admin ${operatore} ha inserito il risultato: ${esitoCampioni}`
        : `Il giocatore ${operatore} ha inserito il risultato del suo match: ${esitoCampioni}`;

    // 7. SCRITTURA LOG DI AUDIT
    const { error: logError } = await (await supabase)
        .from('audit_logs')
        .insert([
            {
                admin_id: user.id,
                admin_name: operatore,
                action_type: 'RESOLVE_MATCH',
                target_player_id: null,
                details: logDescription
            }
        ]);

    if (logError) console.error("❌ Errore scrittura log attività:", logError.message);

    // Resettiamo le cache della Home
    redirect('/');
}
