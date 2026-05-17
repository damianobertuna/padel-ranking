'use client'; // Mettiamo use-client perché usa le transizioni animate di Tailwind

import React from 'react';

// Definiamo l'interfaccia dei dati direttamente qui per comodità
interface WinRateWidgetProps {
    stats: {
        totalPlayed: number;
        totalWon: number;
        totalLost: number;
        winRate: number;
    };
}

export default function WinRateWidget({ stats }: WinRateWidgetProps) {
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (stats.winRate / 100) * circumference;

    const getColorClass = (rate: number) => {
        if (rate >= 60) return { text: 'text-emerald-500', stroke: 'stroke-emerald-500', bg: 'bg-emerald-50' };
        if (rate >= 45) return { text: 'text-indigo-500', stroke: 'stroke-indigo-500', bg: 'bg-indigo-50' };
        return { text: 'text-rose-500', stroke: 'stroke-rose-500', bg: 'bg-rose-50' };
    };

    const theme = getColorClass(stats.winRate);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-sm w-full transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Efficacia in Campo
                </h3>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${theme.bg} ${theme.text}`}>
                    {stats.winRate >= 60 ? 'Top Player' : stats.winRate >= 45 ? 'In Media' : 'Sotto Tono'}
                </span>
            </div>

            <div className="flex items-center justify-between gap-4">
                <div className="relative flex items-center justify-center w-24 h-24">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r={radius} className="stroke-slate-100" strokeWidth="8" fill="transparent" />
                        <circle
                            cx="48"
                            cy="48"
                            r={radius}
                            className={`${theme.stroke} transition-all duration-1000 ease-out`}
                            strokeWidth="8"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            fill="transparent"
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-xl font-black text-slate-800 font-mono">{stats.winRate}%</span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-tight">Win Rate</span>
                    </div>
                </div>

                <div className="flex-1 space-y-2 pl-4 border-l border-slate-100">
                    <div className="flex justify-between items-baseline">
                        <span className="text-xs text-slate-500">Partite Giocate</span>
                        <span className="text-lg font-bold text-slate-800 font-mono">{stats.totalPlayed}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                        <span className="text-xs text-emerald-600 font-medium">Vinte</span>
                        <span className="text-base font-bold text-emerald-600 font-mono">{stats.totalWon}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                        <span className="text-xs text-rose-600 font-medium">Perse</span>
                        <span className="text-base font-bold text-rose-600 font-mono">{stats.totalLost}</span>
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-50 text-[11px] text-slate-400 text-center italic">
                {stats.totalPlayed === 0
                    ? "Nessun match disputato nella stagione corrente."
                    : `Rendimento calcolato su uno storico di ${stats.totalPlayed} match ufficiali.`}
            </div>
        </div>
    );
}
