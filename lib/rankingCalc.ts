// file: lib/rankingCalc.ts
import { Player } from '@/types';

export interface TitolariMatch {
    kingLeftIds: number[];
    kingRightIds: number[];
    kingBothIds: number[];
    lastPlaceLeftIds: number[];
    lastPlaceRightIds: number[];
    lastPlaceBothIds: number[];
}

export function computeKingAndFanalino(players: Player[]): TitolariMatch {
    // 1. Estraiamo i ranking divisi per lato
    const allLeft = players.filter(p => p.preferred_side === 'Left').map(p => p.ranking);
    const allRight = players.filter(p => p.preferred_side === 'Right').map(p => p.ranking);
    const allBoth = players.filter(p => p.preferred_side === 'Both').map(p => p.ranking);

    // 2. Calcoliamo il MAX (King) e il MIN (Fanalino) per ogni singola categoria
    const maxRankingLeft = allLeft.length > 0 ? Math.max(...allLeft) : -1;
    const minRankingLeft = allLeft.length > 0 ? Math.min(...allLeft) : -1;

    const maxRankingRight = allRight.length > 0 ? Math.max(...allRight) : -1;
    const minRankingRight = allRight.length > 0 ? Math.min(...allRight) : -1;

    const maxRankingBoth = allBoth.length > 0 ? Math.max(...allBoth) : -1;
    const minRankingBoth = allBoth.length > 0 ? Math.min(...allBoth) : -1;

    const kingLeftIds: number[] = [];
    const kingRightIds: number[] = [];
    const kingBothIds: number[] = [];

    const lastPlaceLeftIds: number[] = [];
    const lastPlaceRightIds: number[] = [];
    const lastPlaceBothIds: number[] = [];

    // 3. LOGICA DI DOMINIO: Un Fanalino esiste SOLO se c'è un dislivello (il Max deve essere maggiore del Min).
    // Se c'è un solo giocatore, o se sono tutti a pari merito, non ci sono Fanalini.
    const hasLeftGap = maxRankingLeft > minRankingLeft;
    const hasRightGap = maxRankingRight > minRankingRight;
    const hasBothGap = maxRankingBoth > minRankingBoth;

    // 4. Assegnazione Titoli
    for (const p of players) {
        const { id, ranking, preferred_side } = p;

        // Assegnazione KING (Sei al vertice. Se siete tutti pari, siete tutti King)
        if (preferred_side === 'Left' && maxRankingLeft !== -1 && ranking === maxRankingLeft) kingLeftIds.push(id);
        if (preferred_side === 'Right' && maxRankingRight !== -1 && ranking === maxRankingRight) kingRightIds.push(id);
        if (preferred_side === 'Both' && maxRankingBoth !== -1 && ranking === maxRankingBoth) kingBothIds.push(id);

        // Assegnazione FANALINO (Sei in fondo. Applicabile SOLO se c'è un distacco in classifica)
        if (preferred_side === 'Left' && hasLeftGap && ranking === minRankingLeft) lastPlaceLeftIds.push(id);
        if (preferred_side === 'Right' && hasRightGap && ranking === minRankingRight) lastPlaceRightIds.push(id);
        if (preferred_side === 'Both' && hasBothGap && ranking === minRankingBoth) lastPlaceBothIds.push(id);
    }

    return {
        kingLeftIds,
        kingRightIds,
        kingBothIds,
        lastPlaceLeftIds,
        lastPlaceRightIds,
        lastPlaceBothIds,
    };
}
