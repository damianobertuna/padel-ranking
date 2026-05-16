'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';

interface Player {
    id: number;
    first_name: string;
    last_name: string;
    ranking: number;
}

interface Match {
    id: string;
    team_a_left_id: number;
    team_a_right_id: number;
    team_b_left_id: number;
    team_b_right_id: number;
}

export default function ResolveMatch() {
    const router = useRouter();
    const params = useParams();
    const matchId = params.id as string;

    const [match, setMatch] = useState<Match | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);

    // 1. Carichiamo la partita e tutti i giocatori
    useEffect(() => {
        async function fetchData() {
            const { data: matchData } = await supabase.from('matches').select('*').eq('id', matchId).single();
            const { data: playersData } = await supabase.from('players').select('*');

            if (matchData) setMatch(matchData);
            if (playersData) setPlayers(playersData);
            setLoading(false);
        }
        fetchData();
    }, [matchId]);

    // Helper per trovare i dati di un giocatore
    const getPlayer = (id: number) => players.find((p) => p.id === id);

    // 2. Il Motore di aggiornamento (Per ora logica base ±0.05)
    // 2. Il Motore di aggiornamento Avanzato
    const handleResult = async (winningTeam: 'A' | 'B') => {
        if (!match) return;
        setLoading(true);

        const teamAIds = [match.team_a_left_id, match.team_a_right_id];
        const teamBIds = [match.team_b_left_id, match.team_b_right_id];

        const winnerIds = winningTeam === 'A' ? teamAIds : teamBIds;
        const loserIds = winningTeam === 'A' ? teamBIds : teamAIds;

        // --- TROVIAMO I KING E L'ULTIMO IN CLASSIFICA ---
        const leftPlayers = players.filter(p => p.preferred_side === 'Left').sort((a, b) => b.ranking - a.ranking);
        const rightPlayers = players.filter(p => p.preferred_side === 'Right').sort((a, b) => b.ranking - a.ranking);
        const allPlayersAscending = [...players].sort((a, b) => a.ranking - b.ranking);

        const kingLeftId = leftPlayers.length > 0 ? leftPlayers[0].id : null;
        const kingRightId = rightPlayers.length > 0 ? rightPlayers[0].id : null;
        const lastPlaceId = allPlayersAscending.length > 0 ? allPlayersAscending[0].id : null;

        // --- CALCOLIAMO I BONUS/MALUS (Regole 6, 7 e 9) ---
        let winnerBonus = 0.05; // Base

        // Malus personalizzati in caso i King giochino insieme e perdano
        let loserMalusMap: Record<number, number> = {
            [loserIds[0]]: -0.05,
            [loserIds[1]]: -0.05
        };

        const hasLastPlaceWon = winnerIds.includes(lastPlaceId as number);
        const hasKingLeftLost = loserIds.includes(kingLeftId as number);
        const hasKingRightLost = loserIds.includes(kingRightId as number);

        // Regola 7: Se l'ultimo vince, doppio punteggio ai vincitori (+0.10)
        if (hasLastPlaceWon) {
            winnerBonus = 0.10;
        }

        // Regola 6: Se cade un King, doppio punteggio ai vincitori (+0.10)
        if (hasKingLeftLost || hasKingRightLost) {
            winnerBonus = 0.10; // Il tetto massimo rimane 0.10 (Regola 9)

            // Se entrambi i King perdono giocando INSIEME
            if (hasKingLeftLost && hasKingRightLost) {
                loserMalusMap[kingLeftId as number] = -0.10;
                loserMalusMap[kingRightId as number] = -0.10;
            }
        }

        // --- SALVIAMO SUL DATABASE ---
        // A. Aggiorniamo i Vincitori
        for (const id of winnerIds) {
            const p = getPlayer(id);
            if (p) await supabase.from('players').update({ ranking: p.ranking + winnerBonus }).eq('id', id);
        }

        // B. Aggiorniamo i Perdenti
        for (const id of loserIds) {
            const p = getPlayer(id);
            if (p) await supabase.from('players').update({ ranking: p.ranking + loserMalusMap[id] }).eq('id', id);
        }

        // C. Chiudiamo la partita
        await supabase.from('matches').update({
            status: 'completed',
            winning_team: winningTeam
        }).eq('id', match.id);

        router.push('/');
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Caricamento...</div>;
    if (!match) return <div className="p-8 text-center text-red-500">Partita non trovata.</div>;

    return (
        <main className="min-h-screen p-8 bg-slate-100 flex flex-col items-center">
            <div className="max-w-xl w-full bg-white p-8 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-slate-800 mb-6 text-center">Chi ha vinto al meglio dei 3 set?</h1>

                <div className="space-y-4">
                    {/* Pulsante Vittoria Squadra A */}
                    <button
                        onClick={() => handleResult('A')}
                        className="w-full p-6 border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
                    >
                        <h2 className="text-xl font-bold text-blue-800 mb-2 group-hover:scale-105 transition-transform">🏆 Vince Squadra A</h2>
                        <p className="text-sm text-slate-600">
                            {getPlayer(match.team_a_left_id)?.first_name} e {getPlayer(match.team_a_right_id)?.first_name}
                        </p>
                    </button>

                    {/* Pulsante Vittoria Squadra B */}
                    <button
                        onClick={() => handleResult('B')}
                        className="w-full p-6 border-2 border-red-200 bg-red-50 hover:bg-red-100 rounded-lg transition-colors group"
                    >
                        <h2 className="text-xl font-bold text-red-800 mb-2 group-hover:scale-105 transition-transform">🏆 Vince Squadra B</h2>
                        <p className="text-sm text-slate-600">
                            {getPlayer(match.team_b_left_id)?.first_name} e {getPlayer(match.team_b_right_id)?.first_name}
                        </p>
                    </button>
                </div>
            </div>
        </main>
    );
}
