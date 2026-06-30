import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import PendingMatchCard from '@/components/matches/PendingMatchCard';
import SearchBar from '@/components/ui/SearchBar';
import { Player, Club } from "@/types";
import { computeKingAndFanalino } from '@/lib/rankingCalc';
import ClubSelectFilter from '@/components/clubs/ClubSelectFilter';
import { Hand } from 'lucide-react';

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

function getPlayerFullName(id: number | null, playersList: Player[]) {
    if (id === null) return 'Slot Libero';
    const p = playersList?.find(player => player.id === id);
    return p ? `${p.first_name} ${p.last_name}` : 'Sconosciuto';
}

function generateWhatsAppResultLink(
    match: any,
    playersList: Player[],
    clubsList: Club[],
    winner: string | null
): string {
    const matchClub = clubsList.find(c => c.id === match.club_id);
    const dateStr = new Date(match.match_date || match.updated_at).toLocaleString('it-IT', {
        weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome'
    });

    const pA1 = getPlayerFullName(match.team_a_left_id, playersList);
    const pA2 = getPlayerFullName(match.team_a_right_id, playersList);
    const pB1 = getPlayerFullName(match.team_b_left_id, playersList);
    const pB2 = getPlayerFullName(match.team_b_right_id, playersList);

    const sets = (match.score || []) as Array<{team_a: number, team_b: number}>;
    const scoreStr = sets.map(s => `${s.team_a}-${s.team_b}`).join(' / ');

    const tipo = match.is_friendly ? '🤝 Amichevole' : '🔥 Classificata';
    const clubText = matchClub ? `${matchClub.name}${matchClub.city ? ` (${matchClub.city})` : ''}` : '';

    const teamALabel = winner === 'A' ? '*🏆 SQUADRA A VINCENTE 🏆*' : 'SQUADRA A';
    const teamBLabel = winner === 'B' ? '*🏆 SQUADRA B VINCENTE 🏆*' : 'SQUADRA B';

    const testo = `🎾 *RanKING Padel - Risultato Match* 🎾\n\n` +
        `📅 *Data:* ${dateStr}\n` +
        (clubText ? `📍 *Campo:* ${clubText}\n` : '') +
        `📊 *Tipo:* ${tipo}\n\n` +
        `*${teamALabel}*\n` +
        `• ${pA1}\n` +
        `• ${pA2}\n\n` +
        `*${teamBLabel}*\n` +
        `• ${pB1}\n` +
        `• ${pB2}\n\n` +
        `*Punteggio:* ${scoreStr}\n\n` +
        `*Dettaglio completo su:*\n` +
        `🔗 https://ranking-padel.vercel.app/match/${match.id}/join`;

    return `https://wa.me/?text=${encodeURIComponent(testo)}`;
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
    const translateSide: Record<string, string> = {
        Right: 'Dx',
        Left: 'Sx',
        Both: 'Mix'
    };

        // --- DIETRO LE QUINTE: RECUPERO UTENTE LOGGATO E PERMESSI ---
    const { data: { user } } = await supabase.auth.getUser();
    let currentUserPlayer = null;
    let managedClubIds: number[] = [];

    if (user) {
        // 1) Cerca il profilo giocatore (player/club_manager con profilo)
        const { data: playerData } = await supabase
            .from('players')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
        currentUserPlayer = playerData;

        // 2) Se non ha profilo giocatore, verifica se è un club_manager puro (solo user_roles)
        if (!currentUserPlayer) {
            const { data: userRole } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', user.id)
                .maybeSingle();

            if (userRole?.role === 'club_manager') {
                // Crea un oggetto fittizio per rappresentare il manager nell'UI
                currentUserPlayer = { id: null, role: 'club_manager', first_name: null, last_name: null };
            }
        }

        // 3) Recupera i circoli gestiti (usa user_id, non player_id)
        const { data: managementData } = await supabase
            .from('club_managers')
            .select('club_id')
            .eq('user_id', user.id);

        if (managementData) {
            managedClubIds = managementData.map(m => Number(m.club_id));
        }
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

    const playerTitlesMap: Record<number, { type: 'KING' | 'FANALINO', label: string }> = {};

    kingLeftIds.forEach(id => playerTitlesMap[id] = { type: 'KING', label: 'KING SX' });
    kingRightIds.forEach(id => playerTitlesMap[id] = { type: 'KING', label: 'KING DX' });
    kingBothIds.forEach(id => playerTitlesMap[id] = { type: 'KING', label: 'KING MIX' });

    lastPlaceLeftIds.forEach(id => playerTitlesMap[id] = { type: 'FANALINO', label: 'FAN SX' });
    lastPlaceRightIds.forEach(id => playerTitlesMap[id] = { type: 'FANALINO', label: 'FAN DX' });
    lastPlaceBothIds.forEach(id => playerTitlesMap[id] = { type: 'FANALINO', label: 'FAN MIX' });

    // --- FILTRAGGIO ATLETI ---
    const filteredPlayers = playersWithStats.filter(player => {
        const matchesGender = currentGender === 'all' || player.gender === currentGender;
        const matchesSearch = currentTab !== 'ranking' || !currentSearch ||
            player.first_name.toLowerCase().includes(currentSearch.toLowerCase()) ||
            player.last_name.toLowerCase().includes(currentSearch.toLowerCase());
        return matchesGender && matchesSearch;
    });

    const sortedPlayers = [...filteredPlayers].sort((a, b) => {
        if (currentSort === 'played') return b.total_played - a.total_played || b.ranking - a.ranking;
        if (currentSort === 'winrate') return b.win_rate - a.win_rate || b.total_played - a.total_played;
        return b.ranking - a.ranking;
    });

    const totalPlayerPages = Math.ceil(sortedPlayers.length / PLAYERS_PER_PAGE) || 1;
    const startIndex = (playerPage - 1) * PLAYERS_PER_PAGE;
    const paginatedPlayers = sortedPlayers.slice(startIndex, startIndex + PLAYERS_PER_PAGE);

        // --- PENDING MATCHES ---
        const isPureManager = currentUserPlayer?.role === 'club_manager' && currentUserPlayer?.id === null;
        let pendingQuery = supabase
            .from('matches')
            .select('*')
            .eq('status', 'pending');

        // Pure manager: only see their club's pending matches
        if (isPureManager && managedClubIds.length > 0) {
            pendingQuery = pendingQuery.in('club_id', managedClubIds);
        }

    const { data: pendingMatches } = await pendingQuery
        .order('match_date', { ascending: true, nullsFirst: false });

    const filteredPendingMatches = (pendingMatches || []).filter(match => {
        const playerIds = [match.team_a_left_id, match.team_a_right_id, match.team_b_left_id, match.team_b_right_id];
        const activeCount = playerIds.filter(Boolean).length;
        const isMatchComplete = activeCount === 4;
        const isUserInMatch = currentUserPlayer?.id ? playerIds.includes(currentUserPlayer.id) : false;
        const isExpired = match.match_date ? new Date(match.match_date) < new Date() : false;

        // Verifica se l'utente è un manager di QUEL circolo
        const isManagerForThisMatch = currentUserPlayer?.role === 'club_manager' && managedClubIds.includes(match.club_id);

                if (isExpired) {
            // I manager possono visualizzare e gestire i match scaduti dei loro circoli
            const isAdminUser = currentUserPlayer?.role === 'admin';
            if (!isMatchComplete && !isAdminUser && !isManagerForThisMatch) return false;
            if (isMatchComplete && !isAdminUser && !isUserInMatch && !isManagerForThisMatch) return false;
        }

        if (currentSlots === 'free' && isMatchComplete) return false;

                if (currentLevel === 'compatible' && currentUserPlayer?.id && !isUserInMatch && !isMatchComplete) {
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
        return true;
    });

        // --- RISULTATI COMPLETATI ---
    let completedQuery = supabase
        .from('matches')
        .select('*', { count: 'exact' })
        .eq('status', 'completed');

    if (currentCompletedClub !== 'all') {
        completedQuery = completedQuery.eq('club_id', parseInt(currentCompletedClub, 10));
    }

        // Club manager: auto-filter to their managed clubs
    if (isPureManager && currentCompletedClub === 'all' && managedClubIds.length > 0) {
        completedQuery = completedQuery.in('club_id', managedClubIds);
    }

    if (currentCompletedScope === 'mine' && currentUserPlayer?.id) {
        completedQuery = completedQuery.or(`team_a_left_id.eq.${currentUserPlayer.id},team_a_right_id.eq.${currentUserPlayer.id},team_b_left_id.eq.${currentUserPlayer.id},team_b_right_id.eq.${currentUserPlayer.id}`);
    } else if (currentCompletedScope === 'mine' && isPureManager && managedClubIds.length > 0) {
        // Pure manager "I Miei Match" = matches from their clubs
        completedQuery = completedQuery.in('club_id', managedClubIds);
    }

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
        .order('match_date', { ascending: false, nullsFirst: false })
        .range(fromRange, toRange);

    const totalPages = totalCompletedCount ? Math.ceil(totalCompletedCount / MATCHES_PER_PAGE) : 1;

    const urlState = `gender=${currentGender}&sort=${currentSort}&playerPage=${playerPage}&page=${currentPage}&search=${encodeURIComponent(currentSearch)}&slots=${currentSlots}&level=${currentLevel}&completedClub=${currentCompletedClub}&completedScope=${currentCompletedScope}`;

    // --- WRAPPER PER LA PAGINAZIONE LATO SERVER (SERVER COMPONENT) ---
    const renderPagination = (type: 'players' | 'matches', total: number, current: number) => {
        if (total <= 1) return null;

        const maxVisible = 5;
        let start = Math.max(1, current - Math.floor(maxVisible / 2));
        let end = Math.min(total, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        const visiblePages = [];
        for (let i = start; i <= end; i++) {
            visiblePages.push(i);
        }

        const renderButton = (page: number, label: string | number, title: string, disabled: boolean, isActive: boolean = false) => {
            const buttonClass = `w-8 h-8 flex items-center justify-center border rounded-sm text-[10px] font-black uppercase tracking-wider transition-colors ${
                isActive
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white cursor-pointer'
            }`;

            if (disabled || isActive) {
                return (
                    <button key={`${type}-${label}`} type="button" disabled={true} title={title} className={buttonClass}>
                        {label}
                    </button>
                );
            }

            const targetPlayerPage = type === 'players' ? page : playerPage;
            const targetMatchPage = type === 'matches' ? page : currentPage;

            const href = `/?tab=${currentTab}&gender=${currentGender}&sort=${currentSort}&search=${encodeURIComponent(currentSearch)}&slots=${currentSlots}&level=${currentLevel}&completedClub=${currentCompletedClub}&completedScope=${currentCompletedScope}&playerPage=${targetPlayerPage}&page=${targetMatchPage}`;

            return (
                <Link key={`${type}-${label}`} href={href} scroll={false} title={title} className={buttonClass}>
                    {label}
                </Link>
            );
        };

        return (
            <div className="flex items-center justify-center gap-1 mt-6">
                {renderButton(1, '«', 'Prima Pagina', current === 1)}
                {renderButton(Math.max(1, current - 1), '‹', 'Precedente', current === 1)}
                {visiblePages.map(p => renderButton(p, p, `Pagina ${p}`, false, p === current))}
                {renderButton(Math.min(total, current + 1), '›', 'Successiva', current === total)}
                {renderButton(total, '»', 'Ultima Pagina', current === total)}
            </div>
        );
    };

    return (
        <main className="bg-slate-50 flex flex-col items-center text-slate-900 mt-2">
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
                        Match <span className="ml-1 opacity-70">({filteredPendingMatches.length})</span>
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
                                <div className="flex-1 pl-4">Giocatore</div>
                                <div className="w-24 text-center">Lato / Mano</div>
                                <div className="w-24 text-center">Partite</div>
                                <div className="w-24 text-right pr-2">Punti</div>
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
                                                        {translateSide[player.preferred_side] || player.preferred_side} • {player.total_played} Partite
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="hidden sm:block w-24 text-center text-xs font-bold text-slate-500 uppercase">
                                                {translateSide[player.preferred_side] || player.preferred_side}
                                            </div>
                                            <span
                                                className={`flex items-center gap-0.5 text-[9px] font-black px-1.5 py-1 rounded-sm border shrink-0 ${
                                                    player.dominant_hand === 'Mancino'
                                                        ? 'bg-amber-100 text-amber-700 border-amber-300 shadow-sm'
                                                        : 'bg-slate-100 text-slate-500 border-slate-200'
                                                }`}
                                                title={player.dominant_hand === 'Mancino' ? 'Mancino' : 'Destro'}
                                            >
                                                <Hand className="w-3 h-3 shrink-0" />
                                                <span>{player.dominant_hand === 'Mancino' ? 'L' : 'R'}</span>
                                            </span>
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

                        {renderPagination('players', totalPlayerPages, playerPage)}
                    </div>
                )}

                {/* =========================================
                    TAB 2: MATCH IN PROGRAMMA
                ========================================= */}
                {currentTab === 'pending' && (
                    <div className="animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredPendingMatches.length > 0 ? (
                                filteredPendingMatches.map((match) => {
                                    const isExpired = match.match_date ? new Date(match.match_date) < new Date() : false;

                                    return (
                                        <div key={match.id} className="relative group">
                                            <div className="absolute -top-2 right-2 z-10 flex gap-1">
                                                {match.is_friendly && (
                                                    <span className="bg-purple-600 text-white text-[8px] font-black px-2 py-0.5 rounded-sm shadow-md uppercase tracking-widest border border-purple-700">
                                                        🤝 AMICHEVOLE
                                                    </span>
                                                )}
                                                {isExpired && (
                                                    <span className="bg-rose-600 text-white text-[8px] font-black px-2 py-0.5 rounded-sm shadow-md uppercase tracking-widest animate-pulse border border-rose-700">
                                                        SCADUTO ⚠️
                                                    </span>
                                                )}
                                            </div>

                                            <div className={
                                                isExpired
                                                    ? "border-2 border-rose-500 rounded-sm overflow-hidden opacity-90 hover:opacity-100 transition-all shadow-sm"
                                                    : (match.is_friendly ? "border border-purple-300 rounded-sm overflow-hidden shadow-sm" : "")
                                            }>
                                                <PendingMatchCard
                                                    match={match}
                                                    rawPlayers={playersWithStats || []}
                                                    currentUserPlayer={currentUserPlayer}
                                                    clubs={clubsList}
                                                    playerTitles={playerTitlesMap}
                                                    managedClubIds={managedClubIds}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="col-span-2 p-10 bg-white border border-slate-200 text-center text-slate-500 font-bold uppercase text-sm rounded-sm">
                                    Nessun match in bacheca
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* =========================================
                    TAB 3: RISULTATI COMPLETATI
                ========================================= */}
                {currentTab === 'completed' && (
                    <div className="animate-in fade-in duration-300 space-y-4">
                        <div className="w-full">
                            <SearchBar placeholder="FILTRA STORICO PER NOME GIOCATORE..." />
                        </div>

                                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white border border-slate-200 p-2 rounded-sm shadow-sm gap-3 text-xs font-bold uppercase tracking-wider">
                            {currentUserPlayer ? (
                                <div className="flex gap-1 bg-slate-100 p-1 rounded-sm shrink-0 w-full md:w-auto">
                                    {isPureManager ? (
                                        <>
                                            <Link href={`/?tab=completed&completedScope=all&completedClub=${currentCompletedClub}&gender=${currentGender}&sort=${currentSort}&search=${currentSearch}&slots=${currentSlots}&level=${currentLevel}`} scroll={false} className={`px-4 py-1.5 rounded-sm transition-colors text-center flex-1 md:flex-initial ${currentCompletedScope === 'all' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>Tutti i Risultati</Link>
                                            <Link href={`/?tab=completed&completedScope=mine&completedClub=${currentCompletedClub}&gender=${currentGender}&sort=${currentSort}&search=${currentSearch}&slots=${currentSlots}&level=${currentLevel}`} scroll={false} className={`px-4 py-1.5 rounded-sm transition-colors text-center flex-1 md:flex-initial ${currentCompletedScope === 'mine' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>I Miei Circoli</Link>
                                        </>
                                    ) : (
                                        <>
                                            <Link href={`/?tab=completed&completedScope=all&completedClub=${currentCompletedClub}&gender=${currentGender}&sort=${currentSort}&search=${currentSearch}&slots=${currentSlots}&level=${currentLevel}`} scroll={false} className={`px-4 py-1.5 rounded-sm transition-colors text-center flex-1 md:flex-initial ${currentCompletedScope === 'all' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>Tutti i Risultati</Link>
                                            <Link href={`/?tab=completed&completedScope=mine&completedClub=${currentCompletedClub}&gender=${currentGender}&sort=${currentSort}&search=${currentSearch}&slots=${currentSlots}&level=${currentLevel}`} scroll={false} className={`px-4 py-1.5 rounded-sm transition-colors text-center flex-1 md:flex-initial ${currentCompletedScope === 'mine' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>I Miei Match</Link>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="text-[10px] text-slate-400 flex items-center justify-center px-2 font-medium tracking-normal shrink-0">
                                    Accedi per visualizzare lo storico personale.
                                </div>
                            )}

                            <ClubSelectFilter clubs={clubsList} currentClub={currentCompletedClub} />
                        </div>

                        {completedMatches && completedMatches.length > 0 ? (
                            completedMatches.map((match) => {
                                const winner = match.winning_team;
                                const sets = (match.score || []) as Array<{team_a: number, team_b: number}>;
                                const matchClub = clubsList.find(c => c.id === match.club_id);

                                return (
                                    <div key={match.id} className={`bg-white border rounded-sm shadow-sm overflow-hidden transition-all ${
                                        match.is_friendly
                                            ? 'border-purple-300 border-l-4 border-l-purple-500 bg-purple-50/20'
                                            : 'border-slate-200'
                                    }`}>
                                        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                            <div className="flex items-center gap-2">
                                                <span>
                                                    {new Date(match.match_date || match.updated_at).toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' })}
                                                </span>
                                                {match.is_friendly ? (
                                                    <span className="bg-purple-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm shadow-sm tracking-wider uppercase">
                                                        🤝 Amichevole
                                                    </span>
                                                ) : (
                                                    <span className="bg-blue-100 text-blue-800 text-[8px] font-black px-1.5 py-0.5 rounded-sm shadow-sm tracking-normal normal-case">
                                                        🔥 Classificata
                                                    </span>
                                                )}
                                            </div>
                                            <span>{matchClub ? matchClub.name : 'Location N/D'}</span>
                                        </div>

                                        <div className="flex flex-col sm:flex-row items-center p-0 sm:p-2">
                                            <div className={`flex-1 w-full sm:w-auto p-4 flex flex-col justify-center ${winner === 'A' ? 'bg-emerald-50/50' : ''}`}>
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">TEAM A</span>
                                                    {winner === 'A' && <span className="bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider">WINNER</span>}
                                                </div>
                                                <div className="text-sm font-black text-slate-900 uppercase">{getPlayerNameWithRanking(match.team_a_left_id, playersWithStats)}</div>
                                                <div className="text-sm font-black text-slate-900 uppercase">{getPlayerNameWithRanking(match.team_a_right_id, playersWithStats)}</div>
                                            </div>

                                            <div className="px-6 py-4 flex items-center justify-center border-y sm:border-y-0 sm:border-x border-slate-100 bg-slate-50 w-full sm:w-auto">
                                                <div className="flex gap-2">
                                                    {sets.length > 0 ? sets.map((set, sIdx) => (
                                                        <div key={sIdx} className="bg-white border border-slate-200 px-3 py-2 text-base font-black text-slate-900 text-center rounded-sm min-w-[2.5rem]">
                                                            {set.team_a}<br/><span className="text-slate-300 font-normal">-</span><br/>{set.team_b}
                                                        </div>
                                                    )) : <span className="text-xs font-bold text-slate-400">N/D</span>}
                                                </div>
                                            </div>

                                                                                        <div className={`flex-1 w-full sm:w-auto p-4 flex flex-col justify-center sm:text-right ${winner === 'B' ? 'bg-emerald-50/50' : ''}`}>
                                                <div className="flex items-center sm:justify-end gap-2 mb-1.5">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">TEAM B</span>
                                                    {winner === 'B' && <span className="bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider">WINNER</span>}
                                                </div>
                                                <div className="text-sm font-black text-slate-900 uppercase">{getPlayerNameWithRanking(match.team_b_left_id, playersWithStats)}</div>
                                                <div className="text-sm font-black text-slate-900 uppercase">{getPlayerNameWithRanking(match.team_b_right_id, playersWithStats)}</div>
                                            </div>
                                        </div>

                                        <div className="border-t border-slate-100 px-4 py-2 flex justify-center">
                                            <a
                                                href={generateWhatsAppResultLink(match, playersWithStats, clubsList, winner)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-2 px-4 rounded-sm text-[9px] uppercase tracking-wider transition-colors [-webkit-tap-highlight-color:transparent] active:scale-[0.98]"
                                            >
                                                📊 CONDIVIDI RISULTATO
                                            </a>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-8 text-center text-slate-500 font-bold uppercase text-sm border border-slate-200 bg-white rounded-sm">
                                Nessun match registrato corrisponde ai criteri cercati
                            </div>
                        )}

                        {renderPagination('matches', totalPages, currentPage)}
                    </div>
                )}
            </div>
        </main>
    );
}
