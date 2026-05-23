// lib/audit.ts
import { createClient } from "@/lib/supabase/server";

export async function logAction(
    actionType: string,
    entityId: string | number,
    details: string,
    metadata: Record<string, any> = {}
): Promise<{ error: any | null }> {
    const supabase = await createClient();

    // Recuperiamo chi sta agendo
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: new Error("Logging fallito: Utente non autenticato") };
    }

    const { data: player } = await supabase
        .from('players')
        .select('first_name, last_name')
        .eq('user_id', user.id)
        .single();

    const adminName = player ? `${player.first_name} ${player.last_name}` : 'Unknown';

    // Inserimento unificato
    const { error } = await supabase.from('audit_logs').insert([{
        admin_id: user.id,
        admin_name: adminName,
        action_type: actionType,
        entity_id: entityId.toString(),
        details: details,
        metadata: {
            ...metadata,
            timestamp: new Date().toISOString()
        }
    }]);

    return { error };
}
