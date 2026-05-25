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

    // 3. Verifichiamo che la classifica NON sia piatta (MAX deve essere diverso da MIN)
    const isLeftValid = maxRankingLeft !== minRankingLeft && maxRankingLeft !== -1;
    const isRightValid = maxRankingRight !== minRankingRight && maxRankingRight !== -1;
    const isBothValid = maxRankingBoth !== minRankingBoth && maxRankingBoth !== -1;

    // 4. Assegniamo i titoli confrontando il punteggio esatto di ciascun giocatore
    for (const p of players) {
        const { id, ranking, preferred_side } = p;

        // Assegnazione KING (Massimo per lato, valido solo se la classifica è sgranata)
        if (preferred_side === 'Left' && isLeftValid && ranking === maxRankingLeft) kingLeftIds.push(id);
        if (preferred_side === 'Right' && isRightValid && ranking === maxRankingRight) kingRightIds.push(id);
        if (preferred_side === 'Both' && isBothValid && ranking === maxRankingBoth) kingBothIds.push(id);

        // Assegnazione FANALINO (Minimo per lato, valido solo se la classifica è sgranata)
        if (preferred_side === 'Left' && isLeftValid && ranking === minRankingLeft) lastPlaceLeftIds.push(id);
        if (preferred_side === 'Right' && isRightValid && ranking === minRankingRight) lastPlaceRightIds.push(id);
        if (preferred_side === 'Both' && isBothValid && ranking === minRankingBoth) lastPlaceBothIds.push(id);
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
