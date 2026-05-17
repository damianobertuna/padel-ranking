import { deletePendingMatch, createPendingMatch } from './match-actions';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// 1. Mock delle utility di Next.js in stile Vitest
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

vi.mock('next/navigation', () => ({
    redirect: vi.fn(),
}));

// 2. Struttura dei mock per la catena di metodi di Supabase (Convertiti in vi.fn())
const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockIn = vi.fn(() => ({ select: vi.fn(() => Promise.resolve({ data: [] })) }));
const mockSelect = vi.fn(() => ({ eq: mockEq, in: mockIn }));
const mockInsert = vi.fn(() => Promise.resolve({ error: null }));
const mockDelete = vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) }));

const mockSupabaseClient = {
    auth: {
        getUser: vi.fn(),
    },
    from: vi.fn((table: string) => {
        if (table === 'audit_logs') return { insert: mockInsert };
        if (table === 'matches') return { insert: mockInsert, select: mockSelect, delete: mockDelete };
        return { select: mockSelect }; // Default per 'players'
    }),
};

// 3. Iniettiamo il client usando il percorso relativo corretto per evitare l'errore dell'alias
vi.mock('../lib/supabase/server', () => ({
    createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}));

describe('deletePendingMatch', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('dovrebbe lanciare un errore se l’utente non è autenticato', async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValueOnce({ data: { user: null } });

        await expect(deletePendingMatch(123)).rejects.toThrow("Utente non autenticato");
    });

    it('dovrebbe lanciare un errore se il giocatore corrente tenta di cancellare un match in cui non gioca e non è admin', async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user_99' } } });
        mockSingle.mockResolvedValueOnce({ data: { id: 99, first_name: 'Mario', last_name: 'Rossi', role: 'player' } });
        mockSingle.mockResolvedValueOnce({
            data: {
                id: 123,
                status: 'pending',
                team_a_left_id: 1, team_a_right_id: 2,
                team_b_left_id: 3, team_b_right_id: 4
            }
        });

        await expect(deletePendingMatch(123)).rejects.toThrow("Non hai i permessi per cancellare questa partita");
    });

    it('dovrebbe completare la cancellazione e scrivere il log se l’utente è un admin', async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'admin_user' } } });
        mockSingle.mockResolvedValueOnce({ data: { id: 10, first_name: 'Capo', last_name: 'Admin', role: 'admin' } });
        mockSingle.mockResolvedValueOnce({
            data: {
                id: 123, status: 'pending',
                team_a_left_id: 1, team_a_right_id: 2,
                team_b_left_id: 3, team_b_right_id: 4
            }
        });

        await deletePendingMatch(123);

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('audit_logs');
        expect(mockInsert).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ action_type: 'DELETE_MATCH' })
        ]));
    });
});

describe('createPendingMatch', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('dovrebbe inserire correttamente un match e registrare l’audit log', async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user_1' } } });
        mockSingle.mockResolvedValueOnce({ data: { id: 1, first_name: 'Luca', last_name: 'Verdi', role: 'player' } });

        const matchInput = {
            matchDate: '2026-05-20T18:00',
            teamALeft: 1,
            teamARight: 2,
            teamBLeft: 3,
            teamBRight: 4
        };

        await createPendingMatch(matchInput);

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('matches');
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('audit_logs');
        expect(mockInsert).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ action_type: 'CREATE_MATCH' })
        ]));
    });
});
