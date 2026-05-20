'use client';

import { useState } from 'react';
import Link from 'next/link';
import { canUserResolveMatch } from '@/lib/matchRules';
import DeleteMatchButton from '@/components/DeleteMatchButton';
import ResolveMatchButton from '@/components/ResolveMatchButton';
import { useRouter } from "next/navigation";
import { Match, PendingMatchCardProps } from '@/types';

export default function PendingMatchCard({
                                             match,
                                             rawPlayers,
                                             currentUserPlayer
                                         }: PendingMatchCardProps) {
    const [isJoining, setIsJoining] = useState(false);
    const router = useRouter();

    const generaLinkWhatsAppLocal = (m: Match) => {
        const getPlayerObj = (id: number | null) => rawPlayers.find(player => player.id === id) || null;

        const pA1 = getPlayerObj(m.team_a_left_id); const pA2 = getPlayerObj(m.team_a_right_id);
        const pB1 = getPlayerObj(m.team_b_left_id); const pB2 = getPlayerObj(m.team_b_right_id);

        const dataFormattata = new Date(m.created_at).toLocaleString('it-IT', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
        });

        const testo = `🎾 *RanKING Padel - Convocazione Match* 🎾\n\n📅 *Data d'organizzazione:* ${dataFormattata}\n\n👥 *SQUADRA A:*\n• ${pA1 ? `${pA1.first_name} ${pA1.last_name}` : 'Slot Libero'} (${pA1 ? pA1.ranking.toFixed(2) : '0.00'})\n• ${pA2 ? `${pA2.first_name} ${pA2.last_name}` : 'Slot Libero'} (${pA2 ? pA2.ranking.toFixed(2) : '0.00'})\n\n👥 *SQUADRA B:*\n• ${pB1 ? `${pB1.first_name} ${pB1.last_name}` : 'Slot Libero'} (${pB1 ? pB1.ranking.toFixed(2) : '0.00'})\n• ${pB2 ? `${pB2.first_name} ${pB2.last_name}` : 'Slot Libero'} (${pB2 ? pB2.ranking.toFixed(2) : '0.00'})\n\n👉 Accedi all'app per completare la formazione o aggiungere il risultato!`;
        return `https://wa.me/?text=${encodeURIComponent(testo)}`;
    };

    // Helper per estrarre in sicurezza il nome del giocatore e il relativo ranking
    const renderPlayerSlot = (id: number | null, sideLabel: string) => {
        if (!id) {
            return (
                <div className="py-1.5 px-2 bg-amber-50/60 border border-dashed border-amber-200 rounded-lg animate-pulse">
                    <span className="text-xs text-amber-600 font-black tracking-tight">
                        ➕ Slot Libero {sideLabel}
                    </span>
                </div>
            );
        }
        const p = rawPlayers.find(player => player.id === id);
        return (
            <div className="text-sm font-bold text-slate-800 truncate py-0.5 flex items-center justify-center gap-1">
                <span>{p ? `${p.first_name} ${p.last_name}` : 'Sconosciuto'}</span>
                {/* 👈 RISOLTO: Aggiunto il badge del ranking visibile a FE */}
                {p && (
                    <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1 rounded">
                        {p.ranking.toFixed(2)}
                    </span>
                )}
            </div>
        );
    };

    const isMatchComplete = Boolean(
        match.team_a_left_id &&
        match.team_a_right_id &&
        match.team_b_left_id &&
        match.team_b_right_id
    );

    const authCtx = currentUserPlayer ? { userRole: currentUserPlayer.role as 'admin' | 'user', userPlayerId: currentUserPlayer.id } : null;
    const canResolve = isMatchComplete && canUserResolveMatch(authCtx, match as any);

    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between gap-4 transition-all hover:border-slate-300">
            <div>
                <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-mono text-slate-400">ID: #{match.id.slice(0, 8)}</span>
                    {isMatchComplete ? (
                        <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full uppercase tracking-wider">Match Pronto</span>
                    ) : (
                        <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">Partita Aperta</span>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 flex flex-col justify-center space-y-1">
                        <div className="text-[9px] font-black text-blue-600 uppercase tracking-wider mb-1">Coppia A</div>
                        {renderPlayerSlot(match.team_a_left_id, 'SX')}
                        {renderPlayerSlot(match.team_a_right_id, 'DX')}
                    </div>
                    <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 flex flex-col justify-center space-y-1">
                        <div className="text-[9px] font-black text-emerald-600 uppercase tracking-wider mb-1">Coppia B</div>
                        {renderPlayerSlot(match.team_b_left_id, 'SX')}
                        {renderPlayerSlot(match.team_b_right_id, 'DX')}
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <a href={generaLinkWhatsAppLocal(match)} target="_blank" rel="noopener noreferrer" className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-sm">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397 0 11.948 0c3.173.001 6.154 1.24 8.396 3.486 2.242 2.246 3.479 5.23 3.477 8.406-.003 6.557-5.338 11.907-11.89 11.907-2.013-.001-3.99-.51-5.741-1.48L0 24zm6.59-4.846c1.66.986 3.288 1.447 4.805 1.448 5.41-.001 9.814-4.415 9.816-9.83.001-2.624-1.012-5.09-2.856-6.937C16.569 1.988 14.09 1.05 11.47 1.05c-5.416 0-9.821 4.415-9.824 9.83-.001 2.05.534 3.513 1.41 5.03L2.025 21.93l6.222-1.63z" /></svg>
                    Convoca su WhatsApp
                </a>

                <div className="flex gap-2 w-full">
                    {isMatchComplete ? (
                        canResolve ? <ResolveMatchButton matchId={match.id} /> : <div className="flex-1 text-center bg-slate-100 text-slate-400 text-xs py-2.5 rounded-xl italic select-none border border-slate-200 flex items-center justify-center">Sola lettura (non sei in campo)</div>
                    ) : (
                        <button
                            onClick={() => {
                                setIsJoining(true);
                                router.push(`\/match/${match.id}/join`);
                            }}
                            disabled={isJoining}
                            className="flex-1 text-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm font-bold py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                        >
                            {isJoining ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Apertura match...</span>
                                </>
                            ) : (
                                <span>Unisciti / Completa Match</span>
                            )}
                        </button>
                    )}

                    {(currentUserPlayer?.role === 'admin' || canResolve) && (
                        /* 👈 RISOLTO: Rimosso parseInt, ora viene inoltrata la stringa UUID pulita */
                        <DeleteMatchButton matchId={match.id} />
                    )}
                </div>
            </div>
        </div>
    );
}
