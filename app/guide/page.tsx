'use client';

import BackToHomeButton from "@/components/BackToHomeButton";

export default function GuidePage() {
    return (
        <main className="min-h-screen bg-slate-50 p-4 sm:p-8 flex flex-col items-center">
            <div className="max-w-2xl w-full bg-white p-6 sm:p-10 border border-slate-200 shadow-sm rounded-sm">

                {/* Header Istituzionale */}
                <div className="border-b-2 border-slate-900 pb-6 mb-10">
                    <BackToHomeButton></BackToHomeButton>
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mt-4">Manuale d'uso</h1>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Guida operativa per i giocatori</p>
                </div>

                <div className="space-y-12">

                    {[
                        { n: "01", t: "Unirsi a un match", d: "Nella schermata 'MATCH' sono elencate le partite in programma. Seleziona 'UNISCITI' per occupare uno slot libero o aggiungere un amico. Per disdire, utilizza il comando 'ESCI DALLA PARTITA'." },
                        { n: "02", t: "Ruolo Organizzatore", d: "Chi crea un match (+ NUOVA PARTITA) assume il ruolo di Organizzatore. Questo ruolo permette la gestione totale della partita: modifica campo, sostituzione giocatori e gestione assenze dell'ultimo minuto." },
                        { n: "03", t: "Chiusura Referto", d: "Al termine dell'incontro, il risultato deve essere inserito via 'INSERISCI RISULTATO'. Attenzione: il salvataggio è definitivo e irreversibile; la partita passa automaticamente allo stato 'UFFICIALE'." },
                        { n: "04", t: "Profilo e Statistiche", d: "Cliccando sul nome o sulla foto di un utente si accede alla scheda tecnica personale: Win Rate, Partner Ideale, Nemesi e Delta Ranking medio." }
                    ].map((step) => (
                        <section key={step.n} className="flex gap-4">
                            <span className="w-8 h-8 flex items-center justify-center font-black text-[10px] text-white bg-slate-900 rounded-sm shrink-0">{step.n}</span>
                            <div>
                                <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-2">{step.t}</h2>
                                <p className="text-xs font-medium text-slate-600 leading-relaxed mb-4">{step.d}</p>
                                <div className="border border-slate-200 bg-slate-50 aspect-video flex items-center justify-center">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Screenshot {step.n}</span>
                                </div>
                            </div>
                        </section>
                    ))}

                    {/* Tabella Punteggio */}
                    <section className="bg-slate-900 p-6 text-white rounded-sm">
                        <h2 className="text-[10px] font-black uppercase tracking-widest mb-6 border-b border-slate-700 pb-2">Sistema Punteggio RanKING</h2>
                        <div className="space-y-3 text-[10px] font-black uppercase tracking-widest">
                            <div className="flex justify-between border-b border-slate-800 pb-2"><span>VITTORIA STANDARD</span> <span>+0.05</span></div>
                            <div className="flex justify-between border-b border-slate-800 pb-2"><span>SCONFITTA STANDARD</span> <span>-0.05</span></div>
                            <div className="flex justify-between border-b border-slate-800 pb-2"><span>SCONFITTA KING</span> <span>+0.10</span></div>
                            <div className="flex justify-between border-b border-slate-800 pb-2"><span>RISCATTO FANALINO</span> <span>+0.10</span></div>
                        </div>
                    </section>

                </div>

                <div className="mt-12 pt-6 border-t border-slate-200 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    RanKING Padel v2.0 - Documentazione tecnica
                </div>
            </div>
        </main>
    );
}
