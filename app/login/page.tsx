'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function Login() {
    const supabase = createClient();
    const router = useRouter();

    // Stati per il form di autenticazione base
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Nuovi Stati per i dati del Giocatore (Usati solo in fase di registrazione)
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [preferredSide, setPreferredSide] = useState('Left'); // Default Sinistra
    const [dominantHand, setDominantHand] = useState('Destro');  // Default Destro

    // Stati per la UX
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        if (isSignUp) {
            // --- NUOVA LOGICA DI REGISTRAZIONE AUTOMATICA (SIGN UP) ---
            if (!firstName.trim() || !lastName.trim()) {
                setError('Nome e Cognome sono obbligatori!');
                setLoading(false);
                return;
            }

            // 1. Creiamo le credenziali d'accesso in Supabase Auth
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (signUpError) {
                setError(signUpError.message);
                setLoading(false);
                return;
            }

            if (authData?.user) {
                // 2. Creiamo IMMEDIATAMENTE la riga corrispondente nella tabella public.players
                const { error: playerError } = await supabase
                    .from('players')
                    .insert([
                        {
                            user_id: authData.user.id, // Legame con l'account auth appena nato
                            first_name: firstName.trim(),
                            last_name: lastName.trim(),
                            preferred_side: preferredSide,
                            dominant_hand: dominantHand,
                            ranking: 1000.00, // Il ranking di partenza per tutti
                            role: 'user'       // Privilegi utente standard
                        }
                    ]);

                if (playerError) {
                    setError("Account creato, ma c'è stato un errore nella creazione del profilo di gioco.");
                    console.error(playerError);
                } else {
                    setMessage('Profilo creato e inserito in classifica con successo! Ora puoi fare il login.');

                    // Resettiamo i campi del giocatore e spostiamo l'utente sul tab Accedi
                    setFirstName('');
                    setLastName('');
                    setIsSignUp(false);
                }
            }
        } else {
            // --- LOGICA DI ACCESSO STANDARD (SIGN IN) ---
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                setError('Email o password errate.');
            } else {
                // Login completato, andiamo in Home Page
                router.push('/');
                router.refresh();
            }
        }
        setLoading(false);
    };

    return (
        <main className="min-h-screen p-8 bg-slate-100 flex flex-col items-center justify-center">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md border border-slate-200">

                {/* Tab Switcher */}
                <div className="flex mb-6 border-b border-slate-200">
                    <button
                        type="button"
                        className={`w-1/2 pb-2 font-bold text-center transition-colors ${!isSignUp ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                        onClick={() => { setIsSignUp(false); setError(''); setMessage(''); }}
                    >
                        Accedi
                    </button>
                    <button
                        type="button"
                        className={`w-1/2 pb-2 font-bold text-center transition-colors ${isSignUp ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                        onClick={() => { setIsSignUp(true); setError(''); setMessage(''); }}
                    >
                        Registrati
                    </button>
                </div>

                <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">
                    {isSignUp ? 'Crea il tuo Profilo' : 'Bentornato sul Campo'}
                </h2>

                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm font-semibold">{error}</div>}
                {message && <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-sm font-semibold">{message}</div>}

                <form onSubmit={handleAuth} className="space-y-4">

                    {/* CAMPI SPECIFICI DI REGISTRAZIONE (Mostrati solo se isSignUp è vero) */}
                    {isSignUp && (
                        <>
                            {/* Nome */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                                <input
                                    type="text"
                                    required
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full border border-slate-300 rounded p-2 bg-white text-slate-950"
                                    placeholder="Es. Mario"
                                />
                            </div>

                            {/* Cognome */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Cognome</label>
                                <input
                                    type="text"
                                    required
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full border border-slate-300 rounded p-2 bg-white text-slate-950"
                                    placeholder="Es. Rossi"
                                />
                            </div>

                            {/* Lato Preferito */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Lato Preferito in Campo</label>
                                <select
                                    value={preferredSide}
                                    onChange={(e) => setPreferredSide(e.target.value)}
                                    className="w-full border border-slate-300 rounded p-2 bg-white text-slate-950"
                                >
                                    <option value="Left">Sinistra (SX)</option>
                                    <option value="Right">Destra (DX)</option>
                                </select>
                            </div>

                            {/* Mano Dominante */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Mano Dominante</label>
                                <select
                                    value={dominantHand}
                                    onChange={(e) => setDominantHand(e.target.value)}
                                    className="w-full border border-slate-300 rounded p-2 bg-white text-slate-950"
                                >
                                    <option value="Destro">Destro</option>
                                    <option value="Mancino">Mancino</option>
                                </select>
                            </div>

                            <hr className="border-slate-200 my-4" />
                        </>
                    )}

                    {/* CAMPI UTENTE SEMPRE VISIBILI (Sia per Login che per Registrazione) */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border border-slate-300 rounded p-2 bg-white text-slate-950"
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
                            className="w-full border border-slate-300 rounded p-2 bg-white text-slate-950"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white font-bold py-2 rounded hover:bg-indigo-700 disabled:opacity-50 transition-colors mt-6"
                    >
                        {loading ? 'Elaborazione...' : isSignUp ? 'Registrati ed Entra in Classifica' : 'Accedi'}
                    </button>
                </form>
            </div>
        </main>
    );
}
