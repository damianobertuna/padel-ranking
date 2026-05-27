'use client';
import { useTransition } from 'react';
import { deleteClub } from '@/actions/club-actions';

export default function DeleteClubButton({ clubId }: { clubId: number }) {
    const [isPending, startTransition] = useTransition();

    return (
        <button
            onClick={() => confirm("Eliminare questo circolo?") && startTransition(() => deleteClub(clubId))}
            disabled={isPending}
            className="text-[9px] font-black text-red-600 uppercase tracking-widest border border-red-200 px-3 py-1 hover:bg-red-50 disabled:opacity-50 rounded-sm"
        >
            {isPending ? '...' : 'ELIMINA'}
        </button>
    );
}
