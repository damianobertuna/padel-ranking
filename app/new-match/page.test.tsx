// @vitest-environment happy-dom
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CreateMatchForm from './page';
import { createPendingMatch } from '@/actions/match-actions';

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

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush, refresh: mockRefresh })
}));

vi.mock('@/actions/match-actions', () => ({
    createPendingMatch: vi.fn()
}));

vi.mock('@/components/BackToHomeButton', () => ({
    default: () => <button>Torna alla classifica</button>
}));

vi.mock('@/lib/supabase/client', () => {
    const playerQueryChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockImplementation(function (this: any, field: string) {
            if (field === 'last_name') return Promise.resolve({ data: mockPlayers, error: null });
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
    beforeEach(() => { cleanup(); vi.clearAllMocks(); });
    afterEach(() => { cleanup(); });

    it('dovrebbe filtrare i giocatori in base alla categoria (Genere)', async () => {
        render(<CreateMatchForm />);
        await screen.findAllByRole('option');

        const leftSelect = screen.getAllByRole('combobox')[1];
        expect(leftSelect.innerHTML).toContain('UomoSX Marco');

        fireEvent.click(screen.getByRole('button', { name: /FEMMINILE/i }));

        await waitFor(() => {
            const newLeftSelect = screen.getAllByRole('combobox')[1];
            expect(newLeftSelect.innerHTML).toContain('DonnaSX Giulia');
            expect(newLeftSelect.innerHTML).not.toContain('UomoSX Marco');
        });
    });

    it('dovrebbe innescare l alert di scompenso se la forbice tecnica supera lo 0.25', async () => {
        render(<CreateMatchForm />);
        await screen.findAllByRole('option');

        fireEvent.click(screen.getByRole('button', { name: /MISTO/i }));
        const selects = screen.getAllByRole('combobox');

        fireEvent.change(selects[1], { target: { value: '3' } });
        fireEvent.change(selects[2], { target: { value: '4' } });

        await waitFor(() => {
            expect(screen.getByText(/ERRORE: DIVARIO TECNICO > 0.25/i)).toBeDefined();
            const submitBtn = screen.getByRole('button', { name: /CONFERMA PARTITA/i });
            expect(submitBtn.hasAttribute('disabled')).toBe(true);
        });
    });

    it('dovrebbe inviare i dati corretti alla Server Action', async () => {
        render(<CreateMatchForm />);
        await screen.findAllByRole('option');
        const selects = screen.getAllByRole('combobox');

        fireEvent.change(selects[1], { target: { value: '1' } });
        fireEvent.change(selects[2], { target: { value: '2' } });

        let submitBtn: HTMLElement;
        await waitFor(() => {
            submitBtn = screen.getByRole('button', { name: /CONFERMA PARTITA/i });
            expect(submitBtn.hasAttribute('disabled')).toBe(false);
        });

        fireEvent.click(submitBtn!);

        await waitFor(() => {
            expect(createPendingMatch).toHaveBeenCalledWith(expect.objectContaining({
                matchType: 'male',
                teamALeft: 1,
                teamARight: 2
            }));
            expect(mockPush).toHaveBeenCalledWith('/');
        });
    });
});
