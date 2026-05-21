'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { logUserLogin } from '@/actions/auth-actions';
import AvatarUpload from '@/components/AvatarUpload'; // 👈 NUOVO: Importazione del componente Avatar

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
    const [gender, setGender] = useState<'M' | 'F'>('M'); // 👈 NUOVO: Stato per il genere richiesto dal DB
    const [phone, setPhone] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null); // 👈 NUOVO: Stato per memorizzare l'URL della foto
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

                // 1. Creiamo le credenziali d'accesso su Supabase Auth
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
                    // 2. Creiamo il record nella tabella players inserendo anche Avatar e Genere
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
                                gender: gender,          // 👈 NUOVO: Passato correttamente al DB
                                avatar_url: avatarUrl,    // 👈 NUOVO: Link all'immagine dello Storage
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
                        setAvatarUrl(null);
                        setPrivacyAccepted(false);
                        setIsSignUp(false);
                    }
                }
            } else {
                // --- LOGICA DI ACCESSO / LOGIN ---
                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (signInError) {
                    setError('Email o password errate.');
                } else {
                    if (signInData?.user) {
                        logUserLogin(signInData.user.id).catch(err =>
                            console.error("Errore nel log della sessione:", err)
                        );
                    }

                    window.location.href = '/';
                    return;
                }
            }
        } catch (globalCatch) {
            console.error(globalCatch);
            setError("Si è verificato un errore imprevisto.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen p-4 sm:p-8 bg-slate-50 flex flex-col items-center justify-center">
            <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">

                {/* Tab Switcher */}
                <div className="flex mb-6 bg-slate-100 p-1 rounded-xl border border-slate-200 text-sm font-bold">
                    <button
                        type="button"
                        className={`w-1/2 py-2 rounded-lg transition-all ${!isSignUp ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                        onClick={() => { setIsSignUp(false); setError(''); setMessage(''); }}
                    >
                        Accedi
                    </button>
                    <button
                        type="button"
                        className={`w-1/2 py-2 rounded-lg transition-all ${isSignUp ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                        onClick={() => { setIsSignUp(true); setError(''); setMessage(''); }}
                    >
                        Registrati
                    </button>
                </div>

                <h2 className="text-xl font-black text-slate-800 mb-6 text-center tracking-tight">
                    {isSignUp ? 'Crea il tuo Profilo' : 'Bentornato sul Campo'}
                </h2>

                {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl mb-4 text-xs font-bold">{error}</div>}
                {message && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-xl mb-4 text-xs font-bold">{message}</div>}

                <form onSubmit={handleAuth} className="space-y-4">

                    {isSignUp && (
                        <>
                            {/* 👈 NUOVO SECTION AVATAR (Caricamento e Preview in linea) */}
                            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/60 mb-2">
                                <AvatarUpload
                                    currentAvatarUrl={avatarUrl}
                                    onUploadSuccess={(url) => setAvatarUrl(url)}
                                />
                                <div className="min-w-0">
                                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Foto Profilo</h4>
                                    <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">Opzionale. Carica un'immagine quadrata per farti riconoscere nella classifica generale.</p>
                                </div>
                            </div>

                            {/* Nome */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nome</label>
                                <input
                                    type="text"
                                    required
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full border border-slate-200 rounded-xl p-2.5 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:border-indigo-500"
                                    placeholder="Es. Mario"
                                />
                            </div>

                            {/* Cognome */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Cognome</label>
                                <input
                                    type="text"
                                    required
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full border border-slate-200 rounded-xl p-2.5 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:border-indigo-500"
                                    placeholder="Es. Rossi"
                                />
                            </div>

                            {/* Categoria di Gioco (Genere) */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Categoria (Genere)</label>
                                <select
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value as 'M' | 'F')}
                                    className="w-full border border-slate-200 rounded-xl p-2.5 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:border-indigo-500"
                                >
                                    <option value="M">👨 Maschile</option>
                                    <option value="F">👩 Femminile</option>
                                </select>
                            </div>

                            {/* Numero di Telefono */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Numero di Telefono (WhatsApp)</label>
                                <input
                                    type="tel"
                                    required
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full border border-slate-200 rounded-xl p-2.5 bg-white text-slate-800 text-sm font-medium font-mono focus:outline-none focus:border-indigo-500"
                                    placeholder="Es. +39 347 1234567"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">Indispensabile per coordinare le convocazioni dei match aperti.</p>
                            </div>

                            {/* Ranking Iniziale */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Livello / Ranking Iniziale</label>
                                <input
                                    type="number"
                                    required
                                    min="1.00"
                                    max="7.00"
                                    step="0.01"
                                    value={initialRanking}
                                    onChange={(e) => setInitialRanking(e.target.value)}
                                    className="w-full border border-slate-200 rounded-xl p-2.5 bg-white font-mono text-lg font-black text-indigo-600 focus:outline-none focus:border-indigo-500"
                                />

                                <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 space-y-1.5">
                                    <p className="font-bold text-slate-700">📖 Regolamento Autovalutazione:</p>
                                    <p>
                                        Stabilisci il livello di partenza consultando la{' '}
                                        <a
                                            href="https://www.padelnuestro.com/it/blog/livelli-del-padel"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-indigo-600 underline font-bold hover:text-indigo-800"
                                        >
                                            Guida Ufficiale Padel Nuestro
                                        </a>.
                                    </p>
                                    <p className="italic text-[10px]">
                                        Nota: Se sei incerto mantieni il valore standard di 4.50. L'equilibrio dei match esige una forbice di livello massima di ±0.25 tra i partecipanti.
                                    </p>
                                </div>
                            </div>

                            {/* Lato Preferito */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Lato Preferito</label>
                                <select
                                    value={preferredSide}
                                    onChange={(e) => setPreferredSide(e.target.value)}
                                    className="w-full border border-slate-200 rounded-xl p-2.5 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:border-indigo-500"
                                >
                                    <option value="Left">Sinistra (SX)</option>
                                    <option value="Right">Destra (DX)</option>
                                    <option value="Both">Entrambi / MIX (Both)</option>
                                </select>
                            </div>

                            {/* Mano Dominante */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Mano Dominante</label>
                                <select
                                    value={dominantHand}
                                    onChange={(e) => setDominantHand(e.target.value)}
                                    className="w-full border border-slate-200 rounded-xl p-2.5 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:border-indigo-500"
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
                                        className="h-4 w-4 text-indigo-600 border-slate-300 rounded-sm focus:ring-indigo-500 cursor-pointer"
                                    />
                                </div>
                                <div className="ml-3 text-xs">
                                    <label htmlFor="privacy" className="font-bold text-slate-600 cursor-pointer">
                                        Accetto il trattamento dei dati personali secondo l'Informativa sulla Privacy.
                                    </label>
                                </div>
                            </div>

                            <hr className="border-slate-100 my-4" />
                        </>
                    )}

                    {/* CAMPI UTENTE SEMPRE VISIBILI */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl p-2.5 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:border-indigo-500"
                            placeholder="mario.rossi@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl p-2.5 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:border-indigo-500"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3 rounded-xl transition-all shadow-sm text-sm mt-6 active:scale-[0.99]"
                    >
                        {loading ? 'Elaborazione...' : isSignUp ? 'Registrati ed Entra in Classifica' : 'Accedi'}
                    </button>
                </form>
            </div>
        </main>
    );
}
