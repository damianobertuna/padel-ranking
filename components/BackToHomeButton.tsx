// components/BackToHomeButton.tsx
'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function BackToHomeButton() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleNavigation = () => {
        // startTransition dice a React: "Questa è una transizione asincrona, tieni traccia dello stato pending"
        startTransition(() => {
            router.push('/');
        });
    };

    return (
        <button
            onClick={handleNavigation}
            disabled={isPending}
            className={`
                inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all
                ${isPending
                ? 'bg-slate-200 text-slate-500 cursor-wait'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 shadow-sm'
            }
            `}
        >
            {isPending ? (
                <>
                    {/* Icona SVG di uno spinner che ruota */}
                    <svg className="animate-spin h-4 w-4 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Caricamento...</span>
                </>
            ) : (
                <>
                    <span>←</span>
                    <span>Torna alla classifica</span>
                </>
            )}
        </button>
    );
}
