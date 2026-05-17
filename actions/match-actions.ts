'use server';

import {createClient} from "@/lib/supabase/server";
import {revalidatePath} from "next/cache";

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
    const { error: logError } = await (await supabase)
        .from('audit_logs') // Assicurati che il nome della tabella sia corretto (es. audit_logs o logs)
        .insert([
            {
                action_by_profile_id: currentUserPlayer.id,
                action_type: 'DELETE_MATCH',
                description: logDescription,
                created_at: new Date().toISOString()
            }
        ]);

    if (logError) {
        console.error("Errore durante la scrittura del Log di Audit:", logError);
        // Non blocchiamo la cancellazione se il log fallisce, ma lo segnaliamo in console
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
