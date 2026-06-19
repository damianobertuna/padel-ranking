'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createPendingMatch } from '@/actions/match-actions';
import { useRouter } from 'next/navigation';
import { Player, Club } from '@/types';
import BackToHomeButton from "@/components/BackToHomeButton";
import MatchForm, { MatchFormData } from '@/components/MatchForm';

export default function CreateMatchPage() {
    const supabase = createClient();
    const router = useRouter();

    const [players, setPlayers] = useState<Player[]>([]);
    const [clubs, setClubs] = useState<Club[]>([]);
    const [loading, setLoading] = useState(true);
    const [disabledClubId, setDisabledClubId] = useState<number | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                // 1. Identifichiamo l'utente loggato
                const { data: { user } } = await supabase.auth.getUser();

                // Prepariamo la query base per i circoli (che prenderà tutto)
                let clubsQuery = supabase.from('clubs').select('*').order('name');
                console.log("User ID:", user?.id);

                if (user) {
                    // 2. Verifichiamo se l'utente è un manager
                    const { data: roleData, error: roleError } = await supabase
                        .from('user_roles')
                        .select('role')
                        .eq('user_id', user.id)
                        .maybeSingle();
                    console.log("Role:", roleData);
                    console.log("Role Error:", roleError);

                                        if (roleData?.role === 'club_manager') {
                        // 3. Troviamo a quale circolo è assegnato
                        const { data: managerData } = await supabase
                            .from('club_managers')
                            .select('club_id')
                            .eq('user_id', user.id)
                            .maybeSingle();

                        if (managerData?.club_id) {
                            // 4. Lock del circolo manager — dropdown bloccato, nessuna scelta
                            setDisabledClubId(managerData.club_id);
                            clubsQuery = supabase
                                .from('clubs')
                                .select('*')
                                .eq('id', managerData.club_id)
                                .order('name');
                        }

                        console.log("Assigned Club:", managerData);
                    }
                }

                // 5. Lanciamo le query in parallelo per massimizzare le performance
                const [playersRes, clubsRes] = await Promise.all([
                    supabase.from('players').select('*').order('last_name'),
                    clubsQuery
                ]);

                if (playersRes.data) setPlayers(playersRes.data);
                if (clubsRes.data) setClubs(clubsRes.data);
            } catch (error) {
                console.error("Errore nel caricamento dei dati:", error);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [supabase]);

    const handleSubmit = async (data: MatchFormData) => {
        try {
            await createPendingMatch({
                matchDate: data.matchDate,
                matchType: data.matchType,
                isFriendly: data.isFriendly,
                clubId: data.clubId || null,
                teamALeft: data.teamALeft || null,
                teamARight: data.teamARight || null,
                teamBLeft: data.teamBLeft || null,
                teamBRight: data.teamBRight || null,
            });
            router.push('/?tab=pending');
            router.refresh();
        } catch (err: any) {
            alert(`Errore durante la creazione: ${err.message}`);
        }
    };

    if (loading) return <main className="min-h-screen flex items-center justify-center text-[10px] font-black uppercase tracking-widest">Caricamento dati...</main>;

    return (
        <main className="w-full max-w-4xl mx-auto px-4 sm:px-8 mt-6 pb-12">
            <div className="mb-6"><BackToHomeButton tab="pending" /></div>
                        <MatchForm
                title="Nuova Partita"
                submitLabel="Crea Partita"
                players={players}
                clubs={clubs}
                disabledClubId={disabledClubId}
                onSubmit={handleSubmit}
            />
        </main>
    );
}

