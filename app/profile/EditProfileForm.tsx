'use client';

import { useState, useRef } from 'react';
import { updateOwnProfile } from '@/actions/player-actions';

interface EditProfileFormProps {
    player: {
        id: number;
        first_name: string;
        last_name: string;
        preferred_side: string;
        dominant_hand: string;
        avatar_url?: string;
    };
}

export default function EditProfileForm({ player }: EditProfileFormProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(player.avatar_url || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Gestisce l'anteprima istantanea dell'immagine selezionata
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        // Next.js gestisce nativamente i file nel FormData!
        const formData = new FormData(e.currentTarget);

        try {
            await updateOwnProfile(formData);
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

            <input type="hidden" name="playerId" value={player.id} />

            {/* SEZIONE FOTO PROFILO */}
            <div className="mb-8 flex flex-col sm:flex-row items-center gap-6">
                <div
                    className="w-24 h-24 rounded-full bg-slate-100 border-4 border-slate-50 shadow-sm overflow-hidden flex items-center justify-center cursor-pointer relative group"
                    onClick={() => fileInputRef.current?.click()}
                >
                    {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-3xl font-black text-slate-300">
                            {player.first_name.charAt(0)}{player.last_name.charAt(0)}
                        </span>
                    )}

                    {/* Overlay scuro all'hover */}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                </div>

                <div className="text-center sm:text-left">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest mb-1"
                    >
                        Cambia Foto Profilo
                    </button>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">JPG, PNG o WEBP. Max 2MB.</p>
                    {/* Input file nascosto */}
                    <input
                        type="file"
                        name="avatar"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        className="hidden"
                    />
                </div>
            </div>

            {/* I CAMPI DI TESTO (uguali a prima) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label htmlFor="firstName" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Nome</label>
                    <input type="text" id="firstName" name="firstName" defaultValue={player.first_name} required className="w-full h-[42px] px-3 bg-slate-50 border border-slate-200 rounded-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all" />
                </div>
                <div>
                    <label htmlFor="lastName" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Cognome</label>
                    <input type="text" id="lastName" name="lastName" defaultValue={player.last_name} required className="w-full h-[42px] px-3 bg-slate-50 border border-slate-200 rounded-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all" />
                </div>
                {/* LATO PREFERITO */}
                <div>
                    <label htmlFor="preferredSide" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                        Lato Preferito
                    </label>
                    <select
                        id="preferredSide"
                        name="preferredSide"
                        defaultValue={player.preferred_side}
                        className="w-full h-[42px] px-3 bg-slate-50 border border-slate-200 rounded-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all appearance-none"
                    >
                        {/* Devono coincidere esattamente con Right, Left, Both */}
                        <option value="Right">Destra</option>
                        <option value="Left">Sinistra</option>
                        <option value="Both">Entrambi</option>
                    </select>
                </div>

                {/* MANO DOMINANTE */}
                <div>
                    <label htmlFor="dominantHand" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                        Mano Dominante
                    </label>
                    <select
                        id="dominantHand"
                        name="dominantHand"
                        defaultValue={player.dominant_hand}
                        className="w-full h-[42px] px-3 bg-slate-50 border border-slate-200 rounded-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all appearance-none"
                    >
                        {/* Devono coincidere esattamente con Destro, Mancino */}
                        <option value="Destro">Destro</option>
                        <option value="Mancino">Mancino</option>
                    </select>
                </div>
            </div>

            {/* MESSAGGI */}
            {message && (
                <div className={`mb-6 p-3 text-xs font-bold uppercase tracking-widest rounded-sm border-l-4 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-500' : 'bg-red-50 text-red-700 border-red-500'}`}>
                    {message.text}
                </div>
            )}

            {/* BOTTONE SALVATAGGIO */}
            <div className="flex justify-end">
                <button type="submit" disabled={isSaving} className="h-[42px] px-6 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-sm transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px]">
                    {isSaving ? <span className="animate-pulse">Salvataggio...</span> : 'Salva Modifiche'}
                </button>
            </div>
        </form>
    );
}
