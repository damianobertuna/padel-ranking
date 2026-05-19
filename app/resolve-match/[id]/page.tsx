'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';
import { calculateRankingUpdates, MatchContext } from '@/lib/matchRules';
import { resolveMatchWithRanking } from '@/actions/match-actions';

interface Player { id: number; first_name: string; last_name: string; ranking: number; preferred_side: string; }
interface Match { id: string; team_a_left_id: number; team_a_right_id: number; team_b_left_id: number; team_b_right_id: number; status: string; }

export default function ResolveMatch() {
    const supabase = createClient();
    const params = useParams();
    const matchId = params.id as string;

    const [match, setMatch] = useState<Match | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [pageLoading, setPageLoading] = useState(true); // 👈 Sdoppiato: Caricamento della pagina iniziale
    const [submitting, setSubmitting] = useState(false); // 👈 Sdoppiato: Caricamento specifico del pulsante Salva
    const [error, setError] = useState('');

    // Stati per i set
    const [set1A, setSet1A] = useState('');
    const [set1B, setSet1B] = useState('');
    const [set2A, setSet2A] = useState('');
    const [set2B, setSet2B] = useState('');
    const [set3A, setSet3A] = useState('');
    const [set3B, setSet3B] = useState('');

    useEffect(() => {
        async function fetchData() {
            try {
                if (!matchId) return;

                // Eseguiamo le chiamate in parallelo per massima velocità
                const [matchRes, playersRes] = await Promise.all([
                    supabase.from('matches').select('*').eq('id', matchId).maybeSingle(),
                    supabase.from('players').select('*')
                ]);

                if (matchRes.data) setMatch(matchRes.data);
                if (playersRes.data) setPlayers(playersRes.data);
            } catch (err) {
                console.error("Errore download dati:", err);
                setError("Impossibile recuperare i dati dal server.");
            } finally {
                setPageLoading(false); // 👈 Spegne in sicurezza lo schermo di attesa
            }
        }
        fetchData();
    }, [matchId, supabase]);

    const getPlayerName = (id: number) => {
        const p = players.find((pl) => pl.id === id);
        return p ? `${p.first_name} ${p.last_name}` : 'Caricamento...'; // 👈 Protezione anti-crash
    };

    const handleSubmitScore = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!match) return;

        const s1A = parseInt(set1A); const s1B = parseInt(set1B);
        const s2A = parseInt(set2A); const s2B = parseInt(set2B);

        if (isNaN(s1A) || isNaN(s1B) || isNaN(s2A) || isNaN(s2B)) {
            setError('I primi 2 set sono obbligatori per convalidare il referto!');
            return;
        }

        const scoreArray = [
            { team_a: s1A, team_b: s1B },
            { team_a: s2A, team_b: s2B }
        ];

        if (set3A !== '' && set3B !== '') {
            scoreArray.push({ team_a: parseInt(set3A), team_b: parseInt(set3B) });
        }

        let setsWonA = 0; let setsWonB = 0;
        scoreArray.forEach(s => {
            if (s.team_a > s.team_b) setsWonA++;
            else if (s.team_b > s.team_a) setsWonB++;
        });

        if (setsWonA === setsWonB) {
            setError('La partita è in pareggio (1-1 nei set). È obbligatorio inserire il punteggio del 3° set per stabilire la coppia vincente!');
            return;
        }

        const finalWinningTeam = setsWonA > setsWonB ? 'A' : 'B';

        setSubmitting(true); // 👈 Attiva solo lo spinner del pulsante invio
        setError('');

        const teamAIds = [match.team_a_left_id, match.team_a_right_id];
        const teamBIds = [match.team_b_left_id, match.team_b_right_id];
        const winnerIds = finalWinningTeam === 'A' ? teamAIds : teamBIds;
        const loserIds = finalWinningTeam === 'A' ? teamBIds : teamAIds;

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
            setError(err.message || 'Errore durante il salvataggio del referto.');
            setSubmitting(false); // 👈 Spegne lo spinner del tasto in caso di errore
        }
    };

    if (pageLoading) return <div className="p-8 text-center text-slate-500 font-medium bg-slate-100 min-h-screen flex items-center justify-center">Caricamento configurazione partita...</div>;
    if (!match) return <div className="p-8 text-center text-red-500 bg-slate-100 min-h-screen flex items-center justify-center">Partita non trovata o ID errato.</div>;

    return (
        <main className="min-h-screen p-4 sm:p-8 bg-slate-100 flex flex-col items-center justify-center">
            <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-2xl shadow-md border border-slate-200">
                <h1 className="text-xl font-black text-slate-800 text-center tracking-tight">Referto Gara</h1>
                <p className="text-xs text-slate-400 text-center mb-6 mt-1">Inserisci i punteggi reali per convalidare il match.</p>

                {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl mb-5 text-xs font-bold">{error}</div>}

                <form onSubmit={handleSubmitScore} className="space-y-4">

                    {/* Intestazione Squadre */}
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50 py-2 rounded-lg border border-slate-100">
                        <div>Team A (Blu)</div>
                        <div>Set</div>
                        <div>Team B (Rosso)</div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-slate-500 font-semibold mb-4 px-1 items-center">
                        <div className="truncate font-bold text-blue-700">{getPlayerName(match.team_a_left_id)}<br/>{getPlayerName(match.team_a_right_id)}</div>
                        <div className="text-slate-300 font-normal">VS</div>
                        <div className="truncate font-bold text-rose-700">{getPlayerName(match.team_b_left_id)}<br/>{getPlayerName(match.team_b_right_id)}</div>
                    </div>

                    {/* SET 1 */}
                    <div className="grid grid-cols-3 gap-4 items-center bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                        <input type="number" required min="0" max="7" value={set1A} onChange={e => setSet1A(e.target.value)} className="w-full text-center text-lg font-mono font-bold p-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:border-indigo-500 focus:outline-none" placeholder="0" />
                        <div className="text-center font-bold text-slate-400 text-[10px] uppercase">Set 1</div>
                        <input type="number" required min="0" max="7" value={set1B} onChange={e => setSet1B(e.target.value)} className="w-full text-center text-lg font-mono font-bold p-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:border-indigo-500 focus:outline-none" placeholder="0" />
                    </div>

                    {/* SET 2 */}
                    <div className="grid grid-cols-3 gap-4 items-center bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                        <input type="number" required min="0" max="7" value={set2A} onChange={e => setSet2A(e.target.value)} className="w-full text-center text-lg font-mono font-bold p-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:border-indigo-500 focus:outline-none" placeholder="0" />
                        <div className="text-center font-bold text-slate-400 text-[10px] uppercase">Set 2</div>
                        <input type="number" required min="0" max="7" value={set2B} onChange={e => setSet2B(e.target.value)} className="w-full text-center text-lg font-mono font-bold p-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:border-indigo-500 focus:outline-none" placeholder="0" />
                    </div>

                    {/* SET 3 */}
                    <div className="grid grid-cols-3 gap-4 items-center bg-indigo-50/20 p-3 rounded-xl border border-dashed border-indigo-200">
                        <input type="number" min="0" max="7" value={set3A} onChange={e => setSet3A(e.target.value)} className="w-full text-center text-lg font-mono font-bold p-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:border-indigo-500 focus:outline-none" placeholder="-" />
                        <div className="text-center font-bold text-indigo-400 text-[9px] uppercase leading-tight">Set 3<br/><span className="text-[8px] font-normal text-slate-400 lowercase">(se 1-1)</span></div>
                        <input type="number" min="0" max="7" value={set3B} onChange={e => setSet3B(e.target.value)} className="w-full text-center text-lg font-mono font-bold p-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:border-indigo-500 focus:outline-none" placeholder="-" />
                    </div>

                    {/* PULSANTE DI SALVATAGGIO CON SPINNER */}
                    <button
                        type="submit"
                        disabled={submitting} // Bloccato solo se sta inviando i dati
                        className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-sm transition-all active:scale-[0.98] mt-6 text-sm flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Elaborazione punti Ranking...</span>
                            </>
                        ) : (
                            'Conferma e Calcola Classifica'
                        )}
                    </button>
                </form>
            </div>
        </main>
    );
}
