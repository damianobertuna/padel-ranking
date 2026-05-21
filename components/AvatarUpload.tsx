'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AvatarUploadProps {
    playerId?: number; // Opzionale per la fase di registrazione
    currentAvatarUrl: string | null;
    onUploadSuccess?: (url: string) => void; // Richiamata nel form di iscrizione
}

export default function AvatarUpload({ playerId, currentAvatarUrl, onUploadSuccess }: AvatarUploadProps) {
    const supabase = createClient();
    const router = useRouter();
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            setError('');

            if (!event.target.files || event.target.files.length === 0) return;

            const file = event.target.files[0];
            if (file.size > 2 * 1024 * 1024) throw new Error('File troppo pesante! Massimo 2MB.');
            if (!file.type.startsWith('image/')) throw new Error('Il file deve essere un’immagine.');

            const fileExt = file.name.split('.').pop();
            const uniqueId = playerId ? String(playerId) : crypto.randomUUID();
            const fileName = `${uniqueId}-${Date.now()}.${fileExt}`;
            const filePath = `profile-pictures/${fileName}`;

            // 1. Caricamento su Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { cacheControl: '3600', upsert: true });

            if (uploadError) throw uploadError;

            // 2. Recupero URL Pubblico
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setPreviewUrl(publicUrl);

            // 3. Salvataggio diretto a DB (se il player esiste già)
            if (playerId) {
                const { error: updateError } = await supabase
                    .from('players')
                    .update({ avatar_url: publicUrl })
                    .eq('id', playerId);

                if (updateError) throw updateError;
                router.refresh();
            }

            // 4. Comunicazione al form padre (se in fase di registrazione)
            if (onUploadSuccess) {
                onUploadSuccess(publicUrl);
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Errore durante il caricamento.');
        } finally {
            setUploading(false);
        }
    };

    const displayUrl = previewUrl || currentAvatarUrl;

    return (
        <div className="flex flex-col items-center space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200/60 max-w-[160px] shrink-0">
            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center">
                {displayUrl ? (
                    <img src={displayUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                    <span className="text-xl font-black select-none text-slate-400">👤</span>
                )}
                {uploading && (
                    <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    </div>
                )}
            </div>
            <label className="cursor-pointer text-[11px] font-black uppercase text-indigo-600 hover:text-indigo-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs transition-all">
                {uploading ? 'Attendi...' : 'Sfoglia'}
                <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="hidden" />
            </label>
            {error && <p className="text-[9px] font-bold text-rose-600 text-center">{error}</p>}
        </div>
    );
}
