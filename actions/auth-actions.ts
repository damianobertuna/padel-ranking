'use server';

import { createClient } from "@/lib/supabase/server";

export async function logUserLogin(userId: string) {
    const supabase = createClient();

    // 1. Recuperiamo il profilo del giocatore che si è appena loggato
    const { data: player } = await (await supabase)
        .from('players')
        .select('first_name, last_name, role')
        .eq('user_id', userId)
        .single();

    if (!player) {
        console.error(`Impossibile scrivere il log di login: Profilo non trovato per user_id ${userId}`);
        return;
    }

    const operatore = `${player.first_name} ${player.last_name}`;
    const logDescription = player.role === 'admin'
        ? `L'admin ${operatore} ha effettuato l'accesso al sistema.`
        : `Il giocatore ${operatore} ha effettuato l'accesso alla bacheca.`;

    // 2. Scrittura del log nella tabella audit_logs
    const { error: logError } = await (await supabase)
        .from('audit_logs')
        .insert([
            {
                admin_id: userId,
                admin_name: operatore,
                action_type: 'USER_LOGIN',
                target_player_id: null,
                details: logDescription
            }
        ]);

    if (logError) {
        console.error("❌ ERRORE SCRITTURA LOG LOGIN:", logError.message);
    }
}
