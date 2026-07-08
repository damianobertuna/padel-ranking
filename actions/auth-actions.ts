'use server';

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { logAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import dictAudit from "@/lib/i18n/dict-audit";

// ============================================================================
// HELPER: Logica pura per la risoluzione dell'identità utente
// ============================================================================
async function resolveUserIdentity(supabase: any, player: any, roleData: any, userId?: string) {
    const isAdmin = roleData?.role === 'admin' || player?.role === 'admin';

    // 1. Priorità massima: Admin
    if (isAdmin) {
        return {
            qualifica: dictAudit.LABEL_QUALIFICA_ADMIN,
            operatore: player ? `${player.first_name} ${player.last_name}` : dictAudit.LOG_AMBIGUOUS
        };
    }

    // 2. Profilo Giocatore standard
    if (player) {
        return {
            qualifica: dictAudit.LABEL_QUALIFICA_PLAYER,
            operatore: `${player.first_name} ${player.last_name}`
        };
    }

    // 3. Gestore puro (senza profilo giocatore)
    if (roleData?.role === 'club_manager') {
        let operatore: string = dictAudit.QUALIFICA_MANAGER;
        if (userId) {
            const { data: manager } = await supabase
                .from('club_managers')
                .select('first_name, last_name')
                .eq('user_id', userId)
                .maybeSingle();
            if (manager?.first_name || manager?.last_name) {
                operatore = `${manager.first_name} ${manager.last_name}`.trim();
            }
        }
        return {
            qualifica: dictAudit.LABEL_QUALIFICA_MANAGER_FULL,
            operatore
        };
    }

    // Fallback
    return { qualifica: "L'utente", operatore: dictAudit.LOG_UNKNOWN_USER };
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
        const { qualifica, operatore } = await resolveUserIdentity(supabase, player, roleData, userId);

        await logAction(
            dictAudit.ACTION_LOGIN,
            userId,
            dictAudit.LOG_USER_LOGIN
                .replace('{qualifica}', qualifica)
                .replace('{operatore}', operatore),
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
            dictAudit.ACTION_REGISTRATION,
            userId,
            dictAudit.LOG_REGISTRATION.replace('{name}', fullName)
        );
    } catch (error) {
        console.error("Errore durante il log della registrazione:", error);
    }
}

// ============================================================================
// NUOVO SISTEMA RBAC: GESTIONE INVITI MANAGER E PASSWORD
// ============================================================================
export async function inviteClubManager(email: string, clubId: number, firstName: string, lastName: string) {
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
            .insert([{
                user_id: newUserId,
                club_id: clubId,
                first_name: firstName,
                last_name: lastName,
            }]);

        if (clubError) throw new Error(`Errore assegnazione circolo: ${clubError.message}`);

        // Riavalidiamo la pagina dei circoli nella dashboard admin
        revalidatePath('/admin/clubs');

        return { success: true };

    } catch (error: any) {
        console.error("❌ ERRORE INVITO MANAGER:", error.message);
        throw new Error(error.message);
    }
}
