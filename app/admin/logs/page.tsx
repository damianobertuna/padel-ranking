import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const revalidate = 0;

// Numero di log da mostrare per pagina
const LOGS_PER_PAGE = 15;

interface PageProps {
    searchParams: Promise<{ page?: string }>;
}

export default async function AdminLogsPage({ searchParams }: PageProps) {
    const supabase = await createClient();

    // 1. Intercettiamo la pagina corrente dai parametri dell'URL
    const resolvedParams = await searchParams;
    const currentPage = parseInt(resolvedParams.page || '1', 10) || 1;

    // 2. Calcoliamo gli indici di range per la query PostgreSQL
    const fromRange = (currentPage - 1) * LOGS_PER_PAGE;
    const toRange = fromRange + LOGS_PER_PAGE - 1;

    // 3. Scarichiamo solo i log del range corrente e chiediamo il conteggio totale ('exact')
    const { data: logs, count: totalLogsCount, error } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(fromRange, toRange);

    const totalPages = totalLogsCount ? Math.ceil(totalLogsCount / LOGS_PER_PAGE) : 1;

    return (
        <main className="min-h-screen p-4 sm:p-8 bg-slate-100 flex flex-col items-center">
            <div className="max-w-4xl w-full">

                {/* Pulsante Torna Indietro */}
                <Link href="/" className="text-sm font-semibold text-indigo-600 hover:underline mb-6 inline-block">
                    ← Torna alla Classifica
                </Link>

                {/* Intestazione Pagina */}
                <div className="flex justify-between items-baseline mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Registro Attività</h1>
                        <p className="text-xs text-slate-400 mt-1">Pannello di controllo e audit del sistema</p>
                    </div>
                    <span className="text-xs font-bold text-slate-400 font-mono bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm">
                        Pagina {currentPage} di {totalPages}
                    </span>
                </div>

                {error && (
                    <div className="bg-red-100 text-red-700 p-4 rounded-xl mb-4 text-sm font-semibold">
                        ❌ Errore nel caricamento dei log: {error.message}
                    </div>
                )}

                {/* Elenco dei Log */}
                <div className="space-y-2.5">
                    {logs && logs.length > 0 ? (
                        logs.map((log) => {
                            // Formattiamo la data in modo leggibile
                            const logDate = new Date(log.created_at).toLocaleString('it-IT', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                            });

                            return (
                                <div key={log.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                    <div className="flex items-start gap-3 min-w-0">
                                        {/* Badge del tipo di azione per colpo d'occhio rapido */}
                                        <span className={`px-2 py-0.5 rounded-md font-bold font-mono tracking-wide shrink-0 ${
                                            log.action_type === 'USER_LOGIN' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                                log.action_type === 'MATCH_RESOLVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                                    log.action_type === 'MATCH_DELETED' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                                                        'bg-slate-50 text-slate-600 border border-slate-100'
                                        }`}>
                                            {log.action_type}
                                        </span>

                                        {/* Descrizione del Log */}
                                        <div className="min-w-0">
                                            <p className="text-slate-700 font-medium leading-relaxed break-words">
                                                {log.details}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                                                Operatore: <span className="text-slate-600 font-semibold">{log.admin_name}</span> (ID: {log.admin_id})
                                            </p>
                                        </div>
                                    </div>

                                    {/* Data e Ora stampati a destra */}
                                    <div className="shrink-0 text-slate-400 font-mono text-[11px] self-end sm:self-center">
                                        {logDate}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-slate-500 italic text-sm text-center bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                            Nessun log registrato in questa pagina.
                        </p>
                    )}
                </div>

                {/* CONTROLLI DI PAGINAZIONE CON SCROLL PROTETTO */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-6">
                        <Link
                            href={`/admin/logs?page=${currentPage - 1}`}
                            scroll={false} // Mantiene la posizione della pagina senza balzi in alto
                            className={`px-4 py-2 bg-white border border-slate-200 text-sm font-bold text-slate-700 rounded-xl shadow-sm transition-all active:scale-95 ${
                                currentPage <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-slate-50'
                            }`}
                        >
                            ← Precedente
                        </Link>

                        <div className="text-xs font-bold text-slate-500 font-mono">
                            {currentPage} / {totalPages}
                        </div>

                        <Link
                            href={`/admin/logs?page=${currentPage + 1}`}
                            scroll={false} // Mantiene la posizione della pagina senza balzi in alto
                            className={`px-4 py-2 bg-white border border-slate-200 text-sm font-bold text-slate-700 rounded-xl shadow-sm transition-all active:scale-95 ${
                                currentPage >= totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-slate-50'
                            }`}
                        >
                            Successiva →
                        </Link>
                    </div>
                )}

            </div>
        </main>
    );
}
