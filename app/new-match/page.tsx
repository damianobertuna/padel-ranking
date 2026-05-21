'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createPendingMatch as createMatch } from '@/actions/match-actions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Player } from '@/types';

export default function CreateMatchForm() {
    const supabase = createClient();
    const router = useRouter();

    // Stati per i giocatori selezionati nelle tendine (stringhe provenienti dai tag <select>)
    const [players, setPlayers] = useState<Player[]>([]);
    const [teamALeft, setTeamALeft] = useState<number | ''>('');
    const [teamARight, setTeamARight] = useState<number | ''>('');
    const [teamBLeft, setTeamBLeft] = useState<number | ''>('');
    const [teamBRight, setTeamBRight] = useState<number | ''>('');

    // Stato per la gestione di data e ora del match
    const [matchDate, setMatchDate] = useState<string>(() => {
        const now = new Date();
        const tzOffset = now.getTimezoneOffset() * 60000;
        return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
    });

    // Stati per la gestione della validazione in tempo reale
    const [levelError, setLevelError] = useState<boolean>(false);
    const [duplicateError, setDuplicateError] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [submitError, setSubmitError] = useState<string>('');

    // Caricamento iniziale dell'anagrafica giocatori da Supabase
    useEffect(() => {
        async function loadPlayers() {
            try {
                const { data, error } = await supabase
                    .from('players')
                    .select('id, first_name, last_name, ranking, preferred_side')
                    .order('first_name', { ascending: true });

                if (error) {
                    console.error("❌ Errore Supabase:", error.message);
                    setSubmitError(`Impossibile caricare i giocatori: ${error.message}`);
                    return;
                }
                if (data) setPlayers(data);
            } catch (err) {
                console.error("💥 Errore imprevisto:", err);
            }
        }
        loadPlayers();
    }, [supabase]);

    // EFFETTO DI VALIDAZIONE DINAMICA: Controlla cloni e divario tecnico (< 0.25)
    useEffect(() => {
        // 1. Convertiamo in numero SOLO gli slot effettivamente compilati (evitando NaN)
        const selectedIds = [teamALeft, teamARight, teamBLeft, teamBRight]
            .filter((val): val is number => typeof val === 'number');

        // --- CONTROLLO 1: ALMENO UN GIOCATORE ---
        if (selectedIds.length === 0) {
            setLevelError(false);
            setDuplicateError(false);
            return;
        }

        // --- CONTROLLO 2: GIOCATORI DUPLICATI (BANNER ROSSO) ---
        const hasDuplicates = new Set(selectedIds).size !== selectedIds.length;
        setDuplicateError(hasDuplicates);

        if (hasDuplicates) {
            setLevelError(false);
            return;
        }

        // --- CONTROLLO 3: TOLLERANZA LIVELLO MASSIMO (BANNER ARANCIONE) ---
        if (selectedIds.length < 2) {
            setLevelError(false);
            return;
        }

        // Adesso confrontiamo i numeri puri in modo sicuro (number === number)
        const selectedRankings = selectedIds
            .map(id => players.find(p => p.id === id)?.ranking)
            .filter((ranking): ranking is number => ranking !== undefined);

        if (selectedRankings.length >= 2) {
            const maxLevel = Math.max(...selectedRankings);
            const minLevel = Math.min(...selectedRankings);
            const difference = maxLevel - minLevel;

            if (parseFloat(difference.toFixed(2)) > 0.25) {
                setLevelError(true);
            } else {
                setLevelError(false);
            }
        }
    }, [teamALeft, teamARight, teamBLeft, teamBRight, players]);

    // Filtri dinamici per dividere i giocatori in base al lato di campo preferito
    const leftSidePlayers = players.filter(p => p.preferred_side === 'Left' || p.preferred_side === 'Both');
    const rightSidePlayers = players.filter(p => p.preferred_side === 'Right' || p.preferred_side === 'Both');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (levelError || duplicateError) return;

        setLoading(true);
        setSubmitError('');

        try {
            // Inviamo i numeri interi puliti al server action (oppure null se lasciati vuoti)
            await createMatch({
                matchDate: matchDate,
                teamALeft: teamALeft || null,
                teamARight: teamARight || null,
                teamBLeft: teamBLeft || null,
                teamBRight: teamBRight || null,
            });

            router.push('/');
            router.refresh();
        } catch (err: any) {
            console.error(err);
            setSubmitError(err.message || 'Errore durante la creazione del match.');
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen p-4 sm:p-8 bg-slate-50 flex flex-col items-center justify-center">
            <div className="w-full max-w-2xl bg-white p-6 rounded-2xl shadow-sm border border-slate-200">

                <div className="mb-4">
                    <Link href="/" className="text-xs font-bold text-indigo-600 hover:underline">
                        ← Torna alla Classifica
                    </Link>
                </div>

                <h1 className="text-xl font-black text-slate-800 mb-6">Nuova Partita</h1>

                {submitError && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl mb-5 text-xs font-bold">
                        {submitError}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* SELEZIONE DATA E ORA MATCH */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Data e Ora della Partita
                        </label>
                        <input
                            type="datetime-local"
                            required
                            value={matchDate}
                            onChange={e => setMatchDate(e.target.value)}
                            className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-medium text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                        />
                    </div>

                    {/* Griglia dei due Team */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* CARD TEAM A */}
                        <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 flex flex-col space-y-4">
                            <h2 className="text-blue-800 font-black text-base tracking-tight">Team A</h2>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Left Player (SX)</label>
                                <select
                                    value={teamALeft}
                                    onChange={e => setTeamALeft(e.target.value ? parseInt(e.target.value, 10) : '')}
                                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-medium text-sm focus:outline-none focus:border-blue-500"
                                >
                                    <option value="">Seleziona Giocatore (Vuoto)</option>
                                    {leftSidePlayers.map(p => (
                                        <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.ranking.toFixed(2)})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Right Player (DX)</label>
                                <select
                                    value={teamARight}
                                    onChange={e => setTeamARight(e.target.value ? parseInt(e.target.value, 10) : '')}
                                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-medium text-sm focus:outline-none focus:border-blue-500"
                                >
                                    <option value="">Seleziona Giocatore (Vuoto)</option>
                                    {rightSidePlayers.map(p => (
                                        <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.ranking.toFixed(2)})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* CARD TEAM B */}
                        <div className="bg-rose-50/40 p-5 rounded-2xl border border-rose-100 flex flex-col space-y-4">
                            <h2 className="text-rose-800 font-black text-base tracking-tight">Team B</h2>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Left Player (SX)</label>
                                <select
                                    value={teamBLeft}
                                    onChange={e => setTeamBLeft(e.target.value ? parseInt(e.target.value, 10) : '')}
                                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-medium text-sm focus:outline-none focus:border-rose-500"
                                >
                                    <option value="">Seleziona Giocatore (Vuoto)</option>
                                    {leftSidePlayers.map(p => (
                                        <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.ranking.toFixed(2)})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Right Player (DX)</label>
                                <select
                                    value={teamBRight}
                                    onChange={e => setTeamBRight(e.target.value ? parseInt(e.target.value, 10) : '')}
                                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-medium text-sm focus:outline-none focus:border-rose-500"
                                >
                                    <option value="">Seleziona Giocatore (Vuoto)</option>
                                    {rightSidePlayers.map(p => (
                                        <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.ranking.toFixed(2)})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                    </div>

                    {/* BANNER DI ERRORE DUPLICATI */}
                    {duplicateError && (
                        <div className="flex items-center justify-center space-x-2 p-3 bg-rose-50 border border-rose-200 rounded-xl transition-all">
                            <span className="text-base">❌</span>
                            <p className="text-xs font-black text-rose-700 tracking-tight">
                                Errore: Lo stesso giocatore è stato inserito in più posizioni!
                            </p>
                        </div>
                    )}

                    {/* BANNER DI ALERT SCOMPENSO LIVELLO */}
                    {levelError && (
                        <div className="flex items-center justify-center space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-xl transition-all animate-pulse">
                            <span className="text-base">⚠️</span>
                            <p className="text-xs font-black text-amber-700 tracking-tight">
                                Attenzione: La differenza di livello supera il limite di 0.25!
                            </p>
                        </div>
                    )}

                    {/* BOTTONE DI INVIO CON SPINNER REATTIVO */}
                    <button
                        type="submit"
                        disabled={levelError || duplicateError || loading || (!teamALeft && !teamARight && !teamBLeft && !teamBRight)}
                        className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-sm active:scale-[0.99] text-sm flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Creazione in corso...</span>
                            </>
                        ) : (
                            'Crea Partita'
                        )}
                    </button>

                </form>
            </div>
        </main>
    );
}
