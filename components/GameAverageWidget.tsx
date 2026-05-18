'use client';

interface GameAverageProps {
    totalSetsWon: number;
    totalSetsLost: number;
    totalGamesWon: number;   // 👈 AGGIUNTO
    totalGamesLost: number;  // 👈 AGGIUNTO
    avgGamesWonPerMatch: string;
    gameWinPercentage: string;
}

export default function GameAverageWidget({
                                              totalSetsWon,
                                              totalSetsLost,
                                              totalGamesWon,    // 👈 ACCETTIAMO NEL COMPONENTE
                                              totalGamesLost,   // 👈 ACCETTIAMO NEL COMPONENTE
                                              avgGamesWonPerMatch,
                                              gameWinPercentage
                                          }: GameAverageProps) {

    const totalSets = totalSetsWon + totalSetsLost;
    const setWinRate = totalSets > 0 ? ((totalSetsWon / totalSets) * 100).toFixed(0) : '0';

    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between w-full min-h-[180px]">
            {/* Intestazione Widget */}
            <div className="flex justify-between items-start">
                <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        Efficienza Game
                    </span>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight mt-0.5">
                        {avgGamesWonPerMatch} <span className="text-xs font-semibold text-slate-400">game/match</span>
                    </h3>
                </div>
                {/* Icona Mini-Tabellone */}
                <div className="bg-amber-50 p-2 rounded-xl border border-amber-100 text-amber-600">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25A2.25 2.25 0 0 1 13.5 8.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 17.25v-2.25Z" />
                    </svg>
                </div>
            </div>

            {/* Barra di Progresso % Game Vinti */}
            <div className="mt-3">
                <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
                    <span>Rendimento Game</span>
                    <span className="text-indigo-600 font-mono">{gameWinPercentage}% vinti</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/50">
                    <div
                        className="bg-indigo-600 h-full transition-all duration-500 rounded-full"
                        style={{ width: `${Math.min(parseFloat(gameWinPercentage), 100)}%` }}
                    />
                </div>
            </div>

            {/* Footer Dettaglio Set & Game (Ora Completo) */}
            <div className="border-t border-slate-100 pt-2.5 mt-3 space-y-1.5 text-[10px] font-bold text-slate-400">
                <div className="flex justify-between items-center">
                    <span>BILANCIO SET:</span>
                    <span className="font-mono text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                        {totalSetsWon}V - {totalSetsLost}P ({setWinRate}%)
                    </span>
                </div>

                {/* 👈 DETTAGLIO CONTO DEI GAME AGGIUNTO QUI */}
                <div className="flex justify-between items-center">
                    <span>CONTO GAME:</span>
                    <span className="font-mono text-indigo-600 bg-indigo-50/50 px-1.5 py-0.5 rounded border border-indigo-100">
                        {totalGamesWon} Fatti - {totalGamesLost} Subiti
                    </span>
                </div>
            </div>
        </div>
    );
}
