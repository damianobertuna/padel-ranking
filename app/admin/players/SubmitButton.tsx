'use client';

import { useFormStatus } from 'react-dom';

export function SubmitButton() {
    // Questo hook React intercetta automaticamente lo stato di caricamento del form genitore
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-sm active:scale-[0.99] text-sm flex items-center justify-center gap-2"
        >
            {pending ? (
                <>
                    <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Salvataggio in corso...</span>
                </>
            ) : (
                'Salva modifiche'
            )}
        </button>
    );
}
