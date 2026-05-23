// @vitest-environment happy-dom
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import JoinMatchPage from './page';
import { updateMatchPlayers } from '@/actions/match-actions';
import { Match, Player } from '@/types';

// 1. HOISTING GLOBALE
const { mockPush, mockRefresh, mockPlayers, mockMatchFemale, mockMatchMale } = vi.hoisted(() => {
    return {
        mockPush: vi.fn(),
        mockRefresh: vi.fn(),
        mockPlayers: [
            // Paolo è già in campo
            { id: 10, first_name: 'Paolo', last_name: 'Titolare', ranking: 4.5, preferred_side: 'Left', gender: 'M' } as Player,
            // 👈 FIX: Abbiamo cambiato Marco in 'Right' per poterlo inserire nello slot DX
            { id: 20, first_name: 'Marco', last_name: 'UomoDX', ranking: 4.6, preferred_side: 'Right', gender: 'M' } as Player,
            { id: 30, first_name: 'Sofia', last_name: 'DonnaSX', ranking: 4.4, preferred_side: 'Left', gender: 'F' } as Player,
            { id: 40, first_name: 'Elena', last_name: 'DonnaDX', ranking: 4.8, preferred_side: 'Right', gender: 'F' } as Player,
        ],
        mockMatchFemale: {
            id: 'match-f',
            match_type: 'female',
            status: 'pending',
            team_a_left_id: null,
            team_a_right_id: null,
            team_b_left_id: null,
            team_b_right_id: null
        } as Match,
        mockMatchMale: {
            id: 'match-m',
            match_type: 'male',
            status: 'pending',
            team_a_left_id: 10, // Paolo è già piazzato qui
            team_a_right_id: null,
            team_b_left_id: null,
            team_b_right_id: null
        } as Match
    };
});

let currentMatchToReturn = mockMatchMale;

// 2. MOCK MODULI ESTERNI
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
    useParams: () => ({ id: currentMatchToReturn.id })
}));

vi.mock('@/actions/match-actions', () => ({
    updateMatchPlayers: vi.fn()
}));

vi.mock('@/components/BackToHomeButton', () => ({
    default: () => <button>Torna alla classifica</button>
}));

// 3. MOCK SUPABASE INTELLIGENTE
vi.mock('@/lib/supabase/client', () => {
    const matchQueryChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn(() => Promise.resolve({ data: currentMatchToReturn, error: null }))
    };

    const playerQueryChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockImplementation(function (this: any, field: string) {
            if (field === 'last_name') {
                return Promise.resolve({ data: mockPlayers, error: null });
            }
            return this;
        })
    };

    return {
        createClient: () => ({
            from: vi.fn((table: string) => {
                if (table === 'matches') return matchQueryChain;
                if (table === 'players') return playerQueryChain;
                return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
            })
        })
    };
});


describe('JoinMatchPage Component', () => {

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
        // Reset base per ogni test
        currentMatchToReturn = mockMatchMale;
    });

    afterEach(() => {
        cleanup();
    });

    it('dovrebbe renderizzare come testo fisso gli slot già occupati e come select quelli liberi', async () => {
        render(<JoinMatchPage />);

        await waitFor(() => {
            expect(screen.getByText(/🛡️ Paolo Titolare/i)).toBeDefined();
        });

        const selects = screen.getAllByRole('combobox');
        expect(selects).toHaveLength(3);
    });

    it('dovrebbe mostrare solo donne disponibili nelle tendine se il match pre-creato è femminile', async () => {
        currentMatchToReturn = mockMatchFemale;
        render(<JoinMatchPage />);

        await screen.findAllByRole('option');

        const rightSelectTeamA = screen.getAllByRole('combobox')[1]; // Slot DX (indice 1)

        expect(rightSelectTeamA.innerHTML).toContain('Elena');
        expect(rightSelectTeamA.innerHTML).not.toContain('Marco');
        expect(rightSelectTeamA.innerHTML).not.toContain('Paolo');
    });

    it('dovrebbe escludere dalle liste dei rimpiazzi i giocatori che si trovano già in campo', async () => {
        render(<JoinMatchPage />);

        await screen.findAllByRole('option');

        const selects = screen.getAllByRole('combobox');
        expect(selects[0].innerHTML).not.toContain('Paolo Titolare');
    });

    it('dovrebbe chiamare updateMatchPlayers con i soli slot modificati dall utente', async () => {
        render(<JoinMatchPage />);

        await screen.findAllByRole('option');

        const selects = screen.getAllByRole('combobox');

        // Selezioniamo Marco (ora validato per giocare a DX, id:20) nel Team A Destra
        fireEvent.change(selects[0], { target: { value: '20' } });

        let submitBtn: HTMLElement;
        await waitFor(() => {
            submitBtn = screen.getByRole('button', { name: /Salva ed Occupa Slot/i });
            expect(submitBtn.hasAttribute('disabled')).toBe(false);
        });

        fireEvent.click(submitBtn!);

        await waitFor(() => {
            expect(updateMatchPlayers).toHaveBeenCalledWith('match-m', {
                team_a_right_id: 20
            });
            expect(mockPush).toHaveBeenCalledWith('/');
        });
    });
});
