import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const supabase = await createClient();

    // Controlliamo se l'utente è effettivamente loggato prima di disconnetterlo
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        await supabase.auth.signOut();
    }

    // Ricarica la Home Page svuotata
    const url = new URL(request.url);
    return NextResponse.redirect(new URL('/', url.origin), {
        status: 303,
    });
}
