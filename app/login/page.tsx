'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { logUserLogin } from '@/actions/auth-actions'; // <-- Verifica che questo percorso sia corretto rispetto a dove si trova auth-actions.ts

export default function Login() {
    const supabase = createClient();
    const router = useRouter();

    // Stati per il form di autenticazione base
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Stati per i dati del Giocatore
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [preferredSide, setPreferredSide] = useState('Left');
    const [dominantHand, setDominantHand] = useState('Destro');
    const [initialRanking, setInitialRanking] = useState('4.50');
    const [phone, setPhone] = useState('');
    const [privacyAccepted, setPrivacyAccepted] = useState(false);

    // Stati per la UX
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        console.log("Submit inviato! Modalità SignUp:", isSignUp);

        try {
            if (isSignUp) {
                if (!firstName.trim() || !lastName.trim()) {
                    setError('Nome e Cognome sono obbligatori!');
                    setLoading(false);
                    return;
                }

                if (!phone.trim()) {
                    setError('Il numero di telefono è obbligatorio!');
                    setLoading(false);
                    return;
                }

                if (!privacyAccepted) {
                    setError('Devi accettare l\'Informativa sulla Privacy per registrarti.');
                    setLoading(false);
                    return;
                }

                const parsedRanking = parseFloat(initialRanking) || 4.50;

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
                    // 2. Creiamo il giocatore
                    const { error: playerError } = await supabase
                        .from('players')
                        .insert([
                            {
                                user_id: authData.user.id,
                                first_name: firstName.trim(),
                                last_name: lastName.trim(),
                                preferred_side: preferredSide,
                                dominant_hand: dominantHand,
                                ranking: parsedRanking,
                                phone: phone.trim(),
                                role: 'user'
                            }
                        ]);

                    if (playerError) {
                        setError("Account creato, ma c'è stato un errore nella creazione del profilo di gioco.");
                        console.error(playerError);
                    } else {
                        setMessage('Profilo creato con successo! Ora puoi fare il login.');
                        setFirstName('');
                        setLastName('');
                        setPhone('');
                        setInitialRanking('4.50');
                        setPrivacyAccepted(false);
                        setIsSignUp(false);
                    }
                }
            } else {
                // --- LOGICA DI ACCESSO / LOGIN ---
                console.log("Tento il login con Supabase per:", email);
                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (signInError) {
                    console.error("Errore login Supabase:", signInError.message);
                    setError('Email o password errate.');
                } else {
                    console.log("Login Supabase completato con successo! User ID:", signInData?.user?.id);

                    if (signInData?.user) {
                        try {
                            // Chiamiamo la action di log in modalità "fire and forget" senza bloccare il thread client
                            logUserLogin(signInData.user.id).catch(err =>
                                console.error("Errore asincrono nella Server Action di log:", err)
                            );
                        } catch (logErr) {
                            console.error("Errore blocco catch per logUserLogin:", logErr);
                        }
                    }

                    window.location.href = '/';
                    return; // Usciamo subito
                }
            }
        } catch (globalCatch) {
            console.error("Crash globale nel client handler:", globalCatch);
            setError("Si è verificato un errore imprevisto.");
        } finally {
            setLoading(false);
        }
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

                            {/* Numero di Telefono */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Numero di Telefono (WhatsApp)</label>
                                <input
                                    type="tel"
                                    required
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full border border-slate-300 rounded p-2 bg-white text-slate-950 font-mono"
                                    placeholder="Es. +39 347 1234567"
                                />
                                <p className="text-xs text-slate-400 mt-1">Necessario per le future funzioni di coordinamento via WhatsApp.</p>
                            </div>

                            {/* Ranking Iniziale */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Livello / Ranking Iniziale</label>
                                <input
                                    type="number"
                                    required
                                    min="1.00"
                                    max="7.00"
                                    step="0.01"
                                    value={initialRanking}
                                    onChange={(e) => setInitialRanking(e.target.value)}
                                    className="w-full border border-slate-300 rounded p-2 bg-white text-slate-950 font-mono text-lg font-bold text-indigo-600"
                                />

                                <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 space-y-1.5">
                                    <p className="font-semibold text-slate-700">📖 Regolamento di Autovalutazione:</p>
                                    <p>
                                        Per stabilire il tuo livello iniziale, fai riferimento alla guida ufficiale cliccando qui:{' '}
                                        <a
                                            href="https://www.padelnuestro.com/it/blog/livelli-del-padel"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-indigo-600 underline font-semibold hover:text-indigo-800"
                                        >
                                            Guida Livelli Padel Nuestro
                                        </a>.
                                    </p>
                                    <p className="italic text-slate-500">
                                        Nota: Se non conosci il tuo livello, lascia pure il valore di 4.50. Il valore RanKING serve a garantire partite equilibrate (forbice massima di ±0.25).
                                    </p>
                                </div>
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

                            {/* Checkbox Privacy */}
                            <div className="flex items-start mt-4 p-1">
                                <div className="flex items-center h-5">
                                    <input
                                        id="privacy"
                                        type="checkbox"
                                        required
                                        checked={privacyAccepted}
                                        onChange={(e) => setPrivacyAccepted(e.target.checked)}
                                        className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                                    />
                                </div>
                                <div className="ml-3 text-xs">
                                    <label htmlFor="privacy" className="font-medium text-slate-700 cursor-pointer">
                                        Accetto il trattamento dei dati personali secondo la nostra Informativa sulla Privacy.
                                    </label>
                                </div>
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
