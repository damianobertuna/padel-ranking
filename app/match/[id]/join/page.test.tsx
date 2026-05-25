// @vitest-environment happy-dom
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import JoinMatchPage from './page';

// Mock delle dipendenze esterne
vi.mock('next/navigation', () => ({
    useParams: () => ({ id: 'match-123' }),
    useRouter: () => ({ push: vi.fn(), refresh: vi.fn() })
}));

vi.mock('@/actions/match-actions', () => ({
    updateMatchPlayers: vi.fn()
}));

vi.mock('@/components/BackToHomeButton', () => ({
    __esModule: true,
    default: () => <button>Torna</button>
}));

// Mock di Supabase AGGIORNATO
vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        // 1. Simula l'utente loggato per non far fallire il redirect di sicurezza
        auth: {
            getSession: vi.fn().mockResolvedValue({
                data: { session: { user: { id: 'user-123' } } }
            })
        },
        from: vi.fn((table: string) => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),

            // 2. Simula il singolo match
            maybeSingle: vi.fn().mockResolvedValue({
                data: table === 'matches' ? { id: 'match-123', match_type: 'male', club_id: null } : null,
                error: null
            }),

            // 3. Simula le liste di dati per giocatori e club (usate nel Promise.all)
            then: vi.fn((resolve) => {
                if (table === 'players') {
                    return resolve({
                        data: [{ id: 1, first_name: 'Mario', last_name: 'Rossi', ranking: 3.5, preferred_side: 'Both', gender: 'M' }],
                        error: null
                    });
                }
                if (table === 'clubs') {
                    return resolve({
                        data: [{ id: 1, name: 'Padel Club Test' }],
                        error: null
                    });
                }
                return resolve({ data: [], error: null });
            })
        }))
    })
}));

describe('JoinMatchPage Unit Tests', () => {
    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('dovrebbe mostrare il loader durante il caricamento iniziale', () => {
        render(<JoinMatchPage />);
        expect(screen.getByText(/Caricamento dettagli match.../i)).toBeDefined();
    });

    it('dovrebbe renderizzare correttamente il form dopo il caricamento', async () => {
        render(<JoinMatchPage />);

        // Aspettiamo che il loader sparisca e appaia il form
        await waitFor(() => {
            expect(screen.queryByText(/Caricamento dettagli match.../i)).toBeNull();
        });

        // Ora il form viene renderizzato e i select (combobox) sono presenti!
        const selects = await screen.findAllByRole('combobox');
        expect(selects.length).toBeGreaterThan(0);
        expect(screen.getByText(/Gestisci Partita/i)).toBeDefined();
    });
});
