'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import { calculateRankingUpdates, MatchContext } from '@/lib/matchRules';
import { resolveMatchWithRanking } from '@/actions/match-actions';
import { Player, Match } from '@/types';
import BackToHomeButton from "@/components/ui/BackToHomeButton";
import dictError from '@/lib/i18n/dict-error';
import dictMatch from '@/lib/i18n/dict-match';
import dictPlayer from '@/lib/i18n/dict-player';
import dictUi from '@/lib/i18n/dict-ui';

export default function ResolveMatch() {
    const supabase = createClient();
    const params = useParams();
    const router = useRouter();
    const matchId = params.id as string;

    const [match, setMatch] = useState<Match | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [sets, setSets] = useState({ s1A: '', s1B: '', s2A: '', s2B: '', s3A: '', s3B: '' });

    useEffect(() => {
        async function fetchData() {
            try {
                // Recuperiamo parallelamente sessione, partita e lista giocatori
                const [authRes, matchRes, playersRes] = await Promise.all([
                    supabase.auth.getUser(),
                    supabase.from('matches').select('*').eq('id', matchId).maybeSingle(),
                    supabase.from('players').select('*')
                ]);

                const user = authRes.data.user;
                if (!user) throw new Error(dictError.AUTH_REQUIRED);

                const matchData = matchRes.data;
                if (!matchData) throw new Error(dictError.MATCH_NOT_FOUND_REPORT);

                const allPlayers = playersRes.data || [];
                const currentUserPlayer = allPlayers.find(p => p.user_id === user.id);

                // --- CONTROLLO DI SICUREZZA LATO CLIENT ---
                let isManagerForThisMatch = false;
                let currentUserId: number | null = null;
                let userRole: string | null = null;

                if (currentUserPlayer) {
                    currentUserId = currentUserPlayer.id;
                    userRole = currentUserPlayer.role;
                } else {
                    // Potrebbe essere un club_manager senza profilo giocatore
                    const { data: userRoleData } = await supabase
                        .from('user_roles')
                        .select('role')
                        .eq('user_id', user.id)
                        .maybeSingle();
                    userRole = userRoleData?.role || null;
                }

                if (userRole === 'club_manager' && matchData.club_id) {
                    const { data: managerData } = await supabase.from('club_managers')
                        .select('id')
                        .eq('user_id', user.id)
                        .eq('club_id', matchData.club_id)
                        .maybeSingle();
                    isManagerForThisMatch = !!managerData;
                }

                const isPlayerInMatch = currentUserId
                    ? [matchData.team_a_left_id, matchData.team_a_right_id, matchData.team_b_left_id, matchData.team_b_right_id].includes(currentUserId)
                    : false;

                const isAdmin = userRole === 'admin';

                // Chi può inserire il punteggio? L'Admin, un giocatore in campo o il gestore del circolo
                const canResolve = isAdmin || isPlayerInMatch || isManagerForThisMatch;

                if (!canResolve) {
                    throw new Error(dictError.PERMISSION_DENIED_RESOLVE);
                }
                // -----------------------------------------

                setMatch(matchData);
                setPlayers(allPlayers);
            } catch (err: any) {
                setError(err.message || dictError.GENERIC);
            } finally {
                setPageLoading(false);
            }
        }
        fetchData();
    }, [matchId, supabase]);

    const getPlayerName = (id: number | null) => {
        if (id === null) return 'OSPITE';
        const p = players.find(pl => pl.id === id);
        if (!p || !p.last_name || !p.first_name) return dictMatch.LABEL_PLAYER_ND;
        return `${p.last_name.toUpperCase()} ${p.first_name[0]}.`;
    };

    const handleSubmitScore = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!match) return;

        const s1A = parseInt(sets.s1A), s1B = parseInt(sets.s1B), s2A = parseInt(sets.s2A), s2B = parseInt(sets.s2B);
        if (isNaN(s1A) || isNaN(s1B) || isNaN(s2A) || isNaN(s2B)) { setError(dictMatch.ERROR_SETS_INCOMPLETE); return; }

        const scoreArray = [{ team_a: s1A, team_b: s1B }, { team_a: s2A, team_b: s2B }];
        if (sets.s3A !== '' && sets.s3B !== '') scoreArray.push({ team_a: parseInt(sets.s3A), team_b: parseInt(sets.s3B) });

        let setsWonA = 0, setsWonB = 0;
        scoreArray.forEach(s => { if (s.team_a > s.team_b) setsWonA++; else if (s.team_b > s.team_a) setsWonB++; });

        if (setsWonA === setsWonB) { setError(dictMatch.ERROR_SETS_TIED); return; }

        setSubmitting(true);
        const finalWinningTeam = setsWonA > setsWonB ? 'A' : 'B';
        const teamAIds = [match.team_a_left_id, match.team_a_right_id].filter((id): id is number => id !== null);
        const teamBIds = [match.team_b_left_id, match.team_b_right_id].filter((id): id is number => id !== null);

        // Se è un'amichevole, saltiamo del tutto il calcolo del contesto del ranking lato client
        if (!match.is_friendly) {
            const ctx: MatchContext = {
                winnerIds: finalWinningTeam === 'A' ? teamAIds : teamBIds,
                loserIds: finalWinningTeam === 'A' ? teamBIds : teamAIds,
                kingLeftIds: players.filter(p => p.preferred_side === 'Left').sort((a,b) => b.ranking - a.ranking).slice(0,1).map(p => p.id),
                kingRightIds: players.filter(p => p.preferred_side === 'Right').sort((a,b) => b.ranking - a.ranking).slice(0,1).map(p => p.id),
                kingBothIds: players.filter(p => p.preferred_side === 'Both').sort((a,b) => b.ranking - a.ranking).slice(0,1).map(p => p.id),
                lastPlaceIds: players.sort((a,b) => a.ranking - b.ranking).slice(0,1).map(p => p.id),
            };
            calculateRankingUpdates(ctx); // Logica applicata lato server in resolveMatchWithRanking
        }

        try {
            await resolveMatchWithRanking({
                matchId: match.id,
                score: scoreArray
            });
            router.push('/'); router.refresh();
        } catch (err: any) { setError(err.message); setSubmitting(false); }
    };

    if (pageLoading) return <main className="min-h-screen flex items-center justify-center text-[10px] font-black uppercase tracking-widest">{dictMatch.REPORT_LOADING}</main>;

    // Se c'è un errore (es. Accesso Negato), mostriamo una schermata di stop
    if (error || !match) {
        return (
            <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
                <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-sm text-center max-w-sm w-full">
                    <h1 className="text-xl font-black text-red-600 uppercase tracking-tighter mb-2">
                        {error ? dictError.PERMISSION_DENIED : dictError.NOT_FOUND_404}
                    </h1>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">
                        {error || dictError.NOT_FOUND_REPORT}
                    </p>
                    <BackToHomeButton />
                </div>
            </main>
        );
    }

    return (
        <main className="w-full max-w-4xl mx-auto px-4 sm:px-8 mt-6 pb-12">
            <div className=" w-full bg-white border border-slate-200 shadow-sm p-6 rounded-sm">
                <div className="mb-6"><BackToHomeButton /></div>
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-6">
                    {dictMatch.REPORT_TITLE} {match.is_friendly && <span className="text-slate-400 text-lg ml-2">({dictMatch.BADGE_AMICHEVOLE})</span>}
                </h1>

                {error && <div className="p-3 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest mb-4">{error}</div>}

                <form onSubmit={handleSubmitScore} className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 mb-6">
                        <div className="bg-blue-50 border border-blue-200 p-2 text-center">
                            <p className="text-[9px] font-black text-blue-800 uppercase tracking-widest mb-1">{dictPlayer.TEAM_A_BLUE}</p>
                            <p className="text-[10px] font-bold text-slate-900 leading-tight">
                                {getPlayerName(match.team_a_left_id)}<br/>
                                {getPlayerName(match.team_a_right_id)}
                            </p>
                        </div>
                        <div className="bg-red-50 border border-red-200 p-2 text-center">
                            <p className="text-[9px] font-black text-red-800 uppercase tracking-widest mb-1">{dictPlayer.TEAM_B_RED}</p>
                            <p className="text-[10px] font-bold text-slate-900 leading-tight">
                                {getPlayerName(match.team_b_left_id)}<br/>
                                {getPlayerName(match.team_b_right_id)}
                            </p>
                        </div>
                    </div>

                    <div className="text-center font-black text-[10px] uppercase text-slate-900 mb-4 border-b border-slate-100 pb-4">
                        {getPlayerName(match.team_a_left_id)} / {getPlayerName(match.team_a_right_id)}
                        <span className="block text-[8px] text-slate-400 mt-1 mb-1">{dictPlayer.VS}</span>
                        {getPlayerName(match.team_b_left_id)} / {getPlayerName(match.team_b_right_id)}
                    </div>

                    {[1, 2, 3].map(i => (
                        <div key={i} className={`grid grid-cols-3 gap-4 items-center p-2 ${i === 3 ? 'bg-slate-100' : ''}`}>
                            <input type="number" required={i < 3} min="0" max="7" value={sets[`s${i}A` as keyof typeof sets]} onChange={e => setSets({...sets, [`s${i}A`]: e.target.value})} className="w-full text-center p-2 border border-slate-300 font-black text-sm rounded-sm" placeholder="-" />
                            <div className="text-center text-[9px] font-black uppercase text-slate-400">{dictUi.SET_N.replace('{n}', String(i))}</div>
                            <input type="number" required={i < 3} min="0" max="7" value={sets[`s${i}B` as keyof typeof sets]} onChange={e => setSets({...sets, [`s${i}B`]: e.target.value})} className="w-full text-center p-2 border border-slate-300 font-black text-sm rounded-sm" placeholder="-" />
                        </div>
                    ))}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest py-4 rounded-sm hover:bg-black disabled:opacity-50 mt-4 cursor-pointer"
                    >
                        {submitting
                            ? dictMatch.BUTTON_PROCESSING
                            : (match.is_friendly ? dictMatch.BUTTON_RESOLVE_FRIENDLY : dictMatch.BUTTON_RESOLVE_RANKED)}
                    </button>
                </form>
            </div>
        </main>
    );
}