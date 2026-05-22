// actions/club-actions.ts
'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * CREAZIONE DI UN NUOVO CLUB/CAMPO
 */
export async function createClub(formData: FormData) {
    const supabase = await createClient();
    const clubName = formData.get('name') as string;
    const clubAddress = formData.get('address') as string;
    const clubCity = formData.get('city') as string;

    if (!clubName || clubName.trim() === '') {
        return { error: "Il nome del circolo è obbligatorio." };
    }

    // 1. Controllo Autenticazione e Ruolo (Solo Admin)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Non autenticato");

    const { data: adminPlayer } = await supabase
        .from('players')
        .select('first_name, last_name, role')
        .eq('user_id', user.id)
        .single();

    if (!adminPlayer || adminPlayer.role !== 'admin') {
        throw new Error("Accesso negato: Solo gli amministratori possono aggiungere campi.");
    }

    // Generazione Automatica Link Google Maps
    let generatedMapsUrl = null;
    const fullAddressParts = [clubAddress?.trim(), clubCity?.trim()].filter(Boolean);
    const fullAddress = fullAddressParts.join(', ');

    if (fullAddress) {
        // encodeURIComponent trasforma spazi in %20, virgole in %2C, ecc.
        const encodedAddress = encodeURIComponent(`${clubName.trim()}, ${fullAddress}`);
        generatedMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    }

    // 2. Inserimento nel database
    const { error: insertError } = await supabase
        .from('clubs')
        .insert([{
            name: clubName.trim(),
            address: clubAddress?.trim() || null,
            city: clubCity?.trim() || null,
            maps_url: generatedMapsUrl
        }]);

    if (insertError) {
        return { error: `Errore durante il salvataggio: ${insertError.message}` };
    }

    // 3. Scrittura nell'Audit Log
    const operatore = `${adminPlayer.first_name} ${adminPlayer.last_name}`;
    await supabase.from('audit_logs').insert([{
        admin_id: user.id,
        admin_name: operatore,
        action_type: 'CLUB_CREATED',
        details: `L'admin ${operatore} ha aggiunto un nuovo circolo: ${clubName.trim()}`
    }]);

    revalidatePath('/admin/clubs');
    revalidatePath('/new-match'); // Invalida la cache del form match per mostrare subito il nuovo club
    return { success: true };
}

/**
 * ELIMINAZIONE DI UN CLUB/CAMPO
 */
export async function deleteClub(clubId: number) {
    const supabase = await createClient();

    // 1. Controllo Autenticazione e Ruolo
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Non autenticato");

    const { data: adminPlayer } = await supabase
        .from('players')
        .select('first_name, last_name, role')
        .eq('user_id', user.id)
        .single();

    if (!adminPlayer || adminPlayer.role !== 'admin') throw new Error("Accesso negato");

    // Recupero il nome del club prima di cancellarlo per scriverlo nel log
    const { data: clubToDel } = await supabase.from('clubs').select('name').eq('id', clubId).single();

    // 2. Eliminazione (I match collegati diventeranno club_id = NULL grazie al nostro ON DELETE SET NULL)
    const { error: deleteError } = await supabase
        .from('clubs')
        .delete()
        .eq('id', clubId);

    if (deleteError) throw new Error(`Impossibile eliminare il circolo: ${deleteError.message}`);

    // 3. Scrittura nell'Audit Log
    if (clubToDel) {
        const operatore = `${adminPlayer.first_name} ${adminPlayer.last_name}`;
        await supabase.from('audit_logs').insert([{
            admin_id: user.id,
            admin_name: operatore,
            action_type: 'CLUB_DELETED',
            details: `L'admin ${operatore} ha rimosso il circolo: ${clubToDel.name}`
        }]);
    }

    revalidatePath('/admin/clubs');
    revalidatePath('/new-match');
}
