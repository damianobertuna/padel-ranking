import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { updatePlayerByAdmin } from '../player-actions';

export const revalidate = 0; // Evita cache aggressiva

export default async function AdminPlayersManagement() {
    const supabase = await createClient();

    // 1. Controllo di sicurezza lato server
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: adminCheck } = await supabase
        .from('players')
        .select('role')
        .eq('user_id', user.id)
        .single();

    if (!adminCheck || adminCheck.role !== 'admin') {
        return (
            <main className="min-h-screen p-8 bg-slate-100 flex flex-col items-center justify-center">
                <p className="text-red-600 font-bold text-lg mb-4">🚫 Accesso Negato. Questa pagina è riservata agli amministratori.</p>
                <Link href="/" className="text-indigo-600 underline">Torna alla Home</Link>
            </main>
        );
    }

    // 2. Scarichiamo la lista di TUTTI i giocatori
    const { data: allPlayers } = await supabase
        .from('players')
        .select('*')
        .order('last_name', { ascending: true });

    return (
        <main className="min-h-screen p-8 bg-slate-100 flex flex-col items-center">
            <div className="max-w-4xl w-full">

                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Link href="/" className="text-sm font-semibold text-indigo-600 hover:underline">← Torna alla Classifica</Link>
                        <h1 className="text-3xl font-bold text-slate-800 mt-2">Gestione Giocatori (Admin)</h1>
                    </div>
                </div>

                <div className="space-y-6">
                    {(allPlayers || []).map((player) => (
                        <div key={player.id} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">

                            {/* Form di modifica per ogni singolo giocatore */}
                            <form action={updatePlayerByAdmin} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                                <input type="hidden" name="playerId" value={player.id} />

                                {/* Nome e Cognome */}
                                <div className="sm:col-span-2 grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nome</label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            defaultValue={player.first_name}
                                            required
                                            className="w-full p-2 border rounded bg-white text-slate-950 font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Cognome</label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            defaultValue={player.last_name}
                                            required
                                            className="w-full p-2 border rounded bg-white text-slate-950 font-medium"
                                        />
                                    </div>
                                </div>

                                {/* Ranking Punti */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Ranking</label>
                                    <input
                                        type="number"
                                        name="ranking"
                                        step="0.01"
                                        min="1.00"
                                        max="7.00"
                                        defaultValue={player.ranking}
                                        required
                                        className="w-full p-2 border rounded bg-white text-slate-950 font-mono font-bold text-indigo-600"
                                    />
                                </div>

                                {/* Pulsante di salvataggio allineato a destra */}
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        className="w-full bg-emerald-600 text-white font-bold py-2 px-4 rounded hover:bg-emerald-700 transition-colors shadow-sm text-sm"
                                    >
                                        Salva Modifiche
                                    </button>
                                </div>

                                {/* Opzioni avanzate: Lato, Mano e Ruolo */}
                                <div className="sm:col-span-4 grid grid-cols-3 gap-4 pt-2 border-t border-slate-100 mt-2">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Lato Campo</label>
                                        <select name="preferredSide" defaultValue={player.preferred_side} className="w-full p-1.5 border rounded bg-slate-50 text-slate-800 text-xs font-semibold">
                                            <option value="Left">Sinistra (SX)</option>
                                            <option value="Right">Destra (DX)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Mano Dominante</label>
                                        <select name="dominantHand" defaultValue={player.dominant_hand || 'Destro'} className="w-full p-1.5 border rounded bg-slate-50 text-slate-800 text-xs font-semibold">
                                            <option value="Destro">Destro</option>
                                            <option value="Mancino">Mancino</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Permessi Sistema</label>
                                        <select name="role" defaultValue={player.role || 'user'} className="w-full p-1.5 border rounded bg-slate-50 text-slate-800 text-xs font-semibold">
                                            <option value="user">Utente Base</option>
                                            <option value="admin">Amministratore</option>
                                        </select>
                                    </div>
                                </div>

                            </form>
                        </div>
                    ))}
                </div>

            </div>
        </main>
    );
}
