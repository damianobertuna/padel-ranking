// file: lib/matchRules.test.ts
import { describe, it, expect } from 'vitest';
import { isRankingDifferenceValid, calculateRankingUpdates } from './matchRules';

describe('Match Rules Validation', () => {

    it('should allow a match if the ranking difference is EXACTLY 0.50', () => {
        const rankings = [4.50, 4.75, 4.25, 4.50];
        // 4.75 (max) - 4.25 (min) = 0.50. Deve passare!
        expect(isRankingDifferenceValid(rankings)).toBe(true);
    });

    it('should allow a match if players have the same ranking', () => {
        const rankings = [4.50, 4.50, 4.50, 4.50];
        expect(isRankingDifferenceValid(rankings)).toBe(true);
    });

    it('should REJECT a match if the ranking difference is GREATER than 0.50', () => {
        const rankings = [5.00, 4.00, 4.50, 4.50];
        // 5.00 - 4.00 = 1.00. Non deve passare!
        expect(isRankingDifferenceValid(rankings)).toBe(false);
    });

});

describe('Ranking Updates Engine', () => {

    it('should apply standard ±0.05 for a normal match', () => {
        const ctx = {
            winnerIds: [1, 2],
            loserIds: [3, 4],
            kingLeftId: 99, // Un ID che non è in partita
            kingRightId: 100,
            lastPlaceId: 101
        };

        const updates = calculateRankingUpdates(ctx);

        expect(updates[1]).toBe(0.05);
        expect(updates[2]).toBe(0.05);
        expect(updates[3]).toBe(-0.05);
        expect(updates[4]).toBe(-0.05);
    });

    it('should apply +0.10 to winners if the last place wins (Rule 7)', () => {
        const ctx = {
            winnerIds: [1, 5], // 5 è l'ultimo in classifica
            loserIds: [3, 4],
            kingLeftId: 99,
            kingRightId: 100,
            lastPlaceId: 5
        };

        const updates = calculateRankingUpdates(ctx);

        expect(updates[1]).toBe(0.10); // Il socio prende 0.10
        expect(updates[5]).toBe(0.10); // L'ultimo prende 0.10
        expect(updates[3]).toBe(-0.05); // I perdenti prendono il malus standard
    });

    it('should apply +0.10 to winners if a King is defeated (Rule 6)', () => {
        const ctx = {
            winnerIds: [1, 2],
            loserIds: [3, 99], // 99 è il King Sx che perde
            kingLeftId: 99,
            kingRightId: 100,
            lastPlaceId: 5
        };

        const updates = calculateRankingUpdates(ctx);

        expect(updates[1]).toBe(0.10);
        expect(updates[2]).toBe(0.10);
        expect(updates[3]).toBe(-0.05);
        expect(updates[99]).toBe(-0.05); // Il King prende il malus standard se perde da solo
    });

    it('should apply -0.10 malus to Kings if they play together and lose', () => {
        const ctx = {
            winnerIds: [1, 2],
            loserIds: [99, 100], // Entrambi i King perdono insieme
            kingLeftId: 99,
            kingRightId: 100,
            lastPlaceId: 5
        };

        const updates = calculateRankingUpdates(ctx);

        expect(updates[1]).toBe(0.10); // Vincitori prendono il max bonus
        expect(updates[99]).toBe(-0.10); // Malus doppio per la sconfitta di coppia!
        expect(updates[100]).toBe(-0.10);
    });

});
