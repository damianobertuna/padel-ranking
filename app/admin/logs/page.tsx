import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import BackToHomeButton from "@/components/BackToHomeButton";
import LogFilters from './LogFilters';

export const revalidate = 0;
const LOGS_PER_PAGE = 20;

interface PageProps {
    // Aggiungiamo i tipi per i filtri di ricerca
    searchParams: Promise<{ page?: string; search?: string; type?: string }>;
}

export default async function AdminLogsPage({ searchParams }: PageProps) {
    const supabase = await createClient();

    // Risolviamo la promise dei parametri (Next.js 15)
    const resolvedParams = await searchParams;
    const currentPage = parseInt(resolvedParams.page || '1', 10) || 1;
    const searchQuery = resolvedParams.search || '';
    const typeQuery = resolvedParams.type || '';

    // Calcolo range per la paginazione
    const fromRange = (currentPage - 1) * LOGS_PER_PAGE;
    const toRange = fromRange + LOGS_PER_PAGE - 1;

    // 1. Costruiamo la query base
    let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(fromRange, toRange);

    // 2. Applichiamo i filtri se presenti
    if (typeQuery) {
        query = query.eq('action_type', typeQuery);
    }
    if (searchQuery) {
        query = query.or(`admin_name.ilike.%${searchQuery}%,details.ilike.%${searchQuery}%`);
    }

    // 3. Eseguiamo la query finale
    const { data: logs, count: totalLogsCount, error } = await query;

    const totalPages = totalLogsCount ? Math.ceil(totalLogsCount / LOGS_PER_PAGE) : 1;

    // Funzione helper per mantenere i filtri attivi quando si cambia pagina
    const buildPaginationUrl = (pageNumber: number) => {
        const params = new URLSearchParams();
        params.set('page', pageNumber.toString());
        if (searchQuery) params.set('search', searchQuery);
        if (typeQuery) params.set('type', typeQuery);
        return `/admin/logs?${params.toString()}`;
    };

    // --- WRAPPER PER LA PAGINAZIONE LATO SERVER ---
    const renderPagination = (total: number, current: number) => {
        if (total <= 1) return null;

        // Calcola la finestra di 5 pagine
        const maxVisible = 5;
        let start = Math.max(1, current - Math.floor(maxVisible / 2));
        let end = Math.min(total, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        const visiblePages = [];
        for (let i = start; i <= end; i++) {
            visiblePages.push(i);
        }

        // Helper interno per renderizzare il singolo bottone o Link
        const renderButton = (page: number, label: string | number, title: string, disabled: boolean, isActive: boolean = false) => {
            const buttonClass = `w-8 h-8 flex items-center justify-center border rounded-sm text-[10px] font-black uppercase tracking-wider transition-colors ${
                isActive
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white cursor-pointer'
            }`;

            // Se il bottone è disabilitato o è la pagina corrente, non è cliccabile
            if (disabled || isActive) {
                return (
                    <button
                        key={`log-page-${label}`}
                        type="button"
                        disabled={true}
                        title={title}
                        className={buttonClass}
                    >
                        {label}
                    </button>
                );
            }

            // Altrimenti generiamo un link che aggiorna l'URL preservando i filtri (senza far scrollare in alto la pagina)
            return (
                <Link
                    key={`log-page-${label}`}
                    href={buildPaginationUrl(page)}
                    scroll={false}
                    title={title}
                    className={buttonClass}
                >
                    {label}
                </Link>
            );
        };

        return (
            <div className="flex items-center justify-center gap-1 mt-6">
                {renderButton(1, '«', 'Prima Pagina', current === 1)}
                {renderButton(Math.max(1, current - 1), '‹', 'Precedente', current === 1)}

                {visiblePages.map(p => renderButton(p, p, `Pagina ${p}`, false, p === current))}

                {renderButton(Math.min(total, current + 1), '›', 'Successiva', current === total)}
                {renderButton(total, '»', 'Ultima Pagina', current === total)}
            </div>
        );
    };

    return (
        <main className="w-full max-w-4xl mx-auto px-4 sm:px-8">
            <div className="max-w-4xl w-full">

                <div className="mb-8 mt-2 border-b-2 border-slate-900 pb-4">
                    <BackToHomeButton />
                    <h1 className="text-3xl font-black text-slate-900 mt-2 uppercase tracking-tighter">Registro Attività</h1>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Audit di sistema - Tracciamento operazioni</p>
                </div>

                {error && <div className="bg-red-600 text-white p-4 text-[10px] font-black uppercase mb-4">Errore: {error.message}</div>}

                {/* COMPONENTE FILTRI */}
                <LogFilters />

                {/* Tabella Log */}
                <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
                    <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-3 bg-slate-50 border-b border-slate-200 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        <div className="col-span-2">Data</div>
                        <div className="col-span-3">Azione</div>
                        <div className="col-span-7">Dettagli</div>
                    </div>

                    {logs && logs.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                            {logs.map((log) => (
                                <div key={log.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-slate-50 transition-colors">
                                    <div className="col-span-2 font-mono text-[10px] text-slate-500 font-bold">
                                        {new Date(log.created_at).toLocaleDateString('it-IT')} <span className="block">{new Date(log.created_at).toLocaleTimeString('it-IT')}</span>
                                    </div>
                                    <div className="col-span-3">
                                        <span className={`text-[9px] font-black px-1.5 py-0.5 uppercase tracking-widest border ${
                                            log.action_type.includes('LOGIN') ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                                log.action_type.includes('UPDATE') ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                                                    log.action_type.includes('DELETE') ? 'bg-red-50 border-red-200 text-red-700' :
                                                        'bg-slate-100 border-slate-200 text-slate-600'
                                        }`}>
                                            {log.action_type}
                                        </span>
                                    </div>
                                    <div className="col-span-7 text-[11px] font-bold text-slate-900">
                                        {log.details}
                                        <span className="block text-[9px] font-black text-slate-400 uppercase mt-0.5">Operatore: {log.admin_name}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Nessun registro trovato con i filtri attuali</div>
                    )}
                </div>

                {/* Paginazione Aggiornata */}
                {renderPagination(totalPages, currentPage)}

            </div>
        </main>
    );
}
