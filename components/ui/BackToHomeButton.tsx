'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface BackToHomeButtonProps {
    tab?: 'ranking' | 'pending' | 'completed';
    label?: string;
    playerPage?: number;
}

export default function BackToHomeButton({ tab = 'ranking', label, playerPage }: BackToHomeButtonProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleNavigation = () => {
        startTransition(() => {
            let url = '/';
            if (tab === 'pending') {
                url = '/?tab=pending';
            } else if (tab === 'completed') {
                url = '/?tab=completed';
            } else if (playerPage && playerPage > 1) {
                url = `/?playerPage=${playerPage}`;
            }
            router.push(url);
        });
    };

    const defaultLabel =
        tab === 'pending' ? 'MATCH' :
            tab === 'completed' ? 'RISULTATI' :
                'CLASSIFICA';

    const displayLabel = label || defaultLabel;

    return (
        <button
            onClick={handleNavigation}
            disabled={isPending}
            className={`
                inline-flex items-center justify-center gap-2 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border transition-all active:scale-[0.98]
                ${isPending
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-wait'
                : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50'
            }
            `}
        >
            {isPending ? (
                <>
                    <svg className="animate-spin h-3 w-3 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>CARICAMENTO...</span>
                </>
            ) : (
                <>
                    <span>←</span>
                    <span>{displayLabel}</span>
                </>
            )}
        </button>
    );
}
