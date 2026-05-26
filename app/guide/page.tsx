import Link from 'next/link';

export const metadata = {
    title: 'Guida all\'uso | RanKING Padel',
    description: 'Manuale d\'uso per gestire le partite e il ranking',
};

export default function GuidePage() {
    return (
        <main className="min-h-screen p-4 sm:p-8 bg-slate-100 flex flex-col items-center pb-20">
            <div className="max-w-2xl w-full">

                {/* Header e Tasto Indietro */}
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/" className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-sm border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors [-webkit-tap-highlight-color:transparent]">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Come funziona l'App</h1>
                        <p className="text-sm text-slate-500 font-medium">Manuale rapido per i giocatori</p>
                    </div>
                </div>

                <div className="space-y-6">

                    {/* SEZIONE 1: Creare e Unirsi */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-sm">1</div>
                            <h2 className="text-lg font-bold text-slate-800">Unirsi a una partita</h2>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed mb-4">
                            Nella schermata <strong>"🗓️ Match"</strong> trovi tutte le partite in programma. Clicca su <strong>Unisciti / Invita</strong> per inserirti in uno slot libero o aggiungere un amico. Se hai un imprevisto, puoi liberare il tuo posto cliccando su <strong>Esci dalla partita</strong>.
                        </p>
                        {/* Contenitore Immagine 1 */}
                        <div className="rounded-xl border-2 border-slate-100 overflow-hidden bg-slate-50 relative aspect-[4/3] flex items-center justify-center">
                            <span className="absolute text-slate-400 text-xs font-mono font-bold uppercase z-[0]">Inserisci screenshot step-1.png</span>
                            <img src="/guide/step-1.png" alt="Schermata Unisciti" className="w-full h-full object-cover relative z-10" />
                        </div>
                    </div>

                    {/* SEZIONE 2: L'Organizzatore */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-sm">2</div>
                            <h2 className="text-lg font-bold text-slate-800">L'Organizzatore</h2>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed mb-4">
                            Chi crea la partita cliccando su <strong>"+ Nuova Partita"</strong> diventa l'Organizzatore. <br/><br/>
                            L'Organizzatore ha i <strong>superpoteri</strong> per quella specifica partita: può cambiare il campo, spostare i giocatori o sostituirli all'ultimo minuto in caso di assenze, senza dover chiedere all'Admin.
                        </p>
                        {/* Contenitore Immagine 2 */}
                        <div className="rounded-xl border-2 border-slate-100 overflow-hidden bg-slate-50 relative aspect-[4/3] flex items-center justify-center">
                            <span className="absolute text-slate-400 text-xs font-mono font-bold uppercase z-[0]">Inserisci screenshot step-2.png</span>
                            <img src="/guide/step-2.png" alt="Schermata Organizzatore" className="w-full h-full object-cover relative z-10" />
                        </div>
                    </div>

                    {/* SEZIONE 3: Inserire il risultato */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-amber-500">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-black text-sm">3</div>
                            <h2 className="text-lg font-bold text-slate-800">Chiudere il Match</h2>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed mb-4">
                            A fine partita, uno qualsiasi dei 4 partecipanti può inserire il punteggio cliccando su <strong>Inserisci Risultato</strong>. <br/><br/>
                            <span className="text-amber-700 bg-amber-50 px-1 py-0.5 rounded font-semibold">Attenzione:</span> non appena il risultato viene salvato, <strong>la partita viene bloccata e resa ufficiale</strong>. Non sarà più possibile modificare i giocatori o il punteggio!
                        </p>
                        {/* Contenitore Immagine 3 */}
                        <div className="rounded-xl border-2 border-slate-100 overflow-hidden bg-slate-50 relative aspect-[4/3] flex items-center justify-center">
                            <span className="absolute text-slate-400 text-xs font-mono font-bold uppercase z-[0]">Inserisci screenshot step-3.png</span>
                            <img src="/guide/step-3.png" alt="Inserimento Risultato" className="w-full h-full object-cover relative z-10" />
                        </div>
                    </div>

                    {/* SEZIONE 4: Statistiche e Profilo Giocatore */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-black text-sm">4</div>
                            <h2 className="text-lg font-bold text-slate-800">Profilo e Statistiche</h2>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed mb-4">
                            Sapevi che cliccando sul nome o sulla foto di qualsiasi giocatore (nella classifica o in un match) puoi accedere al suo <strong>Profilo Dettagliato</strong>? Qui troverai statistiche avanzate per studiare i tuoi avversari o futuri compagni:
                        </p>
                        <ul className="text-sm text-slate-600 space-y-3 mb-6 font-medium">
                            <li className="flex items-start gap-2">
                                <span className="text-purple-500 mt-0.5">📊</span>
                                <span><strong>Win Rate e Giocate:</strong> La percentuale di vittorie e il numero totale di partite disputate.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-purple-500 mt-0.5">🤝</span>
                                <span><strong>Partner e Nemesi:</strong> Il sistema calcola automaticamente con chi giochi meglio (Partner Ideale) e contro chi perdi più spesso (Nemesi).</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-purple-500 mt-0.5">📈</span>
                                <span><strong>Delta Medio:</strong> La media dei punti rank che il giocatore guadagna o perde a ogni partita.</span>
                            </li>
                        </ul>
                        {/* Contenitore Immagine 4 */}
                        <div className="rounded-xl border-2 border-slate-100 overflow-hidden bg-slate-50 relative aspect-[4/3] flex items-center justify-center">
                            <span className="absolute text-slate-400 text-xs font-mono font-bold uppercase z-[0]">Inserisci screenshot step-4.png</span>
                            <img src="/guide/step-4.png" alt="Profilo Giocatore" className="w-full h-full object-cover relative z-10" />
                        </div>
                    </div>

                    {/* SEZIONE 5: Il Ranking */}
                    <div className="bg-slate-50 p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-2xl">🏆</span>
                            <h2 className="text-lg font-bold text-slate-800">Il Sistema RanKING</h2>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed mb-4">
                            Il nostro sistema calcola automaticamente le variazioni di punteggio. La matematica di base è:
                        </p>
                        <ul className="text-sm text-slate-700 space-y-3 mb-4 font-medium">
                            <li className="flex items-center gap-2">
                                <span className="text-emerald-500 text-lg">✔</span>
                                <span>Vittoria standard: <strong className="text-emerald-600">+0.05</strong></span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-rose-500 text-lg">✖</span>
                                <span>Sconfitta standard: <strong className="text-rose-600">-0.05</strong></span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-amber-500 text-lg">👑</span>
                                <span>Batti il King (il più forte): <strong className="text-indigo-600">+0.10</strong></span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-emerald-600 text-lg">🐢</span>
                                <span>Il Fanalino (ultimo) vince: <strong className="text-indigo-600">+0.10</strong></span>
                            </li>
                        </ul>
                        <p className="text-xs text-slate-500 italic mt-5 pt-4 border-t border-slate-200/60">
                            *Il sistema impedisce le partite se il divario tra i giocatori supera i 0.25 punti, per garantire sfide sempre equilibrate!
                        </p>
                    </div>

                </div>
            </div>
        </main>
    );
}
