'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AvatarUploadProps {
    playerId?: number;
    currentAvatarUrl: string | null;
    onUploadSuccess?: (url: string) => void;
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
            if (file.size > 2 * 1024 * 1024) throw new Error('MAX 2MB');
            if (!file.type.startsWith('image/')) throw new Error('SOLO IMMAGINI');

            const filePath = `avatars/${playerId || crypto.randomUUID()}-${Date.now()}.png`;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
            setPreviewUrl(publicUrl);

            if (playerId) {
                await supabase.from('players').update({ avatar_url: publicUrl }).eq('id', playerId);
                router.refresh();
            }
            if (onUploadSuccess) onUploadSuccess(publicUrl);
        } catch (err: any) { setError(err.message); } finally { setUploading(false); }
    };

    const displayUrl = previewUrl || currentAvatarUrl;

    return (
        <div className="flex flex-col items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-sm">
            <div className="relative w-20 h-20 bg-slate-200 border border-slate-300 flex items-center justify-center overflow-hidden">
                {displayUrl ? (
                    <img src={displayUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                    <span className="text-[10px] font-black uppercase text-slate-400">NO IMG</span>
                )}
                {uploading && (
                    <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center">
                        <span className="text-[9px] font-black text-white animate-pulse">...</span>
                    </div>
                )}
            </div>

            <label className="cursor-pointer w-full text-center bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest py-2 hover:bg-black transition-colors">
                {uploading ? 'CARICAMENTO...' : 'CARICA FOTO'}
                <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="hidden" />
            </label>

            {error && <p className="text-[9px] font-black text-red-600 uppercase tracking-widest">{error}</p>}
        </div>
    );
}
