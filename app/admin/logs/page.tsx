import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const revalidate = 0; // Forza il caricamento in tempo reale

export default async function AdminAuditLogs() {
    const supabase = await createClient();

    // 1. Controllo sicurezza admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: adminCheck } = await supabase
        .from('players')
        .select('role')
        .eq('user_id', user.id)
        .single();

    if (!adminCheck || adminCheck.role !== 'admin') {
        redirect('/');
    }

    // 2. Scarichiamo gli ultimi 100 log ordinati dal più recente
    const { data: logs } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

    return (
        <main className="min-h-screen p-8 bg-slate-100 flex flex-col items-center">
            <div className="max-w-5xl w-full">

                <div className="mb-6">
                    <Link href="/" className="text-sm font-semibold text-indigo-600 hover:underline">← Torna alla Home</Link>
                    <h1 className="text-3xl font-bold text-slate-800 mt-2">Registro Attività (Audit Logs)</h1>
                    <p className="text-sm text-slate-500">Cronologia in tempo reale di tutte le modifiche amministrative apportate al sistema.</p>
                </div>

                {/* Tabella dei Log */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                <th className="p-4">Data / Ora</th>
                                <th className="p-4">Amministratore</th>
                                <th className="p-4">Operazione</th>
                                <th className="p-4">Dettaglio della Modifica</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                            {(!logs || logs.length === 0) ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-400 italic">
                                        Nessuna attività registrata finora.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => {
                                    const dataFormattata = new Date(log.created_at).toLocaleString('it-IT', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit'
                                    });

                                    return (
                                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                                                {dataFormattata}
                                            </td>
                                            <td className="p-4 font-semibold text-slate-700 whitespace-nowrap">
                                                {log.admin_name}
                                            </td>
                                            <td className="p-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            {log.action_type}
                          </span>
                                            </td>
                                            <td className="p-4 text-slate-600 leading-relaxed max-w-md break-words">
                                                {log.details}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </main>
    );
}
