import { logUserLogin } from './auth-actions';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { logAction } from '@/lib/audit';
import { createClient } from '@/lib/supabase/server';

// 1. Mock dei moduli esterni
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}));

vi.mock('@/lib/audit', () => ({
    logAction: vi.fn().mockResolvedValue({ error: null }),
}));

describe('logUserLogin', () => {
    let mockSupabase: any;

    beforeEach(() => {
        vi.clearAllMocks();

        // 2. Creiamo un mock "Intelligente" che supporta il chaining
        const mockQuery = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn(),
        };

        mockSupabase = {
            from: vi.fn().mockReturnValue(mockQuery),
        };

        (createClient as any).mockResolvedValue(mockSupabase);
    });

    it('dovrebbe registrare correttamente il log di login se il profilo esiste', async () => {
        // Mock: recupero profilo giocatore successo
        mockSupabase.from().single.mockResolvedValue({
            data: { first_name: 'Giovanni', last_name: 'Neri', role: 'player' },
            error: null
        });

        await logUserLogin('user_id_123');

        // 3. Verifichiamo che logAction sia stata chiamata con i parametri corretti
        expect(logAction).toHaveBeenCalledWith(
            'USER_LOGIN',
            'user_id_123',
            expect.stringContaining('Giovanni Neri'),
            expect.objectContaining({
                user_id: 'user_id_123',
                method: 'email_password'
            })
        );
    });

    it('non dovrebbe chiamare logAction se il profilo giocatore non viene trovato', async () => {
        // Mock: profilo non trovato
        mockSupabase.from().single.mockResolvedValue({
            data: null,
            error: { message: 'Not found' }
        });

        await logUserLogin('user_id_errato');

        expect(logAction).not.toHaveBeenCalled();
    });
});
