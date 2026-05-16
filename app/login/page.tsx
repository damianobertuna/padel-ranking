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

    // Nuovi Stati per i dati del Giocatore
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [preferredSide, setPreferredSide] = useState('Left');
    const [dominantHand, setDominantHand] = useState('Destro');
    const [initialRanking, setInitialRanking] = useState('4.5'); // Stato per il ranking iniziale scelto dall'utente

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
            if (!firstName.trim() || !lastName.trim()) {
                setError('Nome e Cognome sono obbligatori!');
                setLoading(false);
                return;
            }

            // Convertiamo il ranking inserito in un numero float, se non è valido mettiamo 1000 di paracadute
            const parsedRanking = parseFloat(initialRanking) || 1000.00;

            // 1. Creiamo le credenziali d'accesso
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
                // 2. Creiamo il giocatore usando il ranking scelto dall'utente
                const { error: playerError } = await supabase
                    .from('players')
                    .insert([
                        {
                            user_id: authData.user.id,
                            first_name: firstName.trim(),
                            last_name: lastName.trim(),
                            preferred_side: preferredSide,
                            dominant_hand: dominantHand,
                            ranking: parsedRanking, // <-- Usiamo il valore dinamico qui!
                            role: 'user'
                        }
                    ]);

                if (playerError) {
                    setError("Account creato, ma c'è stato un errore nella creazione del profilo di gioco.");
                    console.error(playerError);
                } else {
                    setMessage('Profilo creato e inserito in classifica con il tuo ranking! Ora puoi fare il login.');
                    setFirstName('');
                    setLastName('');
                    setInitialRanking('1000');
                    setIsSignUp(false);
                }
            }
        } else {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                setError('Email o password errate.');
            } else {
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

                            {/* Ranking Iniziale */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Ranking Punti Iniziale</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    max="5000"
                                    step="0.01"
                                    value={initialRanking}
                                    onChange={(e) => setInitialRanking(e.target.value)}
                                    className="w-full border border-slate-300 rounded p-2 bg-white text-slate-950 font-mono"
                                    placeholder="Es. 1000"
                                />
                                <p className="text-xs text-slate-400 mt-1">Scegli il tuo punteggio di partenza (es. 1000 standard, o più alto se sei esperto).</p>
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

                    {/* CAMPI UTENTE SEMPRE VISIBILI */}
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
