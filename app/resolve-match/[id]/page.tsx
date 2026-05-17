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
    const router = useRouter();
    const params = useParams();
    const matchId = params.id as string;

    const [match, setMatch] = useState<Match | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // 1. Carichiamo la partita e i giocatori
    useEffect(() => {
        async function fetchData() {
            try {
                // 1. Scarichiamo i dati del match singolo usando maybeSingle
                const { data: matchData } = await supabase
                    .from('matches')
                    .select('*')
                    .eq('id', matchId)
                    .maybeSingle();

                // 2. Scarichiamo la lista di tutti i giocatori
                const { data: playersData } = await supabase
                    .from('players')
                    .select('*');

                if (matchData) setMatch(matchData);
                if (playersData) setPlayers(playersData);
            } catch (err) {
                console.error("Errore nel fetch dei dati:", err);
            } finally {
                setLoading(false);
            }
        }

        if (matchId) {
            fetchData();
        }
    }, [matchId, supabase]);

    const getPlayer = (id: number) => players.find((p) => p.id === id);

    // 2. Gestione della risoluzione del match
    const handleResult = async (winningTeam: 'A' | 'B') => {
        if (!match) return;
        setLoading(true);
        setError('');

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
            // Chiamiamo la Server Action passandogli l'ID stringa (UUID)
            await resolveMatchWithRanking({
                matchId: match.id,
                winningTeam: winningTeam,
                rankingUpdates: updates
            });

            // Eseguiamo il reindirizzamento sul client per evitare eccezioni NEXT_REDIRECT
            router.push('/');
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Errore durante la risoluzione del match.');
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Caricamento...</div>;
    if (!match) return <div className="p-8 text-center text-red-500">Partita non trovata.</div>;

    return (
        <main className="min-h-screen p-8 bg-slate-100 flex flex-col items-center">
            <div className="max-w-xl w-full bg-white p-8 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-slate-800 mb-6 text-center">Chi ha vinto al meglio dei 3 set?</h1>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    {/* Pulsante Vittoria Squadra A */}
                    <button
                        onClick={() => handleResult('A')}
                        className="w-full p-6 border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
                    >
                        <h2 className="text-xl font-bold text-blue-800 mb-2 group-hover:scale-105 transition-transform">🏆 Vince Squadra A</h2>
                        <p className="text-sm text-slate-600">
                            {getPlayer(match.team_a_left_id)?.first_name || 'Caricamento...'} e {getPlayer(match.team_a_right_id)?.first_name || 'Caricamento...'}
                        </p>
                    </button>

                    {/* Pulsante Vittoria Squadra B */}
                    <button
                        onClick={() => handleResult('B')}
                        className="w-full p-6 border-2 border-red-200 bg-red-50 hover:bg-red-100 rounded-lg transition-colors group"
                    >
                        <h2 className="text-xl font-bold text-red-800 mb-2 group-hover:scale-105 transition-transform">🏆 Vince Squadra B</h2>
                        <p className="text-sm text-slate-600">
                            {getPlayer(match.team_b_left_id)?.first_name || 'Caricamento...'} e {getPlayer(match.team_b_right_id)?.first_name || 'Caricamento...'}
                        </p>
                    </button>
                </div>
            </div>
        </main>
    );
}
