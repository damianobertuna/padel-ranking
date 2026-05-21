'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updatePlayerByAdmin(formData: FormData) {
    const supabase = createClient();

    // 1. Verifichiamo l'ADMIN loggato
    const { data: { user } } = await (await supabase).auth.getUser();
    if (!user) throw new Error('Non autenticato');

    const { data: currentUserPlayer } = await (await supabase)
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
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const preferredSide = formData.get('preferredSide') as string;
    const dominantHand = formData.get('dominantHand') as string;
    const ranking = parseFloat(formData.get('ranking') as string);
    const role = formData.get('role') as string;

    // 2b. Recuperiamo i vecchi dati del giocatore per scrivere un log preciso
    const { data: oldPlayer } = await (await supabase)
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single();

    // 3. Eseguiamo l'UPDATE del giocatore
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
        throw new Error(error.message);
    }

    // 4. GENERIAMO IL LOG AUTOMATICO DI AUDIT
    if (oldPlayer) {
        const adminFullName = `${currentUserPlayer.first_name} ${currentUserPlayer.last_name}`;
        const targetFullName = `${firstName.trim()} ${lastName.trim()}`;

        // Costruiamo una descrizione testuale di cosa è cambiato
        const modifiche: string[] = [];
        if (oldPlayer.first_name !== firstName.trim() || oldPlayer.last_name !== lastName.trim()) modifiche.push(`Nome cambiato da "${oldPlayer.first_name} ${oldPlayer.last_name}" a "${targetFullName}"`);
        if (oldPlayer.ranking !== ranking) modifiche.push(`Ranking modificato da ${oldPlayer.ranking} a ${ranking}`);
        if (oldPlayer.preferred_side !== preferredSide) modifiche.push(`Lato cambiato da ${oldPlayer.preferred_side} a ${preferredSide}`);
        if (oldPlayer.dominant_hand !== dominantHand) modifiche.push(`Mano cambiata da ${oldPlayer.dominant_hand} a ${dominantHand}`);
        if (oldPlayer.role !== role) modifiche.push(`Ruolo cambiato da ${oldPlayer.role} a ${role}`);

        const dettagliLog = modifiche.length > 0
            ? `Modificato giocatore ${targetFullName}. Dettagli: ${modifiche.join(', ')}`
            : `Salvato modulo giocatore ${targetFullName} senza modifiche apparenti.`;

        // Inseriamo la riga nella tabella audit_logs
        await (await supabase).from('audit_logs').insert([
            {
                admin_id: user.id,
                admin_name: adminFullName,
                action_type: 'UPDATE_PLAYER',
                target_player_id: playerId,
                details: dettagliLog
            }
        ]);
    }

    // Resettiamo le cache
    revalidatePath('/');
    revalidatePath('/admin/players');
    revalidatePath('/admin/logs');
}
