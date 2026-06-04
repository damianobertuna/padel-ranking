import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import PendingMatchCard from '@/components/PendingMatchCard';
import SearchBar from '@/components/SearchBar';
import { Player } from "@/types";
import { computeKingAndFanalino } from '@/lib/rankingCalc';
import ClubSelectFilter from '@/components/ClubSelectFilter';

const MATCHES_PER_PAGE = 5;
const PLAYERS_PER_PAGE = 10;

interface PageProps {
    searchParams: Promise<{
        page?: string;
        playerPage?: string;
        sort?: string;
        gender?: string;
        tab?: string;
        search?: string;
        slots?: string;
        level?: string;
        completedClub?: string;
        completedScope?: string;
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
    const currentSearch = resolvedParams.search || '';
    const currentSlots = resolvedParams.slots || 'all';
    const currentLevel = resolvedParams.level || 'all';
    const currentCompletedClub = resolvedParams.completedClub || 'all';
    const currentCompletedScope = resolvedParams.completedScope || 'all';

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

    // --- Mappa dei Titoli per le Card ---
    const playerTitlesMap: Record<number, { type: 'KING' | 'FANALINO', label: string }> = {};

    kingLeftIds.forEach(id => playerTitlesMap[id] = { type: 'KING', label: 'KING SX' });
    kingRightIds.forEach(id => playerTitlesMap[id] = { type: 'KING', label: 'KING DX' });
    kingBothIds.forEach(id => playerTitlesMap[id] = { type: 'KING', label: 'KING MIX' });

    lastPlaceLeftIds.forEach(id => playerTitlesMap[id] = { type: 'FANALINO', label: 'FAN SX' });
    lastPlaceRightIds.forEach(id => playerTitlesMap[id] = { type: 'FANALINO', label: 'FAN DX' });
    lastPlaceBothIds.forEach(id => playerTitlesMap[id] = { type: 'FANALINO', label: 'FAN MIX' });

    // --- FILTRAGGIO ATLETI (Valido solo per Tab Ranking) ---
    const filteredPlayers = playersWithStats.filter(player => {
        const matchesGender = currentGender === 'all' || player.gender === currentGender;
        const matchesSearch = currentTab !== 'ranking' || !currentSearch ||
            player.first_name.toLowerCase().includes(currentSearch.toLowerCase()) ||
            player.last_name.toLowerCase().includes(currentSearch.toLowerCase());
        return matchesGender && matchesSearch;
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

    // --- QUERY PENDING MATCHES ---
    const { data: pendingMatches } = await supabase
        .from('matches')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    const filteredPendingMatches = (pendingMatches || []).filter(match => {
        const playerIds = [match.team_a_left_id, match.team_a_right_id, match.team_b_left_id, match.team_b_right_id];
        const activeCount = playerIds.filter(Boolean).length;
        const isMatchComplete = activeCount === 4;

        if (currentSlots === 'free' && isMatchComplete) return false;

        if (currentLevel === 'compatible' && currentUserPlayer) {
            const isUserInMatch = playerIds.includes(currentUserPlayer.id);
            if (!isUserInMatch) {
                if (isMatchComplete) return false;
                const activeRankings = playerIds
                    .map(id => playersWithStats.find(p => p.id === id)?.ranking)
                    .filter((r): r is number => r !== undefined);

                if (activeRankings.length > 0) {
                    const minLvl = Math.min(...activeRankings);
                    const maxLvl = Math.max(...activeRankings);
                    const isCompatible = currentUserPlayer.ranking >= (maxLvl - 0.25) && currentUserPlayer.ranking <= (minLvl + 0.25);
                    if (!isCompatible) return false;
                }
            }
        }
        return true;
    });

    // --- LOGICA E COSTRUZIONE DINAMICA DELLA QUERY RISULTATI COMPLETATI ---
    let completedQuery = supabase
        .from('matches')
        .select('*', { count: 'exact' })
        .eq('status', 'completed');

    // 1. Filtro Club Storico
    if (currentCompletedClub !== 'all') {
        completedQuery = completedQuery.eq('club_id', parseInt(currentCompletedClub, 10));
    }

    // 2. Filtro Personale Storico ("I miei match")
    if (currentCompletedScope === 'mine' && currentUserPlayer) {
        completedQuery = completedQuery.or(`team_a_left_id.eq.${currentUserPlayer.id},team_a_right_id.eq.${currentUserPlayer.id},team_b_left_id.eq.${currentUserPlayer.id},team_b_right_id.eq.${currentUserPlayer.id}`);
    }

    // 3. Filtro di Ricerca Testuale Giocatore Storico
    if (currentTab === 'completed' && currentSearch) {
        const searchedPlayerIds = playersWithStats
            .filter(p => p.first_name.toLowerCase().includes(currentSearch.toLowerCase()) ||
                p.last_name.toLowerCase().includes(currentSearch.toLowerCase()))
            .map(p => p.id);

        if (searchedPlayerIds.length > 0) {
            const idsStr = searchedPlayerIds.join(',');
            completedQuery = completedQuery.or(`team_a_left_id.in.(${idsStr}),team_a_right_id.in.(${idsStr}),team_b_left_id.in.(${idsStr}),team_b_right_id.in.(${idsStr})`);
        } else {
            completedQuery = completedQuery.eq('id', '00000000-0000-0000-0000-000000000000');
        }
    }

    const fromRange = (currentPage - 1) * MATCHES_PER_PAGE;
    const toRange = fromRange + MATCHES_PER_PAGE - 1;

    const { data: completedMatches, count: totalCompletedCount } = await completedQuery
        .order('updated_at', { ascending: false })
        .range(fromRange, toRange);

    const totalPages = totalCompletedCount ? Math.ceil(totalCompletedCount / MATCHES_PER_PAGE) : 1;

    const urlState = `gender=${currentGender}&sort=${currentSort}&playerPage=${playerPage}&page=${currentPage}&search=${encodeURIComponent(currentSearch)}&slots=${currentSlots}&level=${currentLevel}&completedClub=${currentCompletedClub}&completedScope=${currentCompletedScope}`;

    return (
        <main className="bg-slate-50 flex flex-col items-center text-slate-900 mt-6">
            <div className="max-w-4xl w-full px-4 sm:px-8">
                {/* NAVIGAZIONE TAB PRINCIPALI */}
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
                    TAB 1: CLASSIFICA GIOCATORI
                ========================================= */}
                {currentTab === 'ranking' && (
                    <div className="animate-in fade-in duration-300">
                        <div className="w-full mb-4">
                            <SearchBar placeholder="CERCA ATLETA PER NOME O COGNOME..." />
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between bg-white border border-slate-200 p-2 mb-4 rounded-sm shadow-sm gap-2">
                            <div className="flex gap-1 bg-slate-100 p-1 rounded-sm text-xs font-bold uppercase tracking-wider">
                                <Link href={`/?tab=ranking&gender=M&sort=${currentSort}&playerPage=1&search=${currentSearch}&slots=${currentSlots}&level=${currentLevel}&completedClub=${currentCompletedClub}&completedScope=${currentCompletedScope}`} scroll={false} className={`px-4 py-1.5 rounded-sm transition-colors ${currentGender === 'M' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>Maschile</Link>
                                <Link href={`/?tab=ranking&gender=F&sort=${currentSort}&playerPage=1&search=${currentSearch}&slots=${currentSlots}&level=${currentLevel}&completedClub=${currentCompletedClub}&completedScope=${currentCompletedScope}`} scroll={false} className={`px-4 py-1.5 rounded-sm transition-colors ${currentGender === 'F' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>Femminile</Link>
                                <Link href={`/?tab=ranking&gender=all&sort=${currentSort}&playerPage=1&search=${currentSearch}&slots=${currentSlots}&level=${currentLevel}&completedClub=${currentCompletedClub}&completedScope=${currentCompletedScope}`} scroll={false} className={`px-4 py-1.5 rounded-sm transition-colors ${currentGender === 'all' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>Tutti</Link>
                            </div>
                            <div className="flex gap-1 bg-slate-100 p-1 rounded-sm text-xs font-bold uppercase tracking-wider">
                                <Link href={`/?tab=ranking&gender=${currentGender}&sort=ranking&playerPage=1&search=${currentSearch}&slots=${currentSlots}&level=${currentLevel}&completedClub=${currentCompletedClub}&completedScope=${currentCompletedScope}`} scroll={false} className={`px-3 py-1.5 rounded-sm transition-colors ${currentSort === 'ranking' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>Punti</Link>
                                <Link href={`/?tab=ranking&gender=${currentGender}&sort=played&playerPage=1&search=${currentSearch}&slots=${currentSlots}&level=${currentLevel}&completedClub=${currentCompletedClub}&completedScope=${currentCompletedScope}`} scroll={false} className={`px-3 py-1.5 rounded-sm transition-colors ${currentSort === 'played' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>Match</Link>
                                <Link href={`/?tab=ranking&gender=${currentGender}&sort=winrate&playerPage=1&search=${currentSearch}&slots=${currentSlots}&level=${currentLevel}&completedClub=${currentCompletedClub}&completedScope=${currentCompletedScope}`} scroll={false} className={`px-3 py-1.5 rounded-sm transition-colors ${currentSort === 'winrate' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>Win %</Link>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 shadow-sm rounded-sm overflow-hidden">
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

                                    const kingSide = kingLeftIds.includes(playerId) ? 'SX' : kingRightIds.includes(playerId) ? 'DX' : kingBothIds.includes(playerId) ? 'MIX' : null;
                                    const fanalinoSide = lastPlaceLeftIds.includes(playerId) ? 'SX' : lastPlaceRightIds.includes(playerId) ? 'DX' : lastPlaceBothIds.includes(playerId) ? 'MIX' : null;

                                    return (
                                        <Link key={player.id} href={`/player/${player.id}`} className="flex flex-row items-center px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                                            <div className={`w-8 sm:w-12 text-center font-black text-lg sm:text-xl ${rankIndex === 1 ? 'text-amber-500' : 'text-slate-400 group-hover:text-slate-900'}`}>
                                                {rankIndex}
                                            </div>

                                            <div className="flex-1 flex items-center gap-3 pl-2 sm:pl-4 min-w-0">
                                                <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full bg-slate-200 border border-slate-300 overflow-hidden flex items-center justify-center">
                                                    {player.avatar_url ? (
                                                        <img src={player.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-slate-500 font-bold text-xs uppercase">{player.first_name[0]}{player.last_name[0]}</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                                                        <span className="font-black text-slate-900 text-sm sm:text-base uppercase tracking-tight truncate">{player.first_name} {player.last_name}</span>

                                                        {kingSide && (
                                                            <span className="bg-amber-100 text-amber-800 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider inline-flex items-center shadow-sm shrink-0" title="King">
                                                                👑 {playerTitlesMap[playerId]?.label || `KING ${kingSide}`}
                                                            </span>
                                                        )}

                                                        {fanalinoSide && (
                                                            <span className="bg-slate-700 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider inline-flex items-center shadow-sm shrink-0" title="Fanalino">
                                                                🐢 {playerTitlesMap[playerId]?.label || `FAN ${fanalinoSide}`}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider sm:hidden block mt-0.5">
                                                        {player.preferred_side} • {player.total_played} Match
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="hidden sm:block w-24 text-center text-xs font-bold text-slate-500 uppercase">{player.preferred_side}</div>
                                            <div className="hidden sm:block w-24 text-center text-xs font-bold text-slate-500">{player.total_played}</div>

                                            <div className="w-20 sm:w-24 text-right flex flex-col justify-center shrink-0">
                                                <span className="text-base sm:text-lg font-black text-blue-600 leading-none">{currentSort === 'played' ? player.total_played : currentSort === 'winrate' ? `${player.win_rate.toFixed(1)}%` : player.ranking.toFixed(2)}</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase sm:hidden">{currentSort === 'played' ? 'Match' : currentSort === 'winrate' ? 'Rate' : 'Pts'}</span>
                                            </div>
                                        </Link>
                                    );
                                })
                            ) : (
                                <div className="p-8 text-center text-slate-500 text-sm font-bold uppercase">Nessun atleta corrisponde alla ricerca</div>
                            )}
                        </div>

                        {/* PAGINAZIONE GIOCATORI */}
                        {totalPlayerPages > 1 && (
                            <div className="flex justify-between items-center mt-6 px-2">
                                <Link href={`/?tab=ranking&playerPage=${playerPage - 1}&page=${currentPage}&sort=${currentSort}&gender=${currentGender}&search=${currentSearch}&slots=${currentSlots}&level=${currentLevel}&completedClub=${currentCompletedClub}&completedScope=${currentCompletedScope}`} scroll={false} className={`px-4 py-2 bg-white border border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-900 rounded-sm hover:bg-slate-100 transition-colors ${playerPage <= 1 ? 'pointer-events-none opacity-40' : ''}`}>← Prev</Link>
                                <div className="text-xs font-bold text-slate-500">PAG {playerPage} / {totalPlayerPages}</div>
                                <Link href={`/?tab=ranking&playerPage=${playerPage + 1}&page=${currentPage}&sort=${currentSort}&gender=${currentGender}&search=${currentSearch}&slots=${currentSlots}&level=${currentLevel}&completedClub=${currentCompletedClub}&completedScope=${currentCompletedScope}`} scroll={false} className={`px-4 py-2 bg-white border border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-900 rounded-sm hover:bg-slate-100 transition-colors ${playerPage >= totalPlayerPages ? 'pointer-events-none opacity-40' : ''}`}>Next →</Link>
                            </div>
                        )}
                    </div>
                )}

                {/* =========================================
                    TAB 2: MATCH IN PROGRAMMA
                ========================================= */}
                {currentTab === 'pending' && (
                    <div className="animate-in fade-in duration-300">
                        <div className="flex flex-col sm:flex-row justify-between bg-white border border-slate-200 p-2 mb-4 rounded-sm shadow-sm gap-2 text-xs font-bold uppercase tracking-wider">
                            <div className="flex gap-1 bg-slate-100 p-1 rounded-sm flex-1 sm:flex-initial">
                                <Link href={`/?tab=pending&slots=all&level=${currentLevel}&gender=${currentGender}&sort=${currentSort}&search=${currentSearch}&completedClub=${currentCompletedClub}&completedScope=${currentCompletedScope}`} scroll={false} className={`flex-1 sm:flex-initial text-center px-4 py-1.5 rounded-sm transition-colors ${currentSlots === 'all' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>Tutti i Match</Link>
                                <Link href={`/?tab=pending&slots=free&level=${currentLevel}&gender=${currentGender}&sort=${currentSort}&search=${currentSearch}&completedClub=${currentCompletedClub}&completedScope=${currentCompletedScope}`} scroll={false} className={`flex-1 sm:flex-initial text-center px-4 py-1.5 rounded-sm transition-colors ${currentSlots === 'free' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>Slot Liberi</Link>
                            </div>

                            {currentUserPlayer ? (
                                <div className="flex gap-1 bg-slate-100 p-1 rounded-sm flex-1 sm:flex-initial">
                                    <Link href={`/?tab=pending&slots=${currentSlots}&level=all&gender=${currentGender}&sort=${currentSort}&search=${currentSearch}&completedClub=${currentCompletedClub}&completedScope=${currentCompletedScope}`} scroll={false} className={`flex-1 sm:flex-initial text-center px-4 py-1.5 rounded-sm transition-colors ${currentLevel === 'all' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>Qualsiasi Livello</Link>
                                    <Link href={`/?tab=pending&slots=${currentSlots}&level=compatible&gender=${currentGender}&sort=${currentSort}&search=${currentSearch}&completedClub=${currentCompletedClub}&completedScope=${currentCompletedScope}`} scroll={false} className={`flex-1 sm:flex-initial text-center px-4 py-1.5 rounded-sm transition-colors ${currentLevel === 'compatible' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>Adatti a Me ({currentUserPlayer.ranking.toFixed(2)})</Link>
                                </div>
                            ) : (
                                <div className="text-[10px] text-slate-400 flex items-center justify-center px-2 font-medium tracking-normal">
                                    Effettua il login per filtrare i match adatti al tuo livello.
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredPendingMatches.length > 0 ? (
                                filteredPendingMatches.map((match) => (
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
                                <div className="col-span-2 p-10 bg-white border border-slate-200 text-center text-slate-500 font-bold uppercase text-sm rounded-sm">
                                    Nessun match corrisponde ai filtri selezionati
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* =========================================
                    TAB 3: RISULTATI COMPLETATI (With Filters)
                ========================================= */}
                {currentTab === 'completed' && (
                    <div className="animate-in fade-in duration-300 space-y-4">

                        {/* BARRA RICERCA STORICO */}
                        <div className="w-full">
                            <SearchBar placeholder="FILTRA STORICO PER NOME GIOCATORE..." />
                        </div>

                        {/* FILTRI OPERATIVI RISULTATI */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white border border-slate-200 p-2 rounded-sm shadow-sm gap-3 text-xs font-bold uppercase tracking-wider">

                            {/* Selettore Scope: Tutti vs I Miei */}
                            {currentUserPlayer ? (
                                <div className="flex gap-1 bg-slate-100 p-1 rounded-sm shrink-0 w-full md:w-auto">
                                    <Link href={`/?tab=completed&completedScope=all&completedClub=${currentCompletedClub}&gender=${currentGender}&sort=${currentSort}&search=${currentSearch}&slots=${currentSlots}&level=${currentLevel}`} scroll={false} className={`px-4 py-1.5 rounded-sm transition-colors text-center flex-1 md:flex-initial ${currentCompletedScope === 'all' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>Tutti i Risultati</Link>
                                    <Link href={`/?tab=completed&completedScope=mine&completedClub=${currentCompletedClub}&gender=${currentGender}&sort=${currentSort}&search=${currentSearch}&slots=${currentSlots}&level=${currentLevel}`} scroll={false} className={`px-4 py-1.5 rounded-sm transition-colors text-center flex-1 md:flex-initial ${currentCompletedScope === 'mine' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>I Miei Match</Link>
                                </div>
                            ) : (
                                <div className="text-[10px] text-slate-400 flex items-center justify-center px-2 font-medium tracking-normal shrink-0">
                                    Accedi per visualizzare lo storico personale.
                                </div>
                            )}

                            {/* DROPDOWN COMPATTA PER I CLUB (Sostituita la lista estesa di bottoni) */}
                            <ClubSelectFilter clubs={clubsList} currentClub={currentCompletedClub} />
                        </div>

                        {/* LISTA RISULTATI FILTRATI */}
                        {completedMatches && completedMatches.length > 0 ? (
                            completedMatches.map((match) => {
                                const winner = match.winning_team;
                                const sets = (match.score || []) as Array<{team_a: number, team_b: number}>;
                                const matchClub = clubsList.find(c => c.id === match.club_id);

                                return (
                                    <div key={match.id} className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
                                        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                            <span>
                                                {new Date(match.updated_at).toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' })}
                                            </span>
                                            <span>{matchClub ? matchClub.name : 'Location N/D'}</span>
                                        </div>

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
                            <div className="p-8 text-center text-slate-500 font-bold uppercase text-sm border border-slate-200 bg-white rounded-sm">
                                Nessun match registrato corrisponde ai criteri cercati
                            </div>
                        )}

                        {/* PAGINAZIONE STORICO */}
                        {totalPages > 1 && (
                            <div className="flex justify-between items-center mt-6">
                                <Link href={`/?tab=completed&page=${currentPage - 1}&playerPage=${playerPage}&sort=${currentSort}&gender=${currentGender}&search=${currentSearch}&slots=${currentSlots}&level=${currentLevel}&completedClub=${currentCompletedClub}&completedScope=${currentCompletedScope}`} scroll={false} className={`px-4 py-2 bg-white border border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-900 rounded-sm hover:bg-slate-100 transition-colors ${currentPage <= 1 ? 'pointer-events-none opacity-40' : ''}`}>← Prev</Link>
                                <div className="text-xs font-bold text-slate-500">PAG {currentPage} / {totalPages}</div>
                                <Link href={`/?tab=completed&page=${currentPage + 1}&playerPage=${playerPage}&sort=${currentSort}&gender=${currentGender}&search=${currentSearch}&slots=${currentSlots}&level=${currentLevel}&completedClub=${currentCompletedClub}&completedScope=${currentCompletedScope}`} scroll={false} className={`px-4 py-2 bg-white border border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-900 rounded-sm hover:bg-slate-100 transition-colors ${currentPage >= totalPages ? 'pointer-events-none opacity-40' : ''}`}>Next →</Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
