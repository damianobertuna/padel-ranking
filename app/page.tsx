import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import PendingMatchCard from '@/components/PendingMatchCard';
import { Player } from "@/types";
import { computeKingAndFanalino } from '@/lib/rankingCalc';

const MATCHES_PER_PAGE = 5;
const PLAYERS_PER_PAGE = 10;

interface PageProps {
    searchParams: Promise<{
        page?: string;
        playerPage?: string;
        sort?: string;
        gender?: string;
        tab?: string;
    }>;
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
    const playerPage = parseInt(resolvedParams.playerPage || '1', 10) || 1;
    const currentSort = resolvedParams.sort || 'ranking';
    const currentGender = resolvedParams.gender || 'all';
    const currentTab = resolvedParams.tab || 'ranking';

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

    const { data: clubsData } = await supabase.from('clubs').select('*');
    const clubsList = clubsData || [];

    const {
        kingLeftIds,
        kingRightIds,
        kingBothIds,
        lastPlaceLeftIds,
        lastPlaceRightIds,
        lastPlaceBothIds
    } = computeKingAndFanalino(playersWithStats);

    // --- OPTION A: Mappa dei Titoli per le Card (Hash Map O(1)) ---
    const playerTitlesMap: Record<number, { type: 'KING' | 'FANALINO', label: string }> = {};

    kingLeftIds.forEach(id => playerTitlesMap[id] = { type: 'KING', label: 'KING SX' });
    kingRightIds.forEach(id => playerTitlesMap[id] = { type: 'KING', label: 'KING DX' });
    kingBothIds.forEach(id => playerTitlesMap[id] = { type: 'KING', label: 'KING MIX' });

    lastPlaceLeftIds.forEach(id => playerTitlesMap[id] = { type: 'FANALINO', label: 'FAN SX' });
    lastPlaceRightIds.forEach(id => playerTitlesMap[id] = { type: 'FANALINO', label: 'FAN DX' });
    lastPlaceBothIds.forEach(id => playerTitlesMap[id] = { type: 'FANALINO', label: 'FAN MIX' });
    // --------------------------------------------------------------

    const filteredPlayers = playersWithStats.filter(player => {
        if (currentGender === 'all') return true;
        return player.gender === currentGender;
    });

    const sortedPlayers = [...filteredPlayers].sort((a, b) => {
        if (currentSort === 'played') {
            return b.total_played - a.total_played || b.ranking - a.ranking;
        }
        if (currentSort === 'winrate') {
            return b.win_rate - a.win_rate || b.total_played - a.total_played;
        }
        return b.ranking - a.ranking;
    });

    const totalPlayerPages = Math.ceil(sortedPlayers.length / PLAYERS_PER_PAGE) || 1;
    const startIndex = (playerPage - 1) * PLAYERS_PER_PAGE;
    const paginatedPlayers = sortedPlayers.slice(startIndex, startIndex + PLAYERS_PER_PAGE);

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

    const urlState = `gender=${currentGender}&sort=${currentSort}&playerPage=${playerPage}&page=${currentPage}`;

    return (
        <main className="bg-slate-50 flex flex-col items-center text-slate-900">
            <div className="max-w-4xl w-full px-4 sm:px-8">
                {/* NAVIGAZIONE TAB MINIMALE (Stile Navbar Sportiva) */}
                <div className="flex w-full mb-6 border-b border-slate-300">
                    <Link
                        href={`/?tab=ranking&${urlState}`}
                        scroll={false}
                        className={`flex-1 text-center py-3 text-sm font-black uppercase tracking-wider transition-colors ${currentTab === 'ranking' ? 'border-b-4 border-blue-600 text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        Rankings
                    </Link>
                    <Link
                        href={`/?tab=pending&${urlState}`}
                        scroll={false}
                        className={`flex-1 text-center py-3 text-sm font-black uppercase tracking-wider transition-colors ${currentTab === 'pending' ? 'border-b-4 border-blue-600 text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        Match <span className="ml-1 opacity-70">({pendingMatches?.length || 0})</span>
                    </Link>
                    <Link
                        href={`/?tab=completed&${urlState}`}
                        scroll={false}
                        className={`flex-1 text-center py-3 text-sm font-black uppercase tracking-wider transition-colors ${currentTab === 'completed' ? 'border-b-4 border-blue-600 text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        Risultati
                    </Link>
                </div>

                {/* =========================================
                    TAB 1: CLASSIFICA GIOCATORI (Stile FIP Table)
                ========================================= */}
                {currentTab === 'ranking' && (
                    <div className="animate-in fade-in duration-300">

                        {/* BARRA FILTRI */}
                        <div className="flex flex-col sm:flex-row justify-between bg-white border border-slate-200 p-2 mb-4 rounded-sm shadow-sm gap-2">
                            <div className="flex gap-1 bg-slate-100 p-1 rounded-sm text-xs font-bold uppercase tracking-wider">
                                <Link href={`/?tab=ranking&gender=M&sort=${currentSort}&playerPage=1`} scroll={false} className={`px-4 py-1.5 rounded-sm transition-colors ${currentGender === 'M' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>Maschile</Link>
                                <Link href={`/?tab=ranking&gender=F&sort=${currentSort}&playerPage=1`} scroll={false} className={`px-4 py-1.5 rounded-sm transition-colors ${currentGender === 'F' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>Femminile</Link>
                                <Link href={`/?tab=ranking&gender=all&sort=${currentSort}&playerPage=1`} scroll={false} className={`px-4 py-1.5 rounded-sm transition-colors ${currentGender === 'all' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>Tutti</Link>
                            </div>
                            <div className="flex gap-1 bg-slate-100 p-1 rounded-sm text-xs font-bold uppercase tracking-wider">
                                <Link href={`/?tab=ranking&gender=${currentGender}&sort=ranking&playerPage=1`} scroll={false} className={`px-3 py-1.5 rounded-sm transition-colors ${currentSort === 'ranking' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>Punti</Link>
                                <Link href={`/?tab=ranking&gender=${currentGender}&sort=played&playerPage=1`} scroll={false} className={`px-3 py-1.5 rounded-sm transition-colors ${currentSort === 'played' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>Match</Link>
                                <Link href={`/?tab=ranking&gender=${currentGender}&sort=winrate&playerPage=1`} scroll={false} className={`px-3 py-1.5 rounded-sm transition-colors ${currentSort === 'winrate' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>Win %</Link>
                            </div>
                        </div>

                        {/* LISTA GIOCATORI TIPO TABELLONE */}
                        <div className="bg-white border border-slate-200 shadow-sm rounded-sm overflow-hidden">
                            {/* Header Tabella */}
                            <div className="hidden sm:flex items-center px-4 py-3 bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <div className="w-12 text-center">Rank</div>
                                <div className="flex-1 pl-4">Player</div>
                                <div className="w-24 text-center">Side</div>
                                <div className="w-24 text-center">Matches</div>
                                <div className="w-24 text-right pr-2">Points</div>
                            </div>

                            {paginatedPlayers.length > 0 ? (
                                paginatedPlayers.map((player, index) => {
                                    const rankIndex = startIndex + index + 1;
                                    const playerId = player.id;

                                    // Calcolo dinamico dei lati per King e Fanalino
                                    const kingSide = kingLeftIds.includes(playerId) ? 'SX' : kingRightIds.includes(playerId) ? 'DX' : kingBothIds.includes(playerId) ? 'MIX' : null;
                                    const fanalinoSide = lastPlaceLeftIds.includes(playerId) ? 'SX' : lastPlaceRightIds.includes(playerId) ? 'DX' : lastPlaceBothIds.includes(playerId) ? 'MIX' : null;

                                    return (
                                        <Link key={player.id} href={`/player/${player.id}`} className="flex flex-row items-center px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                                            {/* Rank Number */}
                                            <div className={`w-8 sm:w-12 text-center font-black text-lg sm:text-xl ${rankIndex === 1 ? 'text-amber-500' : 'text-slate-400 group-hover:text-slate-900'}`}>
                                                {rankIndex}
                                            </div>

                                            {/* Info Giocatore */}
                                            <div className="flex-1 flex items-center gap-3 pl-2 sm:pl-4 min-w-0">
                                                <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full bg-slate-200 border border-slate-300 overflow-hidden flex items-center justify-center">
                                                    {player.avatar_url ? (
                                                        <img src={player.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-slate-500 font-bold text-xs uppercase">{player.first_name[0]}{player.last_name[0]}</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-black text-slate-900 text-sm sm:text-base uppercase tracking-tight truncate">{player.first_name} {player.last_name}</span>

                                                        {/* BADGE KING (Ora dinamico) */}
                                                        {kingSide && (
                                                            <span className="bg-amber-100 text-amber-800 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider hidden sm:inline-flex items-center shadow-sm" title="King">
                                    👑 KING {kingSide}
                                </span>
                                                        )}

                                                        {/* BADGE FANALINO (Aggiunto) */}
                                                        {fanalinoSide && (
                                                            <span className="bg-slate-700 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider hidden sm:inline-flex items-center shadow-sm" title="Fanalino">
                                    🐢 FAN {fanalinoSide}
                                </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider sm:hidden block mt-0.5">
                            {player.preferred_side} • {player.total_played} Match
                        </span>
                                                </div>
                                            </div>

                                            {/* Dati Desktop */}
                                            <div className="hidden sm:block w-24 text-center text-xs font-bold text-slate-500 uppercase">{player.preferred_side}</div>
                                            <div className="hidden sm:block w-24 text-center text-xs font-bold text-slate-500">{player.total_played}</div>

                                            {/* Punti Finali */}
                                            <div className="w-20 sm:w-24 text-right flex flex-col justify-center shrink-0">
                                                <span className="text-base sm:text-lg font-black text-blue-600 leading-none">{currentSort === 'played' ? player.total_played : currentSort === 'winrate' ? `${player.win_rate.toFixed(1)}%` : player.ranking.toFixed(2)}</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase sm:hidden">{currentSort === 'played' ? 'Match' : currentSort === 'winrate' ? 'Rate' : 'Pts'}</span>
                                            </div>
                                        </Link>
                                    );
                                })
                            ) : (
                                <div className="p-8 text-center text-slate-500 text-sm font-bold uppercase">Nessun atleta in questa categoria</div>
                            )}
                        </div>

                        {/* PAGINAZIONE */}
                        {totalPlayerPages > 1 && (
                            <div className="flex justify-between items-center mt-6 px-2">
                                <Link href={`/?tab=ranking&playerPage=${playerPage - 1}&page=${currentPage}&sort=${currentSort}&gender=${currentGender}`} scroll={false} className={`px-4 py-2 bg-white border border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-900 rounded-sm hover:bg-slate-100 transition-colors ${playerPage <= 1 ? 'pointer-events-none opacity-40' : ''}`}>← Prev</Link>
                                <div className="text-xs font-bold text-slate-500">PAG {playerPage} / {totalPlayerPages}</div>
                                <Link href={`/?tab=ranking&playerPage=${playerPage + 1}&page=${currentPage}&sort=${currentSort}&gender=${currentGender}`} scroll={false} className={`px-4 py-2 bg-white border border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-900 rounded-sm hover:bg-slate-100 transition-colors ${playerPage >= totalPlayerPages ? 'pointer-events-none opacity-40' : ''}`}>Next →</Link>
                            </div>
                        )}
                    </div>
                )}

                {/* =========================================
                    TAB 2: MATCH IN PROGRAMMA
                ========================================= */}
                {currentTab === 'pending' && (
                    <div className="animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {pendingMatches && pendingMatches.length > 0 ? (
                                pendingMatches.map((match) => (
                                    <PendingMatchCard
                                        key={match.id}
                                        match={match}
                                        rawPlayers={playersWithStats || []}
                                        currentUserPlayer={currentUserPlayer}
                                        clubs={clubsList}
                                        playerTitles={playerTitlesMap}
                                    />
                                ))
                            ) : (
                                <div className="col-span-2 p-10 bg-white border border-slate-200 text-center text-slate-500 font-bold uppercase text-sm rounded-sm">Nessun match programmato</div>
                            )}
                        </div>
                    </div>
                )}

                {/* =========================================
                    TAB 3: RISULTATI COMPLETATI
                ========================================= */}
                {currentTab === 'completed' && (
                    <div className="animate-in fade-in duration-300 space-y-4">
                        {completedMatches && completedMatches.length > 0 ? (
                            completedMatches.map((match) => {
                                const winner = match.winning_team;
                                const sets = (match.score || []) as Array<{team_a: number, team_b: number}>;
                                const matchClub = clubsList.find(c => c.id === match.club_id);

                                return (
                                    <div key={match.id} className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
                                        {/* Barra Superiore Dati Match */}
                                        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                            <span>{new Date(match.updated_at).toLocaleDateString('it-IT')}</span>
                                            <span>{matchClub ? matchClub.name : 'Location N/D'}</span>
                                        </div>

                                        {/* Corpo del Risultato */}
                                        <div className="flex flex-col sm:flex-row items-center p-0 sm:p-2">

                                            {/* Team A */}
                                            <div className={`flex-1 w-full sm:w-auto p-4 flex flex-col justify-center ${winner === 'A' ? 'bg-emerald-50/50' : ''}`}>
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">TEAM A</span>
                                                    {winner === 'A' && <span className="bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider">WINNER</span>}
                                                </div>
                                                <div className="text-sm font-black text-slate-900 uppercase">{getPlayerNameWithRanking(match.team_a_left_id, playersWithStats)}</div>
                                                <div className="text-sm font-black text-slate-900 uppercase">{getPlayerNameWithRanking(match.team_a_right_id, playersWithStats)}</div>
                                            </div>

                                            {/* Punteggio Centrale */}
                                            <div className="px-6 py-4 flex items-center justify-center border-y sm:border-y-0 sm:border-x border-slate-100 bg-slate-50 w-full sm:w-auto">
                                                <div className="flex gap-2">
                                                    {sets.length > 0 ? sets.map((set, sIdx) => (
                                                        <div key={sIdx} className="bg-white border border-slate-200 px-3 py-2 text-base font-black text-slate-900 text-center rounded-sm min-w-[2.5rem]">
                                                            {set.team_a}<br/><span className="text-slate-300 font-normal">-</span><br/>{set.team_b}
                                                        </div>
                                                    )) : <span className="text-xs font-bold text-slate-400">N/D</span>}
                                                </div>
                                            </div>

                                            {/* Team B */}
                                            <div className={`flex-1 w-full sm:w-auto p-4 flex flex-col justify-center sm:text-right ${winner === 'B' ? 'bg-emerald-50/50' : ''}`}>
                                                <div className="flex items-center sm:justify-end gap-2 mb-1.5">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">TEAM B</span>
                                                    {winner === 'B' && <span className="bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider">WINNER</span>}
                                                </div>
                                                <div className="text-sm font-black text-slate-900 uppercase">{getPlayerNameWithRanking(match.team_b_left_id, playersWithStats)}</div>
                                                <div className="text-sm font-black text-slate-900 uppercase">{getPlayerNameWithRanking(match.team_b_right_id, playersWithStats)}</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-8 text-center text-slate-500 font-bold uppercase text-sm border border-slate-200 bg-white rounded-sm">Nessun match registrato</div>
                        )}

                        {totalPages > 1 && (
                            <div className="flex justify-between items-center mt-6">
                                <Link href={`/?tab=completed&page=${currentPage - 1}&playerPage=${playerPage}&sort=${currentSort}&gender=${currentGender}`} scroll={false} className={`px-4 py-2 bg-white border border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-900 rounded-sm hover:bg-slate-100 transition-colors ${currentPage <= 1 ? 'pointer-events-none opacity-40' : ''}`}>← Prev</Link>
                                <div className="text-xs font-bold text-slate-500">PAG {currentPage} / {totalPages}</div>
                                <Link href={`/?tab=completed&page=${currentPage + 1}&playerPage=${playerPage}&sort=${currentSort}&gender=${currentGender}`} scroll={false} className={`px-4 py-2 bg-white border border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-900 rounded-sm hover:bg-slate-100 transition-colors ${currentPage >= totalPages ? 'pointer-events-none opacity-40' : ''}`}>Next →</Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
