import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { updatePlayerByAdmin } from '../../../actions/player-actions';
import { SubmitButton } from './SubmitButton';
import BackToHomeButton from "@/components/BackToHomeButton";

export const revalidate = 0;

export default async function AdminPlayersManagement() {
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

    const { data: allPlayers } = await supabase
        .from('players')
        .select('*')
        .order('last_name', { ascending: true });

    return (
        <main className="min-h-screen p-4 sm:p-8 bg-slate-50 flex flex-col items-center">
            <div className="max-w-4xl w-full">
                <div className="mb-8 border-b-2 border-slate-900 pb-4">
                    <BackToHomeButton />
                    <h1 className="text-3xl font-black text-slate-900 mt-2 uppercase tracking-tighter">Gestione Atleti</h1>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Area Amministrativa Federale</p>
                </div>

                <div className="space-y-3">
                    {(allPlayers || []).map((player) => (
                        <div key={player.id} className="bg-white p-4 border border-slate-200 shadow-sm rounded-sm">
                            <form action={updatePlayerByAdmin} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                <input type="hidden" name="playerId" value={player.id} />

                                {/* Dati Anagrafici */}
                                <div className="md:col-span-4 grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Nome</label>
                                        <input type="text" name="firstName" defaultValue={player.first_name} required className="w-full p-2 border border-slate-300 bg-slate-50 text-sm font-bold text-slate-900 rounded-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Cognome</label>
                                        <input type="text" name="lastName" defaultValue={player.last_name} required className="w-full p-2 border border-slate-300 bg-slate-50 text-sm font-bold text-slate-900 rounded-sm" />
                                    </div>
                                </div>

                                {/* Ranking */}
                                <div className="md:col-span-2">
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ranking</label>
                                    <input type="number" name="ranking" step="0.01" min="1.00" max="7.00" defaultValue={player.ranking} required className="w-full p-2 border border-slate-300 bg-blue-50 text-sm font-black text-blue-700 rounded-sm" />
                                </div>

                                {/* Opzioni */}
                                <div className="md:col-span-5 grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Lato</label>
                                        <select name="preferredSide" defaultValue={player.preferred_side} className="w-full p-2 border border-slate-300 bg-white text-[10px] font-bold text-slate-800 rounded-sm">
                                            <option value="Left">SX</option>
                                            <option value="Right">DX</option>
                                            <option value="Both">MIX</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Mano</label>
                                        <select name="dominantHand" defaultValue={player.dominant_hand || 'Destro'} className="w-full p-2 border border-slate-300 bg-white text-[10px] font-bold text-slate-800 rounded-sm">
                                            <option value="Destro">DX</option>
                                            <option value="Mancino">SX</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ruolo</label>
                                        <select name="role" defaultValue={player.role || 'user'} className="w-full p-2 border border-slate-300 bg-white text-[10px] font-bold text-slate-800 rounded-sm">
                                            <option value="user">USER</option>
                                            <option value="admin">ADMIN</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Azione */}
                                <div className="md:col-span-1 flex justify-end">
                                    <SubmitButton />
                                </div>
                            </form>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
