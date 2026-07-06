'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logUserLogin, logUserRegistration } from '@/actions/auth-actions';
import AvatarUpload from '@/components/players/AvatarUpload';
import BackToHomeButton from "@/components/ui/BackToHomeButton";
import dictAuth from '@/lib/i18n/dict-auth';

export default function LoginForm() {
    const supabase = createClient();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [preferredSide, setPreferredSide] = useState('Left');
    const [dominantHand, setDominantHand] = useState('Destro');
    const [initialRanking, setInitialRanking] = useState('4.50');
    const [gender, setGender] = useState<'M' | 'F'>('M');
    const [phone, setPhone] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Stato per la checkbox (usato solo in fase di registrazione)
    const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            if (isSignUp) {
                const { data: authData, error: signUpError } = await supabase.auth.signUp({ email, password });
                if (signUpError) throw signUpError;
                if (authData?.user) {
                    const { error: playerError } = await supabase.from('players').insert([{
                        user_id: authData.user.id, first_name: firstName, last_name: lastName, preferred_side: preferredSide,
                        dominant_hand: dominantHand, ranking: parseFloat(initialRanking), gender: gender, avatar_url: avatarUrl,
                        phone: phone, role: 'user'
                    }]);
                    if (playerError) throw playerError;

                    await logUserRegistration(authData.user.id, `${firstName} ${lastName}`);

                    // FIX: Logghiamo il primo accesso e rimandiamo l'utente alla Home Page, non al ricaricamento del Login!
                    await logUserLogin(authData.user.id);
                    window.location.href = '/';
                }
            } else {
                const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
                if (signInError) throw signInError;
                if (data?.user) await logUserLogin(data.user.id);
                window.location.href = '/';
            }
        } catch (err: any) { setError(err.message); setLoading(false); }
    };

    // La logica di disabilitazione del bottone:
    // Se stiamo caricando (loading) -> disabilita sempre.
    // Se siamo in "Registrazione" (!isSignUp è falso) -> disabilita SE la privacy NON è accettata.
    // Se siamo in "Login" -> ignora la privacy e abilita.
    const isButtonDisabled = loading || (isSignUp && !acceptedPrivacy);

    return (
        <main className="w-full max-w-4xl mx-auto px-4 sm:px-8">
            <div className="mb-4 mt-3"><BackToHomeButton></BackToHomeButton></div>

            <div className="max-w-lg w-full bg-white border border-slate-200 shadow-sm p-8 rounded-sm">

                <div className="flex border-b border-slate-900 mb-8">
                                        <button type="button" className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest ${!isSignUp ? 'bg-slate-900 text-white' : 'text-slate-500'}`} onClick={() => setIsSignUp(false)}>{dictAuth.TAB_LOGIN}</button>
                    <button type="button" className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest ${isSignUp ? 'bg-slate-900 text-white' : 'text-slate-500'}`} onClick={() => setIsSignUp(true)}>{dictAuth.TAB_REGISTER}</button>
                </div>

                {error && <div className="p-3 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest mb-4">{error}</div>}

                <form onSubmit={handleAuth} className="space-y-4">
                    {isSignUp && (
                        <div className="space-y-4 border-b border-slate-200 pb-6">
                            <div className="flex items-center gap-4">
                                <AvatarUpload currentAvatarUrl={avatarUrl} onUploadSuccess={setAvatarUrl} />
                                <div className="flex-1">
                                                                        <input type="text" placeholder={dictAuth.PLACEHOLDER_NAME} className="w-full p-2 border border-slate-300 text-[10px] font-black uppercase rounded-sm mb-2" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                                    <input type="text" placeholder={dictAuth.PLACEHOLDER_SURNAME} className="w-full p-2 border border-slate-300 text-[10px] font-black uppercase rounded-sm" value={lastName} onChange={e => setLastName(e.target.value)} required />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                                                <select className="p-2 border border-slate-300 text-[10px] font-black uppercase rounded-sm" value={gender} onChange={e => setGender(e.target.value as 'M' | 'F')}><option value="M">{dictAuth.OPTION_GENDER_MALE}</option><option value="F">{dictAuth.OPTION_GENDER_FEMALE}</option></select>
                                <input type="tel" placeholder={dictAuth.PLACEHOLDER_PHONE} className="p-2 border border-slate-300 text-[10px] font-black uppercase rounded-sm" value={phone} onChange={e => setPhone(e.target.value)} required />
                            </div>
                            <input type="number" step="0.01" placeholder={dictAuth.PLACEHOLDER_RANKING} className="w-full p-2 border border-slate-300 text-[10px] font-black uppercase rounded-sm" value={initialRanking} onChange={e => setInitialRanking(e.target.value)} />
                            <div className="grid grid-cols-2 gap-2">
                                                                <select className="p-2 border border-slate-300 text-[10px] font-black uppercase rounded-sm" value={preferredSide} onChange={e => setPreferredSide(e.target.value)}><option value="Left">{dictAuth.OPTION_SIDE_LEFT}</option><option value="Right">{dictAuth.OPTION_SIDE_RIGHT}</option><option value="Both">{dictAuth.OPTION_SIDE_BOTH}</option></select>
                                <select className="p-2 border border-slate-300 text-[10px] font-black uppercase rounded-sm" value={dominantHand} onChange={e => setDominantHand(e.target.value)}><option value="Destro">{dictAuth.OPTION_HAND_RIGHT}</option><option value="Mancino">{dictAuth.OPTION_HAND_LEFT}</option></select>
                            </div>
                        </div>
                    )}

                                        <input type="email" placeholder={dictAuth.PLACEHOLDER_EMAIL} className="w-full p-2 border border-slate-300 text-[10px] font-black uppercase rounded-sm" value={email} onChange={e => setEmail(e.target.value)} required />
                    <input type="password" placeholder={dictAuth.PLACEHOLDER_PASSWORD} className="w-full p-2 border border-slate-300 text-[10px] font-black uppercase rounded-sm" value={password} onChange={e => setPassword(e.target.value)} required />

                    {/* CHECKBOX PRIVACY POLICY (Mostrata SOLO durante la registrazione) */}
                    {isSignUp && (
                        <div className="flex items-start gap-3 my-4 p-3 bg-slate-50 border border-slate-200 rounded-sm">
                            <div className="flex items-center h-5">
                                <input
                                    id="privacy"
                                    name="privacy"
                                    type="checkbox"
                                    required={isSignUp}
                                    checked={acceptedPrivacy}
                                    onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                                    className="w-4 h-4 border border-slate-300 rounded bg-slate-50 focus:ring-3 focus:ring-blue-300 accent-blue-600 cursor-pointer"
                                />
                            </div>
                            <div className="text-[10px] sm:text-xs text-slate-500 leading-tight">
                                                                <label htmlFor="privacy" className="font-medium cursor-pointer">
                                    {dictAuth.PRIVACY_CHECKBOX_LABEL}
                                </label>
                                <a
                                    href="https://www.iubenda.com/privacy-policy/89843982"
                                    className="iubenda-white iubenda-noiframe iubenda-embed font-bold text-slate-900 hover:text-blue-600 underline decoration-slate-300 hover:decoration-blue-600 transition-colors"
                                    title={dictAuth.PRIVACY_POLICY_LINK}
                                >
                                    {dictAuth.PRIVACY_POLICY_LINK}
                                </a>
                                {' '}{dictAuth.PRIVACY_CONSENT}
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isButtonDisabled}
                        className="w-full bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest py-4 rounded-sm hover:bg-black disabled:opacity-50 transition-colors"
                    >
                        {loading ? dictAuth.BUTTON_PROCESSING : isSignUp ? dictAuth.BUTTON_REGISTER : dictAuth.BUTTON_LOGIN}
                    </button>
                </form>
            </div>
        </main>
    );
}
