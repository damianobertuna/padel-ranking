import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { canUserResolveMatch } from '@/lib/matchRules';
import DeleteMatchButton from '@/components/DeleteMatchButton';

export const revalidate = 0;

// Definiamo il numero di match da mostrare per pagina nello storico
const MATCHES_PER_PAGE = 5;

interface PageProps {
    searchParams: Promise<{ page?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
    const supabase = await createClient();

    // 1. Intercettiamo la pagina corrente dai parametri dell'URL (Next.js 15 richiede l'await)
    const resolvedParams = await searchParams;
    const currentPage = parseInt(resolvedParams.page || '1', 10) || 1;

    // 2. Recuperiamo la sessione dell'utente loggato
    const { data: { user } } = await supabase.auth.getUser();

    // 3. Se l'utente è loggato, recuperiamo il suo profilo giocatore
    let currentUserPlayer = null;
    if (user) {
        const { data: playerData } = await supabase
            .from('players')
            .select('*')
            .eq('user_id', user.id)
            .single();
        currentUserPlayer = playerData;
    }

    // 4. Recuperiamo la classifica completa
    const { data: players } = await supabase
        .from('players')
        .select('*')
        .order('ranking', { ascending: false });

    // 5. Recuperiamo le partite IN PROGRAMMA (pending)
    const { data: pendingMatches } = await supabase
        .from('matches')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    // 6. PAGINAZIONE RISULTATI: Calcoliamo gli indici per la query Supabase
    const fromRange = (currentPage - 1) * MATCHES_PER_PAGE;
    const toRange = fromRange + MATCHES_PER_PAGE - 1;

    // Recuperiamo i match completati all'interno del range e il conteggio totale (count: 'exact')
    const { data: completedMatches, count: totalCompletedCount, error: matchError } = await supabase
        .from('matches')
        .select('*', { count: 'exact' })
        .eq('status', 'completed')
        .order('updated_at', { ascending: false })
        .range(fromRange, toRange);

    const totalPages = totalCompletedCount ? Math.ceil(totalCompletedCount / MATCHES_PER_PAGE) : 1;

    console.log(`=== DEBUG PAGINAZIONE (Pagina ${currentPage}/${totalPages}) ===`);
    console.log("Match trovati in questo range:", completedMatches?.length);
    console.log("Totale match completati nel DB:", totalCompletedCount);

    const leftPlayers = players?.filter(p => p.preferred_side === 'Left') || [];
    const rightPlayers = players?.filter(p => p.preferred_side === 'Right') || [];
    const kingLeftId = leftPlayers.length > 0 ? leftPlayers[0].id : null;
    const kingRightId = rightPlayers.length > 0 ? rightPlayers[0].id : null;
    const lastPlaceId = players && players.length > 0 ? players[players.length - 1].id : null;

    // Helper per recuperare nome e cognome
    const getPlayerName = (id: number) => {
        const p = players?.find(player => player.id === id);
        return p ? `${p.first_name} ${p.last_name}` : 'Sconosciuto';
    };

    // Helper per recuperare l'oggetto giocatore completo (serve per il ranking del link WhatsApp)
    const getPlayerObj = (id: number) => {
        return players?.find(player => player.id === id) || null;
    };

    // FUNZIONE GENERATRICE LINK WHATSAPP
    const generaLinkWhatsApp = (match: any) => {
        const pA1 = getPlayerObj(match.team_a_left_id);
        const pA2 = getPlayerObj(match.team_a_right_id);
        const pB1 = getPlayerObj(match.team_b_left_id);
        const pB2 = getPlayerObj(match.team_b_right_id);

        const dataFormattata = new Date(match.created_at).toLocaleString('it-IT', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });

        const testo =
            `🎾 *RanKING Padel - Convocazione Match* 🎾\n\n📅 *Data d'organizzazione:* ${dataFormattata}\n\n👥 *SQUADRA A:*\n• ${pA1 ? `${pA1.first_name} ${pA1.last_name}` : 'Sconosciuto'} (${pA1 ? pA1.ranking.toFixed(2) : '0.00'})\n• ${pA2 ? `${pA2.first_name} ${pA2.last_name}` : 'Sconosciuto'} (${pA2 ? pA2.ranking.toFixed(2) : '0.00'})\n\n👥 *SQUADRA B:*\n• ${pB1 ? `${pB1.first_name} ${pB1.last_name}` : 'Sconosciuto'} (${pB1 ? pB1.ranking.toFixed(2) : '0.00'})\n• ${pB2 ? `${pB2.first_name} ${pB2.last_name}` : 'Sconosciuto'} (${pB2 ? pB2.ranking.toFixed(2) : '0.00'})\n\n👉 Accedi all'app per inserire il risultato a fine partita!`;

        return `https://wa.me/?text=${encodeURIComponent(testo)}`;
    };

    return (
        <main className="min-h-screen p-4 sm:p-8 bg-slate-100 flex flex-col items-center">
            <div className="max-w-4xl w-full">

                {/* BARRA DI AUTENTICAZIONE IN ALTO */}
                <div className="w-full flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="min-w-0">
                        {user ? (
                            <p className="text-sm text-slate-600 truncate">
                                Connesso come: <strong className="text-slate-900">{currentUserPlayer?.first_name} {currentUserPlayer?.last_name}</strong>
                                <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold uppercase">{currentUserPlayer?.role}</span>
                            </p>
                        ) : (
                            <p className="text-sm text-slate-500">Modalità sola lettura</p>
                        )}
                    </div>
                    <div className="shrink-0 pl-2">
                        {user ? (
                            <form action="/auth/signout" method="post">
                                <button type="submit" className="text-sm font-semibold text-red-600 hover:underline">Esci</button>
                            </form>
                        ) : (
                            <Link href="/login" className="text-sm font-bold text-indigo-600 hover:underline">Accedi</Link>
                        )}
                    </div>
                </div>

                {/* INTESTAZIONE CLASSIFICA */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">RanKING Padel</h1>
                    <div className="flex gap-2 w-full sm:w-auto">
                        {user && (
                            <Link href="/new-match" className="flex-1 sm:flex-none text-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors text-sm shadow-sm">
                                + Nuova Partita
                            </Link>
                        )}
                        {currentUserPlayer?.role === 'admin' && (
                            <>
                                <Link href="/admin/players" className="bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl hover:bg-slate-900 transition-colors text-sm shadow-sm text-center">
                                    ⚙️ Giocatori
                                </Link>
                                <Link href="/admin/logs" className="bg-indigo-600 text-white font-bold py-2.5 px-4 rounded-xl hover:bg-indigo-700 transition-colors text-sm shadow-sm text-center">
                                    📋 Log
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* CLASSIFICA CARD OTTIMIZZATA PER MOBILE */}
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Classifica Ufficiale</h2>
                <div className="flex flex-col gap-2.5 mb-8">
                    {players?.map((player, index) => {
                        const rankIndex = index + 1;
                        const isKingLeft = player.id === kingLeftId;
                        const isKingRight = player.id === kingRightId;
                        const isLastPlace = player.id === lastPlaceId;

                        return (
                            <Link
                                key={player.id}
                                href={`/player/${player.id}`}
                                className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between transition-all active:bg-slate-50 active:scale-[0.99] touch-manipulation"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black font-mono shrink-0 ${
                                        rankIndex === 1 ? 'bg-amber-100 text-amber-700 border border-amber-300' :
                                            rankIndex === 2 ? 'bg-slate-100 text-slate-600 border border-slate-300' :
                                                rankIndex === 3 ? 'bg-orange-100 text-orange-700 border border-orange-300' :
                                                    'bg-slate-50 text-slate-400'
                                    }`}>
                                        {rankIndex}°
                                    </div>

                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="font-bold text-slate-800 text-base truncate">
                                                {player.first_name} {player.last_name}
                                            </span>
                                            {isKingLeft && <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase shrink-0">King SX</span>}
                                            {isKingRight && <span className="bg-yellow-100 text-yellow-800 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase shrink-0">King DX</span>}
                                            {isLastPlace && <span className="bg-red-100 text-red-800 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase shrink-0">Fanalino</span>}
                                        </div>
                                        <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 font-medium">
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${player.preferred_side === 'Left' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                Lato {player.preferred_side === 'Left' ? 'SX' : 'DX'}
                                            </span>
                                            <span className="text-slate-200">•</span>
                                            <span className="text-indigo-500 font-semibold">Vedi statistiche →</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="text-right">
                                        <div className="text-lg font-mono font-black text-indigo-600 leading-none">
                                            {player.ranking.toFixed(2)}
                                        </div>
                                        <span className="text-[9px] text-slate-400 uppercase tracking-tight font-bold">Punti</span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* BANNER PUBBLICITARIO SPONSOR */}
                <div className="w-full bg-gradient-to-r from-indigo-950 to-slate-900 text-white p-5 rounded-xl shadow-sm mb-12 flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-700">
                    <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
                        <div className="bg-white p-2 rounded-md flex items-center justify-center shadow-sm max-w-[140px] shrink-0">
                            <img src="https://www.bionutrimed.it/templates/rt_gemini/custom/images/loghi/bionutrimed_logo_small.png" alt="BioNutriMed Logo" className="h-10 w-auto object-contain select-none" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold tracking-wide text-slate-100">Vuoi scalare il Ranking? Cura la tua nutrizione!</h3>
                            <p className="text-xs text-slate-300 max-w-xl mt-1 leading-relaxed">
                                Scopri come un'alimentazione strategica su misura può aumentare la tua resistenza nei match più lunghi e velocizzare il recovery muscolare.
                            </p>
                        </div>
                    </div>
                    <a href="https://www.bionutrimed.it/prenota/prenota-visita-in-studio.html" target="_blank" rel="noopener noreferrer" className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs uppercase tracking-wider py-3 px-5 rounded-lg transition-all shadow-sm text-center w-full md:w-auto shrink-0">
                        🌐 Prenota una visita
                    </a>
                </div>

                {/* SEZIONE 1: PARTITE IN PROGRAMMA */}
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Partite in Programma</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                    {pendingMatches && pendingMatches.length > 0 ? (
                        pendingMatches.map((match) => {
                            const authCtx = currentUserPlayer ? {
                                userRole: currentUserPlayer.role as 'admin' | 'user',
                                userPlayerId: currentUserPlayer.id
                            } : null;

                            const canResolve = canUserResolveMatch(authCtx, match);

                            return (
                                <div key={match.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between gap-4">
                                    <div>
                                        <div className="grid grid-cols-2 gap-3 text-center">
                                            <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                                <div className="text-[10px] font-bold text-blue-600 uppercase mb-1">Coppia A</div>
                                                <div className="text-sm font-bold text-slate-800 truncate">{getPlayerName(match.team_a_left_id)}</div>
                                                <div className="text-sm font-bold text-slate-800 truncate">{getPlayerName(match.team_a_right_id)}</div>
                                            </div>
                                            <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                                                <div className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Coppia B</div>
                                                <div className="text-sm font-bold text-slate-800 truncate">{getPlayerName(match.team_b_left_id)}</div>
                                                <div className="text-sm font-bold text-slate-800 truncate">{getPlayerName(match.team_b_right_id)}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <a href={generaLinkWhatsApp(match)} target="_blank" rel="noopener noreferrer" className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-sm">
                                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397 0 11.948 0c3.173.001 6.154 1.24 8.396 3.486 2.242 2.246 3.479 5.23 3.477 8.406-.003 6.557-5.338 11.907-11.89 11.907-2.013-.001-3.99-.51-5.741-1.48L0 24zm6.59-4.846c1.66.986 3.288 1.447 4.805 1.448 5.41-.001 9.814-4.415 9.816-9.83.001-2.624-1.012-5.09-2.856-6.937C16.569 1.988 14.09 1.05 11.47 1.05c-5.416 0-9.821 4.415-9.824 9.83-.001 2.05.534 3.513 1.41 5.03L2.025 21.93l6.222-1.63z" /></svg>
                                            Convoca su WhatsApp
                                        </a>

                                        <div className="flex gap-2 w-full">
                                            {canResolve ? (
                                                <Link href={`/resolve-match/${match.id}`} className="flex-1 text-center bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold py-2.5 rounded-xl transition-colors shadow-sm">
                                                    Inserisci Risultato
                                                </Link>
                                            ) : (
                                                <div className="flex-1 text-center bg-slate-100 text-slate-400 text-xs py-2.5 rounded-xl italic select-none border border-slate-200 flex items-center justify-center">
                                                    Sola lettura (non sei in campo)
                                                </div>
                                            )}
                                            {canResolve && <DeleteMatchButton matchId={match.id} />}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-slate-500 italic col-span-2">Nessuna partita in programma.</p>
                    )}
                </div>

                {/* SEZIONE 2: STORICO RISULTATI RECENTI PAGINATO */}
                <div className="flex justify-between items-baseline mb-4">
                    <h2 className="text-2xl font-bold text-slate-800">Risultati Recenti</h2>
                    <span className="text-xs font-semibold text-slate-400 font-mono">Pagina {currentPage} di {totalPages}</span>
                </div>

                <div className="space-y-3">
                    {completedMatches && completedMatches.length > 0 ? (
                        completedMatches.map((match) => {
                            const winner = match.winning_team;
                            const sets = (match.score || []) as Array<{team_a: number, team_b: number}>;

                            return (
                                <div key={match.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3">
                                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">

                                        {/* Team A */}
                                        <div className={`flex flex-col items-center sm:items-start p-3 rounded-xl w-full sm:w-5/12 ${winner === 'A' ? 'bg-green-50 border-l-4 border-l-green-500 font-semibold' : 'opacity-60'}`}>
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Coppia A</span>
                                                {winner === 'A' && <span className="bg-green-200 text-green-800 text-[9px] font-black px-1.5 py-0.2 rounded uppercase">WIN 🎉</span>}
                                            </div>
                                            <div className="text-sm text-slate-800 truncate w-full text-center sm:text-left">{getPlayerName(match.team_a_left_id)}</div>
                                            <div className="text-sm text-slate-800 truncate w-full text-center sm:text-left">{getPlayerName(match.team_a_right_id)}</div>
                                        </div>

                                        {/* Punteggio dei Set al centro */}
                                        <div className="flex flex-col items-center justify-center shrink-0">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 select-none">Punteggio</div>
                                            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 font-mono font-black text-sm text-indigo-600 shadow-inner">
                                                {sets.length > 0 ? (
                                                    sets.map((set, sIdx) => (
                                                        <span key={sIdx} className="bg-white px-1.5 py-0.5 rounded border border-slate-200/60 shadow-sm">
                                                            {set.team_a}-{set.team_b}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs font-normal text-slate-400 italic">Dato pre-set</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Team B */}
                                        <div className={`flex flex-col items-center sm:items-end p-3 rounded-xl w-full sm:w-5/12 text-center sm:text-right ${winner === 'B' ? 'bg-green-50 border-r-4 border-r-green-500 font-semibold' : 'opacity-60'}`}>
                                            <div className="flex items-center sm:flex-row-reverse gap-1.5 mb-1">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Coppia B</span>
                                                {winner === 'B' && <span className="bg-green-200 text-green-800 text-[9px] font-black px-1.5 py-0.2 rounded uppercase">WIN 🎉</span>}
                                            </div>
                                            <div className="text-sm text-slate-800 truncate w-full text-center sm:text-right">{getPlayerName(match.team_b_left_id)}</div>
                                            <div className="text-sm text-slate-800 truncate w-full text-center sm:text-right">{getPlayerName(match.team_b_right_id)}</div>
                                        </div>

                                    </div>

                                    <div className="text-[10px] text-slate-400 text-center sm:text-left font-medium border-t border-slate-50 pt-2">
                                        Disputata il {new Date(match.updated_at).toLocaleDateString('it-IT')}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-slate-500 italic">Nessun match completato in questa pagina.</p>
                    )}
                </div>

                {/* CONTROLLI DI PAGINAZIONE (BOTTONI AVANTI / DIETRO) */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-6">
                        <Link
                            href={`/?page=${currentPage - 1}`}
                            scroll={false}
                            className={`px-4 py-2 bg-white border border-slate-200 text-sm font-bold text-slate-700 rounded-xl shadow-sm transition-all active:scale-95 ${
                                currentPage <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-slate-50'
                            }`}
                        >
                            ← Precedente
                        </Link>

                        <div className="text-xs font-bold text-slate-500 font-mono">
                            {currentPage} / {totalPages}
                        </div>

                        <Link
                            href={`/?page=${currentPage + 1}`}
                            scroll={false}
                            className={`px-4 py-2 bg-white border border-slate-200 text-sm font-bold text-slate-700 rounded-xl shadow-sm transition-all active:scale-95 ${
                                currentPage >= totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-slate-50'
                            }`}
                        >
                            Successiva →
                        </Link>
                    </div>
                )}

            </div>
        </main>
    );
}
