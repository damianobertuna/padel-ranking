import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import PendingMatchCard from '@/components/PendingMatchCard';
import { Player } from "@/types";
import { computeKingAndFanalino } from '@/lib/rankingCalc';

const MATCHES_PER_PAGE = 5;

interface PageProps {
    // 👈 AGGIORNATO: Aggiunto gender opzionale nei parametri della URL
    searchParams: Promise<{ page?: string; sort?: string; gender?: string }>;
}

function getPlayerNameWithRanking(id: number | null, playersList: Player[]) {
    if (id === null) return 'Slot Libero';
    const p = playersList?.find(player => player.id === id);
    return p ? `${p.first_name} ${p.last_name} (${p.ranking.toFixed(2)})` : 'Sconosciuto';
}

export default async function Home({ searchParams }: PageProps) {
    const supabase = await createClient();

    const resolvedParams = await searchParams;
    const currentPage = parseInt(resolvedParams.page || '1', 10) || 1;
    const currentSort = resolvedParams.sort || 'ranking';
    // 👈 NUOVO: Lettura del genere dalla URL con fallback di default su 'M' (Uomini)
    const currentGender = resolvedParams.gender || 'all';

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

    const { data: playersStatsData } = await supabase.from('view_player_stats').select('*');
    const playersWithStats = playersStatsData || [];

    // 👑 Calcolo dei titoli ASSOLUTI (eseguito sull'anagrafica completa prima del filtro visivo)
    const {
        kingLeftIds,
        kingRightIds,
        kingBothIds,
        lastPlaceLeftIds,
        lastPlaceRightIds,
        lastPlaceBothIds
    } = computeKingAndFanalino(playersWithStats);

    // 👈 NUOVO: Filtriamo l'array dei giocatori in base al genere selezionato prima di ordinarli
    const filteredPlayers = playersWithStats.filter(player => {
        if (currentGender === 'all') return true; // Mostra tutti
        return player.gender === currentGender;   // 'M' o 'F'
    });

    // 👈 AGGIORNATO: Ora ordiniamo l'array già filtrato (filteredPlayers)
    const sortedPlayers = [...filteredPlayers].sort((a, b) => {
        if (currentSort === 'played') {
            return b.total_played - a.total_played || b.ranking - a.ranking;
        }
        if (currentSort === 'winrate') {
            return b.win_rate - a.win_rate || b.total_played - a.total_played;
        }
        return b.ranking - a.ranking;
    });

    const { data: pendingMatches } = await supabase
        .from('matches')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    const fromRange = (currentPage - 1) * MATCHES_PER_PAGE;
    const toRange = fromRange + MATCHES_PER_PAGE - 1;

    const { data: completedMatches, count: totalCompletedCount } = await supabase
        .from('matches')
        .select('*', { count: 'exact' })
        .eq('status', 'completed')
        .order('updated_at', { ascending: false })
        .range(fromRange, toRange);

    const totalPages = totalCompletedCount ? Math.ceil(totalCompletedCount / MATCHES_PER_PAGE) : 1;

    return (
        <main className="min-h-screen p-4 sm:p-8 bg-slate-100 flex flex-col items-center">
            <div className="max-w-4xl w-full">

                {/* BARRA DI AUTENTICAZIONE */}
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

                {/* INTESTAZIONE */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">RanKING Padel</h1>
                    <Link
                        href="/rules"
                        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-black rounded-full border border-indigo-200/60 transition-all hover:scale-[1.02] shadow-xs"
                    >
                        <span className="font-mono text-sm leading-none">📖</span>
                        <span>Regolamento Ufficiale</span>
                    </Link>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Link
                            href="/rules"
                            className="sm:hidden flex-1 inline-flex items-center justify-center gap-2 bg-slate-200/80 hover:bg-slate-300 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition-all text-sm shadow-xs active:scale-[0.99]"
                        >
                            <span>📖</span>
                            <span>Regolamento</span>
                        </Link>

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

                {/* FILTRI DI ORDINAMENTO E DI GENERE DINAMICI */}
                {/* 👈 AGGIORNATO: Cambiato in flex-col su mobile per contenere ordinamento e generi senza rompersi */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Classifica Ufficiale</h2>

                    <div className="flex flex-wrap gap-2">
                        {/* 👈 NUOVO: Barra selettrice del Genere (Mantiene l'ordinamento attivo `currentSort`) */}
                        <div className="flex gap-1.5 bg-slate-200/60 p-1 rounded-xl border border-slate-200 text-[11px] font-bold">
                            <Link href={`/?gender=M&sort=${currentSort}`} scroll={false} className={`px-2.5 py-1 rounded-lg transition-all ${currentGender === 'M' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}>👨 Maschi</Link>
                            <Link href={`/?gender=F&sort=${currentSort}`} scroll={false} className={`px-2.5 py-1 rounded-lg transition-all ${currentGender === 'F' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}>👩 Femmine</Link>
                            <Link href={`/?gender=all&sort=${currentSort}`} scroll={false} className={`px-2.5 py-1 rounded-lg transition-all ${currentGender === 'all' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}>🌍 Generale</Link>
                        </div>

                        {/* 👈 AGGIORNATO: Barra ordinamento (Ora mantiene il genere attivo `currentGender`) */}
                        <div className="flex gap-1.5 bg-slate-200/60 p-1 rounded-xl border border-slate-200 text-[11px] font-bold">
                            <Link href={`/?gender=${currentGender}&sort=ranking`} scroll={false} className={`px-2.5 py-1 rounded-lg transition-all ${currentSort === 'ranking' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}>Punti</Link>
                            <Link href={`/?gender=${currentGender}&sort=played`} scroll={false} className={`px-2.5 py-1 rounded-lg transition-all ${currentSort === 'played' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}>Giocate</Link>
                            <Link href={`/?gender=${currentGender}&sort=winrate`} scroll={false} className={`px-2.5 py-1 rounded-lg transition-all ${currentSort === 'winrate' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}>Win Rate</Link>
                        </div>
                    </div>
                </div>

                {/* CLASSIFICA CARD */}
                <div className="flex flex-col gap-2.5 mb-8">
                    {sortedPlayers.length > 0 ? (
                        sortedPlayers.map((player, index) => {
                            const rankIndex = index + 1;
                            const playerId = player.id;

                            const king = kingLeftIds.includes(playerId) ? 'SX'
                                : kingRightIds.includes(playerId) ? 'DX'
                                    : kingBothIds.includes(playerId) ? 'DX/SX'
                                        : null;

                            const last = lastPlaceLeftIds.includes(playerId) ? 'SX'
                                : lastPlaceRightIds.includes(playerId) ? 'DX'
                                    : lastPlaceBothIds.includes(playerId) ? 'DX/SX'
                                        : null;

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
                                        }`}>{rankIndex}°</div>


                                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                                            {player.avatar_url ? (
                                                <img
                                                    src={player.avatar_url}
                                                    alt={`${player.first_name} Avatar`}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                /* Silhouette neutra di default se l'utente non ha impostato nulla */
                                                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 font-black text-xs flex items-center justify-center shrink-0 uppercase tracking-tight">
                                                    {player.first_name[0]}{player.last_name[0]}
                                                </div>
                                            )}
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="font-bold text-slate-800 text-base truncate">{player.first_name} {player.last_name}</span>
                                                {king && (
                                                    <span className="bg-yellow-100 text-yellow-800 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase shrink-0">
                                                    King {king}
                                                    </span>
                                                )}
                                                {last && (
                                                    <span className="bg-red-100 text-red-800 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase shrink-0">
                                                        Fanalino {last}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-1 font-medium flex-wrap">
                                                <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${player.preferred_side === 'Left' ? 'bg-blue-50 text-blue-600' : player.preferred_side === 'Right' ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-600'}`}>
                                                    {player.preferred_side === 'Left' ? 'SX' : player.preferred_side === 'Right' ? 'DX' : 'MIX'}
                                                </span>
                                                <span>Match: <strong className="text-slate-600">{player.total_played}</strong></span>
                                                <span className="text-slate-200">•</span>
                                                <span>Win Rate: <strong className="text-slate-600">{player.win_rate.toFixed(1)}%</strong></span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        <div className="text-right">
                                            <div className="text-lg font-mono font-black text-indigo-600 leading-none">
                                                {currentSort === 'played' ? player.total_played : currentSort === 'winrate' ? `${player.win_rate.toFixed(1)}%` : player.ranking.toFixed(2)}
                                            </div>
                                            <span className="text-[9px] text-slate-400 uppercase tracking-tight font-bold">
                                                {currentSort === 'played' ? 'Partite' : currentSort === 'winrate' ? 'Rate' : 'Punti'}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })
                    ) : (
                        <p className="text-slate-500 italic text-sm p-4 bg-white rounded-xl border border-slate-200 text-center">Nessun giocatore registrato in questa categoria.</p>
                    )}
                </div>

                {/* BANNER PUBBLICITARIO SPONSOR */}
                <div className="w-full bg-gradient-to-r from-indigo-950 to-slate-900 text-white p-5 rounded-xl shadow-sm mb-12 flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-700">
                    <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
                        <div className="bg-white p-2 rounded-md flex items-center justify-center shadow-sm max-w-[140px] shrink-0">
                            <img src="https://www.bionutrimed.it/templates/rt_gemini/custom/images/loghi/bionutrimed_logo_small.png" alt="BioNutriMed Logo" className="h-10 w-auto object-contain select-none" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold tracking-wide text-slate-100">Vuoi scalare il Ranking? Cura la tua nutrizione!</h3>
                            <p className="text-xs text-slate-300 max-w-xl mt-1 leading-relaxed">Scopri come un'alimentazione strategica su misura può aumentare la tua resistenza nei match più lunghi e velocizzare il recovery muscolare.</p>
                        </div>
                    </div>
                    <a href="https://www.bionutrimed.it/prenota/prenota-visita-in-studio.html" target="_blank" rel="noopener noreferrer" className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs uppercase tracking-wider py-3 px-5 rounded-lg transition-all shadow-sm text-center w-full md:w-auto shrink-0">🌐 Prenota una visita</a>
                </div>

                {/* SEZIONE 1: PARTITE IN PROGRAMMA */}
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Partite in Programma</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                    {pendingMatches && pendingMatches.length > 0 ? (
                        pendingMatches.map((match) => (
                            <PendingMatchCard
                                key={match.id}
                                match={match}
                                rawPlayers={playersWithStats || []}
                                currentUserPlayer={currentUserPlayer}
                            />
                        ))
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
                                        <div className={`flex flex-col items-center sm:items-start p-3 rounded-xl w-full sm:w-5/12 ${winner === 'A' ? 'bg-green-50 border-l-4 border-l-green-500 font-semibold' : 'opacity-60'}`}>
                                            <div className="flex items-center gap-1.5 mb-1"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Coppia A</span>{winner === 'A' && <span className="bg-green-200 text-green-800 text-[9px] font-black px-1.5 py-0.2 rounded uppercase">WIN 🎉</span>}</div>
                                            <div className="text-sm text-slate-800 truncate w-full text-center sm:text-left">{getPlayerNameWithRanking(match.team_a_left_id, playersWithStats)}</div>
                                            <div className="text-sm text-slate-800 truncate w-full text-center sm:text-left">{getPlayerNameWithRanking(match.team_a_right_id, playersWithStats)}</div>
                                        </div>
                                        <div className="flex flex-col items-center justify-center shrink-0">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 select-none">Punteggio</div>
                                            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 font-mono font-black text-sm text-indigo-600 shadow-inner">
                                                {sets.length > 0 ? sets.map((set, sIdx) => (<span key={sIdx} className="bg-white px-1.5 py-0.5 rounded border border-slate-200/60 shadow-sm">{set.team_a}-{set.team_b}</span>)) : <span className="text-xs font-normal text-slate-400 italic">Dato pre-set</span>}
                                            </div>
                                        </div>
                                        <div className={`flex flex-col items-center sm:items-end p-3 rounded-xl w-full sm:w-5/12 text-center sm:text-right ${winner === 'B' ? 'bg-green-50 border-r-4 border-r-green-500 font-semibold' : 'opacity-60'}`}>
                                            <div className="flex items-center sm:flex-row-reverse gap-1.5 mb-1"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Coppia B</span>{winner === 'B' && <span className="bg-green-200 text-green-800 text-[9px] font-black px-1.5 py-0.2 rounded uppercase">WIN 🎉</span>}</div>
                                            <div className="text-sm text-slate-800 truncate w-full text-center sm:text-right">{getPlayerNameWithRanking(match.team_b_left_id, playersWithStats)}</div>
                                            <div className="text-sm text-slate-800 truncate w-full text-center sm:text-right">{getPlayerNameWithRanking(match.team_b_right_id, playersWithStats)}</div>
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-slate-400 text-center sm:text-left font-medium border-t border-slate-50 pt-2">Disputata il {new Date(match.updated_at).toLocaleDateString('it-IT')}</div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-slate-500 italic">Nessun match completato.</p>
                    )}
                </div>

                {/* CONTROLLI DI PAGINAZIONE */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-6">
                        {/* 👈 AGGIORNATO: I link di paginazione ora portano con sé anche il parametro `gender` attivo */}
                        <Link href={`/?page=${currentPage - 1}&sort=${currentSort}&gender=${currentGender}`} scroll={false} className={`px-4 py-2 bg-white border border-slate-200 text-sm font-bold text-slate-700 rounded-xl shadow-sm transition-all active:scale-95 ${currentPage <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-slate-50'}`}>← Precedente</Link>
                        <div className="text-xs font-bold text-slate-500 font-mono">{currentPage} / {totalPages}</div>
                        <Link href={`/?page=${currentPage + 1}&sort=${currentSort}&gender=${currentGender}`} scroll={false} className={`px-4 py-2 bg-white border border-slate-200 text-sm font-bold text-slate-700 rounded-xl shadow-sm transition-all active:scale-95 ${currentPage >= totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-slate-50'}`}>Successiva →</Link>
                    </div>
                )}

            </div>
        </main>
    );
}
