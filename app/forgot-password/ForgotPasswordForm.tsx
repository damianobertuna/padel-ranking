'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import BackToHomeButton from "@/components/ui/BackToHomeButton";
import dictAuth from '@/lib/i18n/dict-auth';

export default function ForgotPasswordForm() {
    const supabase = createClient();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const redirectTo = `${window.location.origin}/update-password`;
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo,
            });

            if (resetError) throw resetError;

            setSent(true);
        } catch (err: any) {
            setError(err.message || dictAuth.BUTTON_SEND_RESET);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="w-full max-w-4xl mx-auto px-4 sm:px-8">
            <div className="mb-4 mt-3">
                <BackToHomeButton />
            </div>

            <div className="max-w-lg w-full bg-white border border-slate-200 shadow-sm p-8 rounded-sm">
                <h1 className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-6">
                    {dictAuth.TITLE_FORGOT_PASSWORD}
                </h1>

                {error && (
                    <div className="p-3 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest mb-4">
                        {error}
                    </div>
                )}

                {sent ? (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-sm text-center">
                        <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest">
                            {dictAuth.RESET_EMAIL_SENT}
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="email"
                            placeholder={dictAuth.PLACEHOLDER_EMAIL_FORGOT}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-2 border border-slate-300 text-[10px] font-black uppercase rounded-sm"
                            required
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest py-4 rounded-sm hover:bg-black disabled:opacity-50 transition-colors"
                        >
                            {loading ? dictAuth.BUTTON_SENDING : dictAuth.BUTTON_SEND_RESET}
                        </button>
                    </form>
                )}
            </div>
        </main>
    );
}
