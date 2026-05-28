import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Script from 'next/script';
import '@/app/globals.css'; // Assicurati che l'import dei CSS globali sia corretto

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
        <div>
          {user ? (
              <span className="opacity-90">Account: <span className="font-bold text-white">{currentUserPlayer?.first_name} {currentUserPlayer?.last_name}</span></span>
          ) : (
              <span className="opacity-70">Lector Mode</span>
          )}
        </div>
        <div>
          {user ? (
              <form action="/auth/signout" method="post">
                <button type="submit" className="text-red-400 hover:text-red-300 font-bold transition-colors">Logout</button>
              </form>
          ) : (
              <Link href="/login" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">Login / Register</Link>
          )}
        </div>
      </div>

      {/* 2. BLOCCO BRAND E PULSANTI (Centrato, ma scorre via col contenuto) */}
      <div className="w-full flex flex-col items-center bg-slate-50 border-b-2 border-slate-900">
        <div className="max-w-4xl w-full px-4 sm:px-8 py-4 flex flex-col md:flex-row md:justify-between md:items-end gap-4">

          {/* LOGO E TITOLO */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/" className="shrink-0 flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer">
              <div className="shrink-0 flex items-center justify-center">
                  <img
                      src="/padel_ranking_logo.svg"
                      alt="RanKING Padel Logo"
                      className="w-14 h-14 sm:w-20 sm:h-20 object-contain mix-blend-multiply"
                  />
              </div>
              <div>
                <h1 className="text-4xl sm:text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                  RanKING<br/><span className="text-blue-600">Padel</span>
                </h1>
              </div>
            </Link>
          </div>

          {/* PULSANTI DI NAVIGAZIONE */}
          <div className="flex flex-col items-start md:items-end gap-2">
            <div className="flex flex-wrap gap-2 justify-start md:justify-end">
              {user && (
                  <Link href="/new-match" className="bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-wider py-2 px-4 text-xs transition-colors rounded-sm inline-flex items-center justify-center w-auto">
                    + Nuova Partita
                  </Link>
              )}
              <Link href="/rules" className="bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold uppercase tracking-wider py-2 px-4 text-xs transition-colors rounded-sm inline-flex items-center gap-1.5 justify-center w-auto">
                <span className="text-sm">📖</span> Regolamento
              </Link>
              <Link href="/guide" className="bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold uppercase tracking-wider py-2 px-4 text-xs transition-colors rounded-sm inline-flex items-center gap-1.5 justify-center w-auto">
                <span className="text-sm">❓</span> Guida
              </Link>
            </div>

            {currentUserPlayer?.role === 'admin' && (
                <div className="flex flex-wrap gap-2 mt-1 justify-start md:justify-end">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:flex items-center mr-1">Admin Tools:</span>
                  <Link href="/admin/players" className="bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase tracking-wider py-1.5 px-3 text-[10px] transition-colors rounded-sm inline-flex items-center gap-1.5 w-auto">
                    ⚙️ Giocatori
                  </Link>
                  <Link href="/admin/clubs" className="bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase tracking-wider py-1.5 px-3 text-[10px] transition-colors rounded-sm inline-flex items-center gap-1.5 w-auto">
                    📍 Club
                  </Link>
                  <Link href="/admin/logs" className="bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase tracking-wider py-1.5 px-3 text-[10px] transition-colors rounded-sm inline-flex items-center gap-1.5 w-auto">
                    📋 Logs
                  </Link>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. CONTENUTO DELLE PAGINE (Home, Nuova Partita, ecc.)
                    Aggiungiamo pb-24 per evitare che il footer fisso si sovrapponga ai form o alle liste */}
      <div className="flex-1 pb-6">
        {children}
        <div className="mt-8 mb-3 w-full bg-slate-900 text-white p-4 sm:p-5 mb-6 flex flex-col md:flex-row items-center justify-between gap-6 border-l-4 border-emerald-500">
          <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
            <div className="bg-white p-2 flex items-center justify-center min-w-[140px] shrink-0">
              <img src="https://www.bionutrimed.it/templates/rt_gemini/custom/images/loghi/bionutrimed_logo_small.png" alt="BioNutriMed Logo" className="h-10 w-auto object-contain select-none" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400">Vuoi scalare il Ranking? Cura la tua nutrizione!</h3>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-300 mt-1.5 leading-relaxed uppercase tracking-wide">
                Scopri come un'alimentazione strategica su misura può aumentare la tua resistenza nei match più lunghi e velocizzare il recovery muscolare.
              </p>
            </div>
          </div>
          <a
              href="https://www.bionutrimed.it/prenota/prenota-visita-in-studio.html"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-black text-[10px] uppercase tracking-widest py-3 px-5 transition-colors text-center w-full md:w-auto shrink-0"
          >
            PRENOTA UNA VISITA
          </a>
        </div>
      </div>

      {/* 3. FOOTER LEGALE IUBENDA GLOBALE (Fixed & Sempre Visibile) */}
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

      {/* 1. Configurazione Iubenda (Eseguita in modo sincrono nativo) */}
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

      {/* 2. Motore Cookie Iubenda (Asincrono, caricato DOPO la configurazione) */}
      <Script src="https://cdn.iubenda.com/cs/iubenda_cs.js" strategy="afterInteractive" />

      {/* 3. Motore per aprire le policy legali nei link */}
      <Script src="https://cdn.iubenda.com/iubenda.js" strategy="lazyOnload" />
      </body>
      </html>
  );
}
