import { deletePendingMatch, createPendingMatch, resolveMatchWithRanking } from './match-actions';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { logAction } from '@/lib/audit';
import { createClient } from '@/lib/supabase/server';

// 1. Mock dei moduli esterni
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/audit', () => ({ logAction: vi.fn().mockResolvedValue({ error: null }) }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

describe('Server Actions Match', () => {
    let mockSupabase: any;

    beforeEach(() => {
        vi.clearAllMocks();

        // 2. Mock "Super-Catena" di Supabase
        const mockQuery = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            single: vi.fn(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
        };

        mockSupabase = {
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'admin-1' } }, error: null }) },
            from: vi.fn(() => mockQuery),
        };

        (createClient as any).mockResolvedValue(mockSupabase);
    });

    describe('deletePendingMatch', () => {
        it('dovrebbe cancellare il match e scrivere il log se utente è admin', async () => {
            // Mock: AuthCheck(admin) + MatchFetch(pending) + PlayersFetch
            mockSupabase.from().single
                .mockResolvedValueOnce({ data: { id: 1, role: 'admin' } }) // currentUser
                .mockResolvedValueOnce({ data: { id: 'm1', status: 'pending', team_a_left_id: 10 } }); // match

            mockSupabase.from().in.mockResolvedValueOnce({ data: [{ id: 10, first_name: 'Mario', last_name: 'Rossi' }] });

            await deletePendingMatch('m1');

            expect(mockSupabase.from().delete).toHaveBeenCalled();
            expect(logAction).toHaveBeenCalledWith('MATCH_DELETED', 'm1', expect.any(String), expect.any(Object));
        });
    });

    describe('resolveMatchWithRanking', () => {
        it('dovrebbe risolvere correttamente il match e loggare', async () => {
            // Mock sequenziale: Auth(admin), CurrentUser, Match, Players
            mockSupabase.from().single
                .mockResolvedValueOnce({ data: { id: 99, role: 'admin' } }) // CurrentUser
                .mockResolvedValueOnce({ data: { id: 'm1', status: 'pending', team_a_left_id: 1, team_a_right_id: 2, team_b_left_id: 3, team_b_right_id: 4 } }); // Match

            // Mock giocatori per log e ranking
            mockSupabase.from().in.mockResolvedValueOnce({ data: [{id:1, first_name:'A', last_name:'A'}, {id:2, first_name:'B', last_name:'B'}, {id:3, first_name:'C', last_name:'C'}, {id:4, first_name:'D', last_name:'D'}] });

            await resolveMatchWithRanking({
                matchId: "m1",
                score: [{ team_a: 6, team_b: 4 }, { team_a: 6, team_b: 2 }],
                rankingUpdates: {}
            });

            expect(logAction).toHaveBeenCalledWith(
                'MATCH_RESOLVED',
                "m1",
                expect.stringContaining("Vince il Team A"),
                expect.objectContaining({ winning_team: 'A' })
            );
        });

        it('dovrebbe bloccare se i set sono meno di 2', async () => {
            mockSupabase.from().single.mockResolvedValueOnce({ data: { id: 99, role: 'admin' } })
                .mockResolvedValueOnce({ data: { id: 'm1', status: 'pending' } });

            await expect(resolveMatchWithRanking({
                matchId: "m1",
                score: [{ team_a: 6, team_b: 4 }],
                rankingUpdates: {}
            })).rejects.toThrow("I dati dei set sono incompleti");
        });
    });
});
