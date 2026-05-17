import { logUserLogin } from './auth-actions';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockSingle = vi.fn();
const mockInsert = vi.fn(() => Promise.resolve({ error: null }));

const mockSupabaseClient = {
    from: vi.fn((table: string) => {
        if (table === 'audit_logs') return { insert: mockInsert };
        return { select: vi.fn(() => ({ eq: vi.fn(() => ({ single: mockSingle })) })) };
    }),
};

vi.mock('../lib/supabase/server', () => ({
    createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}));

describe('logUserLogin', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('dovrebbe registrare correttamente il log di login se il profilo esiste', async () => {
        mockSingle.mockResolvedValueOnce({ data: { id: 5, first_name: 'Giovanni', last_name: 'Neri', role: 'player' } });

        await logUserLogin('user_id_123');

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('audit_logs');
        expect(mockInsert).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ action_type: 'USER_LOGIN' })
        ]));
    });
});
