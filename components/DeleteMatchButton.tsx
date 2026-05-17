'use client';

import { deletePendingMatch } from '@/actions/match-actions';

interface DeleteMatchButtonProps {
    matchId: number;
}

export default function DeleteMatchButton({ matchId }: DeleteMatchButtonProps) {
    const handleDelete = async (e: React.FormEvent) => {
        e.preventDefault();

        if (window.confirm("Sei sicuro di voler eliminare definitivamente questa partita in programma?")) {
            try {
                await deletePendingMatch(matchId);
            } catch (error: any) {
                // AGGIORNATO: Mostra l'errore reale nel pop-up
                alert(`Errore durante la cancellazione: ${error.message || error}`);
                console.error(error);
            }
        }
    };

    return (
        <form onSubmit={handleDelete}>
            <button
                type="submit"
                className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold p-2 rounded transition-colors shadow-sm flex items-center justify-center h-full aspect-square"
                title="Annulla/Elimina partita"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        </form>
    );
}
