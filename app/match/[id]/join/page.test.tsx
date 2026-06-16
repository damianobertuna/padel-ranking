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
    team_a_left_id: 1, // Mario Rossi
    team_a_right_id: 2, // Luigi Verdi
    team_b_left_id: null,
    team_b_right_id: null,
    is_friendly: false,
    organizer_id: 1 // L'organizzatore è Mario Rossi
};

const mockPlayers = [
    { id: 1, user_id: 'user-mario', first_name: 'Mario', last_name: 'Rossi', ranking: 4.00, preferred_side: 'Left', gender: 'M', role: 'user' },
    { id: 2, user_id: 'user-luigi', first_name: 'Luigi', last_name: 'Verdi', ranking: 4.10, preferred_side: 'Right', gender: 'M', role: 'user' },
    { id: 3, user_id: 'user-pippo', first_name: 'Pippo', last_name: 'Franco', ranking: 3.90, preferred_side: 'Both', gender: 'M', role: 'user' },
];

const mockClubs = [
    { id: 100, name: 'Padel Club Catania', city: 'Catania' }
];

describe('JoinMatchPage Unit Tests (Edit Match Page)', () => {
    let mockSupabase: any;

    beforeEach(() => {
        vi.clearAllMocks();
        (useParams as any).mockReturnValue({ id: 'match-edit-123' });

        // Creazione di un mock robusto per catene fluide di Supabase
        mockSupabase = {
            // Aggiungiamo il mock per l'autenticazione
            auth: {
                // Simuliamo che l'utente loggato sia Mario (che è in campo ed è l'organizzatore)
                getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-mario' } }, error: null })
            },
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
                    // Simuliamo che non ci siano club_managers (o restituiamo un array vuoto)
                    if (table === 'club_managers') return Promise.resolve({ data: null, error: null });
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
        // Creiamo un builder fittizio che accetta tutte le funzioni a catena e poi "si blocca" (Promise pendente)
        const builder = {
            select: () => builder,
            eq: () => builder,
            order: () => builder,
            maybeSingle: () => new Promise(() => {}) // Promessa che non si risolve mai
        };

        (createClient as any).mockReturnValue({
            auth: { getUser: () => new Promise(() => {}) }, // Promessa che non si risolve mai
            from: () => builder
        });

        render(<EditMatchPage />);
        expect(screen.getByText(/Caricamento/i)).toBeDefined();
    });

    it('dovrebbe renderizzare correttamente il form dopo il caricamento se autorizzato', async () => {
        render(<EditMatchPage />);

        // Aspettiamo la transizione dello stato dal loader alla visualizzazione del form unificato
        await screen.findByText('Modifica Partita');

        // Poiché i dati iniziali passano i giocatori pre-esistenti della partita,
        // SearchableSelect mostrerà i loro nomi come opzioni correnti selezionate.
        expect(screen.getByText(/Rossi Mario/i)).toBeDefined();
        expect(screen.getByText(/Verdi Luigi/i)).toBeDefined();
        expect(screen.getByText('Padel Club Catania (Catania)')).toBeDefined();
    });

    it('dovrebbe mostrare un ERRORE DI ACCESSO se l\'utente non è autorizzato a modificare', async () => {
        // Sovrascriviamo l'auth mock in modo che l'utente loggato sia Pippo (che NON è in campo)
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-pippo' } }, error: null });
        (createClient as any).mockReturnValue(mockSupabase);

        render(<EditMatchPage />);

        // Il form non deve apparire, ma deve apparire il banner di errore di sicurezza
        await screen.findByText(/ACCESSO NEGATO: Non sei autorizzato a gestire/i);
    });
});
