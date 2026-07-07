// actions/club-actions.ts
'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logAction } from "@/lib/audit";
import dictError from "@/lib/i18n/dict-error";
import dictAudit from "@/lib/i18n/dict-audit";

/**
 * CREAZIONE DI UN NUOVO CLUB/CAMPO
 */
export async function createClub(formData: FormData) {
    const supabase = await createClient();
    const clubName = formData.get('name') as string;
    const clubAddress = formData.get('address') as string;
    const clubCity = formData.get('city') as string;

    if (!clubName || clubName.trim() === '') {
        return { error: dictError.CLUB_NAME_REQUIRED };
    }

    // 1. Controllo Autenticazione e Ruolo (Solo Admin)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error(dictError.AUTH_REQUIRED_ALT);

    const { data: adminPlayer } = await supabase
        .from('players')
        .select('first_name, last_name, role')
        .eq('user_id', user.id)
        .single();

    if (!adminPlayer || adminPlayer.role !== 'admin') {
        throw new Error(dictError.CLUB_CREATE_ADMIN_ONLY);
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
    const { data: club, error: insertError } = await supabase
        .from('clubs')
        .insert([{
            name: clubName.trim(),
            address: clubAddress?.trim() || null,
            city: clubCity?.trim() || null,
            maps_url: generatedMapsUrl
        }])
        .select('id')
        .single();

    if (insertError) {
        return { error: `Errore durante il salvataggio: ${insertError.message}` };
    }

    await logAction(
        'CLUB_CREATED',
        club.id,
        dictAudit.LOG_CLUB_CREATED.replace('{name}', clubName),
        { name: clubName, city: clubCity }
    );

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
    if (!user) throw new Error(dictError.AUTH_REQUIRED_ALT);

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

    if (deleteError) throw new Error(`${dictError.CLUB_DELETE_ERROR}${deleteError.message}`);

    // 3. Scrittura nell'Audit Log
    if (clubToDel) {
        await logAction(
            'CLUB_DELETED',
            clubId,
            dictAudit.LOG_CLUB_DELETED.replace('{name}', clubToDel.name),
            {
                club_name: clubToDel.name,
                action: 'deletion'
            }
        );
    }

    revalidatePath('/admin/clubs');
    revalidatePath('/new-match');
}
