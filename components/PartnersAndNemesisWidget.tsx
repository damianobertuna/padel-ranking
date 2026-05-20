'use client';

import React from 'react';
import { Player, MatchWithResult } from '@/types';

interface PartnersAndNemesisWidgetProps {
    playerId: number;
    enrichedMatches: MatchWithResult[];
    allPlayers: Player[]; // <-- CAMBIATO: Ora accettiamo l'array di giocatori puri
}

export default function PartnersAndNemesisWidget({ playerId, enrichedMatches, allPlayers }: PartnersAndNemesisWidgetProps) {

    // Funzione interna per recuperare il nome sul client
    const getPlayerName = (id: number) => {
        const p = allPlayers?.find(x => x.id === id);
        return p ? `${p.first_name} ${p.last_name}` : 'Sconosciuto';
    };

    // Mappe per i conteggi
    const partnerStats: Record<number, { won: number; total: number }> = {};
    const opponentStats: Record<number, { lost: number; total: number }> = {};

    enrichedMatches.forEach(match => {
        const isTeamA = [match.team_a_left_id, match.team_a_right_id].includes(playerId);

        let partnerId: number | null = null;
        if (isTeamA) {
            partnerId = match.team_a_left_id === playerId ? match.team_a_right_id : match.team_a_left_id;
        } else {
            partnerId = match.team_b_left_id === playerId ? match.team_b_right_id : match.team_b_left_id;
        }

        if (partnerId) {
            if (!partnerStats[partnerId]) partnerStats[partnerId] = { won: 0, total: 0 };
            partnerStats[partnerId].total++;
            if (match.userWon) partnerStats[partnerId].won++;
        }

        const opponents = isTeamA
            ? [match.team_b_left_id, match.team_b_right_id]
            : [match.team_a_left_id, match.team_a_right_id];

        opponents.forEach(oppId => {
            if (!opponentStats[oppId]) opponentStats[oppId] = { lost: 0, total: 0 };
            opponentStats[oppId].total++;
            if (!match.userWon) opponentStats[oppId].lost++;
        });
    });

    let bestPartnerId: string | null = null;
    let maxPartnerWins = 0;

    Object.keys(partnerStats).forEach(idStr => {
        const stats = partnerStats[Number(idStr)];
        if (stats.won > maxPartnerWins) {
            maxPartnerWins = stats.won;
            bestPartnerId = idStr;
        }
    });

    let nemesisId: string | null = null;
    let maxNemesisWinsAgainst = 0;

    Object.keys(opponentStats).forEach(idStr => {
        const stats = opponentStats[Number(idStr)];
        if (stats.lost > maxNemesisWinsAgainst) {
            maxNemesisWinsAgainst = stats.lost;
            nemesisId = idStr;
        }
    });

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-sm w-full transition-all hover:shadow-md flex flex-col justify-between gap-4">
            <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Incroci Pericolosi
                </h3>
                <p className="text-xs text-slate-500">
                    I tuoi feedback relazionali sui campi da gioco
                </p>
            </div>

            <div className="space-y-4">
                {/* PARTNER IDEALE */}
                <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center gap-3">
                    <div className="text-2xl">🤝</div>
                    <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold text-indigo-500 uppercase tracking-tight">Partner Ideale</div>
                        <div className="text-sm font-bold text-slate-800 truncate">
                            {bestPartnerId ? getPlayerName(Number(bestPartnerId)) : 'Nessuno'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                            {bestPartnerId
                                ? `Avete vinto insieme ${maxPartnerWins} ${maxPartnerWins === 1 ? 'match' : 'match'}`
                                : 'Gioca più partite in coppia per sbloccarlo'}
                        </div>
                    </div>
                </div>

                {/* NEMESI */}
                <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl flex items-center gap-3">
                    <div className="text-2xl">⚡</div>
                    <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold text-rose-500 uppercase tracking-tight">La tua Nemesi</div>
                        <div className="text-sm font-bold text-slate-800 truncate">
                            {nemesisId ? getPlayerName(Number(nemesisId)) : 'Nessuna'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                            {nemesisId
                                ? `Ti ha inflitto ${maxNemesisWinsAgainst} ${maxNemesisWinsAgainst === 1 ? 'sconfitta' : 'sconfitte'}`
                                : 'Ancora imbattuto contro i rivali attuali'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
