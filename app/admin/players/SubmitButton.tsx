'use client';

import { useFormStatus } from 'react-dom';
import { t } from '@/lib/i18n';

export function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full md:w-auto bg-slate-900 hover:bg-black disabled:bg-slate-300 disabled:text-slate-500 text-white font-black text-[9px] uppercase tracking-widest py-2 px-4 rounded-sm transition-all shadow-none active:scale-[0.98] flex items-center justify-center gap-1.5 whitespace-nowrap min-w-[60px]"
        >
            {pending ? (
                <>
                    <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>...</span>
                </>
            ) : (
                t('ui', 'SALVA')
            )}
        </button>
    );
}
