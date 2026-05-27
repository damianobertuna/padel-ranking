'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { logUserLogin } from '@/actions/auth-actions';
import AvatarUpload from '@/components/AvatarUpload';
import BackToHomeButton from "@/components/BackToHomeButton";

export default function Login() {
    const supabase = createClient();
    const router = useRouter();
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
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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
                    window.location.reload();
                }
            } else {
                const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
                if (signInError) throw signInError;
                if (data?.user) await logUserLogin(data.user.id);
                window.location.href = '/';
            }
        } catch (err: any) { setError(err.message); setLoading(false); }
    };

    return (
        <main className="min-h-screen p-4 sm:p-8 bg-slate-50 flex flex-col items-center justify-center">
            <div className="mb-4"><BackToHomeButton></BackToHomeButton></div>

            <div className="max-w-lg w-full bg-white border border-slate-200 shadow-sm p-8 rounded-sm">

                <div className="flex border-b border-slate-900 mb-8">
                    <button className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest ${!isSignUp ? 'bg-slate-900 text-white' : 'text-slate-500'}`} onClick={() => setIsSignUp(false)}>Login</button>
                    <button className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest ${isSignUp ? 'bg-slate-900 text-white' : 'text-slate-500'}`} onClick={() => setIsSignUp(true)}>Registrati</button>
                </div>

                {error && <div className="p-3 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest mb-4">{error}</div>}

                <form onSubmit={handleAuth} className="space-y-4">
                    {isSignUp && (
                        <div className="space-y-4 border-b border-slate-200 pb-6">
                            <div className="flex items-center gap-4">
                                <AvatarUpload currentAvatarUrl={avatarUrl} onUploadSuccess={setAvatarUrl} />
                                <div className="flex-1">
                                    <input type="text" placeholder="NOME" className="w-full p-2 border border-slate-300 text-[10px] font-black uppercase rounded-sm mb-2" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                                    <input type="text" placeholder="COGNOME" className="w-full p-2 border border-slate-300 text-[10px] font-black uppercase rounded-sm" value={lastName} onChange={e => setLastName(e.target.value)} required />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <select className="p-2 border border-slate-300 text-[10px] font-black uppercase rounded-sm" value={gender} onChange={e => setGender(e.target.value as 'M' | 'F')}><option value="M">MASCHILE</option><option value="F">FEMMINILE</option></select>
                                <input type="tel" placeholder="TELEFONO" className="p-2 border border-slate-300 text-[10px] font-black uppercase rounded-sm" value={phone} onChange={e => setPhone(e.target.value)} required />
                            </div>
                            <input type="number" step="0.01" placeholder="RANKING INIZIALE" className="w-full p-2 border border-slate-300 text-[10px] font-black uppercase rounded-sm" value={initialRanking} onChange={e => setInitialRanking(e.target.value)} />
                            <div className="grid grid-cols-2 gap-2">
                                <select className="p-2 border border-slate-300 text-[10px] font-black uppercase rounded-sm" value={preferredSide} onChange={e => setPreferredSide(e.target.value)}><option value="Left">LATO SX</option><option value="Right">LATO DX</option><option value="Both">BOTH</option></select>
                                <select className="p-2 border border-slate-300 text-[10px] font-black uppercase rounded-sm" value={dominantHand} onChange={e => setDominantHand(e.target.value)}><option value="Destro">DESTRO</option><option value="Mancino">MANCINO</option></select>
                            </div>
                            <label className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase"><input type="checkbox" required checked={privacyAccepted} onChange={e => setPrivacyAccepted(e.target.checked)} /> Accetto privacy</label>
                        </div>
                    )}

                    <input type="email" placeholder="EMAIL" className="w-full p-2 border border-slate-300 text-[10px] font-black uppercase rounded-sm" value={email} onChange={e => setEmail(e.target.value)} required />
                    <input type="password" placeholder="PASSWORD" className="w-full p-2 border border-slate-300 text-[10px] font-black uppercase rounded-sm" value={password} onChange={e => setPassword(e.target.value)} required />

                    <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest py-4 rounded-sm hover:bg-black disabled:opacity-50">
                        {loading ? 'ELABORAZIONE...' : isSignUp ? 'REGISTRATI' : 'ACCEDI'}
                    </button>
                </form>
            </div>
        </main>
    );
}
