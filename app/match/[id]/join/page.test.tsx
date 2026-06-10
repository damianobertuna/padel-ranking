// @vitest-environment happy-dom
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import EditMatchPage from './page';
import { createClient } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';

// Mock dei moduli esterni
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
    useParams: vi.fn()
}));

vi.mock('@/actions/match-actions', () => ({
    updateMatchPlayers: vi.fn().mockResolvedValue({ error: null })
}));

vi.mock('@/lib/supabase/client', () => ({
    createClient: vi.fn()
}));

const mockMatch = {
    id: 'match-edit-123',
    status: 'pending',
    match_date: '2026-06-15T20:00:00.000Z',
    match_type: 'male',
    club_id: 100,
    team_a_left_id: 1,
    team_a_right_id: 2,
    team_b_left_id: null,
    team_b_right_id: null,
    is_friendly: false
};

const mockPlayers = [
    { id: 1, first_name: 'Mario', last_name: 'Rossi', ranking: 4.00, preferred_side: 'Left', gender: 'M' },
    { id: 2, first_name: 'Luigi', last_name: 'Verdi', ranking: 4.10, preferred_side: 'Right', gender: 'M' },
    { id: 3, first_name: 'Pippo', last_name: 'Franco', ranking: 3.90, preferred_side: 'Both', gender: 'M' },
];

const mockClubs = [
    { id: 100, name: 'Padel Club Catania', city: 'Catania' }
];

describe('JoinMatchPage Unit Tests (Edit Match Page)', () => {
    let mockSupabase: any;

    beforeEach(() => {
        vi.clearAllMocks();
        (useParams as any).mockReturnValue({ id: 'match-edit-123' });

        // Creazione di un mock robusto per catene fluide di Supabase (.select.eq.order...)
        mockSupabase = {
            from: vi.fn((table) => {
                const builder: any = {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    order: vi.fn(),
                    maybeSingle: vi.fn()
                };

                builder.order.mockImplementation(() => {
                    if (table === 'players') return Promise.resolve({ data: mockPlayers, error: null });
                    if (table === 'clubs') return Promise.resolve({ data: mockClubs, error: null });
                    return Promise.resolve({ data: [], error: null });
                });

                builder.maybeSingle.mockImplementation(() => {
                    if (table === 'matches') return Promise.resolve({ data: mockMatch, error: null });
                    return Promise.resolve({ data: null, error: null });
                });

                return builder;
            })
        };

        (createClient as any).mockReturnValue(mockSupabase);
    });

    afterEach(() => {
        cleanup();
    });

    it('dovrebbe mostrare il loader durante il caricamento iniziale', () => {
        // Simuliamo un caricamento infinito sovrascrivendo la Promise
        (createClient as any).mockReturnValue({
            from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => new Promise(() => {}) }) }) })
        });

        render(<EditMatchPage />);
        expect(screen.getByText(/Caricamento/i)).toBeDefined();
    });

    it('dovrebbe renderizzare correttamente il form dopo il caricamento', async () => {
        render(<EditMatchPage />);

        // Aspettiamo la transizione dello stato dal loader alla visualizzazione del form unificato
        await screen.findByText('Modifica Partita');

        // Poiché i dati iniziali passano i giocatori pre-esistenti della partita,
        // SearchableSelect mostrerà i loro nomi come opzioni correnti selezionate.
        expect(screen.getByText(/Rossi Mario/i)).toBeDefined();
        expect(screen.getByText(/Verdi Luigi/i)).toBeDefined();
        expect(screen.getByText('Padel Club Catania (Catania)')).toBeDefined();
    });
});
