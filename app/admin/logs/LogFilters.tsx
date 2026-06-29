'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { t } from '@/lib/i18n';

export default function LogFilters() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const currentSearch = searchParams.get('search') || '';
    const currentType = searchParams.get('type') || '';

    const handleUpdateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());

        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }

        // Se cambiamo un filtro, torniamo sempre alla prima pagina
        params.delete('page');

        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`);
        });
    };

    return (
        <div className="bg-slate-50 p-4 rounded-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-end">

            {/* RICERCA TESTUALE */}
            <div className="w-full md:w-1/2">
                <label htmlFor="searchLog" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                    {t('admin', 'LOG_FILTER_SEARCH_LABEL')}
                </label>
                <input
                    type="text"
                    id="searchLog"
                    defaultValue={currentSearch}
                    onChange={(e) => handleUpdateFilter('search', e.target.value)}
                    placeholder="Es. Mario Rossi..."
                    className="w-full h-[42px] px-3 bg-white border border-slate-200 rounded-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
            </div>

            {/* FILTRO TIPO AZIONE */}
            <div className="w-full md:w-1/3">
                <label htmlFor="typeFilter" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                    {t('admin', 'LOG_FILTER_TYPE_LABEL')}
                </label>
                <select
                    id="typeFilter"
                    defaultValue={currentType}
                    onChange={(e) => handleUpdateFilter('type', e.target.value)}
                    className="w-full h-[42px] px-3 bg-white border border-slate-200 rounded-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all appearance-none"
                >
                    <option value="">Tutte le azioni</option>

                    <optgroup label="Gestione Giocatori">
                        <option value="UPDATE_PLAYER">UPDATE_PLAYER (Modifica Admin)</option>
                        <option value="UPDATE_OWN_PROFILE">UPDATE_OWN_PROFILE (Modifica Utente)</option>
                        <option value="UPDATE_AVATAR">UPDATE_AVATAR (Cambio Foto)</option>
                        <option value="DELETE_PLAYER">DELETE_PLAYER (Eliminazione)</option>
                    </optgroup>

                    <optgroup label="Gestione Match">
                        <option value="MATCH_CREATED">MATCH_CREATED (Nuova Partita)</option>
                        <option value="MATCH_UPDATED">MATCH_UPDATED (Modifica Partita)</option>
                        <option value="MATCH_RESOLVED">MATCH_RESOLVED (Risultato Inserito)</option>
                        <option value="MATCH_DELETED">MATCH_DELETED (Cancellazione Manuale)</option>
                        <option value="MATCH_DELETED_AUTO">MATCH_DELETED_AUTO (Partita Vuota)</option>
                    </optgroup>

                    <optgroup label="Iscrizioni">
                        <option value="PLAYER_JOINED_MATCH">PLAYER_JOINED_MATCH (Ingresso Utente)</option>
                        <option value="PLAYER_LEFT_MATCH">PLAYER_LEFT_MATCH (Uscita Utente)</option>
                    </optgroup>

                    <optgroup label="Sistema">
                        <option value="LOGIN">LOGIN (Accessi)</option>
                        <option value="SYSTEM_SEED">SYSTEM_SEED (Popolamento Dati)</option>
                    </optgroup>
                </select>
            </div>

            {/* PULSANTE RESET E INDICATORE */}
            <div className="w-full md:w-auto flex items-center justify-end gap-3 h-[42px]">
                {isPending && <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Aggiornamento...</span>}

                {(currentSearch || currentType) && (
                    <button
                        onClick={() => router.replace(pathname)}
                        className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-red-600 transition-colors"
                    >
                        Resetta Filtri
                    </button>
                )}
            </div>
        </div>
    );
}

