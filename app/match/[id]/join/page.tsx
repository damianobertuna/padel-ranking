'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { updateMatchPlayers } from '@/actions/match-actions';
import BackToHomeButton from "@/components/BackToHomeButton";
import { Player, Match, Club } from '@/types'; // Assicurati di avere 'Club' nei types

export default function JoinMatchPage() {
    const supabase = createClient();
    const params = useParams();
    const router = useRouter();
    const matchId = params.id as string;

    const [match, setMatch] = useState<Match | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [clubs, setClubs] = useState<Club[]>([]); // ← NUOVO STATO PER I CLUB
    const [loadingPage, setLoadingPage] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Stati della formazione (inizializzati a vuoto, poi riempiti dal DB)
    const [teamALeft, setTeamALeft] = useState<number | ''>('');
    const [teamARight, setTeamARight] = useState<number | ''>('');
    const [teamBLeft, setTeamBLeft] = useState<number | ''>('');
    const [teamBRight, setTeamBRight] = useState<number | ''>('');
    const [matchType, setMatchType] = useState<'male' | 'female' | 'mixed'>('male');
    const [selectedClub, setSelectedClub] = useState<number | ''>(''); // ← NUOVO STATO SELEZIONE

    const [levelError, setLevelError] = useState(false);
    const [duplicateError, setDuplicateError] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                if (!matchId) return;

                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    router.push('/login');
                    return;
                }

                // Aggiunto il caricamento dei clubs in parallelo
                const [matchRes, playersRes, clubsRes] = await Promise.all([
                    supabase.from('matches').select('*').eq('id', matchId).maybeSingle(),
                    supabase.from('players')
                        .select('id, first_name, last_name, ranking, preferred_side, gender')
                        .order('ranking', { ascending: false })
                        .order('last_name', { ascending: true }),
                    supabase.from('clubs').select('*').order('name', { ascending: true }) // ← CARICAMENTO CLUB
                ]);

                if (matchRes.data) {
                    setMatch(matchRes.data);
                    setTeamALeft(matchRes.data.team_a_left_id || '');
                    setTeamARight(matchRes.data.team_a_right_id || '');
                    setTeamBLeft(matchRes.data.team_b_left_id || '');
                    setTeamBRight(matchRes.data.team_b_right_id || '');
                    setMatchType(matchRes.data.match_type);
                    setSelectedClub(matchRes.data.club_id || ''); // ← IMPOSTA IL CLUB ATTUALE
                }
                if (playersRes.data) setPlayers(playersRes.data);
                if (clubsRes.data) setClubs(clubsRes.data);

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
        const selectedIds = [teamALeft, teamARight, teamBLeft, teamBRight].filter((val): val is number => typeof val === 'number');

        if (selectedIds.length === 0) {
            setDuplicateError(false);
            setLevelError(false);
            return;
        }

        const hasDuplicates = new Set(selectedIds).size !== selectedIds.length;
        setDuplicateError(hasDuplicates);

        if (hasDuplicates) {
            setLevelError(false);
            return;
        }

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

            setLevelError(parseFloat(difference.toFixed(2)) > 0.25);
        }
    }, [teamALeft, teamARight, teamBLeft, teamBRight, players]);

    if (loadingPage) return <div className="min-h-screen flex items-center justify-center bg-slate-100 text-sm font-medium text-slate-500">Caricamento dettagli match...</div>;
    if (!match) return <div className="min-h-screen flex items-center justify-center bg-slate-100 text-sm font-bold text-red-500">Partita non trovata.</div>;

    const availableLeftPlayers = players.filter(p => {
        const isCorrectSide = p.preferred_side === 'Left' || p.preferred_side === 'Both';
        if (matchType === 'male') return isCorrectSide && p.gender === 'M';
        if (matchType === 'female') return isCorrectSide && p.gender === 'F';
        return isCorrectSide;
    });

    const availableRightPlayers = players.filter(p => {
        const isCorrectSide = p.preferred_side === 'Right' || p.preferred_side === 'Both';
        if (matchType === 'male') return isCorrectSide && p.gender === 'M';
        if (matchType === 'female') return isCorrectSide && p.gender === 'F';
        return isCorrectSide;
    });

    const getOptionsForSlot = (currentVal: number | '', sideFiltered: Player[]) => {
        return sideFiltered.filter(p => {
            const occupiedElsewhere = [teamALeft, teamARight, teamBLeft, teamBRight]
                .filter(id => id !== '' && id !== currentVal);
            return !occupiedElsewhere.includes(p.id);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (levelError || duplicateError) return;

        setSubmitting(true);
        setError('');

        try {
            await updateMatchPlayers(matchId, {
                match_type: matchType,
                club_id: selectedClub || null, // ← INVIO DEL CLUB SELEZIONATO
                team_a_left_id: teamALeft || null,
                team_a_right_id: teamARight || null,
                team_b_left_id: teamBLeft || null,
                team_b_right_id: teamBRight || null,
            });
            router.push('/?tab=pending');
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Si è verificato un errore durante il salvataggio della formazione.');
            setSubmitting(false);
        }
    };

    const renderSlotForm = (
        value: number | '',
        setValue: (v: number | '') => void,
        label: string,
        sideFilteredPlayers: Player[]
    ) => {
        return (
            <select
                value={value}
                onChange={e => setValue(e.target.value ? parseInt(e.target.value, 10) : '')}
                className={`w-full p-2.5 border rounded-xl font-medium text-sm focus:outline-none focus:border-indigo-500 transition-colors ${
                    value !== '' ? 'bg-indigo-50 border-indigo-200 text-indigo-900' : 'bg-amber-50/30 border-amber-200 text-slate-800'
                }`}
            >
                <option value="">Nessuno (Slot Libero)</option>
                {getOptionsForSlot(value, sideFilteredPlayers).map(p => (
                    <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.ranking.toFixed(2)})</option>
                ))}
            </select>
        );
    };

    return (
        <main className="min-h-screen p-4 sm:p-8 bg-slate-100 flex flex-col items-center justify-center">
            <div className="max-w-2xl w-full bg-white p-6 sm:p-8 rounded-2xl shadow-md border border-slate-200">

                <div className="mb-4">
                    <BackToHomeButton tab="pending"/>
                </div>

                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tight">Gestisci Partita</h1>
                        <p className="text-xs text-slate-400 mt-1">Puoi modificare la tipologia, il campo da gioco e la formazione.</p>
                    </div>
                </div>

                {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl mb-5 text-xs font-bold">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* SELETTORE CLUB E TIPOLOGIA MATCH */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-5">

                        {/* Selezione Club */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                                📍 Campo da gioco (Club)
                            </label>
                            <select
                                value={selectedClub}
                                onChange={e => setSelectedClub(e.target.value ? parseInt(e.target.value, 10) : '')}
                                className={`w-full p-3 border rounded-xl font-semibold text-sm focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer ${
                                    selectedClub !== '' ? 'bg-white border-slate-300 text-slate-800 shadow-sm' : 'bg-amber-50/30 border-amber-200 text-slate-600'
                                }`}
                            >
                                <option value="" className="text-slate-400 italic">Nessun Club selezionato (Da definire)</option>
                                {clubs.map(club => (
                                    <option key={club.id} value={club.id}>
                                        {club.name} {club.city ? `- ${club.city}` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Cambio Tipologia Match */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                                🎾 Categoria Partita
                            </label>
                            <div className="flex gap-2">
                                {(['male', 'female', 'mixed'] as const).map((type) => {
                                    const labels = { male: '👨 Maschile', female: '👩 Femminile', mixed: '🌍 Misto' };
                                    return (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setMatchType(type)}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all duration-150 ease-out border shadow-sm active:scale-95 [-webkit-tap-highlight-color:transparent] ${
                                                matchType === type
                                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                                            }`}
                                        >
                                            {labels[type]}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* TEAM CARDS... (rimangono invariate) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* TEAM A CARD */}
                        <div className="bg-blue-50/30 p-5 rounded-2xl border border-blue-100 space-y-4">
                            <h2 className="text-blue-800 font-black text-sm uppercase tracking-wide">Team A (Blu)</h2>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Giocatore Sinistra (SX)</label>
                                {renderSlotForm(teamALeft, setTeamALeft, 'Team A SX', availableLeftPlayers)}
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Giocatore Destra (DX)</label>
                                {renderSlotForm(teamARight, setTeamARight, 'Team A DX', availableRightPlayers)}
                            </div>
                        </div>

                        {/* TEAM B CARD */}
                        <div className="bg-rose-50/20 p-5 rounded-2xl border border-rose-100 space-y-4">
                            <h2 className="text-rose-800 font-black text-sm uppercase tracking-wide">Team B (Rosso)</h2>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Giocatore Sinistra (SX)</label>
                                {renderSlotForm(teamBLeft, setTeamBLeft, 'Team B SX', availableLeftPlayers)}
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Giocatore Destra (DX)</label>
                                {renderSlotForm(teamBRight, setTeamBRight, 'Team B DX', availableRightPlayers)}
                            </div>
                        </div>

                    </div>

                    {/* ERROR MESSAGES... */}
                    {duplicateError && (
                        <div className="flex items-center justify-center space-x-2 p-3 bg-rose-50 border border-rose-200 rounded-xl transition-all">
                            <span className="text-base">❌</span>
                            <p className="text-xs font-black text-rose-700 tracking-tight">
                                Errore: Lo stesso giocatore è inserito in più posizioni!
                            </p>
                        </div>
                    )}

                    {levelError && (
                        <div className="flex items-center justify-center space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-xl transition-all animate-pulse">
                            <span className="text-base">⚠️</span>
                            <p className="text-xs font-black text-amber-700 tracking-tight">
                                Attenzione: La differenza di livello supera il limite di 0.25!
                            </p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting || levelError || duplicateError || (!teamALeft && !teamARight && !teamBLeft && !teamBRight)}
                        className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-sm transition-all duration-150 ease-out active:scale-[0.98] text-sm flex items-center justify-center gap-2 [-webkit-tap-highlight-color:transparent]"
                    >
                        {submitting ? 'Salvataggio...' : 'Salva Modifiche Match'}
                    </button>
                </form>
            </div>
        </main>
    );
}
