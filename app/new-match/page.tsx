'use client'; // Questo dice a Next.js che il componente deve essere interattivo sul browser

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface Player {
    id: number;
    first_name: string;
    last_name: string;
    preferred_side: string;
    ranking: number;
}

export default function NewMatch() {
    const router = useRouter();
    const [players, setPlayers] = useState<Player[]>([]);

    // Stati per le selezioni del form
    const [matchDate, setMatchDate] = useState('');
    const [teamALeft, setTeamALeft] = useState('');
    const [teamARight, setTeamARight] = useState('');
    const [teamBLeft, setTeamBLeft] = useState('');
    const [teamBRight, setTeamBRight] = useState('');
    const [error, setError] = useState('');

    // 1. Scarichiamo i giocatori all'avvio della pagina
    useEffect(() => {
        async function fetchPlayers() {
            const { data } = await supabase.from('players').select('*').order('first_name');
            if (data) setPlayers(data);
        }
        fetchPlayers();
    }, []);

    // 2. Controllo della Regola 2 (Forbice di ±0.25)
    // Questo significa che la differenza tra il giocatore col ranking più alto
    // e quello col ranking più basso non può superare 0.50.
    const isMatchValid = () => {
        const selectedIds = [teamALeft, teamARight, teamBLeft, teamBRight];
        // Se non ha ancora selezionato tutti e 4 i giocatori, nascondiamo l'errore
        if (selectedIds.includes('')) return true;

        // Troviamo i ranking dei 4 giocatori selezionati
        const selectedRankings = selectedIds.map(id => {
            const player = players.find(p => p.id.toString() === id);
            return player ? player.ranking : 0;
        });

        const maxRanking = Math.max(...selectedRankings);
        const minRanking = Math.min(...selectedRankings);

        return (maxRanking - minRanking) <= 0.50;
    };

    // 3. Funzione di salvataggio
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!isMatchValid()) {
            setError('I giocatori selezionati non rispettano la regola della forbice di ±0.25!');
            return;
        }

        // Assicuriamoci che un giocatore non sia selezionato due volte
        const uniquePlayers = new Set([teamALeft, teamARight, teamBLeft, teamBRight]);
        if (uniquePlayers.size < 4) {
            setError('Un giocatore non può essere inserito più di una volta nella stessa partita!');
            return;
        }

        const { error: insertError } = await supabase.from('matches').insert([
            {
                match_date: matchDate || null, // Se vuoto salva null
                team_a_left_id: parseInt(teamALeft),
                team_a_right_id: parseInt(teamARight),
                team_b_left_id: parseInt(teamBLeft),
                team_b_right_id: parseInt(teamBRight),
                status: 'pending'
            }
        ]);

        if (insertError) {
            setError('Errore durante il salvataggio della partita.');
            console.error(insertError);
        } else {
            // Se va tutto bene, riportiamo l'utente alla home
            router.push('/');
        }
    };

    return (
        <main className="min-h-screen p-8 bg-slate-100 flex flex-col items-center">
            <div className="max-w-2xl w-full bg-white p-8 rounded-lg shadow-md">
                <h1 className="text-3xl font-bold text-slate-800 mb-6 text-center">Crea Nuova Partita</h1>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Data della partita */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Data e Ora (Opzionale)</label>
                        <input
                            type="datetime-local"
                            value={matchDate}
                            onChange={(e) => setMatchDate(e.target.value)}
                            className="w-full border border-slate-300 rounded p-2"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Squadra A */}
                        <div className="bg-blue-50 p-4 rounded border border-blue-100">
                            <h3 className="font-bold text-blue-800 mb-4">Squadra A</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Giocatore Sinistra (Sx)</label>
                                    <select required value={teamALeft} onChange={(e) => setTeamALeft(e.target.value)} className="w-full border p-2 rounded">
                                        <option value="">Seleziona...</option>
                                        {players.filter(p => p.preferred_side === 'Left').map(p => (
                                            <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.ranking.toFixed(2)})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Giocatore Destra (Dx)</label>
                                    <select required value={teamARight} onChange={(e) => setTeamARight(e.target.value)} className="w-full border p-2 rounded">
                                        <option value="">Seleziona...</option>
                                        {players.filter(p => p.preferred_side === 'Right').map(p => (
                                            <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.ranking.toFixed(2)})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Squadra B */}
                        <div className="bg-red-50 p-4 rounded border border-red-100">
                            <h3 className="font-bold text-red-800 mb-4">Squadra B</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Giocatore Sinistra (Sx)</label>
                                    <select required value={teamBLeft} onChange={(e) => setTeamBLeft(e.target.value)} className="w-full border p-2 rounded">
                                        <option value="">Seleziona...</option>
                                        {players.filter(p => p.preferred_side === 'Left').map(p => (
                                            <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.ranking.toFixed(2)})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Giocatore Destra (Dx)</label>
                                    <select required value={teamBRight} onChange={(e) => setTeamBRight(e.target.value)} className="w-full border p-2 rounded">
                                        <option value="">Seleziona...</option>
                                        {players.filter(p => p.preferred_side === 'Right').map(p => (
                                            <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.ranking.toFixed(2)})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Alert Regola 2 Dinamico */}
                    {!isMatchValid() && (
                        <p className="text-red-500 text-sm font-bold text-center">
                            ⚠️ Attenzione: La differenza di livello supera il limite di 0.50!
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={!isMatchValid()}
                        className="w-full bg-slate-800 text-white font-bold py-3 rounded hover:bg-slate-700 disabled:opacity-50 transition-colors"
                    >
                        Crea Partita
                    </button>
                </form>
            </div>
        </main>
    );
}
