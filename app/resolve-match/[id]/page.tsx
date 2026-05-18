'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import { calculateRankingUpdates, MatchContext } from '@/lib/matchRules';
import { resolveMatchWithRanking } from '@/actions/match-actions';

interface Player {
    id: number;
    first_name: string;
    last_name: string;
    ranking: number;
    preferred_side: string;
    role: string;
}

interface Match {
    id: string;
    team_a_left_id: number;
    team_a_right_id: number;
    team_b_left_id: number;
    team_b_right_id: number;
    status: string;
}

export default function ResolveMatch() {
    const supabase = createClient();
    const params = useParams();
    const matchId = params.id as string;

    const [match, setMatch] = useState<Match | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Stati per i punteggi numerici dei set
    const [set1A, setSet1A] = useState('');
    const [set1B, setSet1B] = useState('');
    const [set2A, setSet2A] = useState('');
    const [set2B, setSet2B] = useState('');
    const [set3A, setSet3A] = useState('');
    const [set3B, setSet3B] = useState('');

    useEffect(() => {
        async function fetchData() {
            try {
                const { data: matchData } = await supabase.from('matches').select('*').eq('id', matchId).maybeSingle();
                const { data: playersData } = await supabase.from('players').select('*');
                if (matchData) setMatch(matchData);
                if (playersData) setPlayers(playersData);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        if (matchId) fetchData();
    }, [matchId, supabase]);

    const getPlayer = (id: number) => players.find((p) => p.id === id);

    const handleSubmitScore = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!match) return;

        const s1A = parseInt(set1A);
        const s1B = parseInt(set1B);
        const s2A = parseInt(set2A);
        const s2B = parseInt(set2B);

        if (isNaN(s1A) || isNaN(s1B) || isNaN(s2A) || isNaN(s2B)) {
            setError('I primi 2 set sono obbligatori!');
            return;
        }

        // Costruiamo l'array dei set
        const scoreArray = [
            { team_a: s1A, team_b: s1B },
            { team_a: s2A, team_b: s2B }
        ];

        // Aggiungiamo il terzo set solo se compilato
        if (set3A !== '' && set3B !== '') {
            scoreArray.push({ team_a: parseInt(set3A), team_b: parseInt(set3B) });
        }

        // Calcoliamo chi ha vinto più set per determinare il team vincente
        let setsWonA = 0;
        let setsWonB = 0;
        scoreArray.forEach(s => {
            if (s.team_a > s.team_b) setsWonA++;
            else if (s.team_b > s.team_a) setsWonB++;
        });

        if (setsWonA === setsWonB) {
            setError('Pareggio nei set impossibile. Compila il terzo set per decretare il vincitore!');
            return;
        }

        const winningTeam = setsWonA > setsWonB ? 'A' : 'B';

        setLoading(true);
        setError('');

        // Generiamo i contesti per le tue regole di ranking esistenti
        const teamAIds = [match.team_a_left_id, match.team_a_right_id];
        const teamBIds = [match.team_b_left_id, match.team_b_right_id];
        const winnerIds = winningTeam === 'A' ? teamAIds : teamBIds;
        const loserIds = winningTeam === 'A' ? teamBIds : teamAIds;

        const leftPlayers = players.filter(p => p.preferred_side === 'Left').sort((a, b) => b.ranking - a.ranking);
        const rightPlayers = players.filter(p => p.preferred_side === 'Right').sort((a, b) => b.ranking - a.ranking);
        const allPlayersAscending = [...players].sort((a, b) => a.ranking - b.ranking);

        const ctx: MatchContext = {
            winnerIds,
            loserIds,
            kingLeftId: leftPlayers.length > 0 ? leftPlayers[0].id : null,
            kingRightId: rightPlayers.length > 0 ? rightPlayers[0].id : null,
            lastPlaceId: allPlayersAscending.length > 0 ? allPlayersAscending[0].id : null,
        };

        const updates = calculateRankingUpdates(ctx);

        try {
            await resolveMatchWithRanking({
                matchId: match.id,
                score: scoreArray,
                rankingUpdates: updates
            });

            window.location.href = '/';
        } catch (err: any) {
            setError(err.message || 'Errore durante il salvataggio.');
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500 font-medium">Caricamento...</div>;
    if (!match) return <div className="p-8 text-center text-red-500">Partita non trovata.</div>;

    return (
        <main className="min-h-screen p-4 sm:p-8 bg-slate-100 flex flex-col items-center justify-center">
            <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-2xl shadow-md border border-slate-200">
                <h1 className="text-xl font-black text-slate-800 text-center tracking-tight">Referto Gara</h1>
                <p className="text-xs text-slate-400 text-center mb-6 mt-1">Inserisci i punteggi reali dei set disputati.</p>

                {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl mb-5 text-xs font-bold">{error}</div>}

                <form onSubmit={handleSubmitScore} className="space-y-4">

                    {/* Intestazione Squadre */}
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50 py-2 rounded-lg border border-slate-100">
                        <div>Team A (Blu)</div>
                        <div>Set</div>
                        <div>Team B (Rosso)</div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-slate-500 font-semibold mb-4 px-1">
                        <div className="truncate">{getPlayer(match.team_a_left_id)?.first_name} / {getPlayer(match.team_a_right_id)?.first_name}</div>
                        <div></div>
                        <div className="truncate">{getPlayer(match.team_b_left_id)?.first_name} / {getPlayer(match.team_b_right_id)?.first_name}</div>
                    </div>

                    {/* SET 1 */}
                    <div className="grid grid-cols-3 gap-4 items-center bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                        <input
                            type="number"
                            required
                            min="0"
                            max="7"
                            value={set1A}
                            onChange={e => setSet1A(e.target.value)} // 👈 CORRETTO: setSet1A
                            className="w-full text-center text-lg font-mono font-bold p-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:border-indigo-500 focus:outline-none"
                            placeholder="0"
                        />
                        <div className="text-center font-bold text-slate-400 text-[10px] uppercase">Set 1</div>
                        <input
                            type="number"
                            required
                            min="0"
                            max="7"
                            value={set1B}
                            onChange={e => setSet1B(e.target.value)} // 👈 CORRETTO: setSet1B
                            className="w-full text-center text-lg font-mono font-bold p-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:border-indigo-500 focus:outline-none"
                            placeholder="0"
                        />
                    </div>

                    {/* SET 2 */}
                    <div className="grid grid-cols-3 gap-4 items-center bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                        <input
                            type="number"
                            required
                            min="0"
                            max="7"
                            value={set2A}
                            onChange={e => setSet2A(e.target.value)} // 👈 CORRETTO: setSet2A
                            className="w-full text-center text-lg font-mono font-bold p-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:border-indigo-500 focus:outline-none"
                            placeholder="0"
                        />
                        <div className="text-center font-bold text-slate-400 text-[10px] uppercase">Set 2</div>
                        <input
                            type="number"
                            required
                            min="0"
                            max="7"
                            value={set2B}
                            onChange={e => setSet2B(e.target.value)} // 👈 CORRETTO: setSet2B
                            className="w-full text-center text-lg font-mono font-bold p-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:border-indigo-500 focus:outline-none"
                            placeholder="0"
                        />
                    </div>

                    {/* SET 3 (Opzionale) */}
                    <div className="grid grid-cols-3 gap-4 items-center bg-indigo-50/20 p-3 rounded-xl border border-dashed border-indigo-200">
                        <input
                            type="number"
                            min="0"
                            max="7"
                            value={set3A}
                            onChange={e => setSet3A(e.target.value)} // 👈 CORRETTO: setSet3A
                            className="w-full text-center text-lg font-mono font-bold p-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:border-indigo-500 focus:outline-none"
                            placeholder="-"
                        />
                        <div className="text-center font-bold text-indigo-400 text-[9px] uppercase leading-tight">Set 3<br/><span className="text-[8px] font-normal text-slate-400 lowercase">(opzionale)</span></div>
                        <input
                            type="number"
                            min="0"
                            max="7"
                            value={set3B}
                            onChange={e => setSet3B(e.target.value)} // 👈 CORRETTO: setSet3B
                            className="w-full text-center text-lg font-mono font-bold p-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:border-indigo-500 focus:outline-none"
                            placeholder="-"
                        />
                    </div>

                    <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 mt-4 text-sm">
                        {loading ? 'Salvataggio referto...' : 'Invia e Calcola Classifica'}
                    </button>
                </form>
            </div>
        </main>
    );
}
