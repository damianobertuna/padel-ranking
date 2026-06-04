import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import EditProfileForm from '@/components/EditProfileForm';

export default async function ProfilePage() {
    const supabase = await createClient();

    // 1. Verifichiamo che l'utente sia loggato
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    // 2. Recuperiamo il suo profilo dalla tabella players
    const { data: currentPlayer } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (!currentPlayer) {
        return <div className="p-8 text-center font-bold">Profilo giocatore non trovato.</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-8 flex flex-col items-center">
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-2 uppercase">
                Area Personale
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-8">
                Gestisci le tue informazioni. Il tuo Ranking attuale è: <span className="text-blue-600">{currentPlayer.ranking}</span>
            </p>

            <div className="max-w-2xl">
                {/* PASSAGGIO DATI AL COMPONENTE CLIENT */}
                <EditProfileForm player={currentPlayer} />
            </div>
        </div>
    );
}
