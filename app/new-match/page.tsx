'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { createPendingMatch } from '@/actions/match-actions';

interface Player {
    id: number;
    first_name: string;
    last_name: string;
    preferred_side: string;
    ranking: number;
}

export default function NewMatch() {
    const supabase = createClient();
    const router = useRouter();
    const [players, setPlayers] = useState<Player[]>([]);

    const [matchDate, setMatchDate] = useState('');
    const [teamALeft, setTeamALeft] = useState('');
    const [teamARight, setTeamARight] = useState('');
    const [teamBLeft, setTeamBLeft] = useState('');
    const [teamBRight, setTeamBRight] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchPlayers() {
            const { data } = await supabase.from('players').select('*').order('first_name');
            if (data) setPlayers(data);
        }
        fetchPlayers();
    }, []);

    // --- LOGICA DI GUARDIA IN TEMPO REALE ---

    // 1. Controlliamo se ci sono doppioni tra i giocatori attualmente selezionati
    const selectedIds = [teamALeft, teamARight, teamBLeft, teamBRight].filter(id => id !== '');
    const hasDuplicates = new Set(selectedIds).size !== selectedIds.length;

    // 2. Controlliamo se la differenza di ranking supera 0.50
    let isRankingDiffInvalid = false;
    const allSelected = selectedIds.length === 4;

    if (allSelected && !hasDuplicates) {
        const selectedRankings = selectedIds.map(id => {
            const player = players.find(p => p.id.toString() === id);
            return player ? player.ranking : 0;
        });

        const maxRanking = Math.max(...selectedRankings);
        const minRanking = Math.min(...selectedRankings);
        if ((maxRanking - minRanking) > 0.50) {
            isRankingDiffInvalid = true;
        }
    }

    // Il form è valido solo se tutti i 4 giocatori sono scelti, zero doppioni e forbice ok
    const isFormValid = allSelected && !hasDuplicates && !isRankingDiffInvalid;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!isFormValid) return; // Blocco di sicurezza extra

        try {
            // Eseguiamo la Server Action passando i dati puliti convertiti in numeri
            await createPendingMatch({
                matchDate: matchDate || null,
                teamALeft: parseInt(teamALeft),
                teamARight: parseInt(teamARight),
                teamBLeft: parseInt(teamBLeft),
                teamBRight: parseInt(teamBRight)
            });

            // Se l'azione (e l'audit log) va a buon fine, torniamo alla Home rinfrescata
            router.push('/');
            router.refresh();
        } catch (insertError: any) {
            setError(insertError.message || 'Errore durante il salvataggio della partita e dell\'audit log.');
            console.error(insertError);
        }
    };

    return (
        <main className="min-h-screen p-8 bg-slate-100 flex flex-col items-center">
            <div className="max-w-2xl w-full bg-white p-8 rounded-lg shadow-md">
                <h1 className="text-3xl font-bold text-slate-800 mb-6 text-center">New Match</h1>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Data della partita */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Match Date (Optional)</label>
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
                            <h3 className="font-bold text-blue-800 mb-4">Team A</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Left Player</label>
                                    <select required value={teamALeft} onChange={(e) => setTeamALeft(e.target.value)} className="w-full border p-2 rounded">
                                        <option value="">Select...</option>
                                        {players.filter(p => p.preferred_side === 'Left').map(p => (
                                            <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.ranking.toFixed(2)})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Right Player</label>
                                    <select required value={teamARight} onChange={(e) => setTeamARight(e.target.value)} className="w-full border p-2 rounded">
                                        <option value="">Select...</option>
                                        {players.filter(p => p.preferred_side === 'Right').map(p => (
                                            <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.ranking.toFixed(2)})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Squadra B */}
                        <div className="bg-red-50 p-4 rounded border border-red-100">
                            <h3 className="font-bold text-red-800 mb-4">Team B</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Left Player</label>
                                    <select required value={teamBLeft} onChange={(e) => setTeamBLeft(e.target.value)} className="w-full border p-2 rounded">
                                        <option value="">Select...</option>
                                        {players.filter(p => p.preferred_side === 'Left').map(p => (
                                            <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.ranking.toFixed(2)})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Right Player</label>
                                    <select required value={teamBRight} onChange={(e) => setTeamBRight(e.target.value)} className="w-full border p-2 rounded">
                                        <option value="">Select...</option>
                                        {players.filter(p => p.preferred_side === 'Right').map(p => (
                                            <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.ranking.toFixed(2)})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* MESSAGGI DI ERRORE DINAMICI */}
                    <div className="min-h-[24px]">
                        {hasDuplicates && (
                            <p className="text-red-600 text-sm font-bold text-center animate-pulse">
                                ⚠️ Errore: Un giocatore non può sdoppiarsi! Rimuovi i duplicati.
                            </p>
                        )}
                        {isRankingDiffInvalid && (
                            <p className="text-orange-500 text-sm font-bold text-center">
                                ⚠️ Attenzione: La differenza di livello supera il limite di 0.50!
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={!isFormValid}
                        className="w-full bg-slate-800 text-white font-bold py-3 rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Create Match
                    </button>
                </form>
            </div>
        </main>
    );
}
