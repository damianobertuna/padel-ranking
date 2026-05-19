'use client';

import Link from 'next/link';

export default function RegulationsPage() {
    return (
        <main className="min-h-screen bg-slate-50 p-4 sm:p-8 flex flex-col items-center">
            <div className="max-w-4xl w-full bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-slate-200">

                {/* BACK LINK */}
                <div className="mb-6">
                    <Link href="/" className="text-xs font-bold text-indigo-600 hover:underline">
                        ← Torna alla Classifica
                    </Link>
                </div>

                {/* HEADER */}
                <div className="border-b border-slate-100 pb-6 mb-8">
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Regolamento Ufficiale</h1>
                    <p className="text-sm text-slate-400 mt-1">Ciao Padelisti, ecco le semplici regole per poter partecipare alla Classifica del RanKING Padel e l'architettura dei vincoli della nostra applicazione.</p>
                </div>

                {/* CONTENUTO PRINCIPALE */}
                <div className="space-y-8">

                    {/* ARTICOLO 1 */}
                    <section className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs font-mono">1</span>
                            <h2 className="text-base font-black text-slate-800 tracking-tight">Iscrizione e Livello di Partenza</h2>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed pl-8">
                            Comunicare in privato al <strong>3476463474</strong> Nome e Cognome oltre al vostro lato di gioco preferito ed il livello di partenza autovalutandovi tramite la guida ufficiale dei livelli.
                            Se questo non verrà comunicato, sarà assegnato di default il livello di <strong>4.50</strong> e poi aggiornato in seguito su richiesta. Tanto alla fine sarà il campo a delineare il nostro reale valore.
                        </p>
                    </section>

                    {/* ARTICOLO 2 */}
                    <section className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs font-mono">2</span>
                            <h2 className="text-base font-black text-slate-800 tracking-tight">La Forbice di Valore (Regola dell'Equilibrio)</h2>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed pl-8">
                            Al fine di equilibrare la partita e per poter aggiornare la classifica RanKING, è obbligatorio che i 4 partecipanti debbano rientrare in una forbice di valore RanKING di <strong>±0.25</strong> tra di loro. Ad esempio, un giocatore con punteggio 4.50 può partecipare solo alle partite di altri Padelisti con valore RanKING compreso tra 4.25 e 4.75.
                        </p>
                    </section>

                    {/* ARTICOLO 3 */}
                    <section className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs font-mono">3</span>
                            <h2 className="text-base font-black text-slate-800 tracking-tight">Assegnazione Punti Base e Trasparenza</h2>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed pl-8">
                            Quando comunicherete ufficialmente in chat a quale squadra va la vittoria al meglio dei 3 set, verranno aggiunti alla coppia che vince <strong>+0.05</strong> mentre verranno sottratti <strong>-0.05</strong> agli sconfitti.
                            Prima di comunicare il risultato, vi chiediamo (al fine di gestire al meglio e con totale trasparenza) che sia inserito nella chat ufficiale almeno un partecipante per squadra e di invitare tutti i vostri amici interessati.
                        </p>
                    </section>

                    {/* ARTICOLO 4 */}
                    <section className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs font-mono">4</span>
                            <h2 className="text-base font-black text-slate-800 tracking-tight">Partite Consecutive</h2>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed pl-8">
                            È possibile svolgere anche più di una partita RanKING consecutiva all’interno della stessa giornata, giocando sia con le stesse coppie sia modificando la formazione con coppie diverse.
                        </p>
                    </section>

                    {/* ARTICOLO 5 */}
                    <section className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs font-mono">5</span>
                            <h2 className="text-base font-black text-slate-800 tracking-tight">Il Titolo di KING del Lato</h2>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed pl-8">
                            Per ottenere il titolo di <strong>KING</strong> bisogna avere il più alto punteggio Rank nel proprio lato di gioco preferito. Lo status viene evidenziato visivamente in <strong>azzurro per il lato SX</strong> e in <strong>giallo per il lato DX</strong> sulla griglia generale. In caso di parità aritmetica, il titolo verrà assegnato a tutti i giocatori ex-aequo.
                        </p>
                    </section>

                    {/* ARTICOLO 6 */}
                    <section className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs font-mono">6</span>
                            <h2 className="text-base font-black text-slate-800 tracking-tight">Sconfiggere il KING (Moltiplicatore Bonus)</h2>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed pl-8">
                            Nel caso in cui venga battuto il KING di SX o il KING di DX, verrà assegnato il doppio dei punti (ossia <strong>+0.10</strong>) alla coppia vincitrice, mentre verranno sottratti <strong>-0.05</strong> agli sconfitti. Solo nel caso estremo in cui la coppia di KING venga sconfitta giocando nello stesso team, verrà sottratto un Malus di <strong>-0.10</strong> ad entrambi.
                        </p>
                    </section>

                    {/* ARTICOLO 7 */}
                    <section className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs font-mono">7</span>
                            <h2 className="text-base font-black text-slate-800 tracking-tight">Premio Fanalino di Coda</h2>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed pl-8">
                            Nel caso in cui un giocatore di SX o di DX con il punteggio più basso in classifica (evidenziato in <strong>grigio / Fanalino</strong>) dovesse vincere una qualsiasi partita, verrà assegnato il doppio dei punti (ossia <strong>+0.10</strong>) alla coppia vincitrice, chiunque sia il suo compagno di squadra. Verranno sempre sottratti <strong>-0.05</strong> agli sconfitti.
                        </p>
                    </section>

                    {/* ARTICOLO 8 */}
                    <section className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs font-mono">8</span>
                            <h2 className="text-base font-black text-slate-800 tracking-tight">Inattività e Malus d'Ufficio</h2>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed pl-8">
                            Chi non svolgerà almeno una partita RanKING per 10 giornate registrate consecutive (evidenziato in <strong>viola</strong>) perderà d’ufficio <strong>-0.05</strong>. Se questa assenza si protrarrà per altre 10 giornate registrate consecutive alle precedenti (evidenziato in <strong>nero</strong>), il giocatore sarà momentaneamente estromesso dalla classifica. Qualora volesse rientrare subirà, per penalità, un ulteriore decremento di <strong>-0.10</strong> sul livello che aveva lasciato prima.
                        </p>
                    </section>

                    {/* ARTICOLO 9 */}
                    <section className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs font-mono">9</span>
                            <h2 className="text-base font-black text-slate-800 tracking-tight">Massimo Tetto Punti</h2>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed pl-8">
                            I vari Bonus/Malus non sono cumulabili fra loro per la stessa partita: il valore di <strong>±0.10</strong> rappresenta sempre il massimo punteggio assoluto assegnabile per singolo match.
                        </p>
                    </section>

                    {/* ARTICOLO 10 */}
                    <section className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs font-mono">10</span>
                            <h2 className="text-base font-black text-slate-800 tracking-tight">Significato del Valore RanKING</h2>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed pl-8">
                            Il Valore della Classifica RanKING (inventato per differenziare meglio le fasce con il frazionamento di 0.05) non è la classificazione statica dei livelli del padel divisa in numeri al quale ci si è ispirati dal modello NTRP (National Tennis Rating Program) utile a stabilire l'esperienza iniziale. La Classifica RanKING indica invece l’andamento dinamico e lo stato di forma del Padelista a diretto confronto con gli altri membri del circuito.
                        </p>
                    </section>

                    {/* --- PARTE NUOVA: SPECIFICHE E VINCOLI DELL'APPLICAZIONE --- */}
                    <hr className="border-slate-200 my-6" />

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                        <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                            🛡️ Vincoli di Architettura e Organizzazione Match nell'App
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            L'applicazione integra i vincoli del regolamento all'interno dei form per impedire salvataggi non conformi:
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                                <span className="font-bold text-indigo-600 block">Validazione Dinamica delle Partite Aperte</span>
                                <p className="text-slate-600">
                                    È possibile salvare una partita lasciando alcuni **slot vuoti (Partita Aperta)** per consentire ad altri giocatori di unirsi in seguito. La barriera di sbilanciamento del livello ($\le 0.25$) si attiva non appena sono presenti almeno 2 giocatori in campo, bloccando l'invio in caso di scompensi.
                                </p>
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                                <span className="font-bold text-indigo-600 block">Controllo Anti-Clonazione</span>
                                <p className="text-slate-600">
                                    Il sistema esegue un controllo di unicità ad alta priorità: lo stesso giocatore non può essere inserito in più posizioni contemporaneamente, né durante la creazione iniziale, né durante il completamento di uno slot libero.
                                </p>
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                                <span className="font-bold text-indigo-600 block">Filtro Tattico dei Lati Campo (SX/DX)</span>
                                <p className="text-slate-600">
                                    I menu a tendina escludono automaticamente i giocatori fuori ruolo. Chi ha come preferenza **Sinistra (SX)** compare solo negli slot Left, chi ha **Destra (DX)** solo negli slot Right. I giocatori con attitudine **Mix (Both)** compaiono sempre in ogni elenco.
                                </p>
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                                <span className="font-bold text-indigo-600 block">Risoluzione e Registro Audit Log</span>
                                <p className="text-slate-600">
                                    I risultati possono essere registrati inserendo i punteggi dei singoli set. Per garantire totale trasparenza e sicurezza contro le manipolazioni, ogni operazione di creazione, inserimento o cancellazione viene tracciata nell'Audit Log.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* FOOTER NOTE */}
                <div className="mt-10 pt-6 border-t border-slate-100 text-center">
                    <p className="text-[11px] font-mono text-slate-400">RanKING Padel v2.0 - Algoritmo Digitale Sviluppato per la Massima Trasparenza Competitiva.</p>
                </div>

            </div>
        </main>
    );
}
