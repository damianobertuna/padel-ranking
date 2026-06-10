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

    useEffect(() => {
        async function loadData() {
            try {
                const [playersRes, clubsRes] = await Promise.all([
                    supabase.from('players').select('id, first_name, last_name, ranking, preferred_side, gender').order('last_name'),
                    supabase.from('clubs').select('*').order('name')
                ]);
                if (playersRes.data) setPlayers(playersRes.data);
                if (clubsRes.data) setClubs(clubsRes.data);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [supabase]);

    const handleSubmit = async (data: MatchFormData) => {
        try {
            // Convertiamo le stringhe vuote del frontend in null per il database
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
                onSubmit={handleSubmit}
            />
        </main>
    );
}
