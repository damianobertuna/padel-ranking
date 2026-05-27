import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import WinRateWidget from '@/components/WinRateWidget';
import StreakWidget from '@/components/StreakWidget';
import PartnersAndNemesisWidget from '@/components/PartnersAndNemesisWidget';
import GameAverageWidget from '@/components/GameAverageWidget';
import AvatarUpload from '@/components/AvatarUpload';
import BackToHomeButton from "@/components/BackToHomeButton";

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

    // 1. Profilo Giocatore
    const { data: player } = await supabase.from('players').select('*').eq('id', playerId).single();

    if (!player) return <main className="p-8 text-center text-red-600 font-black uppercase">Atleta non trovato.</main>;

    // 2. Dati necessari
    const { data: { user } } = await supabase.auth.getUser();
    const { data: allPlayers } = await supabase.from('players').select('*');
    const { data: allMatches } = await supabase
        .from('matches')
        .select('*')
        .eq('status', 'completed')
        .or(`team_a_left_id.eq.${playerId},team_a_right_id.eq.${playerId},team_b_left_id.eq.${playerId},team_b_right_id.eq.${playerId}`)
        .order('updated_at', { ascending: false });

    // 3. Statistiche
    let victories = 0, defeats = 0, totalSetsWon = 0, totalSetsLost = 0, totalGamesWon = 0, totalGamesLost = 0;

    const enrichedMatches = (allMatches || []).map(match => {
        const isTeamA = [match.team_a_left_id, match.team_a_right_id].includes(playerId);
        const won = (isTeamA && match.winning_team === 'A') || (!isTeamA && match.winning_team === 'B');
        won ? victories++ : defeats++;

        const sets = (match.score || []) as Array<{team_a: number, team_b: number}>;
        sets.forEach(set => {
            const f = isTeamA ? set.team_a : set.team_b;
            const s = isTeamA ? set.team_b : set.team_a;
            totalGamesWon += f; totalGamesLost += s;
            if (f > s) totalSetsWon++; else if (s > f) totalSetsLost++;
        });

        return { ...match, userWon: won, pointsDelta: isTeamA ? Number(match.team_a_delta || 0) : Number(match.team_b_delta || 0) };
    });

    const totalMatches = victories + defeats;
    const statsForWidget = { totalPlayed: totalMatches, totalWon: victories, totalLost: defeats, winRate: totalMatches > 0 ? parseFloat(((victories / totalMatches) * 100).toFixed(1)) : 0 };
    const paginatedMatches = enrichedMatches.slice((currentPage - 1) * MATCHES_PER_PAGE, currentPage * MATCHES_PER_PAGE);
    const totalPages = Math.ceil(enrichedMatches.length / MATCHES_PER_PAGE) || 1;

    return (
        <main className="min-h-screen bg-slate-50 p-4 sm:p-8 flex flex-col items-center">
            <div className="max-w-5xl w-full">
                <div className="mb-6"><BackToHomeButton /></div>

                {/* Header Profilo */}
                <div className="bg-white p-6 border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row items-center gap-6 rounded-sm">
                    <div className="w-24 h-24 shrink-0 rounded-full border-2 border-slate-900 overflow-hidden">
                        {player.avatar_url ? <img src={player.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-200 flex items-center justify-center font-black">{player.first_name[0]}</div>}
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">{player.first_name} {player.last_name}</h1>
                        <div className="flex gap-2 mt-2 justify-center sm:justify-start">
                            <span className="bg-slate-900 text-white text-[10px] px-2 py-1 font-black uppercase tracking-wider">{player.preferred_side}</span>
                            <span className="bg-slate-200 text-slate-800 text-[10px] px-2 py-1 font-black uppercase tracking-wider">{player.gender === 'F' ? 'FEMMINILE' : 'MASCHILE'}</span>
                        </div>
                    </div>
                    <div className="text-center bg-slate-900 text-white p-4 w-full sm:w-32 rounded-sm">
                        <div className="text-[9px] uppercase font-black opacity-70 tracking-widest">Ranking</div>
                        <div className="text-3xl font-black font-mono">{player.ranking.toFixed(2)}</div>
                    </div>
                </div>

                {/* Widget Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <WinRateWidget stats={statsForWidget} />
                    <GameAverageWidget totalSetsWon={totalSetsWon} totalSetsLost={totalSetsLost} totalGamesWon={totalGamesWon} totalGamesLost={totalGamesLost} avgGamesWonPerMatch={(totalGamesWon / (totalMatches || 1)).toFixed(1)} gameWinPercentage={((totalGamesWon / (totalGamesWon + totalGamesLost || 1)) * 100).toFixed(1)} />
                    <StreakWidget enrichedMatches={enrichedMatches} />
                    <PartnersAndNemesisWidget playerId={playerId} enrichedMatches={enrichedMatches} allPlayers={allPlayers || []} />
                </div>

                {/* Storico Partite - Versione COMPLETA */}
                <h2 className="text-xs font-black uppercase text-slate-500 tracking-widest mb-4">Storico Partite</h2>
                <div className="space-y-3">
                    {paginatedMatches.map(match => {
                        const sets = (match.score || []) as Array<{team_a: number, team_b: number}>;
                        const isTeamA = [match.team_a_left_id, match.team_a_right_id].includes(playerId);

                        // Determiniamo il compagno e gli avversari
                        const compagnoId = isTeamA
                            ? (match.team_a_left_id === playerId ? match.team_a_right_id : match.team_a_left_id)
                            : (match.team_b_left_id === playerId ? match.team_b_right_id : match.team_b_left_id);

                        const opp1Id = isTeamA ? match.team_b_left_id : match.team_a_left_id;
                        const opp2Id = isTeamA ? match.team_b_right_id : match.team_a_right_id;

                        const getName = (id: number | null) => {
                            if (!id) return "NON ASSEGNATO";
                            const p = allPlayers?.find(x => x.id === id);
                            return p ? `${p.first_name} ${p.last_name}` : "GIOCATORE";
                        };

                        return (
                            <div key={match.id} className="bg-white border border-slate-200 p-4 rounded-sm shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                {/* Info Base */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase ${match.userWon ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                            {match.userWon ? 'Vittoria' : 'Sconfitta'}
                                        </span>
                                        <span className="text-[10px] font-mono text-slate-400 font-bold">
                                            {new Date(match.updated_at).toLocaleDateString('it-IT')}
                                        </span>
                                    </div>
                                    <div className="space-y-0.5">
                                        <div className="text-[11px] font-bold text-slate-500 uppercase">
                                            In coppia con: <span className="text-slate-900">{getName(Number(compagnoId))}</span>
                                        </div>
                                        <div className="text-[11px] font-bold text-slate-500 uppercase">
                                            Contro: <span className="text-slate-900">{getName(Number(opp1Id))} & {getName(Number(opp2Id))}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Punteggio */}
                                <div className="flex gap-1.5 font-mono font-black text-xs">
                                    {sets.map((s, i) => (
                                        <div key={i} className="bg-slate-100 px-2 py-1 rounded-sm border border-slate-200 text-slate-900">
                                            {s.team_a}-{s.team_b}
                                        </div>
                                    ))}
                                </div>

                                {/* Delta Punti */}
                                <div className={`text-sm font-black font-mono w-16 text-right ${match.pointsDelta > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                    {match.pointsDelta > 0 ? '+' : ''}{match.pointsDelta.toFixed(2)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </main>
    );
}
