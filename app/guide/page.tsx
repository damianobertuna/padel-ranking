'use client';

import BackToHomeButton from "@/components/ui/BackToHomeButton";

export default function GuidePage() {
    return (
        <main className="w-full max-w-4xl mx-auto px-4 sm:px-8 mt-6 pb-12">
            <div className="bg-white p-6 sm:p-10 border border-slate-200 shadow-sm rounded-sm">

                {/* Header Istituzionale */}
                <div className="border-b-2 border-slate-900 pb-6 mb-10">
                    <BackToHomeButton />
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mt-4">Manuale d'uso</h1>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Guida operativa per i giocatori e organizzatori</p>
                </div>

                <div className="space-y-12">

                    {[
                        {
                            n: "01",
                            t: "Creazione, Ricerca e Logica MIX",
                            d: "Usa la barra di ricerca integrata nelle tendine per trovare velocemente i giocatori. L'algoritmo tattico è intelligente: se posizioni un atleta con preferenza MIX in uno slot, il sistema sbloccherà automaticamente il compagno, permettendoti di schierare giocatori SX, DX o altri MIX senza restrizioni.",
                            img: "/guide/guida_1.png"
                        },
                        {
                            n: "02",
                            t: "Gestione Slot e Convocazioni",
                            d: "Puoi occupare uno slot libero o invitare amici condividendo il match su WhatsApp. Il sistema genererà un messaggio smart con il link Google Maps del circolo e l'indicazione dinamica [SX/DX] per indicare le posizioni ancora vacanti in campo.",
                            img: "/guide/guida_2.png"
                        },
                        {
                            n: "03",
                            t: "Privacy e Referto Inviolabile",
                            d: "Per garantire la massima sicurezza e integrità dei dati, le card dei match sono protette. Solo i 4 giocatori scesi in campo (o l'organizzatore originale della partita) vedranno i pulsanti per modificare i partecipanti o per registrare il risultato finale (azione irreversibile). Gli esterni potranno solo visualizzare.",
                            img: "/guide/guida_3.png"
                        },
                        {
                            n: "04",
                            t: "Fair Play, Divari e Amichevoli",
                            d: "Nelle partite Classificate, il sistema blocca la registrazione se la differenza tecnica tra i giocatori supera i ±0.25 punti. Vuoi giocare con un principiante o organizzare una partita fuori dai parametri? Seleziona il regolamento '🤝 Amichevole': il blocco sparirà e potrete giocare liberamente senza intaccare l'Elo personale.",
                            img: "/guide/guida_5.png"
                        },
                        {
                            n: "05",
                            t: "Dinamiche di Neutralizzazione",
                            d: "Nelle partite Classificate, il sistema di punteggio risolve i paradossi in automatico. Se un King gioca contro un altro King (o un Fanalino contro un Fanalino), le forze speciali si annullano ('Neutralizzazione') e la partita assegnerà i normali punti base a tutti i giocatori.",
                        },
                        {
                            n: "06",
                            t: "Analisi e Statistiche Profilo",
                            d: "Ogni atleta ha una dashboard personale pubblica. Cliccando sul nome o sull'avatar di un giocatore, potrai studiare il suo Win Rate storico, scoprire con quale compagno rende di più ('Partner Ideale') e contro chi perde più spesso ('Nemesi'). I match amichevoli non alterano queste statistiche.",
                            img: "/guide/guida_6.png"
                        }
                    ].map((step) => (
                        <section key={step.n} className="flex gap-4">
                            <span className="w-8 h-8 flex items-center justify-center font-black text-[10px] text-white bg-slate-900 rounded-sm shrink-0 shadow-sm">{step.n}</span>
                            <div>
                                <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-2">{step.t}</h2>
                                <p className="text-xs font-medium text-slate-600 leading-relaxed mb-4">{step.d}</p>
                                {/* RENDERING DELL'IMMAGINE O DEL PLACEHOLDER */}
                                {step.img ? (
                                    <div className="border border-slate-200 rounded-sm overflow-hidden shadow-sm">
                                        <img
                                            src={step.img}
                                            alt={`Screenshot ${step.t}`}
                                            className="w-full aspect-video object-cover md:object-contain bg-slate-50"
                                        />
                                    </div>
                                ) : (
                                    <div className="">

                                    </div>
                                )}
                            </div>
                        </section>
                    ))}

                    {/* Tabella Punteggio */}
                    <section className="bg-slate-900 p-6 text-white rounded-sm shadow-md">
                        <h2 className="text-[10px] font-black uppercase tracking-widest mb-6 border-b border-slate-700 pb-2">Sistema Punteggio RanKING</h2>
                        <div className="space-y-3 text-[10px] font-black uppercase tracking-widest">
                            <div className="flex justify-between border-b border-slate-800 pb-2"><span>VITTORIA STANDARD</span> <span className="text-emerald-400">+0.05</span></div>
                            <div className="flex justify-between border-b border-slate-800 pb-2"><span>SCONFITTA STANDARD</span> <span className="text-red-400">-0.05</span></div>
                            <div className="flex justify-between border-b border-slate-800 pb-2"><span>VITTORIA VS KING (Cacciatore)</span> <span className="text-emerald-400">+0.10</span></div>
                            <div className="flex justify-between border-b border-slate-800 pb-2"><span>SCONFITTA DELLA COPPIA REAL</span> <span className="text-red-400">-0.10</span></div>
                            <div className="flex justify-between border-b border-slate-800 pb-2"><span>RISCATTO FANALINO (Vittoria)</span> <span className="text-emerald-400">+0.10</span></div>
                            <div className="flex justify-between border-b border-slate-800 pb-2 border-b-transparent"><span>MATCH AMICHEVOLE (Qualsiasi Esito)</span> <span className="text-slate-400">0.00</span></div>
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
