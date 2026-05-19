'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ResolveMatchButtonProps {
    matchId: string;
}

export default function ResolveMatchButton({ matchId }: ResolveMatchButtonProps) {
    const [isRedirecting, setIsRedirecting] = useState(false);
    const router = useRouter();

    const handleClick = () => {
        setIsRedirecting(true);
        router.push(`/resolve-match/${matchId}`);
    };

    return (
        <button
            onClick={handleClick}
            disabled={isRedirecting}
            className="flex-1 text-center bg-slate-800 hover:bg-slate-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm font-bold py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
        >
            {isRedirecting ? (
                <>
                    <svg className="animate-spin h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Apertura Referto...</span>
                </>
            ) : (
                'Inserisci Risultato'
            )}
        </button>
    );
}
