import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Script from 'next/script';
import '@/app/globals.css';

export default async function RootLayout({
                                             children,
                                         }: {
    children: React.ReactNode;
}) {
    // Recuperiamo la sessione Supabase a livello globale per l'Header
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let currentUserPlayer = null;
    if (user) {
        const { data: playerData } = await supabase
            .from('players')
            .select('*')
            .eq('user_id', user.id)
            .single();
        currentUserPlayer = playerData;
    }

    return (
        <html lang="it">
        <body className="min-h-screen bg-slate-50 flex flex-col text-slate-900 antialiased">

        {/* 1. TOPBAR SCURA (Sottile e Sticky in alto) */}
        <div className="mb-3 sticky top-0 z-50 w-full bg-slate-900/95 backdrop-blur-sm text-white flex justify-between items-center py-2.5 px-4 sm:px-8 text-xs font-semibold uppercase tracking-wider shadow-sm">
            <div className="truncate pr-2">
                {user ? (
                    <span className="opacity-90">Account: <span className="font-bold text-white">{currentUserPlayer?.first_name} {currentUserPlayer?.last_name}</span></span>
                ) : (
                    <span className="opacity-70">Lector Mode</span>
                )}
            </div>

            {/* NAVIGAZIONE SECONDARIA E LOGOUT */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                <Link href="/rules" className="text-slate-300 hover:text-white transition-colors flex items-center gap-1.5" title="Regolamento">
                    <span className="text-sm">📖</span>
                    <span className="hidden sm:inline">Regole</span>
                </Link>
                <Link href="/guide" className="text-slate-300 hover:text-white transition-colors flex items-center gap-1.5" title="Guida">
                    <span className="text-sm">❓</span>
                    <span className="hidden sm:inline">Guida</span>
                </Link>

                <div className="w-px h-4 bg-slate-700 hidden sm:block"></div>

                {user ? (
                    <form action="/auth/signout" method="post">
                        <button type="submit" className="text-red-400 hover:text-red-300 font-bold transition-colors">Logout</button>
                    </form>
                ) : (
                    <Link href="/login" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">Login / Register</Link>
                )}
            </div>
        </div>

        {/* 2. BLOCCO BRAND E PULSANTI PRINCIPALI */}
        <div className="w-full flex flex-col items-center bg-slate-50 border-b-2 border-slate-900">
            <div className="max-w-4xl w-full px-4 sm:px-8 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">

                {/* LOGO E TITOLO */}
                <div className="flex items-center gap-2 sm:gap-3 justify-center sm:justify-start">
                    <Link href="/" className="shrink-0 flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer">
                        <div className="shrink-0 flex items-center justify-center">
                            <img
                                src="/padel_ranking_logo.svg"
                                alt="RanKING Padel Logo"
                                className="w-14 h-14 sm:w-20 sm:h-20 object-contain mix-blend-multiply"
                            />
                        </div>
                        <div>
                            <h1 className="text-4xl sm:text-4xl font-black text-slate-900 tracking-tighter leading-none group-hover:opacity-80 transition-opacity text-left">
                                Ran<span className="text-blue-600">KING</span><br/>
                                <span className="text-blue-600">Padel</span>
                            </h1>
                        </div>
                    </Link>
                </div>

                {/* CALL TO ACTION PRINCIPALE E ADMIN TOOLS */}
                <div className="flex flex-col items-center sm:items-end gap-3 w-full sm:w-auto">
                    {/* Bottone visibile SOLO su desktop (sm:inline-flex) */}
                    {user && (
                        <Link href="/new-match" className="hidden sm:inline-flex bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-wider py-3 px-6 text-sm transition-colors rounded-sm items-center justify-center shadow-sm">
                            + Nuova Partita
                        </Link>
                    )}

                    {currentUserPlayer?.role === 'admin' && (
                        <div className="flex flex-wrap gap-2 justify-center sm:justify-end w-full">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden lg:flex items-center mr-1">Admin Tools:</span>
                            <Link href="/admin/players" className="bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase tracking-wider py-1.5 px-3 text-[10px] transition-colors rounded-sm inline-flex items-center gap-1.5 flex-1 sm:flex-none justify-center">
                                ⚙️ Giocatori
                            </Link>
                            <Link href="/admin/clubs" className="bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase tracking-wider py-1.5 px-3 text-[10px] transition-colors rounded-sm inline-flex items-center gap-1.5 flex-1 sm:flex-none justify-center">
                                📍 Club
                            </Link>
                            <Link href="/admin/logs" className="bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase tracking-wider py-1.5 px-3 text-[10px] transition-colors rounded-sm inline-flex items-center gap-1.5 flex-1 sm:flex-none justify-center">
                                📋 Logs
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* 3. CONTENUTO DELLE PAGINE */}
        <div className="flex-1 pb-16">
            {children}

            {/* BANNER BIONUTRIMED */}
            <div className="max-w-4xl mx-auto px-4 sm:px-8">
                <div className="mt-8 mb-6 w-full bg-slate-900 text-white p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-6 border-l-4 border-emerald-500 rounded-sm">
                    <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
                        <div className="bg-white p-2 flex items-center justify-center min-w-[140px] shrink-0 rounded-sm">
                            <img src="https://www.bionutrimed.it/templates/rt_gemini/custom/images/loghi/bionutrimed_logo_small.png" alt="BioNutriMed Logo" className="h-10 w-auto object-contain select-none" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400">Vuoi scalare il Ranking? Cura la tua nutrizione con Bionutrimed</h3>
                            <p className="text-[9px] sm:text-[10px] font-bold text-slate-300 mt-1.5 leading-relaxed uppercase tracking-wide">
                                Scopri come un'alimentazione strategica su misura può aumentare la tua resistenza nei match più lunghi e velocizzare il recovery muscolare. Affidati alla{' '}
                                <a
                                    href="https://www.bionutrimed.it/prenota/prenota-visita-in-studio.html"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-emerald-400 hover:text-emerald-300 font-black underline underline-offset-[3px] decoration-emerald-500/40 hover:decoration-emerald-400 transition-colors"
                                >
                                    Biologa nutrizionista Dott.ssa Teresa Licciardi
                                </a>
                            </p>
                        </div>
                    </div>
                    <a
                        href="https://www.bionutrimed.it/studio-nutrizione-a-catania/biologo-nutrizionista-catania.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-black text-[10px] uppercase tracking-widest py-3 px-5 transition-colors text-center w-full md:w-auto shrink-0 rounded-sm shadow-sm"
                    >
                        PRENOTA UNA VISITA
                    </a>
                </div>
            </div>
        </div>

        {/* 4. FAB (Floating Action Button) MOBILE */}
        {/* Visibile SOLO su mobile (sm:hidden), posizionato just sopra il footer Iubenda (bottom-16) */}
        {user && (
            <Link
                href="/new-match"
                className="sm:hidden fixed bottom-16 right-5 z-40 bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-[0_4px_12px_rgba(37,99,235,0.4)] active:scale-95 transition-transform"
                aria-label="Nuova Partita"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
            </Link>
        )}

        {/* 5. FOOTER LEGALE IUBENDA GLOBALE */}
        <footer className="w-full py-3 bg-slate-50/90 backdrop-blur-sm border-t border-slate-200 fixed bottom-0 left-0 right-0 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                <a
                    href="https://www.iubenda.com/privacy-policy/89843982"
                    className="iubenda-white iubenda-noiframe iubenda-embed text-slate-500 hover:text-slate-900 transition-colors"
                    title="Privacy Policy"
                >
                    Privacy Policy
                </a>
                <span className="text-slate-300">|</span>
                <a
                    href="https://www.iubenda.com/privacy-policy/89843982/cookie-policy"
                    className="iubenda-white iubenda-noiframe iubenda-embed text-slate-500 hover:text-slate-900 transition-colors"
                    title="Cookie Policy"
                >
                    Cookie Policy
                </a>
            </div>
        </footer>

        {/* SCRIPT IUBENDA */}
        <script dangerouslySetInnerHTML={{
            __html: `
                        var _iub = _iub || [];
                        _iub.csConfiguration = {
                            "askConsentAtCookiePolicyUpdate": true,
                            "floatingPreferencesButtonDisplay": "bottom-right",
                            "perPurposeConsent": true,
                            "siteId": 4547620,
                            "whitelabel": false,
                            "cookiePolicyId": 89843982,
                            "lang": "it",
                            "localConsentDomain": "padel-ranking-plum.vercel.app",
                            "banner": {
                                "acceptButtonDisplay": true,
                                "closeButtonDisplay": false,
                                "customizeButtonDisplay": true,
                                "explicitWithdrawal": true,
                                "listPurposes": true,
                                "position": "float-bottom-center",
                                "rejectButtonDisplay": true
                            }
                        };
                    `
        }} />
        <Script src="https://cdn.iubenda.com/cs/iubenda_cs.js" strategy="afterInteractive" />
        <Script src="https://cdn.iubenda.com/iubenda.js" strategy="lazyOnload" />

        </body>
        </html>
    );
}
