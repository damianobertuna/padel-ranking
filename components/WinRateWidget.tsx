'use client';

import React from 'react';

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

    // Colori standard sicuri
    const getTheme = (rate: number) => {
        if (rate >= 60) return { stroke: 'stroke-emerald-500', text: 'text-emerald-600', label: 'TOP PLAYER' };
        if (rate >= 45) return { stroke: 'stroke-blue-600', text: 'text-blue-600', label: 'IN MEDIA' };
        return { stroke: 'stroke-red-600', text: 'text-red-600', label: 'SOTTO TONO' };
    };

    const theme = getTheme(stats.winRate);

    return (
        <div className="bg-white p-5 border border-slate-200 shadow-sm rounded-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Efficacia in Campo
                </h3>
                <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border ${theme.text} border-slate-200 bg-slate-50`}>
                    {theme.label}
                </span>
            </div>

            <div className="flex items-center justify-between gap-4">
                <div className="relative flex items-center justify-center w-20 h-20">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="40" cy="40" r={radius} className="stroke-slate-100" strokeWidth="6" fill="transparent" />
                        <circle
                            cx="40"
                            cy="40"
                            r={radius}
                            className={`${theme.stroke} transition-all duration-500`}
                            strokeWidth="6"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            fill="transparent"
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-lg font-black text-slate-900 font-mono leading-none">{stats.winRate.toFixed(0)}%</span>
                    </div>
                </div>

                <div className="flex-1 space-y-1 pl-4 border-l border-slate-100">
                    <div className="flex justify-between items-baseline">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Totale</span>
                        <span className="text-sm font-black text-slate-900 font-mono">{stats.totalPlayed}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase">Vinte</span>
                        <span className="text-sm font-black text-emerald-600 font-mono">{stats.totalWon}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                        <span className="text-[10px] font-bold text-red-600 uppercase">Perse</span>
                        <span className="text-sm font-black text-red-600 font-mono">{stats.totalLost}</span>
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[9px] font-bold text-slate-400 text-center uppercase tracking-widest">
                {stats.totalPlayed === 0 ? "Nessun match" : `Calcolato su ${stats.totalPlayed} match`}
            </div>
        </div>
    );
}
