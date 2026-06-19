'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Player, Club } from '@/types';
import { computeKingAndFanalino } from '@/lib/rankingCalc';

export interface MatchFormData {
    matchDate: string | null;
    matchType: 'male' | 'female' | 'mixed';
    clubId: number | '';
    isFriendly: boolean;
    teamALeft: number | '';
    teamARight: number | '';
    teamBLeft: number | '';
    teamBRight: number | '';
}

interface MatchFormProps {
    title: string;
    submitLabel: string;
    players: Player[];
    clubs: Club[];
    initialData?: Partial<MatchFormData> & { matchTime?: string };
    disabledClubId?: number | null;
    onSubmit: (data: MatchFormData) => Promise<void>;
}

// ============================================================================
// COMPONENTE HELPER: Menu a tendina con barra di ricerca integrata
// ============================================================================
interface SearchableSelectProps {
    value: number | '';
    onChange: (value: number | '') => void;
    options: { value: number; label: string }[];
    placeholder: string;
}

function SearchableSelect({ value, onChange, options, placeholder }: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Chiude la tendina se si clicca fuori
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm(''); // Pulisce la ricerca quando si chiude
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    // Filtro case-insensitive
    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div ref={wrapperRef} className="relative w-full mb-2">
            {/* Pulsante che simula la tendina nativa */}
            <div
                className="w-full p-2 text-[10px] font-bold border border-slate-300 rounded-sm cursor-pointer bg-white flex justify-between items-center"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
                <span className="text-slate-400 text-[8px]">▼</span>
            </div>

            {/* Menu a comparsa con ricerca */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-sm shadow-lg max-h-60 flex flex-col">
                    {/* Barra di ricerca fissa in alto */}
                    <div className="p-2 border-b border-slate-100 sticky top-0 bg-slate-50">
                        <input
                            type="text"
                            className="w-full p-1.5 text-[10px] font-bold text-slate-700 border border-slate-300 rounded-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Cerca nome..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus // Focus immediato appena si apre la tendina
                        />
                    </div>

                    {/* Lista Risultati Scorrevoli */}
                    <div className="overflow-y-auto">
                        <div
                            className="p-2 text-[10px] font-bold text-slate-500 hover:bg-slate-100 cursor-pointer border-b border-slate-100 border-dashed"
                            onClick={() => { onChange(''); setIsOpen(false); setSearchTerm(''); }}
                        >
                            -- DESELEZIONA ({placeholder}) --
                        </div>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(opt => (
                                <div
                                    key={opt.value}
                                    className={`p-2 text-[10px] font-bold cursor-pointer transition-colors ${
                                        value === opt.value
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                                    }`}
                                    onClick={() => { onChange(opt.value); setIsOpen(false); setSearchTerm(''); }}
                                >
                                    {opt.label}
                                </div>
                            ))
                        ) : (
                            <div className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Nessun risultato</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// COMPONENTE PRINCIPALE: MatchForm
// ============================================================================
export default function MatchForm({ title, submitLabel, players, clubs, initialData, disabledClubId, onSubmit }: MatchFormProps) {
        const [matchDate, setMatchDate] = useState<string>(initialData?.matchDate || '');
    const [matchTime, setMatchTime] = useState<string>(initialData?.matchTime || '');
    const [clubId, setClubId] = useState<number | ''>(initialData?.clubId ?? (disabledClubId ?? ''));
    const [matchType, setMatchType] = useState<'male' | 'female' | 'mixed'>(initialData?.matchType || 'male');
    const [isFriendly, setIsFriendly] = useState<boolean>(initialData?.isFriendly || false);

    const [teamALeft, setTeamALeft] = useState<number | ''>(initialData?.teamALeft || '');
    const [teamARight, setTeamARight] = useState<number | ''>(initialData?.teamARight || '');
    const [teamBLeft, setTeamBLeft] = useState<number | ''>(initialData?.teamBLeft || '');
    const [teamBRight, setTeamBRight] = useState<number | ''>(initialData?.teamBRight || '');

    const [levelError, setLevelError] = useState(false);
    const [duplicateError, setDuplicateError] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const translateSide: Record<string, string> = { Left: 'SX', Right: 'DX', Both: 'MIX' };

    useEffect(() => {
        if (!initialData?.matchDate) {
            const now = new Date();
            const tzOffsetMs = now.getTimezoneOffset() * 60000;
            const localISO = new Date(now.getTime() - tzOffsetMs).toISOString();
            setMatchDate(localISO.slice(0, 10));
            setMatchTime(localISO.slice(11, 16));
        }
    }, [initialData]);

    useEffect(() => {
        const ids = [teamALeft, teamARight, teamBLeft, teamBRight].filter((v): v is number => typeof v === 'number');
        setDuplicateError(new Set(ids).size !== ids.length);

        if (ids.length < 2 || isFriendly) {
            setLevelError(false);
            return;
        }

        const rks = ids.map(id => players.find(p => p.id === id)?.ranking).filter((r): r is number => r !== undefined);
        setLevelError(Math.max(...rks) - Math.min(...rks) > 0.25);
    }, [teamALeft, teamARight, teamBLeft, teamBRight, players, isFriendly]);

    const playerTitlesMap = useMemo(() => {
        if (!players || players.length === 0) return {};
        const { kingLeftIds, kingRightIds, kingBothIds, lastPlaceLeftIds, lastPlaceRightIds, lastPlaceBothIds } = computeKingAndFanalino(players);
        const map: Record<number, { label: string }> = {};
        kingLeftIds.forEach(id => map[id] = { label: '👑 KING SX' });
        kingRightIds.forEach(id => map[id] = { label: '👑 KING DX' });
        kingBothIds.forEach(id => map[id] = { label: '👑 KING MIX' });
        lastPlaceLeftIds.forEach(id => map[id] = { label: '🐢 FAN SX' });
        lastPlaceRightIds.forEach(id => map[id] = { label: '🐢 FAN DX' });
        lastPlaceBothIds.forEach(id => map[id] = { label: '🐢 FAN MIX' });
        return map;
    }, [players]);

    const currentALeftPlayer = players.find(p => p.id === teamALeft);
    const currentARightPlayer = players.find(p => p.id === teamARight);
    const currentBLeftPlayer = players.find(p => p.id === teamBLeft);
    const currentBRightPlayer = players.find(p => p.id === teamBRight);

    const satisfiesGender = (p: Player) => matchType === 'mixed' || (matchType === 'male' ? p.gender === 'M' : p.gender === 'F');

    const isLeftAllowed = (p: Player, partner: Player | undefined) => {
        if (!satisfiesGender(p)) return false;
        if (p.preferred_side === 'Left' || p.preferred_side === 'Both') return true;
        if (partner?.preferred_side === 'Both') return true;
        return false;
    };

    const isRightAllowed = (p: Player, partner: Player | undefined) => {
        if (!satisfiesGender(p)) return false;
        if (p.preferred_side === 'Right' || p.preferred_side === 'Both') return true;
        if (partner?.preferred_side === 'Both') return true;
        return false;
    };

    // Helper per convertire un array di player nel formato richiesto da SearchableSelect
    const formatPlayerOptions = (filteredPlayers: Player[]) => {
        return filteredPlayers.map(p => ({
            value: p.id,
            label: `[${translateSide[p.preferred_side] || p.preferred_side}] ${p.last_name} ${p.first_name} — ${p.ranking.toFixed(2)}${playerTitlesMap[p.id] ? ` ${playerTitlesMap[p.id].label}` : ''}`
        }));
    };

    const clubOptions = clubs.map(c => ({
        value: c.id,
        label: `${c.name} ${c.city ? `(${c.city})` : ''}`
    }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            let combinedDate = null;
            if (matchDate && matchTime) combinedDate = new Date(`${matchDate}T${matchTime}:00`).toISOString();

            await onSubmit({ matchDate: combinedDate, matchType, clubId, isFriendly, teamALeft, teamARight, teamBLeft, teamBRight });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-white border border-slate-200 shadow-sm p-6 sm:p-8 rounded-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-8">
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{title}</h1>

                {isFriendly ? (
                    <span className="self-start sm:self-center bg-purple-100 text-purple-800 text-[9px] font-black px-3 py-1 rounded-sm uppercase tracking-wider border border-purple-200 shadow-sm">
                        🤝 Regolamento Amichevole
                    </span>
                ) : (
                    <span className="self-start sm:self-center bg-blue-100 text-blue-800 text-[9px] font-black px-3 py-1 rounded-sm uppercase tracking-wider border border-blue-200 shadow-sm">
                        🔥 Regolamento Classificato
                    </span>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Data Match</label>
                        <input type="date" required value={matchDate} onChange={e => setMatchDate(e.target.value)} className="w-full p-2 border border-slate-300 text-[10px] font-black uppercase rounded-sm outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Orario</label>
                        <input type="time" required value={matchTime} onChange={e => setMatchTime(e.target.value)} className="w-full p-2 border border-slate-300 text-[10px] font-black uppercase rounded-sm outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="relative">
                        <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Circolo</label>
                        {disabledClubId ? (
                            <div className="w-full p-2 text-[10px] font-bold border border-slate-300 rounded-sm bg-slate-100 text-slate-600 flex items-center">
                                {clubs.find(c => c.id === disabledClubId)?.name ?? 'Circolo assegnato'}
                                <span className="ml-auto text-[8px] text-slate-400 uppercase tracking-wider">Bloccato</span>
                            </div>
                        ) : (
                            <SearchableSelect
                                value={clubId}
                                onChange={setClubId}
                                options={clubOptions}
                                placeholder="NESSUN CIRCOLO DEFINITO"
                            />
                        )}
                    </div>
                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Tipo Partita</label>
                        <div className="flex bg-slate-100 p-1 rounded-sm gap-1 h-[34px]">
                            {(['male', 'female', 'mixed'] as const).map(type => {
                                const labels = { male: 'MASCHILE', female: 'FEMMINILE', mixed: 'MISTO' };
                                return (
                                    <button key={type} type="button" onClick={() => { setMatchType(type); setTeamALeft(''); setTeamARight(''); setTeamBLeft(''); setTeamBRight(''); }} className={`flex-1 text-[9px] font-black uppercase tracking-widest transition-colors flex items-center justify-center ${matchType === type ? 'bg-slate-900 text-white rounded-sm shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
                                        {labels[type]}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3 rounded-sm space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Regolamento</label>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-black uppercase tracking-wider">
                        <button type="button" onClick={() => setIsFriendly(false)} className={`py-2.5 rounded-sm border transition-all flex flex-col items-center gap-0.5 ${!isFriendly ? 'bg-blue-600 border-blue-700 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                            <span>🔥 Classificata</span><span className={`text-[8px] font-medium normal-case tracking-normal ${!isFriendly ? 'text-blue-100' : 'text-slate-400'}`}>Incide sull'Elo</span>
                        </button>
                        <button type="button" onClick={() => setIsFriendly(true)} className={`py-2.5 rounded-sm border transition-all flex flex-col items-center gap-0.5 ${isFriendly ? 'bg-purple-600 border-purple-700 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                            <span>🤝 Amichevole</span><span className={`text-[8px] font-medium normal-case tracking-normal ${isFriendly ? 'text-purple-100' : 'text-slate-400'}`}>Nessun vincolo</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { label: 'TEAM A', team: [teamALeft, teamARight], setters: [setTeamALeft, setTeamARight], border: 'border-blue-600', compagni: [currentARightPlayer, currentALeftPlayer] },
                        { label: 'TEAM B', team: [teamBLeft, teamBRight], setters: [setTeamBLeft, setTeamBRight], border: 'border-red-600', compagni: [currentBRightPlayer, currentBLeftPlayer] }
                    ].map((t, i) => {
                        // Prepariamo le opzioni per la riga corrente
                        const validLeftPlayers = players.filter(p => isLeftAllowed(p, t.compagni[0]) && (p.id === t.team[0] || ![teamALeft, teamARight, teamBLeft, teamBRight].includes(p.id)));
                        const validRightPlayers = players.filter(p => isRightAllowed(p, t.compagni[1]) && (p.id === t.team[1] || ![teamALeft, teamARight, teamBLeft, teamBRight].includes(p.id)));

                        return (
                            <div key={i} className={`p-4 border-t-4 ${t.border} bg-slate-50 rounded-sm`}>
                                <h2 className="text-[9px] font-black uppercase tracking-widest mb-3">{t.label}</h2>

                                <SearchableSelect
                                    value={t.team[0]}
                                    onChange={t.setters[0]}
                                    options={formatPlayerOptions(validLeftPlayers)}
                                    placeholder="GIOCATORE SX"
                                />

                                <SearchableSelect
                                    value={t.team[1]}
                                    onChange={t.setters[1]}
                                    options={formatPlayerOptions(validRightPlayers)}
                                    placeholder="GIOCATORE DX"
                                />
                            </div>
                        );
                    })}
                </div>

                {duplicateError && <div className="p-3 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded-sm">ERRORE: GIOCATORE DUPLICATO.</div>}
                {levelError && <div className="p-3 bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest rounded-sm">ERRORE: DIVARIO TECNICO &gt; 0.25.</div>}

                <button type="submit" disabled={submitting || duplicateError || levelError} className="w-full bg-slate-900 text-white font-black text-xs uppercase tracking-widest py-4 rounded-sm hover:bg-black disabled:opacity-50 transition-colors">
                    {submitting ? 'ATTENDI...' : submitLabel}
                </button>
            </form>
        </div>
    );
}
