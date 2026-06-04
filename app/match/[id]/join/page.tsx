'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { updateMatchPlayers } from '@/actions/match-actions';
import BackToHomeButton from '@/components/BackToHomeButton';
import { Player, Club } from '@/types';
import { computeKingAndFanalino } from '@/lib/rankingCalc';

export default function JoinMatchPage() {
    const supabase = createClient();
    const params = useParams();
    const router = useRouter();
    const matchId = params.id as string;

    const [players, setPlayers] = useState<Player[]>([]);
    const [clubs, setClubs] = useState<Club[]>([]);
    const [loadingPage, setLoadingPage] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [teamALeft, setTeamALeft] = useState<number | ''>('');
    const [teamARight, setTeamARight] = useState<number | ''>('');
    const [teamBLeft, setTeamBLeft] = useState<number | ''>('');
    const [teamBRight, setTeamBRight] = useState<number | ''>('');
    const [matchType, setMatchType] = useState<'male' | 'female' | 'mixed'>('male');
    const [selectedClub, setSelectedClub] = useState<number | ''>('');

    const [levelError, setLevelError] = useState(false);
    const [duplicateError, setDuplicateError] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                const [matchRes, playersRes, clubsRes] = await Promise.all([
                    supabase.from('matches').select('*').eq('id', matchId).maybeSingle(),
                    supabase.from('players').select('id, first_name, last_name, ranking, preferred_side, gender').order('last_name'),
                    supabase.from('clubs').select('*').order('name')
                ]);

                if (matchRes.data) {
                    setTeamALeft(matchRes.data.team_a_left_id || '');
                    setTeamARight(matchRes.data.team_a_right_id || '');
                    setTeamBLeft(matchRes.data.team_b_left_id || '');
                    setTeamBRight(matchRes.data.team_b_right_id || '');
                    setMatchType(matchRes.data.match_type);
                    setSelectedClub(matchRes.data.club_id || '');
                }
                if (playersRes.data) setPlayers(playersRes.data);
                if (clubsRes.data) setClubs(clubsRes.data);
            } catch { setError('Errore caricamento dati.'); } finally { setLoadingPage(false); }
        }
        loadData();

        if (typeof window !== 'undefined') {
            (window as any).supabase = supabase;
        }
    }, [matchId, supabase]);

    useEffect(() => {
        const ids = [teamALeft, teamARight, teamBLeft, teamBRight].filter((v): v is number => typeof v === 'number');
        setDuplicateError(new Set(ids).size !== ids.length);
        if (ids.length < 2) { setLevelError(false); return; }
        const rks = ids.map(id => players.find(p => p.id === id)?.ranking).filter((r): r is number => r !== undefined);
        setLevelError(Math.max(...rks) - Math.min(...rks) > 0.25);
    }, [teamALeft, teamARight, teamBLeft, teamBRight, players]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await updateMatchPlayers(matchId, { match_type: matchType, club_id: selectedClub || null, team_a_left_id: teamALeft || null, team_a_right_id: teamARight || null, team_b_left_id: teamBLeft || null, team_b_right_id: teamBRight || null });
            router.push('/?tab=pending');
        } catch (err: any) { setError(err.message); setSubmitting(false); }
    };

    const isLeft = (p: Player) => (p.preferred_side === 'Left' || p.preferred_side === 'Both') && (matchType === 'mixed' || (matchType === 'male' ? p.gender === 'M' : p.gender === 'F'));
    const isRight = (p: Player) => (p.preferred_side === 'Right' || p.preferred_side === 'Both') && (matchType === 'mixed' || (matchType === 'male' ? p.gender === 'M' : p.gender === 'F'));

    const {
        kingLeftIds,
        kingRightIds,
        kingBothIds,
        lastPlaceLeftIds,
        lastPlaceRightIds,
        lastPlaceBothIds
    } = computeKingAndFanalino(players);

    const playerTitlesMap: Record<number, { type: 'KING' | 'FANALINO', label: string }> = {};

    kingLeftIds.forEach(id => playerTitlesMap[id] = { type: 'KING', label: '👑 KING SX' });
    kingRightIds.forEach(id => playerTitlesMap[id] = { type: 'KING', label: '👑 KING DX' });
    kingBothIds.forEach(id => playerTitlesMap[id] = { type: 'KING', label: '👑 KING MIX' });

    lastPlaceLeftIds.forEach(id => playerTitlesMap[id] = { type: 'FANALINO', label: '🐢 FAN SX' });
    lastPlaceRightIds.forEach(id => playerTitlesMap[id] = { type: 'FANALINO', label: '🐢 FAN DX' });
    lastPlaceBothIds.forEach(id => playerTitlesMap[id] = { type: 'FANALINO', label: '🐢 FAN MIX' });

    if (loadingPage) return <main className="min-h-screen flex items-center justify-center text-[10px] font-black uppercase tracking-widest">Caricamento...</main>;

    return (
        <main className="w-full max-w-4xl mx-auto px-4 sm:px-8 mt-6">
            <div className="bg-white border border-slate-200 shadow-sm p-6 sm:p-8 rounded-sm">
                <div className="mb-6"><BackToHomeButton tab="pending" /></div>
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-8">Modifica Partita</h1>

                {error && <div className="mb-4 p-3 bg-red-100 text-red-700 text-xs font-bold uppercase rounded-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select value={selectedClub} onChange={e => setSelectedClub(e.target.value ? parseInt(e.target.value) : '')} className="w-full p-2 border border-slate-300 text-[10px] font-black uppercase rounded-sm cursor-pointer">
                            <option value="">NESSUN CIRCOLO DEFINITO</option>
                            {clubs.map(c => <option key={c.id} value={c.id}>{c.name} {c.address ? `| ${c.address}` : ''} {c.city ? `(${c.city})` : ''}</option>)}
                        </select>
                        <div className="flex bg-slate-100 p-1 rounded-sm gap-1">
                            {(['male', 'female', 'mixed'] as const).map(type => {
                                const labels = { male: 'MASCHILE', female: 'FEMMINILE', mixed: 'MISTO' };
                                return (
                                    <button key={type} type="button" onClick={() => { setMatchType(type); setTeamALeft(''); setTeamARight(''); setTeamBLeft(''); setTeamBRight(''); }} className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest transition-colors ${matchType === type ? 'bg-slate-900 text-white rounded-sm shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
                                        {labels[type]}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { label: 'TEAM A', team: [teamALeft, teamARight], setters: [setTeamALeft, setTeamARight], border: 'border-blue-600' },
                            { label: 'TEAM B', team: [teamBLeft, teamBRight], setters: [setTeamBLeft, setTeamBRight], border: 'border-red-600' }
                        ].map((t, i) => (
                            <div key={i} className={`p-4 border-t-4 ${t.border} bg-slate-50 rounded-sm`}>
                                <h2 className="text-[9px] font-black uppercase tracking-widest mb-3">{t.label}</h2>
                                <select value={t.team[0]} onChange={e => t.setters[0](e.target.value ? parseInt(e.target.value) : '')} className="w-full p-2 mb-2 text-[10px] font-bold border border-slate-300 rounded-sm cursor-pointer">
                                    <option value="">GIOCATORE SX</option>
                                    {players.filter(p => isLeft(p) && (p.id === t.team[0] || ![teamALeft, teamARight, teamBLeft, teamBRight].includes(p.id))).map(p => {
                                        const title = playerTitlesMap[p.id];
                                        return (
                                            <option key={p.id} value={p.id}>
                                                {p.last_name} {p.first_name} — {p.ranking.toFixed(2)}{title ? ` ${title.label}` : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                                <select value={t.team[1]} onChange={e => t.setters[1](e.target.value ? parseInt(e.target.value) : '')} className="w-full p-2 text-[10px] font-bold border border-slate-300 rounded-sm cursor-pointer">
                                    <option value="">GIOCATORE DX</option>
                                    {players.filter(p => isRight(p) && (p.id === t.team[1] || ![teamALeft, teamARight, teamBLeft, teamBRight].includes(p.id))).map(p => {
                                        const title = playerTitlesMap[p.id];
                                        return (
                                            <option key={p.id} value={p.id}>
                                                {p.last_name} {p.first_name} — {p.ranking.toFixed(2)}{title ? ` ${title.label}` : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        ))}
                    </div>

                    {duplicateError && <div className="p-3 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded-sm">ERRORE: GIOCATORE DUPLICATO O NON VALIDO.</div>}
                    {levelError && <div className="p-3 bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest rounded-sm">ERRORE: DIVARIO TECNICO &gt; 0.25.</div>}

                    <button type="submit" disabled={submitting || duplicateError || levelError} className="w-full bg-slate-900 text-white font-black text-xs uppercase tracking-widest py-4 rounded-sm hover:bg-black disabled:opacity-50 transition-colors">
                        {submitting ? 'SALVATAGGIO...' : 'CONFERMA MODIFICHE'}
                    </button>
                </form>
            </div>
        </main>
    );
}
