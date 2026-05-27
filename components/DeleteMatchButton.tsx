'use client';

import { useTransition } from 'react';
import { deletePendingMatch } from '@/actions/match-actions';

interface DeleteMatchButtonProps {
    matchId: string;
}

export default function DeleteMatchButton({ matchId }: DeleteMatchButtonProps) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        if (window.confirm("ELIMINARE DEFINITIVAMENTE IL MATCH?")) {
            startTransition(async () => {
                try {
                    await deletePendingMatch(matchId);
                } catch (error: any) {
                    alert(`ERRORE: ${error.message || error}`);
                }
            });
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isPending}
            className={`
                p-2 border transition-colors flex items-center justify-center
                ${isPending
                ? 'bg-slate-100 border-slate-200 cursor-wait'
                : 'bg-white border-slate-200 text-slate-400 hover:border-red-600 hover:text-red-600'
            }
            `}
            title="Elimina Partita"
        >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeLinejoin="miter" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
        </button>
    );
}
