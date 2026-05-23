'use server';

import { createClient } from "@/lib/supabase/server";
import { logAction } from "@/lib/audit";

export async function logUserLogin(userId: string) {
    try {
        console.log("🚀 Server Action logUserLogin invocata");

        // Risolviamo il client con il doppio await protetto, esattamente come in match-actions
        const supabase = await (await createClient());

        // 1. Recuperiamo il profilo del giocatore
        const { data: player, error: playerError } = await supabase
            .from('players')
            .select('first_name, last_name, role')
            .eq('user_id', userId)
            .single();

        if (playerError || !player) {
            console.error("⚠️ Profilo non trovato o errore DB per user:", userId);
            return;
        }

        const operatore = `${player.first_name} ${player.last_name}`;
        const logDescription = player.role === 'admin'
            ? `L'admin ${operatore} ha effettuato l'accesso al sistema.`
            : `Il giocatore ${operatore} ha effettuato l'accesso alla bacheca.`;

        // 2. Scrittura nel registro delle attività
        await logAction(
            'USER_LOGIN',
            userId, // entity_id
            `Accesso effettuato: ${operatore}`,
            {
                user_id: userId,
                method: 'email_password'
            }
        );

        console.log(`✅ Log di login registrato per: ${operatore}`);

    } catch (err) {
        console.error("💥 Errore controllato nella action logUserLogin:", err);
    }
}
