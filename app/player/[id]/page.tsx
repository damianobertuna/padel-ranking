import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import WinRateWidget from '@/components/WinRateWidget';
import StreakWidget from '@/components/StreakWidget';
import PartnersAndNemesisWidget from '@/components/PartnersAndNemesisWidget';

export const revalidate = 0;

// Numero di match personali da mostrare per pagina nello storico del giocatore
const MATCHES_PER_PAGE = 5;

interface PageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ page?: string }>; // <-- Aggiungiamo i searchParams
}

export default async function PlayerProfile({ params, searchParams }: PageProps) {
    // 1. Scompattiamo i parametri asincroni di Next.js 15
    const { id: playerIdStr } = await params;
    const playerId = parseInt(playerIdStr);

    const resolvedSearchParams = await searchParams;
    const currentPage = parseInt(resolvedSearchParams.page || '1', 10) || 1;

    const supabase = await createClient();

    // 2. Recuperiamo il profilo del giocatore specifico
    const { data: player } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single();

    if (!player) {
        return (
            <main className="min-h-screen p-8 bg-slate-100 flex flex-col items-center justify-center">
                <p className="text-red-600 font-bold mb-4">Giocatore non trovato.</p>
                <Link href="/" className="text-indigo-600 underline">Torna alla classifica</Link>
            </main>
        );
    }

    // 3. Recuperiamo TUTTI i giocatori per poter ricostruire i nomi nei match
    const { data: allPlayers } = await supabase.from('players').select('*');
    const getPlayerName = (id: number) => {
        const p = allPlayers?.find(x => x.id === id);
        return p ? `${p.first_name} ${p.last_name}` : 'Sconosciuto';
    };

    // 4. STRATEGIA DI RECUPERO DATI:
    // Per calcolare accuratamente le statistiche globali (Win Rate, Streak, Nemesi)
    // abbiamo ASSOLUTAMENTE bisogno di TUTTI i match del giocatore.
    const { data: allMatches } = await supabase
        .from('matches')
        .select('*')
        .eq('status', 'completed')
        .or(`team_a_left_id.eq.${playerId},team_a_right_id.eq.${playerId},team_b_left_id.eq.${playerId},team_b_right_id.eq.${playerId}`)
        .order('created_at', { ascending: false });

    // Arricchiamo TUTTI i match con l'esito (Vittoria/Sconfitta) per i calcoli dei widget
    let victories = 0;
    let defeats = 0;

    const enrichedMatches = (allMatches || []).map(match => {
        const isTeamA = [match.team_a_left_id, match.team_a_right_id].includes(playerId);
        const won = (isTeamA && match.winning_team === 'A') || (!isTeamA && match.winning_team === 'B');

        if (won) victories++;
        else defeats++;

        return {
            ...match,
            userWon: won,
        };
    });

    const totalMatches = victories + defeats;
    const winRate = totalMatches > 0 ? parseFloat(((victories / totalMatches) * 100).toFixed(1)) : 0;

    const statsForWidget = {
        totalPlayed: totalMatches,
        totalWon: victories,
        totalLost: defeats,
        winRate: winRate
    };

    // 5. APPLICHIAMO LA PAGINAZIONE SOLO SULLA VISUALIZZAZIONE
    // Essendo i dati già in memoria estratti per i widget, facciamo uno "slice" dell'array.
    // Questo evita doppie query complesse o disallineamenti nei conteggi!
    const totalPages = totalMatches > 0 ? Math.ceil(totalMatches / MATCHES_PER_PAGE) : 1;
    const fromIndex = (currentPage - 1) * MATCHES_PER_PAGE;
    const toIndex = fromIndex + MATCHES_PER_PAGE;

    // Questo è il sotto-insieme di match che mostreremo in questa specifica pagina
    const paginatedMatches = enrichedMatches.slice(fromIndex, toIndex);

    return (
        <main className="min-h-screen p-4 sm:p-8 bg-slate-100 flex flex-col items-center">
            <div className="max-w-5xl w-full">

                {/* Pulsante Torna Indietro */}
                <Link href="/" className="text-sm font-semibold text-indigo-600 hover:underline mb-6 inline-block">
                    ← Torna alla Classifica
                </Link>

                {/* Scheda Profilo Principale */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">{player.first_name} {player.last_name}</h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Lato preferito: <strong className="text-slate-700">{player.preferred_side === 'Left' ? 'Sinistro (SX)' : 'Destro (DX)'}</strong>
                        </p>
                    </div>
                    <div className="text-center sm:text-right">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ranking Attuale</span>
                        <div className="text-4xl font-mono font-black text-indigo-600 mt-1">{player.ranking.toFixed(2)}</div>
                    </div>
                </div>

                {/* SEZIONE GRIGLIA STATISTICHE AVANZATE (Prendono sempre i dati globali) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 w-full justify-items-center sm:justify-items-stretch">
                    <WinRateWidget stats={statsForWidget} />
                    <StreakWidget enrichedMatches={enrichedMatches} />
                    <PartnersAndNemesisWidget
                        playerId={playerId}
                        enrichedMatches={enrichedMatches}
                        allPlayers={allPlayers || []}
                    />
                </div>

                {/* ELENCO STORICO PARTITE PERSONALE (Paginato graficamente) */}
                <div className="flex justify-between items-baseline mb-4">
                    <h2 className="text-xl font-bold text-slate-800">Storico Partite Personale</h2>
                    <span className="text-xs font-semibold text-slate-400 font-mono">Pagina {currentPage} di {totalPages}</span>
                </div>

                <div className="space-y-3">
                    {paginatedMatches.length > 0 ? (
                        paginatedMatches.map((match) => (
                            <div
                                key={match.id}
                                className={`bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center ${
                                    match.userWon ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'
                                }`}
                            >
                                <div className="flex-1 min-w-0 pr-2">
                                    <div className="text-[10px] text-slate-400 font-medium mb-1">
                                        {new Date(match.created_at).toLocaleDateString('it-IT')}
                                    </div>
                                    <div className="text-sm text-slate-700 truncate font-medium">
                                        Con: <span className="font-bold text-slate-800">{getPlayerName(match.team_a_left_id === player.id || match.team_a_right_id === player.id ? (match.team_a_left_id === player.id ? match.team_a_right_id : match.team_a_left_id) : (match.team_b_left_id === player.id ? match.team_b_right_id : match.team_b_left_id))}</span>
                                    </div>
                                    <div className="text-xs text-slate-400 mt-0.5 truncate font-medium">
                                        Contro: {match.team_a_left_id === player.id || match.team_a_right_id === player.id
                                        ? `${getPlayerName(match.team_b_left_id)} / ${getPlayerName(match.team_b_right_id)}`
                                        : `${getPlayerName(match.team_a_left_id)} / ${getPlayerName(match.team_a_right_id)}`
                                    }
                                    </div>
                                </div>

                                <div className="shrink-0 pl-2">
                                    {match.userWon ? (
                                        <span className="bg-green-100 text-green-800 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">Vittoria</span>
                                    ) : (
                                        <span className="bg-red-100 text-red-800 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">Sconfitta</span>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-slate-500 italic text-sm bg-white p-6 rounded-xl border border-slate-200 text-center shadow-sm">
                            Questo giocatore non ha ancora disputato partite ufficiali.
                        </p>
                    )}
                </div>

                {/* CONTROLLI DI PAGINAZIONE CON INDIRIZZAMENTO ROTTA DINAMICA */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-6">
                        <Link
                            href={`/player/${playerId}?page=${currentPage - 1}`}
                            scroll={false} // Evita il balzo in alto al click
                            className={`px-4 py-2 bg-white border border-slate-200 text-sm font-bold text-slate-700 rounded-xl shadow-sm transition-all active:scale-95 ${
                                currentPage <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-slate-50'
                            }`}
                        >
                            ← Precedente
                        </Link>

                        <div className="text-xs font-bold text-slate-500 font-mono">
                            {currentPage} / {totalPages}
                        </div>

                        <Link
                            href={`/player/${playerId}?page=${currentPage + 1}`}
                            scroll={false} // Evita il balzo in alto al click
                            className={`px-4 py-2 bg-white border border-slate-200 text-sm font-bold text-slate-700 rounded-xl shadow-sm transition-all active:scale-95 ${
                                currentPage >= totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-slate-50'
                            }`}
                        >
                            Successiva →
                        </Link>
                    </div>
                )}

            </div>
        </main>
    );
}
