import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({ name, value, ...options });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({ name, value, ...options });
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: '', ...options });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({ name, value: '', ...options });
                },
            },
        }
    );

    // Recuperiamo l'utente corrente
    const { data: { user } } = await supabase.auth.getUser();

    // Se l'utente non è loggato e sta cercando di andare su pagine protette
    const isProtectedPath = request.nextUrl.pathname.startsWith('/new-match') ||
        request.nextUrl.pathname.startsWith('/resolve-match');

    if (!user && isProtectedPath) {
        // Modo nativo e sicuro in Next.js per fare un redirect pulito alla login
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return response;
}

// Diciamo a Next.js su quali rotte far girare questo controllo
export const config = {
    matcher: [
        '/new-match',
        '/resolve-match/:path*',
    ],
};
