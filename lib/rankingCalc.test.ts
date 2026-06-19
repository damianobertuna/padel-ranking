// file: lib/rankingCalc.test.ts
import { describe, it, expect } from 'vitest';
import { computeKingAndFanalino } from './rankingCalc';
import { Player } from '@/types';

const createMockPlayer = (id: number, side: 'Left' | 'Right' | 'Both', ranking: number): Player => ({
    id,
    first_name: `Player${id}`,
    last_name: 'Test',
    ranking,
    preferred_side: side,
    gender: 'M',
    dominant_hand: 'Destro',
    avatar_url: null,
    role: 'user',
    user_id: null,
    created_at: new Date().toISOString(),
    absence_days: 0,
    phone: null,
});

describe('Engine Calcolo King e Fanalino', () => {

    it('should handle an empty array of players safely', () => {
        const res = computeKingAndFanalino([]);
        expect(res.kingLeftIds).toEqual([]);
        expect(res.lastPlaceLeftIds).toEqual([]);
    });

    it('should correctly assign King and Fanalino in standard conditions', () => {
        const players = [
            createMockPlayer(1, 'Left', 4.80), // 👑 King Left
            createMockPlayer(2, 'Left', 4.50),
            createMockPlayer(3, 'Left', 4.20), // 🐢 Fanalino Left
            createMockPlayer(4, 'Right', 4.90), // 👑 King Right
            createMockPlayer(5, 'Right', 4.10), // 🐢 Fanalino Right
        ];

        const res = computeKingAndFanalino(players);

        expect(res.kingLeftIds).toEqual([1]);
        expect(res.lastPlaceLeftIds).toEqual([3]);
        expect(res.kingRightIds).toEqual([4]);
        expect(res.lastPlaceRightIds).toEqual([5]);
    });

    it('should support multiple ex-aequo (co-Kings and co-Fanalini)', () => {
        const players = [
            createMockPlayer(1, 'Left', 4.70), // 👑 Co-King 1
            createMockPlayer(2, 'Left', 4.70), // 👑 Co-King 2
            createMockPlayer(3, 'Left', 4.30), // 🐢 Co-Fanalino 1
            createMockPlayer(4, 'Left', 4.30), // 🐢 Co-Fanalino 2
        ];

        const res = computeKingAndFanalino(players);

        expect(res.kingLeftIds).toContain(1);
        expect(res.kingLeftIds).toContain(2);
        expect(res.kingLeftIds.length).toBe(2);

        expect(res.lastPlaceLeftIds).toContain(3);
        expect(res.lastPlaceLeftIds).toContain(4);
        expect(res.lastPlaceLeftIds.length).toBe(2);
    });

    it('should award the title of King, but NOT that of Taillight, to a single player', () => {
        const players = [
            createMockPlayer(1, 'Left', 4.50), // Da solo: max e min coincidono
        ];

        const res = computeKingAndFanalino(players);

        // ID 1 is King (being the highest score), but the Fanalini array remains empty (no gap)
        expect(res.kingLeftIds).toEqual([1]);
        expect(res.lastPlaceLeftIds).toEqual([]);
    });
});
