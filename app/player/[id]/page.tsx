import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import WinRateWidget from '@/components/WinRateWidget';
import StreakWidget from '@/components/StreakWidget';
import PartnersAndNemesisWidget from '@/components/PartnersAndNemesisWidget';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function PlayerProfile({ params }: PageProps) {
    // Scompattiamo i parametri asincroni in Next.js 15
    const { id: playerIdStr } = await params;
    const playerId = parseInt(playerIdStr);

    const supabase = await createClient();

    // 1. Recuperiamo il profilo del giocatore specifico
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

    // 2. Recuperiamo TUTTI i giocatori per poter ricostruire i nomi nei match
    const { data: allPlayers } = await supabase.from('players').select('*');
    const getPlayerName = (id: number) => {
        const p = allPlayers?.find(x => x.id === id);
        return p ? `${p.first_name} ${p.last_name}` : 'Sconosciuto';
    };

    // 3. Recuperiamo TUTTE le partite COMPLETATE in cui ha giocato questo utente
    const { data: matches } = await supabase
        .from('matches')
        .select('*')
        .eq('status', 'completed')
        .or(`team_a_left_id.eq.${playerId},team_a_right_id.eq.${playerId},team_b_left_id.eq.${playerId},team_b_right_id.eq.${playerId}`)
        .order('created_at', { ascending: false });

    // 4. CALCOLO STATISTICHE NATIE
    let victories = 0;
    let defeats = 0;

    const enrichedMatches = (matches || []).map(match => {
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

    // 2. ADASSIAMO I TUOI DATI PER IL FORMATO RICHIESTO DAL WIDGET
    const statsForWidget = {
        totalPlayed: totalMatches,
        totalWon: victories,
        totalLost: defeats,
        winRate: winRate
    };

    return (
        <main className="min-h-screen p-8 bg-slate-100 flex flex-col items-center">
            <div className="max-w-3xl w-full">

                {/* Pulsante Torna Indietro */}
                <Link href="/" className="text-sm font-semibold text-indigo-600 hover:underline mb-6 inline-block">
                    ← Torna alla Classifica
                </Link>

                {/* Scheda Profilo Principale */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
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

                {/* Sezione Statistiche Avanzate (Sostituisce i vecchi 3 quadratini piatti) */}
                <div className="mb-8 flex justify-center sm:justify-start">
                    <WinRateWidget stats={statsForWidget} />
                    {/* Gli passiamo la lista completa dei match arricchiti, ci pensa lui a prendere gli ultimi 5 */}
                    <StreakWidget enrichedMatches={enrichedMatches} />
                    {/* Nuovo widget relazionale */}
                    <PartnersAndNemesisWidget
                        playerId={playerId}
                        enrichedMatches={enrichedMatches}
                        allPlayers={allPlayers || []}
                    />
                </div>

                {/* Elenco Storico Partite del Singolo Giocatore */}
                <h2 className="text-xl font-bold text-slate-800 mb-4">Storico Partite Personale</h2>
                <div className="space-y-3">
                    {enrichedMatches.length > 0 ? (
                        enrichedMatches.map((match) => (
                            <div
                                key={match.id}
                                className={`bg-white p-4 rounded-lg shadow-sm border flex justify-between items-center ${
                                    match.userWon ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'
                                }`}
                            >
                                <div className="flex-1">
                                    <div className="text-xs text-slate-400 mb-1">
                                        {new Date(match.created_at).toLocaleDateString('it-IT')}
                                    </div>
                                    <div className="text-sm text-slate-700">
                                        Con <span className="font-semibold">{getPlayerName(match.team_a_left_id === player.id || match.team_a_right_id === player.id ? (match.team_a_left_id === player.id ? match.team_a_right_id : match.team_a_left_id) : (match.team_b_left_id === player.id ? match.team_b_right_id : match.team_b_left_id))}</span>
                                    </div>
                                    <div className="text-xs text-slate-400 mt-0.5">
                                        Contro: {match.team_a_left_id === player.id || match.team_a_right_id === player.id
                                        ? `${getPlayerName(match.team_b_left_id)} / ${getPlayerName(match.team_b_right_id)}`
                                        : `${getPlayerName(match.team_a_left_id)} / ${getPlayerName(match.team_a_right_id)}`
                                    }
                                    </div>
                                </div>

                                <div>
                                    {match.userWon ? (
                                        <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase">Vittoria</span>
                                    ) : (
                                        <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase">Sconfitta</span>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-slate-500 italic text-sm">Questo giocatore non ha ancora disputato partite ufficiali.</p>
                    )}
                </div>

            </div>
        </main>
    );
}
