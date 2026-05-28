import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import NewClubForm from './NewClubForm';
import DeleteClubButton from './DeleteClubButton';
import { Club } from '@/types';
import BackToHomeButton from "@/components/BackToHomeButton";

export default async function AdminClubsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: player } = await supabase.from('players').select('role').eq('user_id', user.id).single();
    if (!player || player.role !== 'admin') redirect('/');

    const { data: clubsData } = await supabase.from('clubs').select('*').order('name', { ascending: true });
    const clubs: Club[] = clubsData || [];

    return (
        <main className="w-full max-w-4xl mx-auto px-4 sm:px-8">
            <div className="max-w-3xl w-full">
                <div className="mb-8 mt-2 border-b-2 border-slate-900 pb-4">
                    <BackToHomeButton />
                    <h1 className="text-3xl font-black text-slate-900 mt-2 uppercase tracking-tighter">Gestione Circoli</h1>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Area Amministrativa Federale</p>
                </div>

                <div className="mb-8">
                    <NewClubForm />
                </div>

                <div className="bg-white border border-slate-200 shadow-sm rounded-sm">
                    {clubs.length > 0 ? (
                        <ul className="divide-y divide-slate-100">
                            {clubs.map((club) => (
                                <li key={club.id} className="flex justify-between items-center p-4">
                                    <div className="flex flex-col">
                                        <span className="font-black text-slate-900 uppercase text-sm">{club.name}</span>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">{club.address} - {club.city}</span>
                                    </div>
                                    <DeleteClubButton clubId={club.id} />
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Nessun circolo registrato</div>
                    )}
                </div>
            </div>
        </main>
    );
}
