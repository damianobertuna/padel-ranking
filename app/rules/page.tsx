'use client';

import BackToHomeButton from "@/components/BackToHomeButton";

export default function RegulationsPage() {
    return (
        <main className="min-h-screen bg-slate-50 p-4 sm:p-8 flex flex-col items-center">
            <div className="max-w-4xl w-full bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-slate-200">

                {/* BACK LINK */}
                <div className="mb-6">
                    <BackToHomeButton />
                </div>

                {/* HEADER */}
                <div className="border-b border-slate-100 pb-6 mb-8">
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Regolamento Ufficiale</h1>
                    <p className="text-sm text-slate-500 mt-2 font-medium">
                        Regolamento RanKING Padel… Ora anche su WebApp!
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                        Ciao a tutti i Padelisti, ecco le 10 semplici regole per partecipare <strong className="text-slate-600">GRATUITAMENTE</strong> alla Classifica del RanKING Padel.
                    </p>
                </div>

                {/* CONTENUTO PRINCIPALE */}
                <div className="space-y-8">

                    {/* ARTICOLO 1 */}
                    <section className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs font-mono shrink-0">1</span>
                            <h2 className="text-base font-black text-slate-800 tracking-tight">Registrazione e Autovalutazione</h2>
                        </div>
                        <div className="text-sm text-slate-600 leading-relaxed pl-8 space-y-2">
                            <p>
                                Accedete e registratevi autonomamente alla WebApp che vi richiederà: Nome, Cognome, Email, Password, Contatto Whatsapp, Lato di gioco, Mano dominante e Livello personale di partenza.
                            </p>
                            <p>
                                Potete autovalutarvi tramite la{' '}
                                <a href="https://www.padelnuestro.com/it/blog/livelli-del-padel" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-bold hover:underline">
                                    Guida Ufficiale dei Livelli Padel
                                </a>{' '}
                                o chiedendo supporto al vostro Maestro del Circolo di riferimento per avere una valutazione professionale (tanto alla fine sarà il campo a delineare il proprio valore reale).
                            </p>
                            <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <strong className="text-slate-700">Nota sul Valore:</strong> Vi ricordo che il Valore della Classifica RanKING (inventato per differenziare meglio le fasce con il frazionamento di 0.05) non è la classificazione statica dei livelli del padel divisa in numeri al quale mi sono ispirato dal NTRP (National Tennis Rating Program) che serve a stabilire l'esperienza iniziale. La Classifica RanKING indica invece l’andamento dinamico del Padelista a confronto con gli altri della Community.
                            </p>
                        </div>
                    </section>

                    {/* ARTICOLO 2 */}
                    <section className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs font-mono shrink-0">2</span>
                            <h2 className="text-base font-black text-slate-800 tracking-tight">Community e Gruppo WhatsApp</h2>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed pl-8">
                            Utilizzate il link del nostro{' '}
                            <a href="https://chat.whatsapp.com/BLmjJYNGPq6H0jfN4wEwoK?mode=gi_t" target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-bold hover:underline flex items-center gap-1 inline-flex">
                                Gruppo WhatsApp Ufficiale
                            </a>{' '}
                            e inviatelo a tutti i vostri amici e conoscenti interessati a far parte della Community. Nella chat ufficiale potrete conoscere altri Padelisti ed altri Circoli dove proporre le vostre partite RanKING e non solo.
                        </p>
                    </section>

                    {/* ARTICOLO 3 */}
                    <section className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs font-mono shrink-0">3</span>
                            <h2 className="text-base font-black text-slate-800 tracking-tight">La Forbice di Valore (Regola dell'Equilibrio)</h2>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed pl-8">
                            Al fine di equilibrare la partita e per renderla valida per le statistiche RanKING, è obbligatorio che i 4 partecipanti rientrino in un range di valore complessivo di <strong>±0.25</strong> tra di loro. Altrimenti, la WebApp non consentirà il salvataggio della partita (ovviamente nulla osta a organizzarvi per giocare lo stesso, ma non avrà valore RanKING).
                        </p>
                    </section>

                    {/* ARTICOLO 4 */}
                    <section className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs font-mono shrink-0">4</span>
                            <h2 className="text-base font-black text-slate-800 tracking-tight">Inserimento dei Risultati</h2>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed pl-8">
                            Una volta terminata la partita, in qualsiasi momento, uno dei partecipanti (o l’organizzatore del match) dovrà inserire il risultato dettagliando il numero dei Game e dei Set, affinché la vittoria vada alla squadra che ha fatto il meglio dei 3 set.
                        </p>
                    </section>

                    {/* ARTICOLO 5 */}
                    <section className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs font-mono shrink-0">5</span>
                            <h2 className="text-base font-black text-slate-800 tracking-tight">Assegnazione Punti Base</h2>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed pl-8">
                            Il sistema aggiungerà alla coppia che vince <strong>+0.05</strong> mentre sottrarrà <strong>-0.05</strong> agli sconfitti, aggiornando in tempo reale la classifica RanKING e tutte le statistiche dei giocatori interessati.
                        </p>
                    </section>

                    {/* ARTICOLO 6 */}
                    <section className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs font-mono shrink-0">6</span>
                            <h2 className="text-base font-black text-slate-800 tracking-tight">I Titoli di KING e Fanalino (SX, DX, MIX)</h2>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed pl-8">
                            Per ottenere il titolo di KING bisogna avere il più alto punteggio nel proprio lato di gioco scelto in fase di registrazione. Verrà evidenziato in giallo con la scritta <strong>"KING SX"</strong>, <strong>"KING DX"</strong> o <strong>"KING MIX"</strong>. In caso di parità, verrà assegnato a tutti gli ex-aequo. Stesso identico discorso per chi si trova in fondo alla classifica con il punteggio più basso (<strong>"FANALINO SX"</strong>, <strong>"FANALINO DX"</strong> o <strong>"FANALINO MIX"</strong>).
                        </p>
                    </section>

                    {/* ARTICOLO 7 */}
                    <section className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs font-mono shrink-0">7</span>
                            <h2 className="text-base font-black text-slate-800 tracking-tight">Sconfiggere il KING (Moltiplicatore Bonus)</h2>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed pl-8">
                            Nel caso in cui venga battuto il KING (SX, DX o MIX), verrà assegnato il doppio dei punti (ossia <strong>+0.10</strong>) alla coppia vincitrice, mentre sottrarrò sempre <strong>-0.05</strong> agli sconfitti. Solo nel caso in cui venga sconfitta una qualsiasi coppia di KING che ha giocato insieme nella stessa squadra, allora sottrarrò un malus di <strong>-0.10</strong> ad entrambi come penalità.
                        </p>
                    </section>

                    {/* ARTICOLO 8 */}
                    <section className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs font-mono shrink-0">8</span>
                            <h2 className="text-base font-black text-slate-800 tracking-tight">Il Riscatto del Fanalino</h2>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed pl-8">
                            Nel caso in cui un FANALINO (SX, DX o MIX) dovesse vincere qualsiasi partita, verrà assegnato il doppio dei punti (ossia <strong>+0.10</strong>) alla coppia vincitrice chiunque sia il suo compagno, mentre verranno sottratti regolarmente <strong>-0.05</strong> agli sconfitti.
                        </p>
                    </section>

                    {/* ARTICOLO 9 */}
                    <section className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs font-mono shrink-0">9</span>
                            <h2 className="text-base font-black text-slate-800 tracking-tight">Partite Consecutive e Tetto Punti</h2>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed pl-8">
                            È possibile svolgere più di una partita RanKING consecutiva all’interno della stessa giornata (con le stesse coppie o diverse). I vari Bonus/Malus non sono cumulabili fra loro: <strong>±0.10</strong> sarà sempre il massimo assegnato per partita. Se fate più partite consecutive, dovete registrarle separatamente.
                        </p>
                    </section>

                    {/* ARTICOLO 10 */}
                    <section className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs font-mono shrink-0">10</span>
                            <h2 className="text-base font-black text-slate-800 tracking-tight">Inattività e Malus d'Ufficio</h2>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed pl-8">
                            Chi non svolgerà almeno una partita RanKING entro 30 giorni dalla precedente perderà d’ufficio <strong>-0.05</strong> di punteggio ad oltranza. Se l’assenza dovesse protrarsi nel tempo, mi riservo la possibilità di gestire ad hoc la situazione.
                        </p>
                    </section>

                    {/* CONTATTI E RINGRAZIAMENTI */}
                    <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 mt-8">
                        <p className="text-sm font-medium text-indigo-900 mb-2">
                            <strong className="font-black">P.S.</strong> Per qualsiasi informazione o chiarimento non esitate a contattarmi privatamente al <strong>3476463474</strong>, grazie. <br/>
                            <span className="italic">— Fabio Lombardo</span>
                        </p>
                        <p className="text-xs text-indigo-700/80 pt-2 border-t border-indigo-200/50">
                            <strong className="font-bold">N.B.</strong> Un ringraziamento speciale a Damiano Bertuna che gestisce tutta la parte informatica della nostra WebApp!
                        </p>
                    </div>

                    {/* --- PARTE VINCOLI DELL'APPLICAZIONE (Invariata per utilità tecnica) --- */}
                    <hr className="border-slate-200 my-8" />

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                        <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                            🛡️ Vincoli di Architettura e Organizzazione Match nell'App
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            L'applicazione integra nativamente i vincoli del regolamento per impedire salvataggi non conformi:
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                                <span className="font-bold text-indigo-600 block">Validazione Dinamica delle Partite Aperte</span>
                                <p className="text-slate-600">
                                    È possibile salvare una partita lasciando alcuni slot vuoti per consentire ad altri giocatori di unirsi in seguito. La barriera di sbilanciamento del livello (<strong>≤ 0.25</strong>) si attiva non appena sono presenti almeno 2 giocatori.
                                </p>
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                                <span className="font-bold text-indigo-600 block">Controllo Anti-Clonazione</span>
                                <p className="text-slate-600">
                                    Il sistema impedisce l'inserimento dello stesso giocatore in più posizioni contemporaneamente, sia in creazione che durante la partecipazione autonoma.
                                </p>
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                                <span className="font-bold text-indigo-600 block">Filtro Tattico dei Lati Campo (SX/DX)</span>
                                <p className="text-slate-600">
                                    I menu a tendina escludono automaticamente i giocatori fuori ruolo. I giocatori di <strong>Sinistra (SX)</strong> o <strong>Destra (DX)</strong> compaiono solo nei rispettivi slot. I giocatori <strong>Mix (Both)</strong> sono sempre selezionabili.
                                </p>
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                                <span className="font-bold text-indigo-600 block">Registro Audit Log</span>
                                <p className="text-slate-600">
                                    Per garantire totale trasparenza e sicurezza contro le manipolazioni, ogni operazione di registrazione, creazione match o cancellazione viene tracciata nel sistema per l'amministratore.
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
