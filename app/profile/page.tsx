import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import EditProfileForm from './EditProfileForm';
import EditManagerProfileForm from '@/components/managers/EditManagerProfileForm';
import BackToHomeButton from "@/components/ui/BackToHomeButton";

export default async function ProfilePage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    // 1. Try to find a player profile
    const { data: currentPlayer } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

        if (currentPlayer) {
        return (
            <div className="min-h-screen bg-slate-50 p-4 sm:p-8 flex flex-col items-center">
                <div className="w-full max-w-2xl mb-6"><BackToHomeButton /></div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-2 uppercase">
                    Area Personale
                </h1>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-8">
                    Gestisci le tue informazioni. Il tuo Ranking attuale è: <span className="text-blue-600">{currentPlayer.ranking}</span>
                </p>

                <div className="max-w-2xl">
                    <EditProfileForm player={currentPlayer} />
                </div>
            </div>
        );
    }

    // 2. No player — check if user is a club_manager
    const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

    if (userRole?.role === 'club_manager') {
        const { data: manager } = await supabase
            .from('club_managers')
            .select('first_name, last_name, club_id')
            .eq('user_id', user.id)
            .maybeSingle();

        // Resolve club name
        let clubName = 'il tuo circolo';
        if (manager?.club_id) {
            const { data: club } = await supabase
                .from('clubs')
                .select('name')
                .eq('id', manager.club_id)
                .single();
            if (club) clubName = club.name;
        }

        return (
            <div className="min-h-screen bg-slate-50 p-4 sm:p-8 flex flex-col items-center">
                <div className="w-full max-w-2xl mb-6"><BackToHomeButton /></div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-2 uppercase">
                    Area Personale
                </h1>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-8">
                    Gestore di: <span className="text-blue-600">{clubName}</span>
                </p>

                <div className="max-w-2xl">
                    <EditManagerProfileForm
                        firstName={manager?.first_name || ''}
                        lastName={manager?.last_name || ''}
                    />
                </div>
            </div>
        );
    }

    // 3. Unknown role
    return <div className="p-8 text-center font-bold">Profilo non riconosciuto.</div>;
}
