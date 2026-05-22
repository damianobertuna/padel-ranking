// app/admin/clubs/DeleteClubButton.tsx
'use client';

import { useTransition } from 'react';
import { deleteClub } from '@/actions/club-actions';

export default function DeleteClubButton({ clubId }: { clubId: number }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        if (confirm("Sei sicuro di voler eliminare questo campo? I match associati diventeranno 'Non definito'.")) {
            startTransition(async () => {
                await deleteClub(clubId);
            });
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isPending}
            className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
            {isPending ? 'Elm...' : 'Elimina'}
        </button>
    );
}
