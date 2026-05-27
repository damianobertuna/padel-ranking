'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createPendingMatch as createMatch } from '@/actions/match-actions';
import { useRouter } from 'next/navigation';
import { Player, Club } from '@/types';
import BackToHomeButton from "@/components/BackToHomeButton";

export default function CreateMatchForm() {
    const supabase = createClient();
    const router = useRouter();

    const [players, setPlayers] = useState<Player[]>([]);
    const [clubs, setClubs] = useState<Club[]>([]);
    const [teamALeft, setTeamALeft] = useState<number | ''>('');
    const [teamARight, setTeamARight] = useState<number | ''>('');
    const [teamBLeft, setTeamBLeft] = useState<number | ''>('');
    const [teamBRight, setTeamBRight] = useState<number | ''>('');
    const [matchType, setMatchType] = useState<'male' | 'female' | 'mixed'>('male');
    const [clubId, setClubId] = useState<number | ''>('');
    const [matchDate, setMatchDate] = useState<string>(() => new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    const [levelError, setLevelError] = useState<boolean>(false);
    const [duplicateError, setDuplicateError] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        async function loadData() {
            const [playersRes, clubsRes] = await Promise.all([
                supabase.from('players').select('id, first_name, last_name, ranking, preferred_side, gender').order('last_name'),
                supabase.from('clubs').select('*').order('name')
            ]);
            if (playersRes.data) setPlayers(playersRes.data);
            if (clubsRes.data) setClubs(clubsRes.data);
        }
        loadData();
    }, [supabase]);

    useEffect(() => {
        const selectedIds = [teamALeft, teamARight, teamBLeft, teamBRight].filter((v): v is number => typeof v === 'number');
        setDuplicateError(new Set(selectedIds).size !== selectedIds.length);
        if (selectedIds.length < 2) { setLevelError(false); return; }
        const rks = selectedIds.map(id => players.find(p => p.id === id)?.ranking).filter((r): r is number => r !== undefined);
        setLevelError(Math.max(...rks) - Math.min(...rks) > 0.25);
    }, [teamALeft, teamARight, teamBLeft, teamBRight, players]);

    const leftSidePlayers = players.filter(p => (p.preferred_side === 'Left' || p.preferred_side === 'Both') && (matchType === 'mixed' || (matchType === 'male' ? p.gender === 'M' : p.gender === 'F')));
    const rightSidePlayers = players.filter(p => (p.preferred_side === 'Right' || p.preferred_side === 'Both') && (matchType === 'mixed' || (matchType === 'male' ? p.gender === 'M' : p.gender === 'F')));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createMatch({ matchDate, matchType, teamALeft: teamALeft || null, teamARight: teamARight || null, teamBLeft: teamBLeft || null, teamBRight: teamBRight || null, clubId: clubId || null });
            router.push('/');
        } catch (err: any) { setLoading(false); }
    };

    return (
        <main className="min-h-screen p-4 sm:p-8 bg-slate-50 flex flex-col items-center">
            <div className="w-full max-w-3xl bg-white border border-slate-200 shadow-sm p-6 rounded-sm">
                <div className="mb-6"><BackToHomeButton /></div>
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-8">Nuova Partita</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input type="datetime-local" required value={matchDate} onChange={e => setMatchDate(e.target.value)} className="w-full p-2 border border-slate-300 text-sm font-bold bg-slate-50 rounded-sm" />
                        <select value={clubId} onChange={e => setClubId(e.target.value ? parseInt(e.target.value) : '')} className="w-full p-2 border border-slate-300 text-[10px] font-black uppercase rounded-sm">
                            <option value="">NON DEFINITO</option>
                            {clubs.map(c => <option key={c.id} value={c.id}>{c.name} {c.city ? `(${c.city})` : ''}</option>)}
                        </select>
                    </div>

                    <div className="flex bg-slate-100 p-1 rounded-sm gap-1">
                        {(['male', 'female', 'mixed'] as const).map(type => {
                            const labels = { male: 'MASCHILE', female: 'FEMMINILE', mixed: 'MISTO' };
                            return (
                                <button key={type} type="button" onClick={() => { setMatchType(type); setTeamALeft(''); setTeamARight(''); setTeamBLeft(''); setTeamBRight(''); }} className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest ${matchType === type ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>
                                    {labels[type]}
                                </button>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { label: 'TEAM A', setters: [setTeamALeft, setTeamARight], vals: [teamALeft, teamARight], border: 'border-blue-600' },
                            { label: 'TEAM B', setters: [setTeamBLeft, setTeamBRight], vals: [teamBLeft, teamBRight], border: 'border-red-600' }
                        ].map((t, i) => (
                            <div key={i} className={`p-4 border-t-4 ${t.border} bg-slate-50 rounded-sm`}>
                                <h2 className="text-[9px] font-black uppercase mb-3">{t.label}</h2>
                                <select value={t.vals[0]} onChange={e => t.setters[0](e.target.value ? parseInt(e.target.value) : '')} className="w-full p-2 mb-2 text-[10px] font-bold border border-slate-300 rounded-sm">
                                    <option value="">GIOCATORE SX</option>
                                    {leftSidePlayers.filter(p => p.id === t.vals[0] || ![teamALeft, teamARight, teamBLeft, teamBRight].includes(p.id)).map(p => <option key={p.id} value={p.id}>{p.last_name} {p.first_name} — {p.ranking.toFixed(2)}</option>)}
                                </select>
                                <select value={t.vals[1]} onChange={e => t.setters[1](e.target.value ? parseInt(e.target.value) : '')} className="w-full p-2 text-[10px] font-bold border border-slate-300 rounded-sm">
                                    <option value="">GIOCATORE DX</option>
                                    {rightSidePlayers.filter(p => p.id === t.vals[1] || ![teamALeft, teamARight, teamBLeft, teamBRight].includes(p.id)).map(p => <option key={p.id} value={p.id}>{p.last_name} {p.first_name} — {p.ranking.toFixed(2)}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>

                    {(duplicateError || levelError) && <div className="p-3 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest">{duplicateError ? "ERRORE: GIOCATORE DUPLICATO." : "ERRORE: DIVARIO TECNICO > 0.25."}</div>}
                    <button type="submit" disabled={levelError || duplicateError || loading} className="w-full bg-slate-900 text-white font-black text-xs uppercase py-4 rounded-sm hover:bg-black disabled:opacity-50">
                        {loading ? 'CREAZIONE...' : 'CONFERMA PARTITA'}
                    </button>
                </form>
            </div>
        </main>
    );
}
