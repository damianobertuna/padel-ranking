import { deletePendingMatch, createPendingMatch, resolveMatchWithRanking } from './match-actions';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// 1. Mock delle utility di Next.js in stile Vitest
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

vi.mock('next/navigation', () => ({
    redirect: vi.fn(),
}));

// 2. Struttura dei mock per la catena di metodi di Supabase
const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockIn = vi.fn(() => ({ select: vi.fn(() => Promise.resolve({ data: [] })) }));
const mockSelect = vi.fn(() => ({ eq: mockEq, in: mockIn }));
const mockInsert = vi.fn(() => Promise.resolve({ error: null }));
const mockDelete = vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) }));
const mockUpdate = vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) }));

const mockSupabaseClient = {
    auth: {
        getUser: vi.fn(),
    },
    from: vi.fn((table: string) => {
        if (table === 'audit_logs') return { insert: mockInsert };
        if (table === 'matches') return { insert: mockInsert, select: mockSelect, delete: mockDelete, update: mockUpdate };
        return { select: mockSelect, update: mockUpdate }; // Default per 'players' (aggiorna anche il ranking)
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

        await expect(deletePendingMatch('match-uuid-1')).rejects.toThrow("Utente non autenticato");
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

        await expect(deletePendingMatch('match-uuid-1')).rejects.toThrow("Non hai i permessi per cancellare questa partita");
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

        await deletePendingMatch('match-uuid-1');

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('audit_logs');
        expect(mockInsert).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ action_type: 'MATCH_DELETED' })
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
            matchType: 'male' | 'female' | 'mixed',
            teamALeft: 1,
            teamARight: 2,
            teamBLeft: 3,
            teamBRight: 4
        };

        await createPendingMatch(matchInput);

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('matches');
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('audit_logs');
        expect(mockInsert).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ action_type: 'MATCH_CREATED' })
        ]));
    });
});

// 4. BLOCCO DI TEST AGGIORNATO PER LA RISOLUZIONE DEI MATCH (CON SET OBBLIGATORI)
describe('resolveMatchWithRanking', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('dovrebbe calcolare autonomamente il vincitore in base ai set e salvare l’array JSONB', async () => {
        // Mock Utente, Profilo Giocatore e Match corrente
        mockSupabaseClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'admin_user' } } });
        mockSingle.mockResolvedValueOnce({ data: { id: 10, first_name: 'Capo', last_name: 'Admin', role: 'admin' } });
        mockSingle.mockResolvedValueOnce({
            data: {
                id: 123, status: 'pending',
                team_a_left_id: 1, team_a_right_id: 2,
                team_b_left_id: 3, team_b_right_id: 4
            }
        });

        // Mock per i cicli sequenziali di lettura del ranking corrente dei giocatori
        mockSingle.mockResolvedValue({ ranking: 2000 });

        const mockScore = [
            { team_a: 6, team_b: 4 },
            { team_a: 3, team_b: 6 },
            { team_a: 7, team_b: 5 }
        ];

        await resolveMatchWithRanking({
            matchId: "123",
            score: mockScore, // Vince il Team A per 2 set a 1
            rankingUpdates: { 1: 15, 2: 15, 3: -15, 4: -15 }
        });

        // Controlliamo che l'aggiornamento sul match contenga le informazioni elaborate dal server
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('matches');
        expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
            status: 'completed',
            winning_team: 'A', // Deve aver capito che ha vinto A
            score: mockScore   // Salva l'array dei set
        }));

        // Controlliamo il corretto tracciamento nell'audit log
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('audit_logs');
        expect(mockInsert).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ action_type: 'MATCH_RESOLVED' })
        ]));
    });

    // 👈 TEST SOSTITUITO: Ora verifica la barriera di sicurezza dei set obbligatori
    it('dovrebbe rifiutare la risoluzione del match se l’array dei set viene inviato vuoto o incompleto', async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user_1' } } });
        mockSingle.mockResolvedValueOnce({ data: { id: 1, first_name: 'Luca', last_name: 'Verdi', role: 'player' } });
        mockSingle.mockResolvedValueOnce({
            data: {
                id: 123, status: 'pending',
                team_a_left_id: 1, team_a_right_id: 2,
                team_b_left_id: 3, team_b_right_id: 4
            }
        });
        mockSingle.mockResolvedValue({ ranking: 2000 });

        const datiInvalidi = {
            matchId: "123",
            score: [], // ❌ Invio illegale di un array vuoto
            rankingUpdates: { 1: -10, 2: -10, 3: 10, 4: 10 }
        };

        // Ci aspettiamo che la Server Action rimbalzi la richiesta lanciando l'errore esatto
        await expect(resolveMatchWithRanking(datiInvalidi)).rejects.toThrow(
            "I dati dei set sono incompleti. Almeno i primi 2 set sono obbligatori."
        );
    });
});
