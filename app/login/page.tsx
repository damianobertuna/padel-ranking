'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Player {
    id: number;
    first_name: string;
    last_name: string;
    user_id: string | null;
}

export default function Login() {
    const supabase = createClient();
    const router = useRouter();

    // Stati per il form
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedPlayerId, setSelectedPlayerId] = useState('');
    const [players, setPlayers] = useState<Player[]>([]);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // Scarichiamo solo i giocatori che non sono ancora associati a nessun account di login
    useEffect(() => {
        async function fetchUnlinkedPlayers() {
            const { data } = await supabase
                .from('players')
                .select('id, first_name, last_name, user_id')
                .order('first_name');

            if (data) {
                // Se siamo in Sign Up, mostriamo solo chi ha user_id vuoto
                setPlayers(data);
            }
        }
        fetchUnlinkedPlayers();
    }, [supabase]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        if (isSignUp) {
            // --- LOGICA DI REGISTRAZIONE (SIGN UP) ---
            if (!selectedPlayerId) {
                setError('Devi selezionare il tuo nome dalla lista per poterti registrare!');
                setLoading(false);
                return;
            }

            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (signUpError) {
                setError(signUpError.message);
            } else if (authData?.user) {
                // Colleghiamo il giocatore della tabella public con l'utente appena creato
                const { error: linkError } = await supabase
                    .from('players')
                    .update({ user_id: authData.user.id })
                    .eq('id', parseInt(selectedPlayerId));

                if (linkError) {
                    setError("Account creato, ma errore nel collegamento al profilo giocatore.");
                    console.error(linkError);
                } else {
                    setMessage('Registrazione completata con successo! Ora puoi fare il login.');
                    setIsSignUp(false); // Spostiamo l'utente sul form di login
                }
            }
        } else {
            // --- LOGICA DI ACCESSO (SIGN IN) ---
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                setError('Email o password errate.');
            } else {
                // Login effettuato, reindirizziamo alla Home
                router.push('/');
                router.refresh();
            }
        }
        setLoading(false);
    };

    // Filtriamo la lista dei giocatori per mostrare solo quelli "disponibili" in fase di registrazione
    const availablePlayers = players.filter(p => !p.user_id || p.id.toString() === selectedPlayerId);

    return (
        <main className="min-h-screen p-8 bg-slate-100 flex flex-col items-center justify-center">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">

                {/* Tab Switcher */}
                <div className="flex mb-6 border-b">
                    <button
                        type="button"
                        className={`w-1/2 pb-2 font-bold text-center ${!isSignUp ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-400'}`}
                        onClick={() => { setIsSignUp(false); setError(''); }}
                    >
                        Accedi
                    </button>
                    <button
                        type="button"
                        className={`w-1/2 pb-2 font-bold text-center ${isSignUp ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-400'}`}
                        onClick={() => { setIsSignUp(true); setError(''); }}
                    >
                        Registrati
                    </button>
                </div>

                <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">
                    {isSignUp ? 'Crea il tuo Profilo' : 'Bentornato sul Campo'}
                </h2>

                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
                {message && <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-sm">{message}</div>}

                <form onSubmit={handleAuth} className="space-y-4">

                    {/* Sezione speciale per la Registrazione: Selezione del Giocatore esistente */}
                    {isSignUp && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Chi sei nella classifica?</label>
                            <select
                                required
                                value={selectedPlayerId}
                                onChange={(e) => setSelectedPlayerId(e.target.value)}
                                className="w-full border p-2 rounded"
                            >
                                <option value="">Seleziona il tuo nome...</option>
                                {availablePlayers.map(p => (
                                    <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                                ))}
                            </select>
                            <p className="text-xs text-slate-400 mt-1">Collegherai questo accesso email ai tuoi dati di gioco reali.</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border border-slate-300 rounded p-2"
                            placeholder="mario.rossi@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border border-slate-300 rounded p-2"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white font-bold py-2 rounded hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Elaborazione...' : isSignUp ? 'Registrati' : 'Accedi'}
                    </button>
                </form>
            </div>
        </main>
    );
}
