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
            className={`
                flex-1 text-center font-black text-[9px] uppercase tracking-widest py-3 px-4 transition-colors border
                ${isRedirecting
                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-wait'
                : 'bg-slate-900 text-white hover:bg-black border-slate-900'
            }
            `}
        >
            {isRedirecting ? 'CARICAMENTO...' : 'INSERISCI RISULTATO'}
        </button>
    );
}
