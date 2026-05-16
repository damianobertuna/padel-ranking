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
