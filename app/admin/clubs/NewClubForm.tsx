// app/admin/clubs/NewClubForm.tsx
'use client';

import { useState, useTransition } from 'react';
import { createClub } from '@/actions/club-actions';

export default function NewClubForm() {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState(''); // 👈 NUOVO: Stato per la città
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const formData = new FormData();
        formData.append('name', name);
        formData.append('address', address);
        formData.append('city', city); // 👈 NUOVO: Aggiunta al payload per il server

        startTransition(async () => {
            const result = await createClub(formData);
            if (result?.error) {
                setError(result.error);
            } else {
                setName('');
                setAddress('');
                setCity(''); // 👈 NUOVO: Reset del campo
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Aggiungi nuovo campo</h2>

            {/* Struttura a griglia/flex aggiornata per ospitare 3 campi senza stringerli troppo */}
            <div className="flex flex-col md:flex-row gap-3">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nome Circolo (es. Padel Mascalucia)"
                    className="flex-[1.5] bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    required
                />

                <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Via e Civico (es. Via Roma 10)"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />

                <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Città (es. Catania)"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
            </div>

            <button
                type="submit"
                disabled={isPending || !name.trim()}
                className="w-full sm:w-auto self-start bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-2 px-8 rounded-lg transition-colors text-sm shadow-sm"
            >
                {isPending ? 'Salvataggio...' : 'Aggiungi'}
            </button>

            {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
        </form>
    );
}
