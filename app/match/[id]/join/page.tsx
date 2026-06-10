'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { updateMatchPlayers } from '@/actions/match-actions';
import BackToHomeButton from '@/components/BackToHomeButton';
import { Player, Club } from '@/types';
import MatchForm, { MatchFormData } from '@/components/MatchForm';

export default function EditMatchPage() {
    const supabase = createClient();
    const params = useParams();
    const router = useRouter();
    const matchId = params.id as string;

    const [players, setPlayers] = useState<Player[]>([]);
    const [clubs, setClubs] = useState<Club[]>([]);
    const [initialMatchData, setInitialMatchData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function loadData() {
            try {
                const [matchRes, playersRes, clubsRes] = await Promise.all([
                    supabase.from('matches').select('*').eq('id', matchId).maybeSingle(),
                    supabase.from('players').select('id, first_name, last_name, ranking, preferred_side, gender').order('last_name'),
                    supabase.from('clubs').select('*').order('name')
                ]);

                if (matchRes.data) {
                    let matchDate = '';
                    let matchTime = '';

                    if (matchRes.data.match_date) {
                        const d = new Date(matchRes.data.match_date);
                        matchDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                        matchTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                    }

                    setInitialMatchData({
                        matchDate, matchTime,
                        clubId: matchRes.data.club_id || '',
                        matchType: matchRes.data.match_type,
                        isFriendly: matchRes.data.is_friendly ?? false,
                        teamALeft: matchRes.data.team_a_left_id || '',
                        teamARight: matchRes.data.team_a_right_id || '',
                        teamBLeft: matchRes.data.team_b_left_id || '',
                        teamBRight: matchRes.data.team_b_right_id || ''
                    });
                }
                if (playersRes.data) setPlayers(playersRes.data);
                if (clubsRes.data) setClubs(clubsRes.data);
            } catch {
                setError('Errore caricamento dati.');
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [matchId, supabase]);

    const handleSubmit = async (data: MatchFormData) => {
        try {
            await updateMatchPlayers(matchId, {
                match_date: data.matchDate,
                match_type: data.matchType,
                club_id: data.clubId || null,
                team_a_left_id: data.teamALeft || null,
                team_a_right_id: data.teamARight || null,
                team_b_left_id: data.teamBLeft || null,
                team_b_right_id: data.teamBRight || null
            });
            router.push('/?tab=pending');
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (loading) return <main className="min-h-screen flex items-center justify-center text-[10px] font-black uppercase tracking-widest">Caricamento...</main>;

    return (
        <main className="w-full max-w-4xl mx-auto px-4 sm:px-8 mt-6 pb-12">
            <div className="mb-6"><BackToHomeButton tab="pending" /></div>

            {error && <div className="mb-4 p-3 bg-red-100 text-red-700 text-xs font-bold uppercase rounded-sm">{error}</div>}

            {initialMatchData && (
                <MatchForm
                    title="Modifica Partita"
                    submitLabel="Salva Modifiche"
                    players={players}
                    clubs={clubs}
                    initialData={initialMatchData}
                    onSubmit={handleSubmit}
                />
            )}
        </main>
    );
}
