'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function SearchBar({ placeholder = "Cerca..." }: { placeholder?: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Inizializza lo stato leggendo l'URL attuale (utile se ricarichi la pagina)
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

    useEffect(() => {
        // Imposta un timer (Debounce)
        const delayDebounceFn = setTimeout(() => {
            const params = new URLSearchParams(searchParams);

            if (searchTerm) {
                params.set('search', searchTerm);
            } else {
                params.delete('search');
            }

            // Aggiorna l'URL usando replace (per non riempire la cronologia del tasto "Indietro")
            // scroll: false impedisce alla pagina di saltare in cima ad ogni lettera digitata
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });

        }, 300); // Aspetta 300ms prima di aggiornare l'URL

        // Pulisce il timer se l'utente digita una nuova lettera prima dei 300ms
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
