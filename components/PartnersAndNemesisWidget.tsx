'use client';

import React from 'react';
import { Player, MatchWithResult } from '@/types';

interface PartnersAndNemesisWidgetProps {
    playerId: number;
    enrichedMatches: MatchWithResult[];
    allPlayers: Player[];
}

export default function PartnersAndNemesisWidget({ playerId, enrichedMatches, allPlayers }: PartnersAndNemesisWidgetProps) {
    const getPlayerName = (id: number) => {
        const p = allPlayers?.find(x => x.id === id);
        return p ? `${p.first_name} ${p.last_name}` : 'SCONOSCIUTO';
    };

    const partnerStats: Record<number, { won: number }> = {};
    const opponentStats: Record<number, { lost: number }> = {};

    enrichedMatches.forEach(match => {
        const isTeamA = [match.team_a_left_id, match.team_a_right_id].includes(playerId);
        let partnerId = isTeamA
            ? (match.team_a_left_id === playerId ? match.team_a_right_id : match.team_a_left_id)
            : (match.team_b_left_id === playerId ? match.team_b_right_id : match.team_b_left_id);

        if (partnerId) {
            if (!partnerStats[partnerId]) partnerStats[partnerId] = { won: 0 };
            if (match.userWon) partnerStats[partnerId].won++;
        }

        const opponents = isTeamA ? [match.team_b_left_id, match.team_b_right_id] : [match.team_a_left_id, match.team_a_right_id];
        opponents.forEach(oppId => {
            if (!opponentStats[oppId]) opponentStats[oppId] = { lost: 0 };
            if (!match.userWon) opponentStats[oppId].lost++;
        });
    });

    let bestPartnerId: string | null = null, maxPartnerWins = 0;
    Object.keys(partnerStats).forEach(id => {
        if (partnerStats[Number(id)].won > maxPartnerWins) {
            maxPartnerWins = partnerStats[Number(id)].won;
            bestPartnerId = id;
        }
    });

    let nemesisId: string | null = null, maxNemesisLosses = 0;
    Object.keys(opponentStats).forEach(id => {
        if (opponentStats[Number(id)].lost > maxNemesisLosses) {
            maxNemesisLosses = opponentStats[Number(id)].lost;
            nemesisId = id;
        }
    });

    return (
        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-sm flex flex-col justify-between">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">
                Incroci Pericolosi
            </h3>

            <div className="space-y-2">
                {/* PARTNER */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm">
                    <div className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Partner Ideale</div>
                    <div className="text-sm font-black text-slate-900 uppercase truncate my-1">
                        {bestPartnerId ? getPlayerName(Number(bestPartnerId)) : 'NESSUNO'}
                    </div>
                    <div className="text-[9px] font-bold text-slate-500 uppercase">
                        {bestPartnerId ? `${maxPartnerWins} VITTORIE INSIEME` : 'NESSUN MATCH GIOCATO'}
                    </div>
                </div>

                {/* NEMESI */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm">
                    <div className="text-[9px] font-black text-red-600 uppercase tracking-widest">La tua Nemesi</div>
                    <div className="text-sm font-black text-slate-900 uppercase truncate my-1">
                        {nemesisId ? getPlayerName(Number(nemesisId)) : 'NESSUNA'}
                    </div>
                    <div className="text-[9px] font-bold text-slate-500 uppercase">
                        {nemesisId ? `${maxNemesisLosses} SCONFITTE SUBITE` : 'IMBATTUTO'}
                    </div>
                </div>
            </div>
        </div>
    );
}
