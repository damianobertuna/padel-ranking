'use client';

import { useState } from 'react';
import { updateManagerProfile } from '@/actions/manager-actions';

interface EditManagerProfileFormProps {
    firstName: string;
    lastName: string;
}

export default function EditManagerProfileForm({ firstName, lastName }: EditManagerProfileFormProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        const formData = new FormData(e.currentTarget);

        try {
            await updateManagerProfile(formData);
            setMessage({ type: 'success', text: 'Profilo aggiornato con successo!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-sm shadow-sm border border-slate-200">
            <h2 className="text-lg font-black uppercase tracking-tighter text-slate-900 mb-6 border-b-2 border-slate-100 pb-2">
                I Tuoi Dati
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label htmlFor="firstName" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Nome</label>
                    <input type="text" id="firstName" name="firstName" defaultValue={firstName} required className="w-full h-[42px] px-3 bg-slate-50 border border-slate-200 rounded-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all" />
                </div>
                <div>
                    <label htmlFor="lastName" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Cognome</label>
                    <input type="text" id="lastName" name="lastName" defaultValue={lastName} required className="w-full h-[42px] px-3 bg-slate-50 border border-slate-200 rounded-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all" />
                </div>
            </div>

            {message && (
                <div className={`mb-6 p-3 text-xs font-bold uppercase tracking-widest rounded-sm border-l-4 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-500' : 'bg-red-50 text-red-700 border-red-500'}`}>
                    {message.text}
                </div>
            )}

            <div className="flex justify-end">
                <button type="submit" disabled={isSaving} className="h-[42px] px-6 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-sm transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px]">
                    {isSaving ? <span className="animate-pulse">Salvataggio...</span> : 'Salva Modifiche'}
                </button>
            </div>
        </form>
    );
}
