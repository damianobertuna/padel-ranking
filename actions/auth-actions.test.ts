import { logUserLogin } from './auth-actions';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { logAction } from '@/lib/audit';
import { createClient } from '@/lib/supabase/server';

// 1. Mock dei moduli esterni
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
    createAdminClient: vi.fn(),
}));

vi.mock('@/lib/audit', () => ({
    logAction: vi.fn().mockResolvedValue({ error: null }),
}));

describe('logUserLogin', () => {
    let mockSupabase: any;
    let playerResult: any;
    let roleResult: any;

    beforeEach(() => {
        vi.clearAllMocks();

        // Resettiamo i risultati prima di ogni test
        playerResult = { data: null, error: null };
        roleResult = { data: null, error: null };

        // 2. Creiamo un mock "Intelligente" che gestisce .maybeSingle() e differenzia le tabelle
        mockSupabase = {
            from: vi.fn((table: string) => {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    maybeSingle: vi.fn().mockImplementation(() => {
                        if (table === 'players') return Promise.resolve(playerResult);
                        if (table === 'user_roles') return Promise.resolve(roleResult);
                        return Promise.resolve({ data: null, error: null });
                    }),
                };
            }),
        };

        (createClient as any).mockResolvedValue(mockSupabase);
    });

    it('dovrebbe registrare correttamente il log di login se il profilo giocatore esiste', async () => {
        // Mock: recupero profilo giocatore con successo, nessun ruolo admin/gestore
        playerResult = {
            data: { first_name: 'Giovanni', last_name: 'Neri', role: 'user' },
            error: null
        };
        roleResult = { data: null, error: null };

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

    it('dovrebbe registrare correttamente il log di login se l\'utente è un gestore puro', async () => {
        // Mock: nessun profilo giocatore, ma presente in user_roles come club_manager
        playerResult = { data: null, error: null };
        roleResult = {
            data: { role: 'club_manager' },
            error: null
        };

        await logUserLogin('user_id_manager');

        expect(logAction).toHaveBeenCalledWith(
            'USER_LOGIN',
            'user_id_manager',
            expect.stringContaining('Gestore Campo'),
            expect.objectContaining({
                user_id: 'user_id_manager',
                method: 'email_password'
            })
        );
    });

    it('non dovrebbe chiamare logAction se l\'utente non viene trovato in nessuna tabella', async () => {
        // Mock: profilo non trovato in entrambe le query
        playerResult = { data: null, error: null };
        roleResult = { data: null, error: null };

        await logUserLogin('user_id_errato');

        expect(logAction).not.toHaveBeenCalled();
    });
});
