'use client';

interface GameAverageProps {
    totalSetsWon: number;
    totalSetsLost: number;
    totalGamesWon: number;
    totalGamesLost: number;
    avgGamesWonPerMatch: string;
    gameWinPercentage: string;
}

export default function GameAverageWidget({
                                              totalSetsWon,
                                              totalSetsLost,
                                              totalGamesWon,
                                              totalGamesLost,
                                              avgGamesWonPerMatch,
                                              gameWinPercentage
                                          }: GameAverageProps) {

    const totalSets = totalSetsWon + totalSetsLost;
    const setWinRate = totalSets > 0 ? ((totalSetsWon / totalSets) * 100).toFixed(0) : '0';

    return (
        <div className="bg-white p-5 border border-slate-200 shadow-sm rounded-sm flex flex-col justify-between">
            {/* Intestazione */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                        Efficienza Game
                    </span>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight mt-1">
                        {avgGamesWonPerMatch} <span className="text-[10px] font-bold text-slate-400 uppercase">game/match</span>
                    </h3>
                </div>
            </div>

            {/* Barra di Progresso Squadrata */}
            <div className="mb-4">
                <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                    <span>Rendimento Game</span>
                    <span className="text-blue-600 font-mono">{gameWinPercentage}% vinti</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-none border border-slate-200 overflow-hidden">
                    <div
                        className="bg-blue-600 h-full transition-all duration-300"
                        style={{ width: `${Math.min(parseFloat(gameWinPercentage), 100)}%` }}
                    />
                </div>
            </div>

            {/* Footer Dettagliato */}
            <div className="border-t border-slate-100 pt-3 space-y-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                <div className="flex justify-between items-center">
                    <span>BILANCIO SET</span>
                    <span className="font-mono text-slate-900 bg-slate-50 px-1.5 py-0.5 border border-slate-200">
                        {totalSetsWon}V - {totalSetsLost}P ({setWinRate}%)
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span>CONTO GAME</span>
                    <span className="font-mono text-slate-900 bg-slate-50 px-1.5 py-0.5 border border-slate-200">
                        {totalGamesWon} Fatti / {totalGamesLost} Subiti
                    </span>
                </div>
            </div>
        </div>
    );
}
