// file: lib/matchRules.ts
// file: lib/matchRules.ts (aggiungi in fondo al file)

// Interfaccia per passare i dati del match in modo pulito
export interface MatchContext {
    winnerIds: number[];
    loserIds: number[];
    kingLeftId: number | null;
    kingRightId: number | null;
    lastPlaceId: number | null;
}

export function calculateRankingUpdates(ctx: MatchContext): Record<number, number> {
    const { winnerIds, loserIds, kingLeftId, kingRightId, lastPlaceId } = ctx;

    // L'oggetto che conterrà i risultati: { idGiocatore: variazionePunteggio }
    const updates: Record<number, number> = {};

    let winnerBonus = 0.05; // Base (Regola 3)

    // Mappa di default per i malus (Regola 3)
    let loserMalusMap: Record<number, number> = {
        [loserIds[0]]: -0.05,
        [loserIds[1]]: -0.05
    };

    const hasLastPlaceWon = winnerIds.includes(lastPlaceId as number);
    const hasKingLeftLost = loserIds.includes(kingLeftId as number);
    const hasKingRightLost = loserIds.includes(kingRightId as number);

    // Regola 7: Se l'ultimo in classifica vince, doppio bonus ai vincitori
    if (hasLastPlaceWon) {
        winnerBonus = 0.10;
    }

    // Regola 6: Se cade un King, doppio bonus ai vincitori
    if (hasKingLeftLost || hasKingRightLost) {
        winnerBonus = 0.10; // Capped a 0.10 (non si somma con la regola 7)

        // Regola "Catastrofe": Se entrambi i King perdono giocando INSIEME
        if (hasKingLeftLost && hasKingRightLost) {
            loserMalusMap[kingLeftId as number] = -0.10;
            loserMalusMap[kingRightId as number] = -0.10;
        }
    }

    // Assegniamo i risultati finali
    winnerIds.forEach(id => updates[id] = winnerBonus);
    loserIds.forEach(id => updates[id] = loserMalusMap[id]);

    return updates;
}

export function isRankingDifferenceValid(rankings: number[]): boolean {
    if (rankings.length === 0) return true;

    const maxRanking = Math.max(...rankings);
    const minRanking = Math.min(...rankings);

    return (maxRanking - minRanking) <= 0.50;
}

// file: lib/matchRules.ts (Aggiungi in fondo)

export interface AuthContext {
    userRole: 'admin' | 'user';
    userPlayerId: number;
}

export interface MatchPlayers {
    team_a_left_id: number;
    team_a_right_id: number;
    team_b_left_id: number;
    team_b_right_id: number;
}

export function canUserResolveMatch(auth: AuthContext | null, match: MatchPlayers): boolean {
    // Se l'utente non è loggato, non può fare nulla
    if (!auth) return false;

    // Se è un admin, ha il via libera assoluto
    if (auth.userRole === 'admin') return true;

    // Se è un utente normale, controlliamo se il suo ID giocatore è in campo
    return (
        match.team_a_left_id === auth.userPlayerId ||
        match.team_a_right_id === auth.userPlayerId ||
        match.team_b_left_id === auth.userPlayerId ||
        match.team_b_right_id === auth.userPlayerId
    );
}

export interface PlayerWinRateStats {
    totalPlayed: number;
    totalWon: number;
    totalLost: number;
    winRate: number; // Valore percentuale (es. 65.4)
}

/**
 * Calcola il Win Rate di un singolo giocatore partendo dallo storico dei suoi match completati
 */
export function calculatePlayerWinRate(playerId: number, completedMatches: any[]): PlayerWinRateStats {
    let totalWon = 0;
    let totalLost = 0;

    // Filtriamo solo i match in cui il giocatore è sceso in campo
    const playerMatches = completedMatches.filter(match =>
            match.status === 'completed' && (
                match.team_a_left_id === playerId ||
                match.team_a_right_id === playerId ||
                match.team_b_left_id === playerId ||
                match.team_b_right_id === playerId
            )
    );

    playerMatches.forEach(match => {
        // Determiniamo se il giocatore era in Squadra A o Squadra B
        const isTeamA = match.team_a_left_id === playerId || match.team_a_right_id === playerId;
        const winner = match.winning_team; // Può essere 'A' o 'B'

        if ((isTeamA && winner === 'A') || (!isTeamA && winner === 'B')) {
            totalWon++;
        } else {
            totalLost++;
        }
    });

    const totalPlayed = totalWon + totalLost;
    // Evitiamo la divisione per zero se il giocatore non ha ancora partite completate
    const winRate = totalPlayed > 0 ? parseFloat(((totalWon / totalPlayed) * 100).toFixed(1)) : 0;

    return {
        totalPlayed,
        totalWon,
        totalLost,
        winRate
    };
}
