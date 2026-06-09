'use client';

import { useState, useTransition } from 'react';
import { canUserResolveMatch } from '@/lib/matchRules';
import DeleteMatchButton from '@/components/DeleteMatchButton';
import ResolveMatchButton from '@/components/ResolveMatchButton';
import { useRouter } from "next/navigation";
import { Match, PendingMatchCardProps, Club } from '@/types';
import { leaveMatchAction, joinMatchAction } from '@/actions/match-actions';

export default function PendingMatchCard({
                                             match,
                                             rawPlayers,
                                             currentUserPlayer,
                                             clubs,
                                             playerTitles
                                         }: PendingMatchCardProps & { clubs?: Club[] }) {

    const isExpired = match.match_date ? new Date(match.match_date) < new Date() : false;
    const [isManaging, setIsManaging] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const matchClub = clubs?.find(c => c.id === match.club_id);

    // --- LOGICA LIVELLO E RANGE CONSENTITO ---
    const activePlayerIds = [
        match.team_a_left_id, match.team_a_right_id,
        match.team_b_left_id, match.team_b_right_id
    ].filter(Boolean) as number[];

    const activeRankings = activePlayerIds
        .map(id => rawPlayers.find(p => p.id === id)?.ranking)
        .filter((r): r is number => r !== undefined);

    let levelLabel = 'LIVELLO:';
    let levelText = 'DA DEFINIRE';

    if (activeRankings.length > 0) {
        const minLvl = Math.min(...activeRankings);
        const maxLvl = Math.max(...activeRankings);

        const isMatchComplete = activeRankings.length === 4;

        if (isMatchComplete) {
            // Se la partita è piena, mostriamo il livello reale in campo
            levelLabel = 'LIVELLO MATCH:';
            levelText = minLvl === maxLvl ? `${minLvl.toFixed(2)}` : `${minLvl.toFixed(2)} - ${maxLvl.toFixed(2)}`;
        } else {
            // Se ci sono slot liberi, calcoliamo e mostriamo il range matematico consentito
            levelLabel = 'RANGE CONSENTITO:';
            const minAllowed = Math.max(0, maxLvl - 0.25); // Impedisce ranking negativi
            const maxAllowed = minLvl + 0.25;
            levelText = `${minAllowed.toFixed(2)} - ${maxAllowed.toFixed(2)}`;
        }
    }

    // --- LOGICA DI DOMINIO E RUOLI ---
    const isMatchComplete = Boolean(match.team_a_left_id && match.team_a_right_id && match.team_b_left_id && match.team_b_right_id);
    const isUserInMatch = currentUserPlayer && activePlayerIds.includes(currentUserPlayer.id);
    const isAdmin = currentUserPlayer?.role === 'admin';
    const isOrganizer = currentUserPlayer?.id === match.organizer_id;

    // La VERA regola di autorizzazione:
    // Puoi gestire se sei Admin, se sei l'Organizzatore, oppure (per i vecchi match senza org) se sei in campo.
    const canManage = isAdmin || isOrganizer || (!match.organizer_id && isUserInMatch);

    // --- CALCOLO COMPATIBILITÀ LATO ---
    const fullCurrentUser = currentUserPlayer
        ? rawPlayers.find(p => p.id === currentUserPlayer.id)
        : null;

    const prefSide = fullCurrentUser?.preferred_side || 'Both';
    const canPlayLeft = prefSide === 'Left' || prefSide === 'Both';
    const canPlayRight = prefSide === 'Right' || prefSide === 'Both';

    const hasCompatibleFreeSlot =
        (canPlayLeft && (!match.team_a_left_id || !match.team_b_left_id)) ||
        (canPlayRight && (!match.team_a_right_id || !match.team_b_right_id));

    // --- MACCHINA A STATI PER L'AZIONE DEL BOTTONE ---
    let primaryActionLabel = '';
    let actionType: 'manage' | 'leave' | 'join' | 'view' = 'view';

    if (canManage) {
        primaryActionLabel = isMatchComplete ? 'GESTISCI MATCH' : 'MODIFICA MATCH';
        actionType = 'manage';
    } else if (isUserInMatch) {
        primaryActionLabel = 'LASCIA PARTITA';
        actionType = 'leave';
    } else if (!isMatchComplete) {
        if (hasCompatibleFreeSlot) {
            primaryActionLabel = 'UNISCITI ORA';
            actionType = 'join';
        } else {
            primaryActionLabel = 'LATO INCOMPATIBILE';
            actionType = 'view';
        }
    } else {
        primaryActionLabel = 'VEDI DETTAGLI';
        actionType = 'view';
    }
    // ---------------------------------------------

    const generaLinkWhatsAppLocal = (m: Match) => {
        const getPlayerObj = (id: number | null) => rawPlayers.find(player => player.id === id) || null;

        const pA1 = getPlayerObj(m.team_a_left_id); // Giocatore nello slot SX
        const pA2 = getPlayerObj(m.team_a_right_id); // Giocatore nello slot DX
        const pB1 = getPlayerObj(m.team_b_left_id); // Giocatore nello slot SX
        const pB2 = getPlayerObj(m.team_b_right_id); // Giocatore nello slot DX

        // ========================================================
        // CALCOLO DINAMICO DEI LATI PER GLI SLOT LIBERI (GESTIONE MIX)
        // ========================================================
        let labelA1 = "[SX]";
        let labelA2 = "[DX]";

        if (pA1 && !pA2) {
            // C'è il sinistro ma manca il destro. Se il sinistro è MIX, il destro può essere chiunque
            labelA2 = pA1.preferred_side === 'Both' ? "[SX/DX]" : "[DX]";
        } else if (!pA1 && pA2) {
            // Manca il sinistro ma c'è il destro. Se il destro è MIX, il sinistro può essere chiunque
            labelA1 = pA2.preferred_side === 'Both' ? "[SX/DX]" : "[SX]";
        }

        let labelB1 = "[SX]";
        let labelB2 = "[DX]";

        if (pB1 && !pB2) {
            labelB2 = pB1.preferred_side === 'Both' ? "[SX/DX]" : "[DX]";
        } else if (!pB1 && pB2) {
            labelB1 = pB2.preferred_side === 'Both' ? "[SX/DX]" : "[SX]";
        }

        // ========================================================
        // GEOLOCALIZZAZIONE DINAMICA CIRCOLO
        // ========================================================
        const dataFormattata = new Date(m.match_date || m.created_at).toLocaleString('it-IT', {
            weekday: 'short', // <-- AGGIUNTA: Include il giorno della settimana (es. "lun", "mar"...)
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });

        const clubText = matchClub ? `${matchClub.name}${matchClub.city ? ` (${matchClub.city})` : ''}` : 'Da definire';

        // Generiamo un URL di ricerca universale per Google Maps basato sul nome e sulla città del circolo
        const mapsUrl = matchClub
            ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(matchClub.name + ' ' + (matchClub.city || ''))}`
            : null;

        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const matchLink = `${baseUrl}/match/${m.id}/join`;

        // Costruzione del testo finale per WhatsApp
        const testo = `🎾 *RanKING Padel - Convocazione Match* 🎾\n\n` +
            `📅 *Data:* ${dataFormattata}\n` +
            `📍 *Campo:* ${clubText}\n` +
            (mapsUrl ? `🗺️ *Posizione:* ${mapsUrl}\n` : '') + // Inserisce la riga della mappa solo se il circolo è definito
            `📊 *Livello Attuale:* ${levelText}\n\n` +
            `👥 *SQUADRA A:*\n` +
            `• ${pA1 ? '[SX]' : labelA1} ${pA1 ? `${pA1.first_name} ${pA1.last_name}` : 'Slot Libero'} (${pA1 ? pA1.ranking.toFixed(2) : '0.00'})\n` +
            `• ${pA2 ? '[DX]' : labelA2} ${pA2 ? `${pA2.first_name} ${pA2.last_name}` : 'Slot Libero'} (${pA2 ? pA2.ranking.toFixed(2) : '0.00'})\n\n` +
            `👥 *SQUADRA B:*\n` +
            `• ${pB1 ? '[SX]' : labelB1} ${pB1 ? `${pB1.first_name} ${pB1.last_name}` : 'Slot Libero'} (${pB1 ? pB1.ranking.toFixed(2) : '0.00'})\n` +
            `• ${pB2 ? '[DX]' : labelB2} ${pB2 ? `${pB2.first_name} ${pB2.last_name}` : 'Slot Libero'} (${pB2 ? pB2.ranking.toFixed(2) : '0.00'})\n\n` +
            `👉 *Tutte le info e gestione match qui:*\n` +
            `🔗 ${matchLink}`;

        return `https://wa.me/?text=${encodeURIComponent(testo)}`;
    };

    const renderPlayerSlot = (id: number | null, sideLabel: string) => {
        if (!id) return (
            <div className="py-1.5 px-2 bg-slate-100 border border-dashed border-slate-300 rounded-sm">
                <span className="text-[10px] text-slate-500 font-black tracking-widest uppercase">➕ SLOT LIBERO ({sideLabel})</span>
            </div>
        );

        const p = rawPlayers.find(player => player.id === id);
        const titleInfo = p && playerTitles ? playerTitles[p.id] : null;

        return (
            <div className="w-full py-1 flex flex-col items-center justify-center gap-1 overflow-hidden">
                <span className="w-full text-center text-[11px] sm:text-xs font-black uppercase text-slate-900 truncate">
                    {p ? `${p.first_name} ${p.last_name}` : 'SCONOSCIUTO'}
                </span>
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                    {p && (
                        <span className="shrink-0 text-[9px] font-mono font-bold text-blue-600 bg-blue-50 px-1 border border-blue-100 rounded-sm">
                            {p.ranking.toFixed(2)}
                        </span>
                    )}
                    {titleInfo && titleInfo.type === 'KING' && (
                        <span className="shrink-0 px-1 py-0.5 bg-amber-100 text-amber-800 text-[8px] font-black tracking-widest uppercase rounded-sm flex items-center shadow-sm" title="King">
                            👑 {titleInfo.label}
                        </span>
                    )}
                    {titleInfo && titleInfo.type === 'FANALINO' && (
                        <span className="shrink-0 px-1 py-0.5 bg-slate-700 text-white text-[8px] font-black tracking-widest uppercase rounded-sm flex items-center shadow-sm" title="Fanalino">
                            🐢 {titleInfo.label}
                        </span>
                    )}
                    {p && match.organizer_id === p.id && (
                        <span className="shrink-0 px-1 py-0.5 bg-slate-900 text-amber-400 text-[8px] font-black tracking-widest uppercase rounded-sm flex items-center gap-0.5 shadow-sm" title="Organizzatore del Match">
                            👑 ORG
                        </span>
                    )}
                </div>
            </div>
        );
    };

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

                <div className="flex flex-col gap-1.5 mb-4 text-xs font-bold text-slate-500 bg-slate-50 p-3 rounded-sm border border-slate-200 uppercase tracking-wide">
                    {match.match_date && (
                        <div className="flex items-center gap-2">
                            <span className="text-slate-400">📅</span> {new Date(match.match_date).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                    )}
                    <div className="flex items-center gap-2 truncate">
                        <span className="text-slate-400">📍</span>
                        {matchClub?.maps_url ? (
                            <a href={matchClub.maps_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline transition-colors [-webkit-tap-highlight-color:transparent]">
                                {matchClub.name} {matchClub.city && <span className="font-medium text-slate-400">({matchClub.city})</span>}
                            </a>
                        ) : matchClub ? (
                            <span className="text-slate-900">{matchClub.name} {matchClub.city && <span className="font-medium text-slate-400">({matchClub.city})</span>}</span>
                        ) : (
                            <span className="italic text-slate-400 font-medium">CAMPO DA DEFINIRE</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 pt-1.5 border-t border-slate-200">
                        <span className="text-slate-400">📊</span>
                        <span>{levelLabel} <span className="text-slate-900 font-black">{levelText}</span></span>
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
                        {(!isExpired || currentUserPlayer?.role === 'admin') && (
                            <button
                                onClick={() => {
                                    if (actionType === 'leave') {
                                        startTransition(async () => {
                                            try { await leaveMatchAction(match.id); }
                                            catch (error: any) { alert(`Errore: ${error.message}`); }
                                        });
                                    } else if (actionType === 'join') {
                                        startTransition(async () => {
                                            try { await joinMatchAction(match.id); }
                                            catch (error: any) { alert(`Errore: ${error.message}`); }
                                        });
                                    } else if (actionType === 'manage') {
                                        setIsManaging(true);
                                        router.push(`/match/${match.id}/join`);
                                    }
                                }}
                                disabled={isManaging || isPending || actionType === 'view'}
                                className={`flex-[2] text-center text-white text-[10px] font-black uppercase tracking-wider py-3 rounded-sm transition-all duration-150 ease-out flex items-center justify-center gap-2 [-webkit-tap-highlight-color:transparent]
                                    ${actionType === 'view'
                                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-80'
                                    : 'bg-slate-900 hover:bg-slate-800 active:scale-[0.96]'
                                }
                                `}
                            >
                                {(isManaging || isPending) ? 'ATTENDI...' : primaryActionLabel}
                            </button>
                        )}

                        {canResolve && <ResolveMatchButton matchId={match.id} />}
                        {(currentUserPlayer?.role === 'admin' || canResolve) && <DeleteMatchButton matchId={match.id} />}
                    </div>
                </div>
            )}
        </div>
    );
}
