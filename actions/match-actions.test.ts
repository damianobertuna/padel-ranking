import { describe, it, expect, vi, beforeEach } from 'vitest';
import { leaveMatchAction, joinMatchAction } from './match-actions';
import { createClient } from '@/lib/supabase/server';
import { logAction } from '@/lib/audit';

// 1. MOCK DELLE DIPENDENZE
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
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

            // Ora l'updateSpy è correttamente monitorato!
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
