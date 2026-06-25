'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logAction } from '@/lib/audit';

export async function updateManagerProfile(formData: FormData) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Devi effettuare l'accesso per modificare il tuo profilo.");

    const firstName = (formData.get('firstName') as string).trim();
    const lastName = (formData.get('lastName') as string).trim();
    if (!firstName || !lastName) throw new Error("Nome e cognome sono obbligatori.");

    // Verify the user is a club_manager
    const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

    if (userRole?.role !== 'club_manager') {
        throw new Error("Azione non autorizzata.");
    }

    const { data: updated, error } = await supabase
        .from('club_managers')
        .update({ first_name: firstName, last_name: lastName })
        .eq('user_id', user.id)
        .select('id');

    if (error) throw new Error(`Errore durante il salvataggio: ${error.message}`);

    // Detect RLS silent failure
    if (!updated || updated.length === 0) {
        throw new Error("ACCESSO NEGATO: Impossibile aggiornare il profilo. Verifica i permessi (RLS).");
    }

    await logAction(
        'UPDATE_MANAGER_PROFILE',
        user.id,
        `Il Club Manager ${firstName} ${lastName} ha aggiornato il proprio nome.`
    );

    revalidatePath('/profile');
    revalidatePath('/');
}

// ============================================================================
// AMMINISTRAZIONE: Aggiornamento gestore da parte dell'admin
// ============================================================================
export async function updateManagerByAdmin(formData: FormData) {
    const supabase = await createClient();

    // 1. Verifica admin loggato
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non autenticato');

    const { data: currentPlayer } = await supabase
        .from('players')
        .select('role, first_name, last_name')
        .eq('user_id', user.id)
        .single();

    if (!currentPlayer || currentPlayer.role !== 'admin') {
        throw new Error('Azione non autorizzata. Serve il ruolo Admin.');
    }

    // 2. Estrai dati dal form
    const managerId = formData.get('managerId') as string;
    const firstName = (formData.get('firstName') as string).trim();
    const lastName = (formData.get('lastName') as string).trim();
    const clubIdStr = formData.get('clubId') as string;

    if (!managerId || !firstName || !lastName || !clubIdStr) {
        throw new Error("Tutti i campi sono obbligatori.");
    }

    const clubId = parseInt(clubIdStr, 10);

    // 3. Recupera vecchi dati per il log
    const { data: oldManager } = await supabase
        .from('club_managers')
        .select('first_name, last_name, club_id')
        .eq('id', managerId)
        .single();

    // 4. Esegui update
    const { error: updateError } = await supabase
        .from('club_managers')
        .update({ first_name: firstName, last_name: lastName, club_id: clubId })
        .eq('id', managerId);

    if (updateError) throw new Error(`Errore aggiornamento: ${updateError.message}`);

    // 5. Audit log
    const adminName = `${currentPlayer.first_name} ${currentPlayer.last_name}`;
    const targetName = `${firstName} ${lastName}`;

    const modifiche: string[] = [];
    if (oldManager) {
        if (oldManager.first_name !== firstName || oldManager.last_name !== lastName) {
            modifiche.push(`Nome: da "${oldManager.first_name} ${oldManager.last_name}" a "${targetName}"`);
        }
        if (oldManager.club_id !== clubId) {
            modifiche.push(`Circolo: da #${oldManager.club_id} a #${clubId}`);
        }
    }

    await logAction(
        'UPDATE_MANAGER',
        managerId,
        `Admin ${adminName} ha modificato il gestore ${targetName}${modifiche.length > 0 ? ': ' + modifiche.join('; ') : '.'}`,
        { changes: { first_name: firstName, last_name: lastName, club_id: clubId }, previous_data: oldManager }
    );

    revalidatePath('/admin/managers');
}

// ============================================================================
// AMMINISTRAZIONE: Eliminazione gestore da parte dell'admin
// ============================================================================
export async function deleteManagerByAdmin(managerId: string) {
    const supabase = await createClient();

    // 1. Verifica admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non autenticato');

    const { data: currentPlayer } = await supabase
        .from('players')
        .select('role, first_name, last_name')
        .eq('user_id', user.id)
        .single();

    if (!currentPlayer || currentPlayer.role !== 'admin') {
        throw new Error('Azione non autorizzata. Serve il ruolo Admin.');
    }

    // 2. Recupera dati gestore prima dell'eliminazione
    const { data: targetManager } = await supabase
        .from('club_managers')
        .select('first_name, last_name, user_id')
        .eq('id', managerId)
        .single();

    if (!targetManager) throw new Error("Gestore non trovato.");

    // 3. Elimina la riga da club_managers
    const { error: deleteError } = await supabase
        .from('club_managers')
        .delete()
        .eq('id', managerId);

    if (deleteError) throw new Error(`Errore eliminazione: ${deleteError.message}`);

    // 4. Rimuovi anche il ruolo in user_roles
    const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', targetManager.user_id);

    if (roleError) console.error("Errore rimozione ruolo:", roleError.message);

    // 5. Audit log
    const adminName = `${currentPlayer.first_name} ${currentPlayer.last_name}`;
    const targetName = `${targetManager.first_name} ${targetManager.last_name}`;

    await logAction(
        'DELETE_MANAGER',
        managerId,
        `Admin ${adminName} ha eliminato il gestore ${targetName}.`
    );

    revalidatePath('/admin/managers');
}
