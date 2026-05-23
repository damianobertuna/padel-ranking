// app/admin/clubs/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import NewClubForm from './NewClubForm';
import DeleteClubButton from './DeleteClubButton'; // Lo creiamo subito sotto
import { Club } from '@/types';
import BackToHomeButton from "@/components/BackToHomeButton"; // Assicurati di aver esportato l'interfaccia nel file types/index.ts

export default async function AdminClubsPage() {
    const supabase = await createClient();

    // 1. Controllo Sessione e Ruolo Admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: player } = await supabase
        .from('players')
        .select('role')
        .eq('user_id', user.id)
        .single();

    if (!player || player.role !== 'admin') redirect('/');

    // 2. Fetch dei Club esistenti
    const { data: clubsData } = await supabase
        .from('clubs')
        .select('*')
        .order('name', { ascending: true });

    const clubs: Club[] = clubsData || [];

    return (
        <main className="min-h-screen p-4 sm:p-8 bg-slate-100 flex flex-col items-center">
            <div className="max-w-3xl w-full">

                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Gestione Campi</h1>
                        <p className="text-sm text-slate-500">I campi inseriti qui saranno selezionabili in fase di creazione match.</p>
                    </div>
                    <BackToHomeButton />
                </div>

                {/* Componente Client per l'inserimento */}
                <div className="mb-8">
                    <NewClubForm />
                </div>

                {/* Lista dei Club Esistenti */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {clubs.length > 0 ? (
                        <ul className="divide-y divide-slate-100">
                            {clubs.map((club) => (
                                <li key={club.id} className="flex justify-between items-center p-4 hover:bg-slate-50 transition-colors">
                                    <span className="font-bold text-slate-700">{club.name} {club.address} {club.city}</span>
                                    {/* Bottone Client per gestire l'eliminazione */}
                                    <DeleteClubButton clubId={club.id} />
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-8 text-center text-slate-500 italic text-sm">
                            Nessun circolo registrato. Aggiungine uno per iniziare.
                        </div>
                    )}
                </div>

            </div>
        </main>
    );
}
