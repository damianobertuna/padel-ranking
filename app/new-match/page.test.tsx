// @vitest-environment happy-dom
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CreateMatchForm from './page';
import { createPendingMatch } from '@/actions/match-actions';

// 1. Usiamo vi.hoisted() per dichiarare le variabili PRIMA che i vi.mock vengano eseguiti
const { mockPush, mockRefresh, mockPlayers, mockClubs } = vi.hoisted(() => {
    return {
        mockPush: vi.fn(),
        mockRefresh: vi.fn(),
        mockPlayers: [
            { id: 1, first_name: 'Marco', last_name: 'UomoSX', ranking: 4.50, preferred_side: 'Left', gender: 'M' },
            { id: 2, first_name: 'Luca', last_name: 'UomoDX', ranking: 4.55, preferred_side: 'Right', gender: 'M' },
            { id: 3, first_name: 'Giulia', last_name: 'DonnaSX', ranking: 4.45, preferred_side: 'Left', gender: 'F' },
            { id: 4, first_name: 'Elena', last_name: 'DonnaDX', ranking: 4.80, preferred_side: 'Right', gender: 'F' },
        ],
        mockClubs: [
            { id: 1, name: 'Padel Club X', city: 'Catania' }
        ]
    };
});

// 2. Mock delle dipendenze di navigazione e server actions
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush, refresh: mockRefresh })
}));

vi.mock('@/actions/match-actions', () => ({
    createPendingMatch: vi.fn()
}));

// Componente fittizio per BackToHomeButton
vi.mock('@/components/BackToHomeButton', () => ({
    default: () => <button>Torna alla classifica</button>
}));

// 3. Mock Supabase con accesso alle variabili hoisted
vi.mock('@/lib/supabase/client', () => {
    const playerQueryChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockImplementation(function (this: any, field: string) {
            if (field === 'last_name') {
                return Promise.resolve({ data: mockPlayers, error: null });
            }
            return this;
        })
    };

    const clubQueryChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockClubs, error: null })
    };

    return {
        createClient: () => ({
            from: vi.fn((table: string) => {
                if (table === 'players') return playerQueryChain;
                if (table === 'clubs') return clubQueryChain;
                return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
            })
        })
    };
});


describe('CreateMatchForm Component', () => {

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('dovrebbe filtrare i giocatori in base alla categoria del match (Genere)', async () => {
        render(<CreateMatchForm />);

        await screen.findAllByRole('option');

        // Di default il match è "male" (Maschile).
        const leftSelect = screen.getAllByRole('combobox')[1];
        expect(leftSelect.innerHTML).toContain('Marco UomoSX');
        expect(leftSelect.innerHTML).not.toContain('Giulia DonnaSX');

        // Cambiamo la categoria in Femminile
        const femaleButton = screen.getByRole('button', { name: /👩 Femminile/i });
        fireEvent.click(femaleButton);

        // Ora la tendina Left deve contenere Giulia e non Marco
        await waitFor(() => {
            const newLeftSelect = screen.getAllByRole('combobox')[1];
            expect(newLeftSelect.innerHTML).toContain('Giulia DonnaSX');
            expect(newLeftSelect.innerHTML).not.toContain('Marco UomoSX');
        });
    });

    it('dovrebbe mostrare un errore visivo in caso di giocatori cloni', async () => {
        render(<CreateMatchForm />);
        await screen.findAllByRole('option');

        const selects = screen.getAllByRole('combobox');

        // Selezioniamo lo stesso giocatore (Marco id: 1) sia in Team A Left [1] che in Team B Left [3]
        fireEvent.change(selects[1], { target: { value: '1' } });
        fireEvent.change(selects[3], { target: { value: '1' } });

        await waitFor(() => {
            expect(screen.getByText(/Errore: Lo stesso giocatore è stato inserito in più posizioni/i)).toBeDefined();
            const submitBtn = screen.getByRole('button', { name: /Crea Partita/i });
            expect(submitBtn.hasAttribute('disabled')).toBe(true);
        });
    });

    it('dovrebbe innescare l alert di scompenso se la forbice tecnica supera lo 0.25', async () => {
        render(<CreateMatchForm />);
        await screen.findAllByRole('option');

        // Passiamo a match misto
        fireEvent.click(screen.getByRole('button', { name: /🌍 Misto/i }));

        const selects = screen.getAllByRole('combobox');

        // Inseriamo Giulia (4.45) in Team A SX [1] ed Elena (4.80) in Team A DX [2] (Diff = 0.35)
        fireEvent.change(selects[1], { target: { value: '3' } });
        fireEvent.change(selects[2], { target: { value: '4' } });

        await waitFor(() => {
            expect(screen.getByText(/Attenzione: La differenza di livello supera il limite di 0.25/i)).toBeDefined();
            const submitBtn = screen.getByRole('button', { name: /Crea Partita/i });
            expect(submitBtn.hasAttribute('disabled')).toBe(true);
        });
    });

    it('dovrebbe inviare i dati corretti alla Server Action al submit del form', async () => {
        render(<CreateMatchForm />);
        await screen.findAllByRole('option');

        const selects = screen.getAllByRole('combobox');

        // Configurazione valida (Diff = 0.05)
        fireEvent.change(selects[1], { target: { value: '1' } });
        fireEvent.change(selects[2], { target: { value: '2' } });

        // Verifichiamo che il bottone si sblocchi
        let submitBtn: HTMLElement;
        await waitFor(() => {
            submitBtn = screen.getByRole('button', { name: /Crea Partita/i });
            expect(submitBtn.hasAttribute('disabled')).toBe(false);
        });

        fireEvent.click(submitBtn!);

        await waitFor(() => {
            expect(createPendingMatch).toHaveBeenCalledWith(expect.objectContaining({
                matchType: 'male',
                teamALeft: 1,
                teamARight: 2,
                teamBLeft: null,
                teamBRight: null,
                clubId: null
            }));
            expect(mockPush).toHaveBeenCalledWith('/');
        });
    });
});
