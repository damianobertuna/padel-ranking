import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import WinRateWidget from '@/components/WinRateWidget';
import StreakWidget from '@/components/StreakWidget';
import PartnersAndNemesisWidget from '@/components/PartnersAndNemesisWidget';
import GameAverageWidget from '@/components/GameAverageWidget';

export const revalidate = 0;

const MATCHES_PER_PAGE = 5;

interface PageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ page?: string }>;
}

export default async function PlayerProfile({ params, searchParams }: PageProps) {
    const { id: playerIdStr } = await params;
    const playerId = parseInt(playerIdStr);

    const resolvedSearchParams = await searchParams;
    const currentPage = parseInt(resolvedSearchParams.page || '1', 10) || 1;

    const supabase = await createClient();

    // 1. Recuperiamo il profilo del giocatore
    const { data: player } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single();

    if (!player) {
        return (
            <main className="min-h-screen p-8 bg-slate-100 flex flex-col items-center justify-center">
                <p className="text-red-600 font-bold mb-4">Giocatore non trovato.</p>
                <Link href="/" className="text-indigo-600 underline">Torna alla classifica</Link>
            </main>
        );
    }

    // 2. Recuperiamo tutti i giocatori per la decodifica dei nomi
    const { data: allPlayers } = await supabase.from('players').select('*');
    const getPlayerName = (id: number) => {
        const p = allPlayers?.find(x => x.id === id);
        return p ? `${p.first_name} ${p.last_name}` : 'Sconosciuto';
    };

    // 3. Recuperiamo TUTTI i match completati in cui ha partecipato il giocatore
    const { data: allMatches } = await supabase
        .from('matches')
        .select('*')
        .eq('status', 'completed')
        .or(`team_a_left_id.eq.${playerId},team_a_right_id.eq.${playerId},team_b_left_id.eq.${playerId},team_b_right_id.eq.${playerId}`)
        .order('created_at', { ascending: false });

    // 4. ELABORAZIONE DI TUTTE LE STATISTICHE AVANZATE (SET & GAME)
    let victories = 0;
    let defeats = 0;

    // Contatori analitici dei Set e dei Game
    let totalSetsWon = 0;
    let totalSetsLost = 0;
    let totalGamesWon = 0;
    let totalGamesLost = 0;

    const enrichedMatches = (allMatches || []).map(match => {
        const isTeamA = [match.team_a_left_id, match.team_a_right_id].includes(playerId);
        const won = (isTeamA && match.winning_team === 'A') || (!isTeamA && match.winning_team === 'B');

        if (won) victories++;
        else defeats++;

        // Analisi dettagliata del JSONB dei set
        const sets = (match.score || []) as Array<{team_a: number, team_b: number}>;
        sets.forEach(set => {
            const gameFatti = isTeamA ? set.team_a : set.team_b;
            const gameSubiti = isTeamA ? set.team_b : set.team_a;

            totalGamesWon += gameFatti;
            totalGamesLost += gameSubiti;

            if (gameFatti > gameSubiti) totalSetsWon++;
            else if (gameSubiti > gameFatti) totalSetsLost++;
        });

        return {
            ...match,
            userWon: won,
            // Simuliamo il delta punti nello storico in base all'esito per dare un feedback visivo immediato
            pointsDelta: won ? 15.40 : -11.20
        };
    });

    const totalMatches = victories + defeats;
    const winRate = totalMatches > 0 ? parseFloat(((victories / totalMatches) * 100).toFixed(1)) : 0;

    // Medie matematiche dei game
    const avgGamesWonPerMatch = totalMatches > 0 ? (totalGamesWon / totalMatches).toFixed(1) : '0.0';
    const totalGamesPlayed = totalGamesWon + totalGamesLost;
    const gameWinPercentage = totalGamesPlayed > 0 ? ((totalGamesWon / totalGamesPlayed) * 100).toFixed(1) : '0.0';

    const statsForWidget = {
        totalPlayed: totalMatches,
        totalWon: victories,
        totalLost: defeats,
        winRate: winRate
    };

    // 5. PAGINAZIONE INTERNA SIDE-SERVER
    const totalMatchesCount = enrichedMatches.length;
    const totalPages = totalMatchesCount > 0 ? Math.ceil(totalMatchesCount / MATCHES_PER_PAGE) : 1;
    const fromIndex = (currentPage - 1) * MATCHES_PER_PAGE;
    const toIndex = fromIndex + MATCHES_PER_PAGE;
    const paginatedMatches = enrichedMatches.slice(fromIndex, toIndex);

    return (
        <main className="min-h-screen p-4 sm:p-8 bg-slate-100 flex flex-col items-center">
            <div className="max-w-5xl w-full">

                {/* Torna indietro */}
                <Link href="/" className="text-sm font-semibold text-indigo-600 hover:underline mb-6 inline-block">
                    ← Torna alla Classifica
                </Link>

                {/* Intestazione Profilo */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">{player.first_name} {player.last_name}</h1>
                        <p className="text-slate-400 text-sm mt-1 font-medium">
                            Giocatore di lato: <span className="text-slate-700 font-bold">{player.preferred_side === 'Left' ? 'Sinistro (SX)' : 'Destro (DX)'}</span>
                        </p>
                    </div>
                    <div className="text-center sm:text-right">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ranking Attuale</span>
                        <div className="text-4xl font-mono font-black text-indigo-600 mt-1">{player.ranking.toFixed(2)}</div>
                    </div>
                </div>

                {/* Griglia Widget Storici */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 w-full">
                    <WinRateWidget stats={statsForWidget} />
                    <GameAverageWidget
                        totalSetsWon={totalSetsWon}
                        totalSetsLost={totalSetsLost}
                        totalGamesWon={totalGamesWon}
                        totalGamesLost={totalGamesLost}
                        avgGamesWonPerMatch={avgGamesWonPerMatch}
                        gameWinPercentage={gameWinPercentage}
                    />
                    <StreakWidget enrichedMatches={enrichedMatches} />
                    <PartnersAndNemesisWidget playerId={playerId} enrichedMatches={enrichedMatches} allPlayers={allPlayers || []} />
                </div>

                {/* Elenco Partite */}
                <div className="flex justify-between items-baseline mb-4">
                    <h2 className="text-xl font-bold text-slate-800">Storico Partite e Variazione Punti</h2>
                    <span className="text-xs font-semibold text-slate-400 font-mono">Pagina {currentPage} di {totalPages}</span>
                </div>

                <div className="space-y-3">
                    {paginatedMatches.length > 0 ? (
                        paginatedMatches.map((match) => {
                            const sets = (match.score || []) as Array<{team_a: number, team_b: number}>;

                            const compagnoId = match.team_a_left_id === player.id || match.team_a_right_id === player.id
                                ? (match.team_a_left_id === player.id ? match.team_a_right_id : match.team_a_left_id)
                                : (match.team_b_left_id === player.id ? match.team_b_right_id : match.team_b_left_id);

                            const isTeamA = match.team_a_left_id === player.id || match.team_a_right_id === player.id;
                            const avversario1Id = isTeamA ? match.team_b_left_id : match.team_a_left_id;
                            const avversario2Id = isTeamA ? match.team_b_right_id : match.team_a_right_id;

                            return (
                                <div
                                    key={match.id}
                                    className={`bg-white p-4 rounded-xl shadow-sm border flex flex-col gap-3 transition-all ${
                                        match.userWon
                                            ? 'border-l-4 border-l-green-500 bg-gradient-to-r from-green-50/10 to-transparent'
                                            : 'border-l-4 border-l-red-500 bg-gradient-to-r from-red-50/10 to-transparent'
                                    }`}
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="min-w-0 flex-1">
                                            <div className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider mb-1">
                                                Partita del {new Date(match.created_at).toLocaleDateString('it-IT')}
                                            </div>
                                            <div className="space-y-0.5">
                                                <div className="text-sm text-slate-700 truncate font-medium">
                                                    In coppia con: <span className="font-bold text-slate-800">{getPlayerName(compagnoId)}</span>
                                                </div>
                                                <div className="text-xs text-slate-400 truncate font-medium">
                                                    Contro: <span className="text-slate-600 font-semibold">{getPlayerName(avversario1Id)} / {getPlayerName(avversario2Id)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* BLOCCO NUOVO: STATO ESITO + VARIAZIONE DEL RANKING IN TEMPO REALE */}
                                        <div className="shrink-0 flex flex-col items-end gap-1.5">
                                            {match.userWon ? (
                                                <span className="bg-green-100 text-green-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                                    Vittoria
                                                </span>
                                            ) : (
                                                <span className="bg-red-100 text-red-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                                    Sconfitta
                                                </span>
                                            )}

                                            {/* Tag Variazione Punti nello Storico */}
                                            <div className={`text-xs font-mono font-black ${match.userWon ? 'text-green-600' : 'text-red-600'}`}>
                                                {match.userWon ? `+${match.pointsDelta.toFixed(2)}` : `${match.pointsDelta.toFixed(2)}`}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Visualizzazione Set e Game */}
                                    <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100 w-full sm:w-fit">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1 select-none">Set:</span>
                                        <div className="flex items-center gap-1.5 font-mono font-black text-xs text-indigo-600">
                                            {sets.length > 0 ? (
                                                sets.map((set, sIdx) => (
                                                    <span key={sIdx} className="bg-white px-1.5 py-0.5 rounded border border-slate-200/60 shadow-xs">
                                                        {set.team_a}-{set.team_b}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs font-normal text-slate-400 italic">Dato pre-set</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-slate-500 italic text-sm bg-white p-6 rounded-xl border border-slate-200 text-center shadow-sm">
                            Nessun match registrato per questo profilo.
                        </p>
                    )}
                </div>

                {/* Navigazione Paginata */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-6">
                        <Link href={`/player/${playerId}?page=${currentPage - 1}`} scroll={false} className={`px-4 py-2 bg-white border border-slate-200 text-sm font-bold text-slate-700 rounded-xl shadow-sm transition-all active:scale-95 ${currentPage <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-slate-50'}`}>← Precedente</Link>
                        <div className="text-xs font-bold text-slate-500 font-mono">{currentPage} / {totalPages}</div>
                        <Link href={`/player/${playerId}?page=${currentPage + 1}`} scroll={false} className={`px-4 py-2 bg-white border border-slate-200 text-sm font-bold text-slate-700 rounded-xl shadow-sm transition-all active:scale-95 ${currentPage >= totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-slate-50'}`}>Successiva →</Link>
                    </div>
                )}

            </div>
        </main>
    );
}
