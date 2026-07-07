'use client';
import { useState, useTransition } from 'react';
import { createClub } from '@/actions/club-actions';
import { t } from '@/lib/i18n';

export default function NewClubForm() {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const formData = new FormData();
        formData.append('name', name);
        formData.append('address', address);
        formData.append('city', city);

        startTransition(async () => {
            const result = await createClub(formData);
            if (result?.error) setError(result.error);
            else { setName(''); setAddress(''); setCity(''); }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-5 border border-slate-200 shadow-sm rounded-sm flex flex-col gap-4">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                {t('admin', 'CLUB_PAGE_ADD_TITLE')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('form', 'CLUB_ADD_NAME')}
                    className="p-2 border border-slate-300 bg-slate-50 text-xs font-bold text-slate-900 rounded-sm focus:border-slate-900 outline-none"
                    required
                />
                <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={t('form', 'CLUB_ADD_ADDRESS')}
                    className="p-2 border border-slate-300 bg-slate-50 text-xs font-bold text-slate-900 rounded-sm focus:border-slate-900 outline-none"
                />
                <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder={t('form', 'CLUB_ADD_CITY')}
                    className="p-2 border border-slate-300 bg-slate-50 text-xs font-bold text-slate-900 rounded-sm focus:border-slate-900 outline-none"
                />
            </div>
            <button type="submit" disabled={isPending || !name.trim()} className="bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-sm disabled:opacity-50">
                {isPending ? t('form', 'CLUB_ADD_SAVING') : t('admin', 'CLUB_PAGE_ADD_SUBMIT')}
            </button>
            {error && <p className="text-[9px] font-black text-red-600 uppercase">{error}</p>}
        </form>
    );
}
