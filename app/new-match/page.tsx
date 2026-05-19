'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createPendingMatch as createMatch } from '@/actions/match-actions'; // 👈 RISOLTO: Import corretto con alias dinamico

interface Player {
    id: number;
    first_name: string;
    last_name: string;
    ranking: number; // Il livello del giocatore (es. 4.50, 5.05)
}

export default function CreateMatchForm() {
    const supabase = createClient();

    // Stati per i giocatori selezionati nelle tendine
    const [players, setPlayers] = useState<Player[]>([]);
    const [teamALeft, setTeamALeft] = useState<string>('');
    const [teamARight, setTeamARight] = useState<string>('');
    const [teamBLeft, setTeamBLeft] = useState<string>('');
    const [teamBRight, setTeamBRight] = useState<string>('');

    // Stati per la gestione della validazione in tempo reale
    const [levelError, setLevelError] = useState<boolean>(false);
    const [duplicateError, setDuplicateError] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [submitError, setSubmitError] = useState<string>('');

    // Caricamento iniziale dell'anagrafica giocatori da Supabase
    useEffect(() => {
        async function loadPlayers() {
            const { data } = await supabase
                .from('players')
                .select('id, first_name, last_name, ranking')
                .order('first_name', { ascending: true });
            if (data) setPlayers(data);
        }
        loadPlayers();
    }, [supabase]);

    // EFFETTO DI VALIDAZIONE DINAMICA: Controlla cloni e divario tecnico (< 0.25)
    useEffect(() => {
        // 1. Raccogliamo gli ID selezionati filtrando le opzioni vuote
        const selectedIds = [teamALeft, teamARight, teamBLeft, teamBRight]
            .map(id => parseInt(id))
            .filter(id => !isNaN(id));

        // --- CONTROLLO 1: GIOCATORI DUPLICATI (BANNER ROSSO) ---
        const hasDuplicates = new Set(selectedIds).size !== selectedIds.length;
        setDuplicateError(hasDuplicates);

        // Se ci sono cloni in campo, blocchiamo qui i controlli per evitare conflitti visivi
        if (hasDuplicates) {
            setLevelError(false);
            return;
        }

        // --- CONTROLLO 2: TOLLERANZA LIVELLO MASSIMO (BANNER ARANCIONE) ---
        if (selectedIds.length < 2) {
            setLevelError(false);
            return;
        }

        const selectedRankings = selectedIds
            .map(id => players.find(p => p.id === id)?.ranking)
            .filter((ranking): ranking is number => ranking !== undefined);

        if (selectedRankings.length >= 2) {
            const maxLevel = Math.max(...selectedRankings);
            const minLevel = Math.min(...selectedRankings);
            const difference = maxLevel - minLevel;

            // Arrotondiamo a 2 decimali per evitare i bachi matematici dei float in JS
            if (parseFloat(difference.toFixed(2)) > 0.25) {
                setLevelError(true);
            } else {
                setLevelError(false);
            }
        }
    }, [teamALeft, teamARight, teamBLeft, teamBRight, players]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Doppia barriera di sicurezza prima di sparare i dati al server
        if (levelError || duplicateError) return;

        setLoading(true);
        setSubmitError('');

        try {
            // 👈 AGGIORNATO: Ora esegue realmente l'inserimento agganciando l'azione
            await createMatch({
                teamALeft: teamALeft ? parseInt(teamALeft) : null,
                teamARight: teamARight ? parseInt(teamARight) : null,
                teamBLeft: teamBLeft ? parseInt(teamBLeft) : null,
                teamBRight: teamBRight ? parseInt(teamBRight) : null,
                // Il database imposterà automaticamente la data corrente e lo status 'pending'
            });

            // Ritorno pulito alla home alla fine dell'operazione
            window.location.href = '/';
        } catch (err: any) {
            console.error(err);
            setSubmitError(err.message || 'Errore durante la creazione del match.');
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen p-4 sm:p-8 bg-slate-55 flex items-center justify-center">
            <div className="w-full max-w-2xl bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h1 className="text-xl font-black text-slate-800 mb-6">Nuova Partita</h1>

                {submitError && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl mb-5 text-xs font-bold">
                        {submitError}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Griglia dei due Team */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* CARD TEAM A */}
                        <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 flex flex-col space-y-4">
                            <h2 className="text-blue-800 font-black text-base tracking-tight">Team A</h2>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Left Player</label>
                                <select
                                    value={teamALeft}
                                    onChange={e => setTeamALeft(e.target.value)}
                                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-medium text-sm focus:outline-none focus:border-blue-500"
                                >
                                    <option value="">Seleziona Giocatore (Vuoto)</option>
                                    {players.map(p => (
                                        <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.ranking.toFixed(2)})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Right Player</label>
                                <select
                                    value={teamARight}
                                    onChange={e => setTeamARight(e.target.value)}
                                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-medium text-sm focus:outline-none focus:border-blue-500"
                                >
                                    <option value="">Seleziona Giocatore (Vuoto)</option>
                                    {players.map(p => (
                                        <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.ranking.toFixed(2)})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* CARD TEAM B */}
                        <div className="bg-rose-50/40 p-5 rounded-2xl border border-rose-100 flex flex-col space-y-4">
                            <h2 className="text-rose-800 font-black text-base tracking-tight">Team B</h2>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Left Player</label>
                                <select
                                    value={teamBLeft}
                                    onChange={e => setTeamBLeft(e.target.value)}
                                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-medium text-sm focus:outline-none focus:border-rose-500"
                                >
                                    <option value="">Seleziona Giocatore (Vuoto)</option>
                                    {players.map(p => (
                                        <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.ranking.toFixed(2)})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Right Player</label>
                                <select
                                    value={teamBRight}
                                    onChange={e => setTeamBRight(e.target.value)}
                                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-medium text-sm focus:outline-none focus:border-rose-500"
                                >
                                    <option value="">Seleziona Giocatore (Vuoto)</option>
                                    {players.map(p => (
                                        <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.ranking.toFixed(2)})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                    </div>

                    {/* BANNER DI ERRORE DUPLICATI (Rosso - Priorità Alta) */}
                    {duplicateError && (
                        <div className="flex items-center justify-center space-x-2 p-3 bg-rose-50 border border-rose-200 rounded-xl transition-all">
                            <span className="text-base">❌</span>
                            <p className="text-xs font-black text-rose-700 tracking-tight">
                                Errore: Lo stesso giocatore è stato inserito in più posizioni!
                            </p>
                        </div>
                    )}

                    {/* BANNER DI ALERT SCOMPENSO LIVELLO (Arancione) */}
                    {levelError && (
                        <div className="flex items-center justify-center space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-xl transition-all animate-pulse">
                            <span className="text-base">⚠️</span>
                            <p className="text-xs font-black text-amber-700 tracking-tight">
                                Attenzione: La differenza di livello supera il limite di 0.25!
                            </p>
                        </div>
                    )}

                    {/* BOTTONE DI INVIO */}
                    <button
                        type="submit"
                        disabled={levelError || duplicateError || loading}
                        className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-sm active:scale-[0.99] text-sm"
                    >
                        {loading ? 'Creazione in corso...' : 'Crea Partita'}
                    </button>

                </form>
            </div>
        </main>
    );
}
