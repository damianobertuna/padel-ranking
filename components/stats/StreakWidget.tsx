'use client';

import React from 'react';

interface MatchWithResult {
    id: string;
    userWon: boolean;
}

interface StreakWidgetProps {
    enrichedMatches: MatchWithResult[];
}

export default function StreakWidget({ enrichedMatches }: StreakWidgetProps) {
    const last5Matches = enrichedMatches.slice(0, 5);
    const chronologicalMatches = [...last5Matches].reverse();

    let currentStreakType: 'V' | 'S' | 'Nessuna' = 'Nessuna';
    let currentStreakCount = 0;

    if (last5Matches.length > 0) {
        currentStreakType = last5Matches[0].userWon ? 'V' : 'S';
        for (const m of last5Matches) {
            if ((currentStreakType === 'V' && m.userWon) || (currentStreakType === 'S' && !m.userWon)) {
                currentStreakCount++;
            } else {
                break;
            }
        }
    }

    return (
        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-sm flex flex-col justify-between">
            <div>
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">
                    Stato di Forma
                </h3>
            </div>

            {/* Visualizzazione Box Forma */}
            <div className="flex items-center gap-1.5 mb-6">
                {chronologicalMatches.map((match) => (
                    <div
                        key={match.id}
                        className={`w-10 h-10 flex items-center justify-center font-black text-sm border ${
                            match.userWon
                                ? 'bg-emerald-600 border-emerald-700 text-white'
                                : 'bg-red-600 border-red-700 text-white'
                        }`}
                        title={match.userWon ? 'Vittoria' : 'Sconfitta'}
                    >
                        {match.userWon ? 'V' : 'P'}
                    </div>
                ))}

                {/* Slot vuoti */}
                {Array.from({ length: 5 - chronologicalMatches.length }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="w-10 h-10 bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-300 text-sm">
                        -
                    </div>
                ))}
            </div>

            {/* Striscia Attuale */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Striscia:</span>
                {currentStreakType === 'Nessuna' ? (
                    <span className="text-[10px] font-black text-slate-400 uppercase">N/A</span>
                ) : (
                    <span className={`text-[10px] font-black uppercase ${currentStreakType === 'V' ? 'text-emerald-700' : 'text-red-700'}`}>
                        {currentStreakCount} {currentStreakType === 'V' ? 'Vittorie' : 'Sconfitte'}
                    </span>
                )}
            </div>
        </div>
    );
}
