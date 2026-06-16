'use server';

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { logAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";

// ============================================================================
// HELPER: Logica pura per la risoluzione dell'identità utente
// ============================================================================
function resolveUserIdentity(player: any, roleData: any) {
    const isAdmin = roleData?.role === 'admin' || player?.role === 'admin';

    // 1. Priorità massima: Admin
    if (isAdmin) {
        return {
            qualifica: "L'admin",
            operatore: player ? `${player.first_name} ${player.last_name}` : "Amministratore"
        };
    }

    // 2. Profilo Giocatore standard
    if (player) {
        return {
            qualifica: "Il giocatore",
            operatore: `${player.first_name} ${player.last_name}`
        };
    }

    // 3. Gestore puro (senza profilo giocatore)
    if (roleData?.role === 'club_manager') {
        return {
            qualifica: "Il Club Manager",
            operatore: "Gestore Campo"
        };
    }

    // Fallback
    return { qualifica: "L'utente", operatore: "Utente Sconosciuto" };
}

// ============================================================================
// SERVER ACTIONS PRINCIPALI
// ============================================================================
export async function logUserLogin(userId: string) {
    try {
        console.log("🚀 Server Action logUserLogin invocata");

        const supabase = await createClient();

        const [roleResponse, playerResponse] = await Promise.all([
            supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle(),
            supabase.from('players').select('first_name, last_name, role').eq('user_id', userId).maybeSingle()
        ]);

        const roleData = roleResponse.data;
        const player = playerResponse.data;

        if (!roleData && !player) {
            console.error("⚠️ Profilo non trovato in nessuna tabella per user:", userId);
            return;
        }

        // Deleghiamo l'estrazione delle stringhe all'helper
        const { qualifica, operatore } = resolveUserIdentity(player, roleData);

        await logAction(
            'USER_LOGIN',
            userId,
            `Accesso effettuato: ${qualifica} ${operatore}`,
            {
                user_id: userId,
                method: 'email_password'
            }
        );

        console.log(`✅ Log di login registrato per: ${qualifica} ${operatore}`);

    } catch (err) {
        console.error("💥 Errore controllato nella action logUserLogin:", err);
    }
}

export async function logUserRegistration(userId: string, fullName: string) {
    try {
        await logAction(
            'USER_REGISTERED',
            userId,
            `Nuovo giocatore registrato: ${fullName}`
        );
    } catch (error) {
        console.error("Errore durante il log della registrazione:", error);
    }
}

// ============================================================================
// NUOVO SISTEMA RBAC: GESTIONE INVITI MANAGER E PASSWORD
// ============================================================================
export async function inviteClubManager(email: string, clubId: number) {
    // Usiamo ESCLUSIVAMENTE il client Admin che ha i permessi di Service Role
    // necessari per aggirare la RLS e usare le API di Auth
    const supabaseAdmin = createAdminClient();

    try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

        // 1. Invio invito ufficiale via Supabase Auth
        // Questo crea l'utente in auth.users e gli spedisce il magic link per la password
        const { data: authData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            redirectTo: `${baseUrl}/update-password`
        });

        if (inviteError) throw new Error(`Errore Auth: ${inviteError.message}`);
        if (!authData.user) throw new Error("Creazione utente fallita.");

        const newUserId = authData.user.id;

        // 2. Registrazione ruolo nella nuova tabella user_roles
        const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .insert([{ user_id: newUserId, role: 'club_manager' }]);

        if (roleError) throw new Error(`Errore assegnazione ruolo: ${roleError.message}`);

        // 3. Assegnazione del circolo nella tabella ponte (aggiornata al nuovo schema)
        const { error: clubError } = await supabaseAdmin
            .from('club_managers')
            .insert([{ user_id: newUserId, club_id: clubId }]);

        if (clubError) throw new Error(`Errore assegnazione circolo: ${clubError.message}`);

        // Riavalidiamo la pagina dei circoli nella dashboard admin
        revalidatePath('/admin/clubs');

        return { success: true };

    } catch (error: any) {
        console.error("❌ ERRORE INVITO MANAGER:", error.message);
        throw new Error(error.message);
    }
}
