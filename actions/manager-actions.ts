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
