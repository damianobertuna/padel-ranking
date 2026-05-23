// @vitest-environment happy-dom
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import JoinMatchPage from './page';
import userEvent from '@testing-library/user-event';

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

// Mock di Supabase per gestire la catena di chiamate (select().eq().maybeSingle())
vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
                data: { id: 'match-123', match_type: 'male' },
                error: null
            }),
            then: vi.fn((resolve) => resolve({ data: [], error: null }))
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

        // Verifica la presenza dei campi select
        const selects = await screen.findAllByRole('combobox');
        expect(selects.length).toBeGreaterThan(0);
        expect(screen.getByText(/Gestisci Partita/i)).toBeDefined();
    });
});
