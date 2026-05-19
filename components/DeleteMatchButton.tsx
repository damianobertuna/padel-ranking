'use client';

import { deletePendingMatch } from '@/actions/match-actions';

// 1. 👈 RISOLTO: Cambia il tipo di matchId da number a string
interface DeleteMatchButtonProps {
    matchId: string;
}

export default function DeleteMatchButton({ matchId }: DeleteMatchButtonProps) {
    const handleDelete = async () => {
        if (window.confirm("Sei sicuro di voler eliminare definitivamente questa partita in programma?")) {
            try {
                // Ora sia la prop che la Server Action parlano la stessa lingua (string)
                await deletePendingMatch(matchId);
            } catch (error: any) {
                alert(`Errore durante la cancellazione: ${error.message || error}`);
            }
        }
    };

    return (
        <button
            onClick={handleDelete}
            className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-slate-200 hover:border-rose-200"
            title="Elimina Partita"
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
        </button>
    );
}
