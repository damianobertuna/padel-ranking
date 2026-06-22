// file: lib/matchRules.ts
// file: lib/matchRules.ts (aggiungi in fondo al file)

// Interfaccia per passare i dati del match in modo pulito
export interface MatchContext {
    winnerIds: number[];
    loserIds: number[];
    kingRightIds: number[];
    kingLeftIds: number[];
    kingBothIds?: number[];
    lastPlaceIds: number[];
}

export function calculateRankingUpdates(ctx: MatchContext): Record<number, number> {
    const updates: Record<number, number> = {};

    // Helper per capire se un ID appartiene a un King o a un Fanalino
    const isKing = (id: number) =>
        ctx.kingLeftIds.includes(id) ||
        ctx.kingRightIds.includes(id) ||
        (ctx.kingBothIds && ctx.kingBothIds.includes(id));

    const isLastPlace = (id: number) => ctx.lastPlaceIds.includes(id);

    // Variabili di stato per i Bonus/Malus
    let defeatedKing = false;
    let kingsLostTogether = false;
    let lastPlaceWon = false;

    // 1. Controlliamo se qualche King ha perso
    const losingKings = ctx.loserIds.filter(id => isKing(id));
    if (losingKings.length > 0) {
        defeatedKing = true;
        // Se due King perdono giocando nello stesso team
        if (losingKings.length >= 2) {
            kingsLostTogether = true;
        }
    }

    // 2. Controlliamo se un Fanalino ha vinto
    if (ctx.winnerIds.some(id => isLastPlace(id))) {
        lastPlaceWon = true;
    }

    // 3. Calcolo Punti Vincitori (Max +0.10 se battono un King o se vince il Fanalino, altrimenti +0.05)
    const winnerBonus = (defeatedKing || lastPlaceWon) ? 0.10 : 0.05;
    ctx.winnerIds.forEach(id => {
        updates[id] = winnerBonus;
    });

    // 4. Calcolo Punti Sconfitti
    ctx.loserIds.forEach(id => {
        // Se due King perdono insieme, subiscono entrambi -0.10 (Regola 6)
        if (kingsLostTogether && isKing(id)) {
            updates[id] = -0.10;
        } else {
            // Malus standard -0.05 per tutti gli altri
            updates[id] = -0.05;
        }
    });

    return updates;
}

export function isRankingDifferenceValid(rankings: number[]): boolean {
    if (rankings.length === 0) return true;

    const maxRanking = Math.max(...rankings);
    const minRanking = Math.min(...rankings);

    return (maxRanking - minRanking) <= 0.25;
}

export interface AuthContext {
    userRole: 'admin' | 'user' | 'club_manager';
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
