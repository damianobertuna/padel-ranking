'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { t } from '@/lib/i18n/dictionary';

export default function SearchBar({ placeholder = t('ui', 'SEAECH_ONLY_PLACEHOLDER') }: { placeholder?: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());

            if (searchTerm) {
                params.set('search', searchTerm);
            } else {
                params.delete('search');
            }

            const newQueryString = params.toString();
            const currentQueryString = searchParams.toString();

            // === LA GUARDIA CRUCIALE PER EVITARE IL LOOP INFINITO ===
            // Aggiorna l'URL solo se la stringa dei parametri è effettivamente cambiata
            if (newQueryString !== currentQueryString) {
                router.replace(`${pathname}?${newQueryString}`, { scroll: false });
            }

        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, pathname, router, searchParams]);

    return (
        <div className="relative flex flex-1 w-full max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                🔍
            </span>
            <input
                type="text"
                className="w-full rounded-sm border border-slate-300 py-2.5 pl-9 pr-4 text-[11px] font-black uppercase tracking-widest text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all shadow-sm"
                placeholder={placeholder}
                onChange={(e) => setSearchTerm(e.target.value)}
                value={searchTerm}
            />
        </div>
    );
}

