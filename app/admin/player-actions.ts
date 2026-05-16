'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updatePlayerByAdmin(formData: FormData) {
    const supabase = createClient();

    // 1. Verifichiamo che chi compie l'azione sia un ADMIN
    const { data: { user } } = await (await supabase).auth.getUser();
    if (!user) throw new Error('Non autenticato');

    const { data: currentUserPlayer } = await (await supabase)
        .from('players')
        .select('role')
        .eq('user_id', user.id)
        .single();

    if (!currentUserPlayer || currentUserPlayer.role !== 'admin') {
        throw new Error('Azione non autorizzata. Serve il ruolo Admin.');
    }

    // 2. Estraiamo i dati dal form
    const playerId = parseInt(formData.get('playerId') as string);
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const preferredSide = formData.get('preferredSide') as string;
    const dominantHand = formData.get('dominantHand') as string;
    const ranking = parseFloat(formData.get('ranking') as string);
    const role = formData.get('role') as string;

    // 3. Eseguiamo l'UPDATE su Supabase
    const { error } = await (await supabase)
        .from('players')
        .update({
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            preferred_side: preferredSide,
            dominant_hand: dominantHand,
            ranking: ranking,
            role: role
        })
        .eq('id', playerId);

    if (error) {
        console.error("Errore update admin:", error);
        throw new Error(error.message); // Invece di fare il return dell'errore, solleviamo un'eccezione
    }

    // Resettiamo la cache per mostrare i dati aggiornati all'istante
    revalidatePath('/');
    revalidatePath('/admin/players');
    revalidatePath(`/player/${playerId}`);

    // Rimosso il return { success: true } per accontentare TypeScript!
}
