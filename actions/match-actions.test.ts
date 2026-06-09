import { describe, it, expect, vi, beforeEach } from 'vitest';
import { leaveMatchAction, joinMatchAction, resolveMatchWithRanking } from './match-actions';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logAction } from '@/lib/audit';

// 1. MOCK DELLE DIPENDENZE
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
    createAdminClient: vi.fn()
}));
vi.mock('@/lib/audit', () => ({ logAction: vi.fn().mockResolvedValue({ error: null }) }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));


describe('Match Server Actions', () => {
    let mockSupabase: any;
    let mockPlayer: any;
    let mockMatch: any;
    let updateSpy: any;
    let deleteSpy: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockPlayer = { id: 10, first_name: 'Mario', last_name: 'Rossi', preferred_side: 'Both' };
        mockMatch = {
            id: 'match-123',
            team_a_left_id: null, team_a_right_id: null,
            team_b_left_id: null, team_b_right_id: null,
            organizer_id: 99
        };

        // --- IL TRUCCO ARCHITETTURALE: Spie condivise ---
        updateSpy = vi.fn().mockReturnThis();
        deleteSpy = vi.fn().mockReturnThis();

        const mockQueryBuilder = (table: string) => {
            return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                in: vi.fn().mockReturnThis(),
                update: updateSpy, // Riferimento alla spia globale
                delete: deleteSpy, // Riferimento alla spia globale
                single: vi.fn().mockImplementation(() => {
                    if (table === 'players') return Promise.resolve({ data: mockPlayer, error: null });
                    if (table === 'matches') return Promise.resolve({ data: mockMatch, error: null });
                    return Promise.resolve({ data: null, error: null });
                }),
                // Rende il finto builder "awaitable" per simulare supabase.from().update().eq()
                then: function(resolve: any) {
                    resolve({ data: null, error: null });
                }
            };
        };

        mockSupabase = {
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }) },
            from: vi.fn((table) => mockQueryBuilder(table)),
        };

        (createClient as any).mockResolvedValue(mockSupabase);
        (createAdminClient as any).mockReturnValue(mockSupabase); // Fai usare lo stesso mock anche all'admin
    });

    describe('joinMatchAction', () => {
        it('dovrebbe impedire l\'ingresso se l\'utente è già nella partita', async () => {
            mockMatch.team_a_right_id = 10;
            await expect(joinMatchAction('match-123')).rejects.toThrow('Sei già iscritto a questa partita.');
        });

        it('dovrebbe inserire un giocatore "Right" nel primo slot destro libero', async () => {
            mockPlayer.preferred_side = 'Right';
            mockMatch.team_a_left_id = null;
            mockMatch.team_b_left_id = null;
            mockMatch.team_a_right_id = null;

            await expect(joinMatchAction('match-123')).resolves.not.toThrow();

            expect(updateSpy).toHaveBeenCalledWith({ team_a_right_id: 10 });
        });

        it('dovrebbe bloccare l\'ingresso se non ci sono slot compatibili col lato del giocatore', async () => {
            mockPlayer.preferred_side = 'Right';
            mockMatch.team_a_right_id = 99;
            mockMatch.team_b_right_id = 88;
            mockMatch.team_a_left_id = null;
            mockMatch.team_b_left_id = null;

            await expect(joinMatchAction('match-123'))
                .rejects.toThrow('Impossibile unirsi: nessuno slot disponibile per la tua preferenza (Right).');
        });
    });

    describe('leaveMatchAction', () => {
        it('dovrebbe impedire l\'uscita se l\'utente non è nella partita', async () => {
            mockPlayer.id = 10;
            mockMatch.team_a_left_id = 99;
            await expect(leaveMatchAction('match-123')).rejects.toThrow('Impossibile uscire: non sei iscritto a questa partita.');
        });

        it('dovrebbe liberare lo slot se un giocatore normale esce', async () => {
            mockPlayer.id = 10;
            mockMatch.team_a_left_id = 10;
            mockMatch.team_a_right_id = 20;
            mockMatch.organizer_id = 20;

            await expect(leaveMatchAction('match-123')).resolves.not.toThrow();
            expect(updateSpy).toHaveBeenCalledWith({ team_a_left_id: null });
        });

        it('dovrebbe cedere il ruolo di organizzatore al primo giocatore rimasto (Passaggio Testimone)', async () => {
            mockPlayer.id = 10;
            mockMatch.team_a_left_id = 10;
            mockMatch.team_b_right_id = 30;
            mockMatch.organizer_id = 10;

            await expect(leaveMatchAction('match-123')).resolves.not.toThrow();

            expect(updateSpy).toHaveBeenCalledWith({
                team_a_left_id: null,
                organizer_id: 30
            });

            expect(logAction).toHaveBeenCalledWith(
                'PLAYER_LEFT_MATCH',
                'match-123',
                expect.stringContaining('ruolo di Organizzatore è passato automaticamente al giocatore ID: 30')
            );
        });

        it('dovrebbe ELIMINARE la partita se esce l\'ultimo giocatore rimasto', async () => {
            mockPlayer.id = 10;
            mockMatch.team_a_left_id = 10;
            mockMatch.team_a_right_id = null;
            mockMatch.team_b_left_id = null;
            mockMatch.team_b_right_id = null;

            await expect(leaveMatchAction('match-123')).resolves.not.toThrow();

            expect(updateSpy).not.toHaveBeenCalled();
            expect(deleteSpy).toHaveBeenCalled();
            expect(logAction).toHaveBeenCalledWith(
                'MATCH_DELETED_AUTO',
                'match-123',
                expect.stringContaining('eliminato automaticamente perché vuoto')
            );
        });
    });
});

describe('resolveMatchWithRanking (Logica Punteggi e Regole)', () => {
    let updateSpy: any;

    beforeEach(() => {
        vi.clearAllMocks();
        updateSpy = vi.fn().mockReturnThis();
    });

    const executeResolve = async (teamA: number[], teamB: number[], winningTeam: 'A'|'B', isFriendly = false) => {
        const matchData = {
            id: 'm1', status: 'pending',
            team_a_left_id: teamA[0], team_a_right_id: teamA[1],
            team_b_left_id: teamB[0], team_b_right_id: teamB[1],
            is_friendly: isFriendly
        };

        const mockSupabaseWithRules = {
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
            from: vi.fn((table) => {
                // MODIFICA: Aggiunti first_name e last_name ai mock per lo snapshot dell'audit log
                const mockAll = [
                    {id:1, first_name: 'A', last_name: 'Player', preferred_side:'Left', ranking: 5.0}, // KING SX
                    {id:2, first_name: 'B', last_name: 'Player', preferred_side:'Left', ranking: 3.0}, // Normale SX (1)
                    {id:3, first_name: 'C', last_name: 'Player', preferred_side:'Left', ranking: 1.0}, // FANALINO SX
                    {id:4, first_name: 'D', last_name: 'Player', preferred_side:'Right', ranking: 5.0},// KING DX
                    {id:5, first_name: 'E', last_name: 'Player', preferred_side:'Right', ranking: 3.0},// Normale DX (1)
                    {id:6, first_name: 'F', last_name: 'Player', preferred_side:'Right', ranking: 1.0},// FANALINO DX
                    {id:7, first_name: 'G', last_name: 'Player', preferred_side:'Left', ranking: 3.1}, // Normale SX (2)
                    {id:8, first_name: 'H', last_name: 'Player', preferred_side:'Right', ranking: 3.1},// Normale DX (2)
                    {id:9, first_name: 'I', last_name: 'Player', preferred_side:'Both', ranking: 5.0}, // KING MIX
                    {id:10, first_name: 'J', last_name: 'Player', preferred_side:'Both', ranking: 3.0} // Normale MIX
                ];

                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    in: vi.fn().mockImplementation((c, ids: number[]) => {
                        return Promise.resolve({ data: mockAll.filter(p => ids.includes(p.id)), error: null });
                    }),
                    update: updateSpy,
                    single: vi.fn().mockImplementation(() => table === 'matches' ? Promise.resolve({ data: matchData, error: null }) : Promise.resolve({ data: { id: 99, first_name: 'Op', last_name: 'Test' }, error: null })),
                    then: function(res: any) {
                        if (table === 'players') res({ data: mockAll, error: null });
                        else res({ data: null, error: null });
                    }
                };
            })
        };

        (createClient as any).mockResolvedValueOnce(mockSupabaseWithRules);
        (createAdminClient as any).mockReturnValueOnce(mockSupabaseWithRules);

        const score = winningTeam === 'A' ? [{team_a: 6, team_b: 4}, {team_a: 6, team_b: 4}] : [{team_a: 4, team_b: 6}, {team_a: 4, team_b: 6}];
        await resolveMatchWithRanking({ matchId: 'm1', score });
    };

    it('Regola 5: Partita tra Normali (2,5 vs 7,8) -> +0.05 / -0.05', async () => {
        await executeResolve([2, 5], [7, 8], 'A');
        expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({ team_a_delta: 0.05, team_b_delta: -0.05 }));
    });

    it('Regola 7: Normali battono un King (1,5 perdono contro 7,8) -> +0.10 / -0.05', async () => {
        await executeResolve([1, 5], [7, 8], 'B');
        expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({ team_a_delta: -0.05, team_b_delta: 0.10 }));
    });

    it('Regola 7: Malus due King battuti da Normali (1,4 perdono contro 7,8) -> +0.10 / -0.10', async () => {
        await executeResolve([1, 4], [7, 8], 'B');
        expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({ team_a_delta: -0.10, team_b_delta: 0.10 }));
    });

    it('Regola 7 (Neutralizzazione): King batte King (1,5 battono 4,7) -> +0.05 / -0.05', async () => {
        await executeResolve([1, 5], [4, 7], 'A');
        expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({ team_a_delta: 0.05, team_b_delta: -0.05 }));
    });

    it('Regola 8: Fanalino vince (3,5 battono 7,8) -> +0.10 / -0.05', async () => {
        await executeResolve([3, 5], [7, 8], 'A');
        expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({ team_a_delta: 0.10, team_b_delta: -0.05 }));
    });

    it('Regola 8 (Neutralizzazione): Fanalino batte Fanalino (3,5 battono 6,7) -> +0.05 / -0.05', async () => {
        await executeResolve([3, 5], [6, 7], 'A');
        expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({ team_a_delta: 0.05, team_b_delta: -0.05 }));
    });

    it('Regola 7 (Neutralizzazione Incrociata): King SX batte King MIX (1,5 battono 9,7) -> +0.05 / -0.05', async () => {
        await executeResolve([1, 5], [9, 7], 'A');
        expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({ team_a_delta: 0.05, team_b_delta: -0.05 }));
    });

    it('Regola 7 (Bugfix Neutralizzazione Totale): 2 King vs 1 King (1,4 perdono contro 9,7) -> +0.05 / -0.05', async () => {
        await executeResolve([1, 4], [9, 7], 'B');
        expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({ team_a_delta: -0.05, team_b_delta: 0.05 }));
    });

    // ========================================================
    // NUOVI TEST: VERIFICA AMICHEVOLI E AUDIT LOG
    // ========================================================
    it('Feature Amichevoli: Partita Amichevole -> delta impostati a 0 indipendentemente dai titoli (Bypass ELO)', async () => {
        await executeResolve([3, 5], [7, 8], 'A', true);

        expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({
            status: 'completed',
            winning_team: 'A',
            team_a_delta: 0,
            team_b_delta: 0
        }));
    });

    it('Feature Amichevoli: Partita Amichevole -> deve scrivere l audit log personalizzato con flag is_friendly', async () => {
        await executeResolve([2, 5], [7, 8], 'A', true);

        // MODIFICA: La stringa attesa ora è perfettamente allineata al nuovo refactoring!
        expect(logAction).toHaveBeenCalledWith(
            'MATCH_RESOLVED',
            'm1',
            expect.stringContaining("ha registrato l'AMICHEVOLE"),
            expect.objectContaining({
                is_friendly: true,
                deltas: { team_a: 0, team_b: 0 }
            })
        );
    });
});
