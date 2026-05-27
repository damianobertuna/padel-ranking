'use client';

import BackToHomeButton from "@/components/BackToHomeButton";

export default function RegulationsPage() {
    return (
        <main className="min-h-screen bg-slate-50 p-4 sm:p-8 flex flex-col items-center">
            <div className="max-w-4xl w-full bg-white p-6 sm:p-10 border border-slate-200 shadow-sm rounded-sm">

                <div className="mb-8"><BackToHomeButton /></div>

                <div className="border-b-2 border-slate-900 pb-6 mb-8">
                    <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Regolamento Ufficiale</h1>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Normativa tecnica e operativa RanKING Padel</p>
                </div>

                <div className="space-y-8">
                    {/* ARTICOLI 1-10 */}
                    {[
                        { n: "01", t: "Registrazione e Autovalutazione", d: <>Accedete e registratevi autonomamente alla WebApp che vi richiederà: Nome, Cognome, Email, Password, Contatto Whatsapp, Lato di gioco, Mano dominante e Livello personale di partenza. Potete autovalutarvi tramite la <a href="https://www.padelnuestro.com/it/blog/livelli-del-padel" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-black hover:underline">GUIDA UFFICIALE DEI LIVELLI PADEL</a> o chiedendo supporto al vostro Maestro del Circolo di riferimento per avere una valutazione professionale (tanto alla fine sarà il campo a delineare il proprio valore reale). <br/><br/><strong>Nota sul Valore:</strong> Vi ricordo che il Valore della Classifica RanKING (inventato per differenziare meglio le fasce con il frazionamento di 0.05) non è la classificazione statica dei livelli del padel divisa in numeri al quale mi sono ispirato dal NTRP (National Tennis Rating Program) che serve a stabilire l'esperienza iniziale. La Classifica RanKING indica invece l’andamento dinamico del Padelista a confronto con gli altri della Community.</> },
                        { n: "02", t: "Community e Gruppo WhatsApp", d: <>Utilizzate il link del nostro <a href="https://chat.whatsapp.com/BLmjJYNGPq6H0jfN4wEwoK?mode=gi_t" target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-black hover:underline">GRUPPO WHATSAPP UFFICIALE</a> e inviatelo a tutti i vostri amici e conoscenti interessati a far parte della Community. Nella chat ufficiale potrete conoscere altri Padelisti ed altri Circoli dove proporre le vostre partite RanKING e non solo.</> },
                        { n: "03", t: "La Forbice di Valore (Regola dell'Equilibrio)", d: "Al fine di equilibrare la partita e per renderla valida per le statistiche RanKING, è obbligatorio che i 4 partecipanti rientrino in un range di valore complessivo di ±0.25 tra di loro. Altrimenti, la WebApp non consentirà il salvataggio della partita (ovviamente nulla osta a organizzarvi per giocare lo stesso, ma non avrà valore RanKING)." },
                        { n: "04", t: "Inserimento dei Risultati", d: "Una volta terminata la partita, in qualsiasi momento, uno dei partecipanti (o l’organizzatore del match) dovrà inserire il risultato dettagliando il numero dei Game e dei Set, affinché la vittoria vada alla squadra che ha fatto il meglio dei 3 set." },
                        { n: "05", t: "Assegnazione Punti Rank Base", d: "Il sistema aggiungerà alla coppia che vince +0.05 mentre sottrarrà -0.05 agli sconfitti, aggiornando in tempo reale la classifica RanKING e tutte le statistiche dei giocatori interessati." },
                        { n: "06", t: "I Titoli di KING e Fanalino (SX, DX, MIX)", d: "Per ottenere il titolo di KING bisogna avere il più alto punteggio nel proprio lato di gioco scelto in fase di registrazione. Verrà evidenziato in giallo con la scritta 'KING SX', 'KING DX' o 'KING MIX'. In caso di parità, verrà assegnato a tutti gli ex-aequo. Stesso identico discorso per chi si trova in fondo alla classifica con il punteggio più basso ('FANALINO SX', 'FANALINO DX' o 'FANALINO MIX')." },
                        { n: "07", t: "Sconfiggere il KING (Moltiplicatore Bonus)", d: "Nel caso in cui venga battuto il KING (SX, DX o MIX), verrà assegnato il doppio dei punti rank (ossia +0.10) alla coppia vincitrice, mentre sottrarrò sempre -0.05 agli sconfitti. Solo nel caso in cui venga sconfitta una qualsiasi coppia di KING che ha giocato insieme nella stessa squadra, allora sottrarrò un malus di -0.10 ad entrambi come penalità." },
                        { n: "08", t: "Il Riscatto del Fanalino", d: "Nel caso in cui un FANALINO (SX, DX o MIX) dovesse vincere qualsiasi partita, verrà assegnato il doppio dei punti rank (ossia +0.10) alla coppia vincitrice chiunque sia il suo compagno, mentre verranno sottratti regolarmente -0.05 agli sconfitti." },
                        { n: "09", t: "Partite Consecutive e Tetto Punti Rank", d: "È possibile svolgere più di una partita RanKING consecutiva all’interno della stessa giornata (con le stesse coppie o diverse). I vari Bonus/Malus non sono cumulabili fra loro: ±0.10 sarà sempre il massimo assegnato per partita. Se fate più partite consecutive, dovete registrarle separatamente." },
                        { n: "10", t: "Inattività e Malus d'Ufficio", d: "Chi non svolgerà almeno una partita RanKING entro 30 giorni dalla precedente perderà d’ufficio -0.05 di punteggio ad oltranza. Se l’assenza dovesse protrarsi nel tempo, mi riservo la possibilità di gestire ad hoc la situazione." }
                    ].map((art) => (
                        <section key={art.n} className="flex gap-4 border-b border-slate-100 pb-6">
                            <span className="w-10 h-10 flex items-center justify-center font-black text-xs text-white bg-slate-900 rounded-sm shrink-0">
                                {art.n}
                            </span>
                            <div>
                                <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-2">{art.t}</h2>
                                <p className="text-xs font-medium text-slate-600 leading-relaxed">{art.d}</p>
                            </div>
                        </section>
                    ))}

                    {/* VINCOLI APPLICAZIONE */}
                    <div className="bg-slate-900 text-white p-6 rounded-sm mt-12">
                        <h3 className="text-[10px] font-black uppercase tracking-widest mb-6 border-b border-slate-700 pb-2">🛡️ Vincoli di Architettura e Organizzazione Match nell'App</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { t: "Validazione Dinamica", d: "È possibile salvare una partita lasciando alcuni slot vuoti. La barriera di sbilanciamento (±0.25) si attiva non appena sono presenti almeno 2 giocatori." },
                                { t: "Controllo Anti-Clonazione", d: "Il sistema impedisce l'inserimento dello stesso giocatore in più posizioni contemporaneamente, sia in creazione che durante la partecipazione autonoma." },
                                { t: "Filtro Tattico", d: "I menu a tendina escludono i giocatori fuori ruolo. SX o DX compaiono solo negli slot corretti; i giocatori MIX sono sempre selezionabili." },
                                { t: "Registro Audit Log", d: "Per garantire trasparenza, ogni operazione di registrazione, creazione match o cancellazione viene tracciata nel sistema per l'amministratore." }
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
