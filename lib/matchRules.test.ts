// file: lib/matchRules.test.ts
import { describe, it, expect } from 'vitest';
import { isRankingDifferenceValid, calculateRankingUpdates, canUserResolveMatch } from './matchRules';

describe('Match Rules Validation (Tolleranza 0.25)', () => {

    it('should allow a match if the ranking difference is EXACTLY 0.25', () => {
        const rankings = [4.50, 4.75, 4.50, 4.50];
        // 4.75 (max) - 4.50 (min) = 0.25. Deve passare!
        expect(isRankingDifferenceValid(rankings)).toBe(true);
    });

    it('should allow a match if players have the same ranking', () => {
        const rankings = [4.50, 4.50, 4.50, 4.50];
        expect(isRankingDifferenceValid(rankings)).toBe(true);
    });

    it('should REJECT a match if the ranking difference is GREATER than 0.25', () => {
        const rankings = [4.50, 4.80, 4.50, 4.50];
        // 4.80 - 4.50 = 0.30. Non deve passare!
        expect(isRankingDifferenceValid(rankings)).toBe(false);
    });

});

describe('Ranking Updates Engine', () => {

    it('should apply standard ±0.05 for a normal match', () => {
        const ctx = {
            winnerIds: [1, 2],
            loserIds: [3, 4],
            kingLeftIds: [99], // Array per supportare eventuali ex-aequo
            kingRightIds: [100],
            lastPlaceIds: [101, 102, 103] // Array per supportare i 3 Fanalini (SX, DX, MIX)
        };

        const updates = calculateRankingUpdates(ctx);

        expect(updates[1]).toBe(0.05);
        expect(updates[2]).toBe(0.05);
        expect(updates[3]).toBe(-0.05);
        expect(updates[4]).toBe(-0.05);
    });

    it('should apply +0.10 to winners if a Fanalino wins (Rule 7)', () => {
        const ctx = {
            winnerIds: [1, 5], // 5 è uno dei Fanalini
            loserIds: [3, 4],
            kingLeftIds: [99],
            kingRightIds: [100],
            lastPlaceIds: [5, 6, 7] // 5 è presente tra i Fanalini
        };

        const updates = calculateRankingUpdates(ctx);

        expect(updates[1]).toBe(0.10); // Il compagno prende 0.10
        expect(updates[5]).toBe(0.10); // Il Fanalino prende 0.10
        expect(updates[3]).toBe(-0.05); // I perdenti prendono il malus standard
    });

    it('should apply +0.10 to winners if a King is defeated (Rule 6)', () => {
        const ctx = {
            winnerIds: [1, 2],
            loserIds: [3, 99], // 99 è il King Sx che perde
            kingLeftIds: [99],
            kingRightIds: [100],
            lastPlaceIds: [5, 6, 7]
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
            kingLeftIds: [99],
            kingRightIds: [100],
            lastPlaceIds: [5, 6, 7]
        };

        const updates = calculateRankingUpdates(ctx);

        expect(updates[1]).toBe(0.10); // Vincitori prendono il max bonus
        expect(updates[99]).toBe(-0.10); // Malus doppio per la sconfitta di coppia
        expect(updates[100]).toBe(-0.10);
    });

    it('should NOT cumulate bonuses (Max +0.10) if a Fanalino wins against a King (Rule 9)', () => {
        const ctx = {
            winnerIds: [1, 5], // 5 è un Fanalino
            loserIds: [3, 99], // 99 è un King
            kingLeftIds: [99],
            kingRightIds: [],
            kingBothIds: [],
            lastPlaceIds: [5]
        };

        const updates = calculateRankingUpdates(ctx);

        // Il bonus si ferma al tetto massimo di 0.10, non diventa 0.20!
        expect(updates[1]).toBe(0.10);
        expect(updates[5]).toBe(0.10);
        expect(updates[3]).toBe(-0.05);
        expect(updates[99]).toBe(-0.05);
    });

    it('should apply +0.10 to winners if a MIX King (Both) is defeated', () => {
        const ctx = {
            winnerIds: [1, 2],
            loserIds: [3, 88], // 88 è il King MIX che perde
            kingLeftIds: [],
            kingRightIds: [],
            kingBothIds: [88], // King MIX!
            lastPlaceIds: []
        };

        const updates = calculateRankingUpdates(ctx);

        expect(updates[1]).toBe(0.10); // Bonus applicato correttamente
        expect(updates[2]).toBe(0.10);
        expect(updates[88]).toBe(-0.05);
    });

    it('should apply standard ±0.05 when a King wins or a Fanalino loses (no wild modifiers)', () => {
        const ctx = {
            winnerIds: [99, 2], // Il King (99) vince la sua partita
            loserIds: [5, 4],   // Il Fanalino (5) perde la sua partita
            kingLeftIds: [99],
            kingRightIds: [],
            kingBothIds: [],
            lastPlaceIds: [5]
        };

        const updates = calculateRankingUpdates(ctx);

        expect(updates[99]).toBe(0.05); // Il King vince normalmente
        expect(updates[2]).toBe(0.05);
        expect(updates[5]).toBe(-0.05); // Il Fanalino perde normalmente
        expect(updates[4]).toBe(-0.05);
    });

});

describe('Match Resolution Authorization (Self-Service Security)', () => {
    // Aggiornato con UUID e match_type per rispettare rigorosamente l'interfaccia Match
    const mockMatch = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        team_a_left_id: 10,
        team_a_right_id: 11,
        team_b_left_id: 12,
        team_b_right_id: 13,
        status: 'pending',
        match_type: 'male' as const,
        created_at: new Date().toISOString(),
    };

    it('should DENY access if the user is not logged in', () => {
        expect(canUserResolveMatch(null, mockMatch as any)).toBe(false);
    });

    it('should ALLOW access to an ADMIN even if they are not playing', () => {
        const auth = { userRole: 'admin' as const, userPlayerId: 99 }; // ID 99 non è in campo
        expect(canUserResolveMatch(auth, mockMatch as any)).toBe(true);
    });

    it('should ALLOW access to a USER if they are playing in the match', () => {
        const auth = { userRole: 'user' as const, userPlayerId: 11 }; // Sta giocando in Team A Right
        expect(canUserResolveMatch(auth, mockMatch as any)).toBe(true);
    });

    it('should DENY access to a USER if they are not playing in the match', () => {
        const auth = { userRole: 'user' as const, userPlayerId: 44 }; // ID 44 è un giocatore esterno
        expect(canUserResolveMatch(auth, mockMatch as any)).toBe(false);
    });
});
