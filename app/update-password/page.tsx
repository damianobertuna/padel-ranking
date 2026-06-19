'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function UpdatePasswordPage() {
        const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sessionReady, setSessionReady] = useState(false);

    const router = useRouter();
    const [supabase] = useState(() => createClient());

    useEffect(() => {
        let mounted = true;

        const initializeSession = async () => {
            // 1. Estrazione manuale bruta dall'URL (Forziamo la mano a Supabase)
            const hash = window.location.hash;

            if (hash && hash.includes('access_token')) {
                // Trasformiamo l'hash in parametri leggibili
                const hashParams = new URLSearchParams(hash.substring(1));
                const accessToken = hashParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token');

                if (accessToken && refreshToken) {
                    // Diciamo esplicitamente a Supabase di loggare l'utente con questi token
                    const { error: sessionError } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken
                    });

                    if (sessionError) {
                        if (mounted) setError("Errore di validazione: " + sessionError.message);
                        return;
                    }

                    if (mounted) {
                        setSessionReady(true);
                        // Puliamo l'URL nascondendo i token per sicurezza
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }
                    return;
                }
            }

            // 2. Fallback: se ricarica la pagina e la sessione c'era già
            const { data: { session } } = await supabase.auth.getSession();
            if (session && mounted) {
                setSessionReady(true);
                return;
            }

            // 3. Se non c'è né hash né sessione, sblocchiamo l'attesa infinita
            if (mounted && !hash.includes('access_token')) {
                setTimeout(() => {
                    if (mounted && !sessionReady) {
                        setError("Nessun token valido trovato. Il link potrebbe essere scaduto.");
                    }
                }, 2000);
            }
        };

        initializeSession();

        // Listener di sicurezza per catturare eventuali cambiamenti in ritardo
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (session && mounted) {
                setSessionReady(true);
            }
        });

        return () => {
            mounted = false;
            authListener.subscription.unsubscribe();
        };
    }, [supabase, sessionReady]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError("La password deve avere almeno 6 caratteri.");
            return;
        }

        if (password !== confirm) {
            setError("Le password non coincidono.");
            return;
        }

                setLoading(true);
        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: password,
                data: {
                    full_name: `${firstName} ${lastName}`.trim(),
                    first_name: firstName,
                    last_name: lastName,
                }
            });

            if (updateError) throw new Error(updateError.message);

            router.push('/');
            router.refresh();

        } catch (err: any) {
            setError(err.message || "Impossibile aggiornare la password.");
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="bg-white p-8 max-w-md w-full border border-slate-200 shadow-sm rounded-sm">
                <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900 mb-2">
                    Benvenuto Gestore
                </h1>

                {!sessionReady && !error && (
                    <div className="mb-4 bg-amber-50 text-amber-700 p-3 text-[10px] font-bold uppercase rounded-sm border border-amber-100 flex items-center gap-2">
                        <span className="animate-pulse">⏳</span> Verifica link sicuro in corso...
                    </div>
                )}

                {sessionReady && !error && (
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8 text-green-600">
                        ✓ Identità verificata. Imposta la tua password.
                    </p>
                )}

                {error && (
                    <div className="mb-4 bg-red-50 text-red-700 p-3 text-[10px] font-bold uppercase rounded-sm border border-red-100">
                        ⚠️ {error}
                    </div>
                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                            Nome
                        </label>
                        <input
                            type="text"
                            placeholder="Mario"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            disabled={!sessionReady}
                            className="w-full border border-slate-200 p-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                            Cognome
                        </label>
                        <input
                            type="text"
                            placeholder="Rossi"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            disabled={!sessionReady}
                            className="w-full border border-slate-200 p-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                            Nuova Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={!sessionReady}
                            className="w-full border border-slate-200 p-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                            Conferma Password
                        </label>
                        <input
                            type="password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            disabled={!sessionReady}
                            className="w-full border border-slate-200 p-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !sessionReady}
                        className="w-full mt-4 bg-slate-900 text-white px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Salvataggio...' : 'Salva e Accedi'}
                    </button>
                </form>
            </div>
        </main>
    );
}
