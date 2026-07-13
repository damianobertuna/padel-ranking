'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { updateMatchPlayers } from '@/actions/match-actions';
import BackToHomeButton from '@/components/ui/BackToHomeButton';
import { Player, Club } from '@/types';
import MatchForm, { MatchFormData } from '@/components/matches/MatchForm';
import dictError from '@/lib/i18n/dict-error';
import dictMatch from '@/lib/i18n/dict-match';
import dictUi from '@/lib/i18n/dict-ui';

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
    const [disabledClubId, setDisabledClubId] = useState<number | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                // Recuperiamo parallelamente la sessione, il match, i giocatori e i circoli
                const [matchRes, playersRes, clubsRes, authRes] = await Promise.all([
                    supabase.from('matches').select('*').eq('id', matchId).maybeSingle(),
                    supabase.from('players').select('*').order('last_name'),
                    supabase.from('clubs').select('*').order('name'),
                    supabase.auth.getUser()
                ]);

                const user = authRes.data.user;
                if (!user) throw new Error(dictError.AUTH_REQUIRED);

                const match = matchRes.data;
                if (!match) throw new Error(dictError.MATCH_NOT_FOUND_GENERIC);

                // Cerca profilo giocatore (esiste per player/admin, non per club_manager puro)
                const currentUserPlayer = playersRes.data?.find(p => p.user_id === user.id);

                // --- CONTROLLO DI SICUREZZA LATO CLIENT ---
                let isManagerForThisMatch = false;
                let currentUserId: number | null = null;
                let userRole: string | null = null;

                if (currentUserPlayer) {
                    currentUserId = currentUserPlayer.id;
                    userRole = currentUserPlayer.role;
                } else {
                    // Potrebbe essere un club_manager senza profilo giocatore
                    const { data: userRoleData } = await supabase
                        .from('user_roles')
                        .select('role')
                        .eq('user_id', user.id)
                        .maybeSingle();
                    userRole = userRoleData?.role || null;
                }

                if (userRole === 'club_manager' && match.club_id) {
                    const { data: managerData } = await supabase.from('club_managers')
                        .select('id')
                        .eq('user_id', user.id)
                        .eq('club_id', match.club_id)
                        .maybeSingle();
                    isManagerForThisMatch = !!managerData;

                    if (isManagerForThisMatch) {
                        setDisabledClubId(match.club_id);
                    }
                }

                const isPlayerInMatch = currentUserId
                    ? [match.team_a_left_id, match.team_a_right_id, match.team_b_left_id, match.team_b_right_id].includes(currentUserId)
                    : false;
                const isAdmin = userRole === 'admin';
                const isOrganizer = currentUserId ? currentUserId === match.organizer_id : false;

                const canManage = isAdmin || isOrganizer || isManagerForThisMatch || (!match.organizer_id && isPlayerInMatch);

                if (!canManage) {
                    throw new Error(dictError.PERMISSION_DENIED_EDIT);
                }
                // -----------------------------------------

                let matchDate = '';
                let matchTime = '';

                if (match.match_date) {
                    const d = new Date(match.match_date);
                    matchDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    matchTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                }

                setInitialMatchData({
                    matchDate, matchTime,
                    clubId: match.club_id || '',
                    matchType: match.match_type,
                    isFriendly: match.is_friendly ?? false,
                    courtType: match.court_type,
                    teamALeft: match.team_a_left_id || '',
                    teamARight: match.team_a_right_id || '',
                    teamBLeft: match.team_b_left_id || '',
                    teamBRight: match.team_b_right_id || ''
                });

                if (playersRes.data) setPlayers(playersRes.data);
                if (clubsRes.data) setClubs(clubsRes.data);

            } catch (err: any) {
                setError(err.message || dictError.MATCH_LOAD_ERROR);
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
                court_type: data.courtType,
                is_friendly: data.isFriendly,
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

    if (loading) return <main className="min-h-screen flex items-center justify-center text-[10px] font-black uppercase tracking-widest">{dictUi.LOADING}</main>;

    return (
        <main className="w-full max-w-4xl mx-auto px-4 sm:px-8 mt-6 pb-12">
            <div className="mb-6"><BackToHomeButton tab="pending" /></div>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold uppercase rounded-sm flex items-center gap-2">
                    <span>⚠️</span> {error}
                </div>
            )}

            {!error && initialMatchData && (
                <MatchForm
                    title={dictMatch.EDIT_TITLE}
                    submitLabel={dictMatch.EDIT_SUBMIT}
                    players={players}
                    clubs={clubs}
                    initialData={initialMatchData}
                    disabledClubId={disabledClubId}
                    onSubmit={handleSubmit}
                />
            )}
        </main>
    );
}