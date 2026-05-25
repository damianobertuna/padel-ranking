'use client';

import { useState } from 'react';
import Link from 'next/link';
import { canUserResolveMatch } from '@/lib/matchRules';
import DeleteMatchButton from '@/components/DeleteMatchButton';
import ResolveMatchButton from '@/components/ResolveMatchButton';
import { useRouter } from "next/navigation";
import { Match, PendingMatchCardProps, Club } from '@/types';

export default function PendingMatchCard({
                                             match,
                                             rawPlayers,
                                             currentUserPlayer,
                                             clubs
                                         }: PendingMatchCardProps & { clubs?: Club[] }) {

    const [isManaging, setIsManaging] = useState(false);
    const router = useRouter();

    const matchClub = clubs?.find(c => c.id === match.club_id);

    const generaLinkWhatsAppLocal = (m: Match) => {
        const getPlayerObj = (id: number | null) => rawPlayers.find(player => player.id === id) || null;
        const pA1 = getPlayerObj(m.team_a_left_id); const pA2 = getPlayerObj(m.team_a_right_id);
        const pB1 = getPlayerObj(m.team_b_left_id); const pB2 = getPlayerObj(m.team_b_right_id);

        const dataFormattata = new Date(m.match_date || m.created_at).toLocaleString('it-IT', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
        });
        const clubText = matchClub ? `${matchClub.name}${matchClub.city ? ` (${matchClub.city})` : ''}` : 'Da definire';

        const testo = `🎾 *RanKING Padel - Convocazione Match* 🎾\n\n📅 *Data:* ${dataFormattata}\n📍 *Campo:* ${clubText}\n\n👥 *SQUADRA A:*\n• ${pA1 ? `${pA1.first_name} ${pA1.last_name}` : 'Slot Libero'} (${pA1 ? pA1.ranking.toFixed(2) : '0.00'})\n• ${pA2 ? `${pA2.first_name} ${pA2.last_name}` : 'Slot Libero'} (${pA2 ? pA2.ranking.toFixed(2) : '0.00'})\n\n👥 *SQUADRA B:*\n• ${pB1 ? `${pB1.first_name} ${pB1.last_name}` : 'Slot Libero'} (${pB1 ? pB1.ranking.toFixed(2) : '0.00'})\n• ${pB2 ? `${pB2.first_name} ${pB2.last_name}` : 'Slot Libero'} (${pB2 ? pB2.ranking.toFixed(2) : '0.00'})\n\n👉 Accedi all'app per completare la formazione o aggiungere il risultato!`;

        return `https://wa.me/?text=${encodeURIComponent(testo)}`;
    };

    const renderPlayerSlot = (id: number | null, sideLabel: string) => {
        if (!id) return (
            <div className="py-1.5 px-2 bg-amber-50/60 border border-dashed border-amber-200 rounded-lg">
                <span className="text-[10px] text-amber-600 font-black tracking-tight uppercase">➕ {sideLabel}</span>
            </div>
        );

        const p = rawPlayers.find(player => player.id === id);
        return (
            <div className="text-xs font-bold text-slate-800 truncate py-0.5 flex items-center justify-center gap-1">
                <span>{p ? `${p.first_name} ${p.last_name}` : 'Sconosciuto'}</span>
                {p && <span className="text-[9px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1 rounded">{p.ranking.toFixed(1)}</span>}
            </div>
        );
    };

    const isMatchComplete = Boolean(match.team_a_left_id && match.team_a_right_id && match.team_b_left_id && match.team_b_right_id);
    const authCtx = currentUserPlayer ? { userRole: currentUserPlayer.role as 'admin' | 'user', userPlayerId: currentUserPlayer.id } : null;
    const canResolve = isMatchComplete && canUserResolveMatch(authCtx, match as any);

    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between gap-4 transition-all hover:border-slate-300">
            <div>
                <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-mono text-slate-400">ID: #{match.id.slice(0, 8)}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${isMatchComplete ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-100 text-amber-800 animate-pulse'}`}>
                        {isMatchComplete ? 'Match Pronto' : 'Aperto'}
                    </span>
                </div>

                {(match.match_date || matchClub) && (
                    <div className="flex flex-col gap-1.5 mb-4 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {match.match_date && (
                            <div className="flex items-center gap-2 font-semibold">📅 {new Date(match.match_date).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                        )}
                        {matchClub && (
                            <div className="flex items-center gap-2 truncate">📍 {matchClub.name}</div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-blue-50/50 p-2 rounded-lg border border-blue-100 space-y-1">
                        <div className="text-[9px] font-black text-blue-600 uppercase mb-1">Team A</div>
                        {renderPlayerSlot(match.team_a_left_id, 'SX')}
                        {renderPlayerSlot(match.team_a_right_id, 'DX')}
                    </div>
                    <div className="bg-emerald-50/50 p-2 rounded-lg border border-emerald-100 space-y-1">
                        <div className="text-[9px] font-black text-emerald-600 uppercase mb-1">Team B</div>
                        {renderPlayerSlot(match.team_b_left_id, 'SX')}
                        {renderPlayerSlot(match.team_b_right_id, 'DX')}
                    </div>
                </div>
            </div>

            {currentUserPlayer && (
            <div className="flex flex-col gap-2">
                <a href={generaLinkWhatsAppLocal(match)} target="_blank" rel="noopener noreferrer" className="w-full inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2 px-4 rounded-xl text-[11px] transition-colors">
                    💬 Condividi su WhatsApp
                </a>

                <div className="flex gap-2 w-full">
                    {/* Bottoni di gestione - Sempre accessibili per modificare o risolvere */}
                    <button
                        onClick={() => {
                            setIsManaging(true);
                            router.push(`/match/${match.id}/join`);
                        }}
                        disabled={isManaging}
                        className="flex-[2] text-center bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        {isManaging ? 'Caricamento...' : (isMatchComplete ? 'Gestisci / Modifica' : 'Unisciti / Invita')}
                    </button>

                    {canResolve && <ResolveMatchButton matchId={match.id} />}
                    {(currentUserPlayer?.role === 'admin' || canResolve) && <DeleteMatchButton matchId={match.id} />}
                </div>
            </div>
            )}
        </div>
    );
}
