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
    // 1. Prendiamo gli ultimi 5 match disputati
    const last5Matches = enrichedMatches.slice(0, 5);

    // 2. Li invertiamo per mostrarli in ordine cronologico da sinistra a destra (il più vecchio a SX, il più recente a DX)
    const chronologicalMatches = [...last5Matches].reverse();

    // 3. Calcoliamo la striscia di vittorie/sconfitte attuale (partendo dall'ultimo match giocato)
    let currentStreakType: 'V' | 'S' | 'Nessuna' = 'Nessuna';
    let currentStreakCount = 0;

    if (last5Matches.length > 0) {
        currentStreakType = last5Matches[0].userWon ? 'V' : 'S';
        for (const m of last5Matches) {
            const isWon = m.userWon;
            if ((currentStreakType === 'V' && isWon) || (currentStreakType === 'S' && !isWon)) {
                currentStreakCount++;
            } else {
                break;
            }
        }
    }

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-sm w-full transition-all hover:shadow-md flex flex-col justify-between">
            <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Stato di Forma
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                    Esito degli ultimi 5 match ufficiali
                </p>
            </div>

            {/* Visualizzazione dei Cerchietti della Forma (🟢 / 🔴) */}
            <div className="flex items-center gap-3 my-2">
                {/* Generiamo i cerchietti per le partite giocate */}
                {chronologicalMatches.map((match, idx) => (
                    <div
                        key={match.id}
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold font-mono text-xs shadow-sm transition-transform hover:scale-110 ${
                            match.userWon
                                ? 'bg-emerald-100 border-2 border-emerald-500 text-emerald-700'
                                : 'bg-rose-100 border-2 border-rose-500 text-rose-700'
                        }`}
                        title={match.userWon ? 'Vittoria' : 'Sconfitta'}
                    >
                        {match.userWon ? 'V' : 'S'}
                    </div>
                ))}

                {/* Se il giocatore ha giocato meno di 5 partite, riempiamo i vuoti con cerchietti neutri */}
                {Array.from({ length: 5 - chronologicalMatches.length }).map((_, idx) => (
                    <div
                        key={`empty-${idx}`}
                        className="w-8 h-8 rounded-full bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center font-bold text-slate-300 text-xs"
                        title="Nessun match"
                    >
                        -
                    </div>
                ))}
            </div>

            {/* Badge della Striscia Attuale sul fondo */}
            <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 italic">Striscia Attuale:</span>
                {currentStreakType === 'Nessuna' ? (
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Nessun dato</span>
                ) : currentStreakType === 'V' ? (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full animate-pulse">
                        🔥 {currentStreakCount} {currentStreakCount === 1 ? 'Vittoria' : 'Vittorie'} di fila
                    </span>
                ) : (
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                        📉 {currentStreakCount} {currentStreakCount === 1 ? 'Sconfitta' : 'Sconfitte'} di fila
                    </span>
                )}
            </div>
        </div>
    );
}
