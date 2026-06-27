import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import BackToHomeButton from "@/components/ui/BackToHomeButton";
import InviteManagerModal from "@/components/admin/InviteManagerModal";
import { updateManagerByAdmin, deleteManagerByAdmin } from '@/actions/manager-actions';
import { SubmitButton } from '@/app/admin/players/SubmitButton';
import DeleteManagerButton from './DeleteManagerButton';

export const revalidate = 0;

export default async function AdminManagersPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: adminCheck } = await supabase
        .from('players')
        .select('role')
        .eq('user_id', user.id)
        .single();

    if (!adminCheck || adminCheck.role !== 'admin') {
        return (
            <main className="min-h-screen p-8 bg-slate-50 flex flex-col items-center justify-center">
                <p className="text-red-600 font-black uppercase text-sm mb-4 tracking-widest">🚫 Accesso Negato.</p>
                <Link href="/" className="text-blue-600 font-bold underline text-xs uppercase tracking-wider">Torna alla Home</Link>
            </main>
        );
    }

    // Fetch all club managers
    const { data: managers } = await supabase
        .from('club_managers')
        .select('id, user_id, first_name, last_name, club_id')
        .order('last_name', { ascending: true });

    // Fetch tutti i circoli per la tendina di modifica e per la modale d'invito
    const { data: allClubs } = await supabase
        .from('clubs')
        .select('id, name, city')
        .order('name');

    return (
        <main className="w-full max-w-4xl mx-auto px-4 sm:px-8 pb-12">
            <div className="max-w-4xl w-full">
                <div className="mb-8 mt-2 border-b-2 border-slate-900 pb-4">
                    <BackToHomeButton />
                    <div className="flex justify-between items-end mt-2">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Gestione Gestori</h1>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Area Amministrativa Federale</p>
                        </div>
                        <InviteManagerModal clubs={allClubs || []} />
                    </div>
                </div>

                <div className="space-y-3">
                    {managers && managers.length > 0 ? (
                        managers.map((manager: any) => (
                            <div key={manager.id} className="bg-white p-4 border border-slate-200 shadow-sm rounded-sm">
                                <form action={updateManagerByAdmin} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                    <input type="hidden" name="managerId" value={manager.id} />

                                    {/* Dati Anagrafici */}
                                    <div className="md:col-span-4 grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Nome</label>
                                            <input
                                                type="text"
                                                name="firstName"
                                                defaultValue={manager.first_name}
                                                required
                                                className="w-full p-2 border border-slate-300 bg-slate-50 text-sm font-bold text-slate-900 rounded-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Cognome</label>
                                            <input
                                                type="text"
                                                name="lastName"
                                                defaultValue={manager.last_name}
                                                required
                                                className="w-full p-2 border border-slate-300 bg-slate-50 text-sm font-bold text-slate-900 rounded-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Circolo Assegnato */}
                                    <div className="md:col-span-3">
                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Circolo</label>
                                        <select
                                            name="clubId"
                                            defaultValue={manager.club_id}
                                            className="w-full p-2 border border-slate-300 bg-white text-[10px] font-bold text-slate-800 rounded-sm"
                                        >
                                            {allClubs?.map((club: any) => (
                                                <option key={club.id} value={club.id}>
                                                    {club.name} {club.city ? `(${club.city})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* User ID (sola lettura) */}
                                    <div className="md:col-span-3">
                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">User ID</label>
                                        <div className="w-full p-2 border border-slate-200 bg-slate-100 text-[10px] font-mono text-slate-500 rounded-sm truncate">
                                            {manager.user_id}
                                        </div>
                                    </div>

                                    {/* Azioni */}
                                    <div className="md:col-span-2 flex gap-2 items-end justify-end">
                                        <SubmitButton />
                                        <DeleteManagerButton
                                            managerId={manager.id}
                                            managerName={`${manager.first_name} ${manager.last_name}`}
                                        />
                                    </div>
                                </form>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white p-8 border border-slate-200 text-center rounded-sm">
                            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Nessun gestore registrato.</p>
                            <p className="text-slate-400 text-[10px] font-bold mt-2">Utilizza il pulsante &quot;Invita Gestore&quot; per aggiungerne uno.</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
