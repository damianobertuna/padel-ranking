'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { updateMatchPlayers } from '@/actions/match-actions';
import BackToHomeButton from "@/components/BackToHomeButton";
import { Player, Match } from '@/types';

export default function JoinMatchPage() {
    const supabase = createClient();
    const params = useParams();
    const router = useRouter();
    const matchId = params.id as string;

    const [match, setMatch] = useState<Match | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [loadingPage, setLoadingPage] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Selections for empty slots
    const [newALeft, setNewALeft] = useState<number | ''>('');
    const [newARight, setNewARight] = useState<number | ''>('');
    const [newBLeft, setNewBLeft] = useState<number | ''>('');
    const [newBRight, setNewBRight] = useState<number | ''>('');

    const [levelError, setLevelError] = useState(false);
    const [duplicateError, setDuplicateError] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                if (!matchId) return;
                const [matchRes, playersRes] = await Promise.all([
                    supabase.from('matches').select('*').eq('id', matchId).maybeSingle(),
                    // Scarichiamo anche il genere per poter filtrare correttamente i rimpiazzi
                    supabase.from('players').select('id, first_name, last_name, ranking, preferred_side, gender').order('first_name', { ascending: true })
                ]);
                if (matchRes.data) setMatch(matchRes.data);
                if (playersRes.data) setPlayers(playersRes.data);
            } catch (err) {
                console.error(err);
                setError('Errore nel caricamento dei dati necessari per il match.');
            } finally {
                setLoadingPage(false);
            }
        }
        loadData();
    }, [matchId, supabase]);

    useEffect(() => {
        if (!match) return;

        const allCurrentInField = [
            match.team_a_left_id,
            match.team_a_right_id,
            match.team_b_left_id,
            match.team_b_right_id
        ];

        const allNewSelections = [newALeft, newARight, newBLeft, newBRight];

        const totalActiveIds: number[] = [];

        allCurrentInField.forEach(id => { if (id) totalActiveIds.push(id); });
        allNewSelections.forEach(id => { if (typeof id === 'number') totalActiveIds.push(id); });

        if (totalActiveIds.length === 0) {
            setDuplicateError(false);
            setLevelError(false);
            return;
        }

        // --- CONTROLLO DUPLICATI ---
        const hasDuplicates = new Set(totalActiveIds).size !== totalActiveIds.length;
        setDuplicateError(hasDuplicates);

        if (hasDuplicates) {
            setLevelError(false);
            return;
        }

        // --- CONTROLLO LIVELLO MASSIMO (Tolleranza 0.25) ---
        if (totalActiveIds.length < 2) {
            setLevelError(false);
            return;
        }

        const activeRankings = totalActiveIds
            .map(id => players.find(p => p.id === id)?.ranking)
            .filter((ranking): ranking is number => ranking !== undefined);

        if (activeRankings.length >= 2) {
            const maxLevel = Math.max(...activeRankings);
            const minLevel = Math.min(...activeRankings);
            const difference = maxLevel - minLevel;

            if (parseFloat(difference.toFixed(2)) > 0.25) {
                setLevelError(true);
            } else {
                setLevelError(false);
            }
        }
    }, [newALeft, newARight, newBLeft, newBRight, match, players]);

    if (loadingPage) return <div className="min-h-screen flex items-center justify-center bg-slate-100 text-sm font-medium text-slate-500">Caricamento dettagli match...</div>;
    if (!match) return <div className="min-h-screen flex items-center justify-center bg-slate-100 text-sm font-bold text-red-500">Partita non trovata.</div>;

    const occupiedPlayerIds = [
        match.team_a_left_id,
        match.team_a_right_id,
        match.team_b_left_id,
        match.team_b_right_id
    ].filter((id): id is number => id !== null);

    const availablePlayers = players.filter(p => !occupiedPlayerIds.includes(p.id));

    // 👈 AGGIORNATO: Filtro Dinamico per Lato e per GENERE in base al tipo di match salvato
    const availableLeftPlayers = availablePlayers.filter(p => {
        const isCorrectSide = p.preferred_side === 'Left' || p.preferred_side === 'Both';
        if (match.match_type === 'male') return isCorrectSide && p.gender === 'M';
        if (match.match_type === 'female') return isCorrectSide && p.gender === 'F';
        return isCorrectSide; // mixed
    });

    const availableRightPlayers = availablePlayers.filter(p => {
        const isCorrectSide = p.preferred_side === 'Right' || p.preferred_side === 'Both';
        if (match.match_type === 'male') return isCorrectSide && p.gender === 'M';
        if (match.match_type === 'female') return isCorrectSide && p.gender === 'F';
        return isCorrectSide; // mixed
    });

    const getPlayerLabel = (id: number | null) => {
        if (!id) return '';
        const p = players.find(pl => pl.id === id);
        return p ? `${p.first_name} ${p.last_name} (${p.ranking.toFixed(2)})` : 'Giocatore Sconosciuto';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (levelError || duplicateError) return;

        setSubmitting(true);
        setError('');

        // Tipizzazione sicura per eliminare `any`
        const updatedFields: Partial<Record<'team_a_left_id' | 'team_a_right_id' | 'team_b_left_id' | 'team_b_right_id', number>> = {};

        if (newALeft) updatedFields.team_a_left_id = newALeft;
        if (newARight) updatedFields.team_a_right_id = newARight;
        if (newBLeft) updatedFields.team_b_left_id = newBLeft;
        if (newBRight) updatedFields.team_b_right_id = newBRight;

        try {
            const cleanMatchId = params.id as string;
            await updateMatchPlayers(cleanMatchId, updatedFields);
            router.push('/');
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Si è verificato un errore durante il salvataggio della formazione.');
            setSubmitting(false);
        }
    };

    const renderSlotForm = (
        currentId: number | null,
        value: number | '',
        setValue: (v: number | '') => void,
        label: string,
        sideFilteredPlayers: Player[]
    ) => {
        if (currentId) {
            return (
                <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-slate-700 text-sm font-bold">
                    🛡️ {getPlayerLabel(currentId)}
                </div>
            );
        }

        return (
            <select
                value={value}
                // 👈 RISOLTO: Ora usa il parametro dinamico `setValue` invece di settare sempre la sinistra!
                onChange={e => setValue(e.target.value ? parseInt(e.target.value, 10) : '')}
                className="w-full p-2.5 border border-amber-200 rounded-xl bg-amber-50/20 font-medium text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white"
            >
                <option value="">Seleziona Giocatore per {label}</option>
                {sideFilteredPlayers.map(p => (
                    <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.ranking.toFixed(2)})</option>
                ))}
            </select>
        );
    };

    // Label visiva per mostrare chiaramente in quale tipo di match si sta entrando
    const getMatchBadge = () => {
        if (match?.match_type === 'female') return <span className="bg-pink-100 text-pink-700 border-pink-200 border px-2 py-0.5 rounded text-[10px] font-black uppercase">👩 Femminile</span>;
        if (match?.match_type === 'mixed') return <span className="bg-purple-100 text-purple-700 border-purple-200 border px-2 py-0.5 rounded text-[10px] font-black uppercase">🌍 Misto</span>;
        return <span className="bg-blue-100 text-blue-700 border-blue-200 border px-2 py-0.5 rounded text-[10px] font-black uppercase">👨 Maschile</span>;
    };

    return (
        <main className="min-h-screen p-4 sm:p-8 bg-slate-100 flex flex-col items-center justify-center">
            <div className="max-w-2xl w-full bg-white p-6 sm:p-8 rounded-2xl shadow-md border border-slate-200">

                <div className="mb-4">
                    <BackToHomeButton />
                </div>

                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tight">Completa Formazione Match</h1>
                        <p className="text-xs text-slate-400 mt-1">Inserisci i giocatori negli slot liberi evidenziati in arancione.</p>
                    </div>
                    {getMatchBadge()}
                </div>

                {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl mb-5 text-xs font-bold">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* TEAM A CARD */}
                        <div className="bg-blue-50/30 p-5 rounded-2xl border border-blue-100 space-y-4">
                            <h2 className="text-blue-800 font-black text-sm uppercase tracking-wide">Team A (Blu)</h2>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Giocatore Sinistra (SX)</label>
                                {renderSlotForm(match.team_a_left_id, newALeft, setNewALeft, 'Team A Sinistra', availableLeftPlayers)}
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Giocatore Destra (DX)</label>
                                {renderSlotForm(match.team_a_right_id, newARight, setNewARight, 'Team A Destra', availableRightPlayers)}
                            </div>
                        </div>

                        {/* TEAM B CARD */}
                        <div className="bg-rose-50/20 p-5 rounded-2xl border border-rose-100 space-y-4">
                            <h2 className="text-rose-800 font-black text-sm uppercase tracking-wide">Team B (Rosso)</h2>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Giocatore Sinistra (SX)</label>
                                {renderSlotForm(match.team_b_left_id, newBLeft, setNewBLeft, 'Team B Sinistra', availableLeftPlayers)}
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Giocatore Destra (DX)</label>
                                {renderSlotForm(match.team_b_right_id, newBRight, setNewBRight, 'Team B Destra', availableRightPlayers)}
                            </div>
                        </div>

                    </div>

                    {duplicateError && (
                        <div className="flex items-center justify-center space-x-2 p-3 bg-rose-50 border border-rose-200 rounded-xl transition-all">
                            <span className="text-base">❌</span>
                            <p className="text-xs font-black text-rose-700 tracking-tight">
                                Errore: Lo stesso giocatore è inserito in più posizioni contemporaneamente!
                            </p>
                        </div>
                    )}

                    {levelError && (
                        <div className="flex items-center justify-center space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-xl transition-all animate-pulse">
                            <span className="text-base">⚠️</span>
                            <p className="text-xs font-black text-amber-700 tracking-tight">
                                Attenzione: Con questa configurazione la differenza di livello nel match supera il limite di 0.25!
                            </p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting || levelError || duplicateError || (!newALeft && !newARight && !newBLeft && !newBRight)}
                        className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-sm transition-all text-sm flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Salvataggio e aggiornamento convocazioni...</span>
                            </>
                        ) : (
                            'Salva ed Occupa Slot'
                        )}
                    </button>
                </form>
            </div>
        </main>
    );
}
