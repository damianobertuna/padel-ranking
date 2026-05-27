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

    // --- NUOVA LOGICA: Calcolo del range di livello ---
    const activePlayerIds = [
        match.team_a_left_id, match.team_a_right_id,
        match.team_b_left_id, match.team_b_right_id
    ].filter(Boolean) as number[];

    const activeRankings = activePlayerIds
        .map(id => rawPlayers.find(p => p.id === id)?.ranking)
        .filter((r): r is number => r !== undefined);

    let levelText = 'DA DEFINIRE (NESSUN GIOCATORE)';
    if (activeRankings.length > 0) {
        const minLvl = Math.min(...activeRankings);
        const maxLvl = Math.max(...activeRankings);
        levelText = minLvl === maxLvl
            ? `${minLvl.toFixed(2)}`
            : `${minLvl.toFixed(2)} - ${maxLvl.toFixed(2)}`;
    }
    // ----------------------------------------------------

    const generaLinkWhatsAppLocal = (m: Match) => {
        const getPlayerObj = (id: number | null) => rawPlayers.find(player => player.id === id) || null;
        const pA1 = getPlayerObj(m.team_a_left_id); const pA2 = getPlayerObj(m.team_a_right_id);
        const pB1 = getPlayerObj(m.team_b_left_id); const pB2 = getPlayerObj(m.team_b_right_id);

        const dataFormattata = new Date(m.match_date || m.created_at).toLocaleString('it-IT', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
        });
        const clubText = matchClub ? `${matchClub.name}${matchClub.city ? ` (${matchClub.city})` : ''}` : 'Da definire';

        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const matchLink = `${baseUrl}/match/${m.id}/join`;

        const testo = `🎾 *RanKING Padel - Convocazione Match* 🎾\n\n📅 *Data:* ${dataFormattata}\n📍 *Campo:* ${clubText}\n📊 *Livello Attuale:* ${levelText}\n\n👥 *SQUADRA A:*\n• ${pA1 ? `${pA1.first_name} ${pA1.last_name}` : 'Slot Libero'} (${pA1 ? pA1.ranking.toFixed(2) : '0.00'})\n• ${pA2 ? `${pA2.first_name} ${pA2.last_name}` : 'Slot Libero'} (${pA2 ? pA2.ranking.toFixed(2) : '0.00'})\n\n👥 *SQUADRA B:*\n• ${pB1 ? `${pB1.first_name} ${pB1.last_name}` : 'Slot Libero'} (${pB1 ? pB1.ranking.toFixed(2) : '0.00'})\n• ${pB2 ? `${pB2.first_name} ${pB2.last_name}` : 'Slot Libero'} (${pB2 ? pB2.ranking.toFixed(2) : '0.00'})\n\n👉 *Tutte le info e gestione match qui:*\n🔗 ${matchLink}`;

        return `https://wa.me/?text=${encodeURIComponent(testo)}`;
    };

    const renderPlayerSlot = (id: number | null, sideLabel: string) => {
        if (!id) return (
            <div className="py-1.5 px-2 bg-slate-100 border border-dashed border-slate-300 rounded-sm">
                <span className="text-[10px] text-slate-500 font-black tracking-widest uppercase">➕ SLOT LIBERO ({sideLabel})</span>
            </div>
        );

        const p = rawPlayers.find(player => player.id === id);
        return (
            <div className="text-xs font-black uppercase text-slate-900 truncate py-0.5 flex items-center justify-center gap-1">
                <span>{p ? `${p.first_name} ${p.last_name}` : 'SCONOSCIUTO'}</span>
                {p && <span className="text-[9px] font-mono font-bold text-blue-600 bg-blue-50 px-1 border border-blue-100 rounded-sm">{p.ranking.toFixed(2)}</span>}
            </div>
        );
    };

    const isMatchComplete = Boolean(match.team_a_left_id && match.team_a_right_id && match.team_b_left_id && match.team_b_right_id);
    const authCtx = currentUserPlayer ? { userRole: currentUserPlayer.role as 'admin' | 'user', userPlayerId: currentUserPlayer.id } : null;
    const canResolve = isMatchComplete && canUserResolveMatch(authCtx, match as any);

    return (
        <div className="bg-white p-5 rounded-sm shadow-sm border border-slate-200 flex flex-col justify-between gap-4 transition-all hover:border-slate-300">
            <div>
                <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">ID: #{match.id.slice(0, 8)}</span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wider ${isMatchComplete ? 'bg-slate-900 text-white' : 'bg-amber-400 text-slate-900 animate-pulse'}`}>
                        {isMatchComplete ? 'MATCH PRONTO' : 'OPEN MATCH'}
                    </span>
                </div>

                {/* VISUALIZZAZIONE FISSA DI DATA, CAMPO E LIVELLO */}
                <div className="flex flex-col gap-1.5 mb-4 text-xs font-bold text-slate-500 bg-slate-50 p-3 rounded-sm border border-slate-200 uppercase tracking-wide">
                    {match.match_date && (
                        <div className="flex items-center gap-2">
                            <span className="text-slate-400">📅</span> {new Date(match.match_date).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                    )}

                    <div className="flex items-center gap-2 truncate">
                        <span className="text-slate-400">📍</span>
                        {matchClub?.maps_url ? (
                            <a
                                href={matchClub.maps_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline transition-colors [-webkit-tap-highlight-color:transparent]"
                            >
                                {matchClub.name} {matchClub.city && <span className="font-medium text-slate-400">({matchClub.city})</span>}
                            </a>
                        ) : matchClub ? (
                            <span className="text-slate-900">
                                {matchClub.name} {matchClub.city && <span className="font-medium text-slate-400">({matchClub.city})</span>}
                            </span>
                        ) : (
                            <span className="italic text-slate-400 font-medium">CAMPO DA DEFINIRE</span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 pt-1.5 border-t border-slate-200">
                        <span className="text-slate-400">📊</span>
                        <span>
                            RANK: <span className="text-slate-900 font-black">{levelText}</span>
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-slate-50 p-2 rounded-sm border border-slate-200 space-y-1">
                        <div className="text-[9px] font-black text-slate-900 uppercase tracking-widest mb-1.5">TEAM A</div>
                        {renderPlayerSlot(match.team_a_left_id, 'SX')}
                        {renderPlayerSlot(match.team_a_right_id, 'DX')}
                    </div>
                    <div className="bg-slate-50 p-2 rounded-sm border border-slate-200 space-y-1">
                        <div className="text-[9px] font-black text-slate-900 uppercase tracking-widest mb-1.5">TEAM B</div>
                        {renderPlayerSlot(match.team_b_left_id, 'SX')}
                        {renderPlayerSlot(match.team_b_right_id, 'DX')}
                    </div>
                </div>
            </div>

            {currentUserPlayer && (
                <div className="flex flex-col gap-2 border-t border-slate-200 pt-3 mt-1">
                    <a href={generaLinkWhatsAppLocal(match)} target="_blank" rel="noopener noreferrer" className="w-full inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-2.5 px-4 rounded-sm text-[10px] uppercase tracking-wider transition-colors [-webkit-tap-highlight-color:transparent] active:scale-[0.98]">
                        💬 CONDIVIDI CONVOCAZIONE
                    </a>

                    <div className="flex gap-2 w-full">
                        <button
                            onClick={() => {
                                setIsManaging(true);
                                router.push(`/match/${match.id}/join`);
                            }}
                            disabled={isManaging}
                            className="flex-[2] text-center bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider py-3 rounded-sm transition-all duration-150 ease-out active:scale-[0.96] flex items-center justify-center gap-2 [-webkit-tap-highlight-color:transparent]"
                        >
                            {isManaging ? 'ATTENDI...' : (isMatchComplete ? 'GESTISCI MATCH' : 'UNISCITI / INVITA')}
                        </button>

                        {canResolve && <ResolveMatchButton matchId={match.id} />}
                        {(currentUserPlayer?.role === 'admin' || canResolve) && <DeleteMatchButton matchId={match.id} />}
                    </div>
                </div>
            )}
        </div>
    );
}
