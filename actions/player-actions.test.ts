import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updatePlayerByAdmin } from './player-actions';
import { createClient } from '@/lib/supabase/server';
import { logAction } from '@/lib/audit';

// 1. Mock delle dipendenze
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/audit', () => ({ logAction: vi.fn().mockResolvedValue({ error: null }) }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

describe('updatePlayerByAdmin Server Action', () => {
    let mockSupabase: any;

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock di Supabase con supporto al chaining
        const mockQuery = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn(),
            update: vi.fn().mockReturnThis(),
        };

        mockSupabase = {
            auth: { getUser: vi.fn() },
            from: vi.fn(() => mockQuery),
        };

        (createClient as any).mockResolvedValue(mockSupabase);
    });

    it('dovrebbe bloccare l\'azione se l\'utente non è un admin', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
        mockSupabase.from().single.mockResolvedValue({
            data: { role: 'player' }, error: null
        });

        const formData = new FormData();
        formData.append('playerId', '10');

        await expect(updatePlayerByAdmin(formData)).rejects.toThrow('Azione non autorizzata');
    });

    it('dovrebbe aggiornare il giocatore e scrivere il log se l\'utente è admin', async () => {
        // Mock Auth + Admin Check + Old Player Data
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'admin-id' } } });

        mockSupabase.from().single
            .mockResolvedValueOnce({ data: { first_name: 'Super', last_name: 'Admin', role: 'admin' }, error: null }) // Auth Check
            .mockResolvedValueOnce({ data: { id: 10, first_name: 'Mario', last_name: 'Rossi', ranking: 4.5 }, error: null }); // Old Player

        const formData = new FormData();
        formData.append('playerId', '10');
        formData.append('firstName', 'Mario');
        formData.append('lastName', 'Rossi');
        formData.append('ranking', '5.0');
        formData.append('preferredSide', 'Left');
        formData.append('dominantHand', 'Right');
        formData.append('role', 'player');

        await expect(updatePlayerByAdmin(formData)).resolves.not.toThrow();

        // Verifica aggiornamento DB
        expect(mockSupabase.from().update).toHaveBeenCalledWith(
            expect.objectContaining({ ranking: 5.0 })
        );

        // Verifica audit log
        expect(logAction).toHaveBeenCalledWith(
            'UPDATE_PLAYER',
            10,
            expect.stringContaining('Ranking: da 4.5 a 5'),
            expect.any(Object)
        );
    });
});
