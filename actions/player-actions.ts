'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logAction } from '@/lib/audit';

export async function updatePlayerByAdmin(formData: FormData) {
    const supabase = await createClient();

    // 1. Verifichiamo l'ADMIN loggato
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non autenticato');

    const { data: currentUserPlayer } = await supabase
        .from('players')
        .select('first_name, last_name, role')
        .eq('user_id', user.id)
        .single();

    if (!currentUserPlayer || currentUserPlayer.role !== 'admin') {
        throw new Error('Azione non autorizzata. Serve il ruolo Admin.');
    }

    // 2. Estraiamo i dati dal form
    const playerIdStr = formData.get('playerId');
    if (!playerIdStr) throw new Error("ID mancante");

    const playerId = parseInt(playerIdStr as string, 10);
    const firstName = (formData.get('firstName') as string).trim();
    const lastName = (formData.get('lastName') as string).trim();
    const preferredSide = formData.get('preferredSide') as string;
    const dominantHand = formData.get('dominantHand') as string;
    const ranking = parseFloat(formData.get('ranking') as string);
    const role = formData.get('role') as string;

    // 2b. Recuperiamo i vecchi dati del giocatore per il log
    const { data: oldPlayer } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single();

    // 3. Eseguiamo l'UPDATE
    const { error } = await supabase
        .from('players')
        .update({
            first_name: firstName,
            last_name: lastName,
            preferred_side: preferredSide,
            dominant_hand: dominantHand,
            ranking: ranking,
            role: role
        })
        .eq('id', playerId);

    if (error) {
        console.error("Errore update admin:", error);
        throw new Error(error.message);
    }

    // 4. GENERIAMO IL LOG DI AUDIT
    if (oldPlayer) {
        const adminFullName = `${currentUserPlayer.first_name} ${currentUserPlayer.last_name}`;
        const targetFullName = `${firstName} ${lastName}`;

        const updatedFields = { first_name: firstName, last_name: lastName, preferred_side: preferredSide, dominant_hand: dominantHand, ranking, role };

        const modifiche: string[] = [];
        if (oldPlayer.first_name !== firstName || oldPlayer.last_name !== lastName) modifiche.push(`Nome: da "${oldPlayer.first_name} ${oldPlayer.last_name}" a "${targetFullName}"`);
        if (oldPlayer.ranking !== ranking) modifiche.push(`Ranking: da ${oldPlayer.ranking} a ${ranking}`);
        if (oldPlayer.preferred_side !== preferredSide) modifiche.push(`Lato: da ${oldPlayer.preferred_side} a ${preferredSide}`);
        if (oldPlayer.dominant_hand !== dominantHand) modifiche.push(`Mano: da ${oldPlayer.dominant_hand} a ${dominantHand}`);
        if (oldPlayer.role !== role) modifiche.push(`Ruolo: da ${oldPlayer.role} a ${role}`);

        const dettagliLog = modifiche.length > 0
            ? `Admin ${adminFullName} ha modificato ${targetFullName}: ${modifiche.join('; ')}`
            : `Admin ${adminFullName} ha salvato il profilo di ${targetFullName} senza modifiche.`;

        await logAction(
            'UPDATE_PLAYER',
            playerId,
            dettagliLog,
            {
                changes: updatedFields,
                previous_data: oldPlayer
            }
        );
    }

    // Resettiamo le cache
    revalidatePath('/');
    revalidatePath('/admin/players');
    revalidatePath('/admin/logs');
}

// --- NUOVA AZIONE: Aggiornamento Avatar Utente ---
export async function updatePlayerAvatar(playerId: number, newAvatarUrl: string) {
    const supabase = await createClient();

    // 1. Verifica che l'utente sia loggato
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Non autorizzato. Devi effettuare l'accesso.");

    // 2. Recuperiamo il profilo dell'utente loggato per il log e per sicurezza
    const { data: currentUserPlayer } = await supabase
        .from('players')
        .select('id, first_name, last_name')
        .eq('user_id', user.id)
        .single();

    if (!currentUserPlayer || currentUserPlayer.id !== playerId) {
        throw new Error("Non puoi modificare la foto profilo di un altro giocatore.");
    }

    // 3. Aggiorna il database (il controllo su user_id garantisce ulteriore sicurezza)
    const { error } = await supabase
        .from('players')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', playerId)
        .eq('user_id', user.id);

    if (error) throw new Error(`Errore DB: ${error.message}`);

    // 4. Logghiamo l'azione nel sistema di Audit
    await logAction(
        'UPDATE_AVATAR',
        playerId,
        `Il giocatore ${currentUserPlayer.first_name} ${currentUserPlayer.last_name} ha aggiornato la propria foto profilo.`
    );

    // 5. Pulisce la cache di Next.js per mostrare subito la nuova immagine
    revalidatePath('/');
    revalidatePath(`/player/${playerId}`);
    revalidatePath('/admin/logs'); // Aggiorniamo anche i log admin

    return { success: true };
}
