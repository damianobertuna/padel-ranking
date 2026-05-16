import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { canUserResolveMatch } from '@/lib/matchRules';

export const revalidate = 0;

const sideTranslations: Record<string, string> = {
    'Left': 'SX',
    'Right': 'DX',
};

export default async function Home() {
    const supabase = await createClient();

    // 1. Recuperiamo la sessione dell'utente loggato
    const { data: { user } } = await supabase.auth.getUser();

    // 2. Se l'utente è loggato, recuperiamo il suo profilo giocatore
    let currentUserPlayer = null;
    if (user) {
        const { data: playerData } = await supabase
            .from('players')
            .select('*')
            .eq('user_id', user.id)
            .single();
        currentUserPlayer = playerData;
    }

    // 3. Recuperiamo la classifica completa
    const { data: players } = await supabase
        .from('players')
        .select('*')
        .order('ranking', { ascending: false });

    // 4. Recuperiamo le partite IN PROGRAMMA (pending)
    const { data: pendingMatches } = await supabase
        .from('matches')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    // 5. NUOVO: Recuperiamo lo STORICO delle ultime 10 partite completate (completed)
    const { data: completedMatches, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('status', 'completed')
        .order('updated_at', { ascending: false }) // Ordinate dalla più recente alla più vecchia
        .limit(10);
    console.log("=== DEBUG MATCH COMPLETATI ===");
    console.log("Errore query:", matchError);
    console.log("Quanti match trovati con 'completed':", completedMatches?.length);
    const leftPlayers = players?.filter(p => p.preferred_side === 'Left') || [];
    const rightPlayers = players?.filter(p => p.preferred_side === 'Right') || [];
    const kingLeftId = leftPlayers.length > 0 ? leftPlayers[0].id : null;
    const kingRightId = rightPlayers.length > 0 ? rightPlayers[0].id : null;
    const lastPlaceId = players && players.length > 0 ? players[players.length - 1].id : null;

    const getPlayerName = (id: number) => {
        const p = players?.find(player => player.id === id);
        return p ? `${p.first_name} ${p.last_name}` : 'Sconosciuto';
    };

    return (
        <main className="min-h-screen p-8 bg-slate-100 flex flex-col items-center">
            <div className="max-w-4xl w-full">

                {/* BARRA DI AUTENTICAZIONE IN ALTO */}
                <div className="w-full flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm">
                    <div>
                        {user ? (
                            <p className="text-sm text-slate-600">
                                Connesso come: <strong className="text-slate-900">{currentUserPlayer?.first_name} {currentUserPlayer?.last_name}</strong>
                                <span className="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold uppercase">{currentUserPlayer?.role}</span>
                            </p>
                        ) : (
                            <p className="text-sm text-slate-500">Modalità sola lettura</p>
                        )}
                    </div>
                    <div>
                        {user ? (
                            <form action="/auth/signout" method="post">
                                <button type="submit" className="text-sm font-semibold text-red-600 hover:underline">Esci (Logout)</button>
                            </form>
                        ) : (
                            <Link href="/login" className="text-sm font-bold text-indigo-600 hover:underline">Accedi / Registrati</Link>
                        )}
                    </div>
                </div>

                {/* INTESTAZIONE CLASSIFICA */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-slate-800">RanKING Padel</h1>
                    {user && (
                        <Link href="/new-match" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition-colors text-sm">
                            + Nuova Partita
                        </Link>
                    )}

                    {/* Se l'utente è admin, mostriamo anche il link di gestione */}
                    {currentUserPlayer?.role === 'admin' && (
                        <Link
                            href="/admin/players"
                            className="bg-slate-800 text-white font-bold py-2 px-4 rounded hover:bg-slate-900 transition-colors text-sm shadow-sm"
                        >
                            ⚙️ Gestione Giocatori
                        </Link>
                    )}
                </div>

                {/* TABELLA CLASSIFICA */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-12">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="bg-slate-800 text-white text-sm uppercase">
                            <th className="p-4">Pos</th>
                            <th className="p-4">Giocatore</th>
                            <th className="p-4">Lato</th>
                            <th className="p-4 text-right">Ranking</th>
                            <th className="p-4 text-center">Ruoli</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                        {players?.map((player, index) => {
                            const isKingLeft = player.id === kingLeftId;
                            const isKingRight = player.id === kingRightId;
                            const isLastPlace = player.id === lastPlaceId;

                            return (
                                <tr key={player.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 font-bold text-slate-500">{index + 1}°</td>
                                    <td className="p-4 font-semibold text-slate-800">
                                        <Link
                                            href={`/player/${player.id}`}
                                            className="font-semibold text-slate-800 hover:text-indigo-600 hover:underline transition-colors"
                                        >
                                            {player.first_name} {player.last_name}
                                        </Link>
                                    </td>
                                    <td className="p-4 text-sm">
                                        {player.preferred_side === 'Left' ? (
                                            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded border border-blue-200">SX</span>
                                        ) : player.preferred_side === 'Right' ? (
                                            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded border border-emerald-200">DX</span>
                                        ) : (
                                            <span className="text-slate-400 font-italic">-</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right font-mono font-bold text-indigo-600">
                                        {player.ranking.toFixed(2)}
                                    </td>
                                    <td className="p-4 flex gap-1 justify-center">
                                        {isKingLeft && <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-300">👑 King SX</span>}
                                        {isKingRight && <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full border border-yellow-300">👑 King DX</span>}
                                        {isLastPlace && <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-0.5 rounded-full border border-red-300">🐌 Fanalino</span>}
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>

                {/* SEZIONE 1: PARTITE IN PROGRAMMA */}
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Partite in Programma</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                    {pendingMatches && pendingMatches.length > 0 ? (
                        pendingMatches.map((match) => {
                            const authCtx = currentUserPlayer ? {
                                userRole: currentUserPlayer.role as 'admin' | 'user',
                                userPlayerId: currentUserPlayer.id
                            } : null;

                            const canResolve = canUserResolveMatch(authCtx, match);

                            return (
                                <div key={match.id} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex flex-col justify-between">
                                    <div className="grid grid-cols-2 gap-4 text-center mb-4">
                                        <div className="bg-blue-50 p-3 rounded">
                                            <div className="text-xs font-bold text-blue-600 uppercase mb-1">Coppia A</div>
                                            <div className="text-sm font-semibold text-slate-800">{getPlayerName(match.team_a_left_id)}</div>
                                            <div className="text-sm font-semibold text-slate-800">{getPlayerName(match.team_a_right_id)}</div>
                                        </div>
                                        <div className="bg-emerald-50 p-3 rounded">
                                            <div className="text-xs font-bold text-emerald-600 uppercase mb-1">Coppia B</div>
                                            <div className="text-sm font-semibold text-slate-800">{getPlayerName(match.team_b_left_id)}</div>
                                            <div className="text-sm font-semibold text-slate-800">{getPlayerName(match.team_b_right_id)}</div>
                                        </div>
                                    </div>

                                    {canResolve ? (
                                        <Link
                                            href={`/resolve-match/${match.id}`}
                                            className="mt-2 w-full text-center bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold py-2 rounded transition-colors"
                                        >
                                            Inserisci Risultato
                                        </Link>
                                    ) : (
                                        <div className="mt-2 w-full text-center bg-slate-100 text-slate-400 text-xs py-2 rounded italic select-none">
                                            Sola lettura (non sei in campo)
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-slate-500 italic col-span-2">Nessuna partita in programma.</p>
                    )}
                </div>

                {/* NUOVA SEZIONE 2: STORICO RISULTATI RECENTI */}
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Risultati Recenti</h2>
                <div className="space-y-4">
                    {completedMatches && completedMatches.length > 0 ? (
                        completedMatches.map((match) => {
                            const winner = match.winning_team; // 'A' o 'B'

                            return (
                                <div key={match.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">

                                    {/* Team A */}
                                    <div className={`flex flex-col items-center sm:items-start p-2 rounded w-full sm:w-5/12 ${winner === 'A' ? 'bg-green-50 border-l-4 border-green-500' : 'opacity-60'}`}>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-400 uppercase">Coppia A</span>
                                            {winner === 'A' && <span className="bg-green-200 text-green-800 text-xs font-extrabold px-1.5 py-0.2 rounded">VINCITORI 🎉</span>}
                                        </div>
                                        <div className="text-sm font-bold text-slate-800">{getPlayerName(match.team_a_left_id)}</div>
                                        <div className="text-sm font-bold text-slate-800">{getPlayerName(match.team_a_right_id)}</div>
                                    </div>

                                    {/* VS Divider */}
                                    <div className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase select-none">
                                        VS
                                    </div>

                                    {/* Team B */}
                                    <div className={`flex flex-col items-center sm:items-end p-2 rounded w-full sm:w-5/12 text-center sm:text-right ${winner === 'B' ? 'bg-green-50 border-r-4 border-green-500' : 'opacity-60'}`}>
                                        <div className="flex items-center sm:flex-row-reverse gap-2">
                                            <span className="text-xs font-bold text-slate-400 uppercase">Coppia B</span>
                                            {winner === 'B' && <span className="bg-green-200 text-green-800 text-xs font-extrabold px-1.5 py-0.2 rounded">VINCITORI 🎉</span>}
                                        </div>
                                        <div className="text-sm font-bold text-slate-800">{getPlayerName(match.team_b_left_id)}</div>
                                        <div className="text-sm font-bold text-slate-800">{getPlayerName(match.team_b_right_id)}</div>
                                    </div>

                                </div>
                            );
                        })
                    ) : (
                        <p className="text-slate-500 italic">Nessun match disputato finora.</p>
                    )}
                </div>

            </div>
        </main>
    );
}
