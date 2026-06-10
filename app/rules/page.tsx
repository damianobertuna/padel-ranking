'use client';

import BackToHomeButton from "@/components/BackToHomeButton";

export default function RegulationsPage() {
    return (
        <main className="w-full max-w-4xl mx-auto px-4 sm:px-8 pb-12">
            <div className="max-w-4xl w-full bg-white p-6 sm:p-10 border border-slate-200 shadow-sm rounded-sm">

                <div className="mb-8"><BackToHomeButton /></div>

                <div className="border-b-2 border-slate-900 pb-6 mb-8">
                    <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Regolamento Ufficiale</h1>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Normativa tecnica e operativa RanKING Padel</p>
                </div>

                <div className="space-y-8">
                    {/* ARTICOLI 1-10 */}
                    {[
                        {
                            n: "01",
                            t: "Registrazione e Livello Iniziale",
                            d: <>L'iscrizione alla piattaforma è totalmente gratuita. In fase di registrazione ti verranno richiesti i dati di base, il tuo lato di preferenza e una <strong>autovalutazione del tuo livello</strong> di partenza. Puoi stimarlo tramite la <a href="https://www.padelnuestro.com/it/blog/livelli-del-padel" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-black hover:underline">GUIDA UFFICIALE DEI LIVELLI PADEL</a> o chiedendo supporto al tuo Maestro. Sarà poi il campo a delineare il tuo valore reale.<br/><br/><strong>Nota sul Valore RanKING:</strong> A differenza delle classifiche statiche (es. NTRP) che servono solo a stabilire l'esperienza iniziale, il Valore RanKING (frazionato di 0.05 in 0.05) è un indicatore dinamico che si aggiorna costantemente in base ai tuoi risultati e al confronto directo con il resto della Community.</>
                        },
                        {
                            n: "02",
                            t: "Community e Gruppo WhatsApp",
                            d: <>Entra nel vivo dell'azione unendoti al nostro <a href="https://chat.whatsapp.com/BLmjJYNGPq6H0jfN4wEwoK?mode=gi_t" target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-black hover:underline">GRUPPO WHATSAPP UFFICIALE</a>. Condividi il link con amici e conoscenti appassionati: la chat è il cuore pulsante della Community, il luogo ideale per conoscere nuovi giocatori, scoprire nuovi circoli e organizzare sfide valide per la classifica.</>
                        },
                        {
                            n: "03",
                            t: "Equilibrio in Campo (Regola del ±0.25)",
                            d: <>Per garantire match competitivi nelle partite Classificate, è obbligatorio che il livello dei 4 partecipanti rientri in un <strong>range di valore complessivo di ±0.25</strong>. La WebApp effettua un controllo in tempo reale: se il dislivello tra i giocatori supera questa soglia, il sistema bloccherà la creazione del match.<br/><br/><span className="text-purple-600 font-bold">Bypass Amichevole:</span> Se desideri giocare con amici di livello molto diverso, puoi impostare il match come <strong>Amichevole</strong>. In questo modo il blocco del ±0.25 viene completamente disattivato.</>
                        },
                        {
                            n: "04",
                            t: "Registrazione dei Risultati e Sicurezza",
                            d: <>Al termine dell'incontro, il punteggio deve essere inserito tempestivamente nella WebApp, specificando il punteggio esatto di Game e Set (al meglio dei 3 set).<br/><br/><span className="text-red-600 font-bold">Restrizione Permessi:</span> Per garantire l'integrità dei dati ed evitare manomissioni esterne, la schermata di inserimento del risultato e la modifica dei dati del match <strong>sono visibili e accessibili esclusivamente ai 4 partecipanti scesi in campo</strong> (oltre all'Amministratore della piattaforma).</>
                        },
                        {
                            n: "05",
                            t: "Punteggio Base (Classificate vs Amichevoli)",
                            d: <>
                                <strong>• Match Classificato:</strong> Al salvataggio del risultato, il sistema aggiunge automaticamente <strong>+0.05</strong> al punteggio della coppia vincitrice e sottrae <strong>-0.05</strong> agli sconfitti, aggiornando le classifiche in tempo reale.<br/>
                                <strong>• Match Amichevole:</strong> Lo scontro non ha alcun impatto sul ranking. Al momento della chiusura, la variazione di punti è blindata a <strong>0.00 assoluto</strong> per tutti i giocatori, indipendentemente da chi abbia vinto l'incontro.
                            </>
                        },
                        {
                            n: "06",
                            t: "Titoli Ufficiali: KING e FANALINO",
                            d: <>Il giocatore con il punteggio più alto nel proprio lato di gioco ottiene l'ambito titolo di <strong>KING</strong> (evidenziato in giallo come KING SX, KING DX o KING MIX). Chi si trova temporaneamente all'ultimo posto ottiene il titolo di <strong>FANALINO</strong> (SX, DX o MIX). In caso di parità di punteggio, i titoli vengono assegnati a tutti i giocatori a pari merito.</>
                        },
                        {
                            n: "07",
                            t: "Sconfiggere un KING (Bonus e Malus)",
                            d: <>
                                <strong>• Bonus Vittoria (+0.10):</strong> Se in un match competitivo una coppia sconfigge una squadra in cui milita un KING, ottiene il doppio dei punti. <br/>
                                <strong>• Malus Sconfitta:</strong> Agli sconfitti si applica il normale -0.05. Tuttavia, se due KING giocano in coppia e vengono battuti da due giocatori "normali", subiranno un malus raddoppiato di <strong>-0.10</strong>.<br/>
                                <span className="text-amber-600 font-bold">Eccezione di Neutralizzazione:</span> Se è presente almeno un KING in <em>entrambe</em> le squadre, tutti i moltiplicatori si annullano e la partita assegna il classico ±0.05.
                            </>
                        },
                        {
                            n: "08",
                            t: "Il Riscatto del FANALINO (Bonus Vittoria)",
                            d: <>
                                Se in un match competitivo un FANALINO vince una partita, garantisce a sé stesso e al proprio compagno di squadra un <strong>punteggio raddoppiato (+0.10)</strong>, a prescindere dal livello del compagno. Alla coppia sconfitta verrà regolarmente sottratto -0.05.<br/>
                                <span className="text-amber-600 font-bold">Eccezione di Neutralizzazione:</span> Anche in questo caso, se è presente un FANALINO in <em>entrambe</em> le squadre avversarie, il bonus si annulla e la partita assegna il classico ±0.05.
                            </>
                        },
                        {
                            n: "09",
                            t: "Partite Consecutive e Tetto Punti",
                            d: <>È consentito giocare più partite ufficiali nella stessa giornata, sia mantenendo le coppie che mischiandole. <strong>I Bonus e i Malus non sono mai cumulabili</strong> tra loro: la variazione massima consentita dal sistema per una singola partita classificata è fissata a ±0.10. Le partite consecutive vanno registrate singolarmente sulla piattaforma.</>
                        },
                        {
                            n: "10",
                            t: "Penalità per Inattività",
                            d: <>Per mantenere la classifica dinamica e veritiera, è richiesta costanza. Chi non disputa almeno una partita ufficiale entro <strong>30 giorni</strong> dalla precedente, subirà d'ufficio una penalità di <strong>-0.05 punti</strong> ad oltranza per ogni periodo di inattività. L'Amministratore si riserva la facoltà di gestire ad hoc le assenze prolungate per cause di forza maggiore.</>
                        }
                    ].map((art) => (
                        <section key={art.n} className="flex gap-4 border-b border-slate-100 pb-6">
                            <span className="w-10 h-10 flex items-center justify-center font-black text-xs text-white bg-slate-900 rounded-sm shrink-0">
                                {art.n}
                            </span>
                            <div>
                                <h2 className="text-[12px] font-black text-slate-900 uppercase tracking-widest mb-2">{art.t}</h2>
                                <p className="text-xs font-medium text-slate-600 leading-relaxed">{art.d}</p>
                            </div>
                        </section>
                    ))}

                    {/* VINCOLI APPLICAZIONE */}
                    <div className="bg-slate-900 text-white p-6 rounded-sm mt-12">
                        <h3 className="text-[10px] font-black uppercase tracking-widest mb-6 border-b border-slate-700 pb-2">🛡️ Vincoli di Architettura e Organizzazione Match nell'App</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { t: "Validazione Dinamica", d: "È possibile salvare una partita lasciando alcuni slot vuoti per la raccolta adesioni. La barriera di sbilanciamento (±0.25) si attiva solo per i match Classificati non appena sono presenti almeno 2 giocatori." },
                                { t: "Controllo Anti-Clonazione", d: "Il sistema impedisce l'inserimento dello stesso giocatore in più posizioni contemporaneamente, sia in fase di creazione che durante la prenotazione autonoma degli slot." },
                                { t: "Filtro Tattico Flessibile (MIX)", d: "Le dropdown integrano un motore di ricerca per nome/cognome e indicano il lato preferito. L'algoritmo è intelligente: se in una coppia inserisci un giocatore MIX (Both), l'altro slot si svincola accettando partner DX, SX o altri MIX." },
                                { t: "Privacy e Gestione Ruoli", d: "I match in programma non sono modificabili da utenti esterni. Solo i giocatori iscritti all'incontro, l'organizzatore originale o l'admin possono alterare la formazione o caricare i set." },
                                { t: "Registro Audit Log Pro", d: "Ogni azione (creazione, cambio giocatore, cancellazione manuale o automatica) viene tracciata. Alla risoluzione, il sistema effettua uno snapshot storico blindato del punteggio Elo pre e post partita." },
                                { t: "Cancellazione Automatica", d: "Se un giocatore abbandona un match in programma lasciandolo completamente vuoto, la WebApp provvede all'eliminazione automatica della card per mantenere pulita la bacheca." }
                            ].map((v) => (
                                <div key={v.t} className="p-4 bg-slate-800 rounded-sm">
                                    <p className="text-[9px] font-black uppercase text-slate-400 mb-1">{v.t}</p>
                                    <p className="text-[10px] text-slate-300 leading-snug">{v.d}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="text-center pt-8">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-1">Supporto Tecnico</p>
                        <p className="text-xs text-slate-600">Per info: 3476463474 (Fabio Lombardo) | Sviluppo: Damiano Bertuna</p>
                    </div>
                </div>
            </div>
        </main>
    );
}
