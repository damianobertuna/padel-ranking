import { createClient } from '@/lib/supabase/server';

// Interfacce aggiornate
interface Player {
    id: number;
    first_name: string;
    last_name: string;
    preferred_side: string;
    ranking: number;
}

interface Match {
    id: string;
    match_date: string;
    team_a_left_id: number;
    team_a_right_id: number;
    team_b_left_id: number;
    team_b_right_id: number;
    status: string;
}

export default async function Home() {
    const supabase = createClient();

    // 1. Recuperiamo i giocatori per la classifica
    const { data: players } = await supabase
        .from('players')
        .select('*')
        .order('ranking', { ascending: false });

    // 2. Recuperiamo le partite "pending" (non ancora concluse)
    const { data: pendingMatches } = await supabase
        .from('matches')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    // Funzione helper per trovare il nome di un giocatore partendo dal suo ID
    const getPlayerName = (id: number) => {
        const player = players?.find((p) => p.id === id);
        return player ? `${player.first_name} ${player.last_name}` : 'Sconosciuto';
    };

    // --- LOGICA PER IDENTIFICARE I RUOLI SPECIALI ---
    const leftPlayers = players?.filter(p => p.preferred_side === 'Left') || [];
    const rightPlayers = players?.filter(p => p.preferred_side === 'Right') || [];

    const kingLeftId = leftPlayers.length > 0 ? leftPlayers[0].id : null;
    const kingRightId = rightPlayers.length > 0 ? rightPlayers[0].id : null;
    const lastPlaceId = players && players.length > 0 ? players[players.length - 1].id : null;

    return (
        <main className="min-h-screen p-8 bg-slate-100 flex flex-col items-center">
            <div className="max-w-4xl w-full">
                {/* Titolo e Pulsante */}
                <h1 className="text-4xl font-extrabold text-slate-800 text-center mb-2">
                    RanKING Padel 🎾
                </h1>
                <p className="text-slate-600 text-center mb-6">
                    Classifica ufficiale aggiornata in tempo reale
                </p>

                <div className="mb-8 flex justify-center">
                    <a
                        href="/new-match"
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-full shadow transition-colors"
                    >
                        + Crea Nuova Partita
                    </a>
                </div>

                {/* CLASSIFICA */}
                <div className="bg-white shadow-md rounded-lg overflow-hidden mb-12">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Pos.</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Giocatore</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Lato Pref.</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Ranking</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                        {players?.map((player, index) => {
                            // Determiniamo lo stile della riga in base al ruolo
                            let rowClass = "hover:bg-slate-50 transition-colors";
                            let roleBadge = null;

                            if (player.id === kingLeftId) {
                                rowClass = "bg-blue-50 border-l-4 border-blue-500 hover:bg-blue-100";
                                roleBadge = <span className="ml-2 text-xs font-bold text-blue-600 bg-blue-200 px-2 py-1 rounded-full">👑 KING Sx</span>;
                            } else if (player.id === kingRightId) {
                                rowClass = "bg-yellow-50 border-l-4 border-yellow-400 hover:bg-yellow-100";
                                roleBadge = <span className="ml-2 text-xs font-bold text-yellow-700 bg-yellow-200 px-2 py-1 rounded-full">👑 KING Dx</span>;
                            } else if (player.id === lastPlaceId) {
                                rowClass = "bg-slate-100 border-l-4 border-slate-400";
                                roleBadge = <span className="ml-2 text-xs font-bold text-slate-500 bg-slate-200 px-2 py-1 rounded-full">⚓ Fanalino</span>;
                            }

                            return (
                                <tr key={player.id} className={rowClass}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-500">#{index + 1}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 flex items-center">
                                        {player.first_name} {player.last_name} {roleBadge}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-slate-600">
                                        {player.preferred_side === 'Left' ? 'Sx' : 'Dx'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-indigo-600">
                                        {player.ranking.toFixed(2)}
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>

                {/* PARTITE IN PROGRAMMA */}
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Partite in Programma</h2>
                {pendingMatches?.length === 0 ? (
                    <p className="text-slate-500 italic">Nessuna partita in programma al momento.</p>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                        {pendingMatches?.map((match) => (
                            <div key={match.id} className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
                                <div className="text-sm text-slate-500 mb-4 text-center font-medium">
                                    {match.match_date ? new Date(match.match_date).toLocaleString('it-IT') : 'Data da definire'}
                                </div>

                                <div className="flex justify-between items-center">
                                    {/* Squadra A */}
                                    <div className="text-center w-2/5">
                                        <h3 className="font-bold text-blue-700 mb-2">Squadra A</h3>
                                        <p className="text-sm text-slate-700">{getPlayerName(match.team_a_left_id)} <span className="text-xs text-slate-400">(Sx)</span></p>
                                        <p className="text-sm text-slate-700">{getPlayerName(match.team_a_right_id)} <span className="text-xs text-slate-400">(Dx)</span></p>
                                    </div>

                                    <div className="text-xl font-black text-slate-300">VS</div>

                                    {/* Squadra B */}
                                    <div className="text-center w-2/5">
                                        <h3 className="font-bold text-red-700 mb-2">Squadra B</h3>
                                        <p className="text-sm text-slate-700">{getPlayerName(match.team_b_left_id)} <span className="text-xs text-slate-400">(Sx)</span></p>
                                        <p className="text-sm text-slate-700">{getPlayerName(match.team_b_right_id)} <span className="text-xs text-slate-400">(Dx)</span></p>
                                    </div>
                                </div>

                                <a
                                    href={`/resolve-match/${match.id}`}
                                    className="block text-center mt-6 w-full bg-slate-100 text-slate-600 font-semibold py-2 rounded hover:bg-slate-200 transition-colors"
                                >
                                    Inserisci Risultato
                                </a>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
