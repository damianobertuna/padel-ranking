'use client';

import { useState } from 'react';
import { inviteClubManager } from '@/actions/auth-actions';
import { t } from '@/lib/i18n';

interface Club {
    id: number;
    name: string;
    city?: string;
}

export default function InviteManagerModal({ clubs }: { clubs: Club[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [clubId, setClubId] = useState<number | ''>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

                if (!email || clubId === '' || !firstName || !lastName) {
            setError("Compila tutti i campi: nome, cognome, circolo ed email.");
            return;
        }

        setLoading(true);
        try {
            await inviteClubManager(email, Number(clubId), firstName, lastName);
            setSuccess(true);
            setEmail('');
            setFirstName('');
            setLastName('');
            setClubId('');

            // Chiude la modale in automatico dopo 2 secondi dal successo
            setTimeout(() => {
                setIsOpen(false);
                setSuccess(false);
            }, 2000);
        } catch (err: any) {
            setError(err.message || "Errore durante l'invio dell'invito.");
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => {
        setIsOpen(false);
        setError('');
        setSuccess(false);
        setEmail('');
        setClubId('');
    };

    return (
        <>
            {/* Bottone di apertura (Posizionalo dove preferisci nella pagina) */}
            <button
                onClick={() => setIsOpen(true)}
                className="bg-slate-900 text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors rounded-sm flex items-center gap-2"
            >
                <span>➕</span> {t('admin', 'BUTTON_INVITE_MANAGER')}
            </button>

            {/* Overlay Modale */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white w-full max-w-md p-6 rounded-sm shadow-xl">
                        <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">{t('form', 'MANAGER_INVITE_TITLE')}</h2>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
                        </div>

                        {success ? (
                            <div className="bg-green-50 text-green-700 p-4 font-bold text-xs uppercase tracking-widest text-center rounded-sm">
                                ✅ Invito inviato con successo!
                            </div>
                        ) : (
                                                        <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <div className="bg-red-50 text-red-700 p-3 text-[10px] font-bold uppercase rounded-sm">
                                        ⚠️ {error}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                                        Circolo da gestire
                                    </label>
                                    <select
                                        value={clubId}
                                        onChange={(e) => setClubId(e.target.value ? Number(e.target.value) : '')}
                                        className="w-full border border-slate-200 p-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-400"
                                    >
                                        <option value="">-- Seleziona un circolo --</option>
                                        {clubs.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} {c.city ? `(${c.city})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                                            Nome
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Mario"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="w-full border border-slate-200 p-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-400"
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
                                            className="w-full border border-slate-200 p-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-400"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                                        Indirizzo Email
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="es. mario.rossi@email.it"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full border border-slate-200 p-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-400"
                                        required
                                    />
                                </div>

                                <div className="pt-4 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        disabled={loading}
                                        className="flex-1 border border-slate-200 bg-white text-slate-600 px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-50"
                                    >
                                        Annulla
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 bg-blue-600 text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {loading ? 'INVIO...' : 'INVIA INVITO'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

