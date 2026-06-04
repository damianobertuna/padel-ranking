'use client';

import { useState } from 'react';
import AvatarUpload from '@/components/AvatarUpload';
import { updatePlayerAvatar } from '@/actions/player-actions';

interface EditAvatarProps {
    playerId: number;
    currentAvatarUrl: string | null;
}

export default function EditAvatar({ playerId, currentAvatarUrl }: EditAvatarProps) {
    const [isUpdating, setIsUpdating] = useState(false);

    const handleAvatarChange = async (newUrl: string) => {
        setIsUpdating(true);
        try {
            // Chiama la Server Action che abbiamo appena creato
            await updatePlayerAvatar(playerId, newUrl);
        } catch (error: any) {
            alert(`Errore durante il salvataggio: ${error.message}`);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <AvatarUpload
                currentAvatarUrl={currentAvatarUrl}
                onUploadSuccess={handleAvatarChange}
            />
            {isUpdating && (
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest animate-pulse mt-2">
                    Salvataggio in corso...
                </span>
            )}
        </div>
    );
}
