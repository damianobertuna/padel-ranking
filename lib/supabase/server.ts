import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
    // Aspettiamo la promessa dei cookies prima di usarli
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options });
                    } catch (error) {
                        // Ignoriamo l'errore se chiamato da un Server Component puro
                    }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options });
                    } catch (error) {
                        // Ignoriamo l'errore se chiamato da un Server Component puro
                    }
                },
            },
        }
    );
}

// Assicurati di avere questo import in alto nel file, se non c'è già:
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// ... (il tuo codice esistente per createClient rimane intatto) ...

/**
 * Client Admin: Scavalca le RLS.
 * DA USARE SOLO NELLE SERVER ACTIONS PER OPERAZIONI DI SISTEMA (es. calcolo ranking).
 * Non esporre mai questo client al browser.
 */
export function createAdminClient() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error("Variabili d'ambiente Supabase mancanti per l'Admin Client.");
    }

    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false // Il server non deve mantenere sessioni admin persistenti
            }
        }
    );
}
