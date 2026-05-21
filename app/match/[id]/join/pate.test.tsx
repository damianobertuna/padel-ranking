// @vitest-environment happy-dom
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import JoinMatchPage from './page';
import { updateMatchPlayers } from '@/actions/match-actions';
import { Match, Player } from '@/types';

const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
    useParams: () => ({ id: 'match-existing-uuid' }),
    useRouter: () => ({ push: mockPush, refresh: mockRefresh })
}));

vi.mock('@/actions/match-actions', () => ({
    updateMatchPlayers: vi.fn()
}));

const mockPlayers: Player[] = [
    { id: 10, first_name: 'Paolo', last_name: 'Titolare', ranking: 4.50, preferred_side: 'Left', gender: 'M' },
    { id: 20, first_name: 'Andrea', last_name: 'LiberoM', ranking: 4.60, preferred_side: 'Right', gender: 'M' },
    { id: 30, first_name: 'Sofia', last_name: 'LiberoF', ranking: 4.55, preferred_side: 'Right', gender: 'F' },
];

// Una partita esistente di tipo FEMMINILE ("female") dove Paolo (id: 10) occupa già lo slot di sinistra
const mockMatchData: Match = {
    id: 'match-existing-uuid',
    team_a_left_id: 10, // Già occupato
    team_a_right_id: null,
    team_b_left_id: null,
    team_b_right_id: null,
    match_type: 'female', // Match femminile
    status: 'pending',
    created_at: new Date().toISOString()
};

const mockMaybeSingle = vi.fn().mockImplementation(() => Promise.resolve({ data: mockMatchData, error: null }));
const mockSelect = vi.fn().mockImplementation(() => ({
    order: vi.fn().mockResolvedValue({ data: mockPlayers, error: null })
}));

vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        from: (table: string) => {
            if (table === 'matches') return { select: () => ({ eq: () => ({ maybeSingle: mockMaybeSingle }) }) };
            return { select: mockSelect };
        }
    })
}));

describe('JoinMatchPage Component', () => {

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('dovrebbe renderizzare come testo fisso gli slot già occupati e come select quelli liberi', async () => {
        render(<JoinMatchPage />);

        // Slot occupato da Paolo deve essere un badge testuale protetto
        await waitFor(() => {
            expect(screen.getByText(/🛡️ Paolo Titolare/i)).toBeDefined();
        });

        // Gli altri 3 slot devono essere dei menu a tendina editabili
        const selects = screen.getAllByRole('combobox');
        expect(selects.length).toBe(3);
    });

    it('dovrebbe mostrare solo donne disponibili nelle tendine se il match pre-creato è femminile', async () => {
        render(<JoinMatchPage />);

        await waitFor(() => {
            const rightSelectTeamA = screen.getAllByRole('combobox')[0]; // Primo slot libero (Team A DX)

            // Sofia (Donna) deve essere inclusa, Andrea (Uomo) deve essere nascosto
            expect(rightSelectTeamA.innerHTML).toContain('Sofia LiberoF');
            expect(rightSelectTeamA.innerHTML).not.toContain('Andrea LiberoM');
        });
    });

    it('dovrebbe escludere dalle liste dei rimpiazzi i giocatori che si trovano già in campo', async () => {
        // Cambiamo il finto match in "mixed" per evitare i blocchi di genere
        mockMatchData.match_type = 'mixed';
        render(<JoinMatchPage />);

        await waitFor(() => {
            const selects = screen.getAllByRole('combobox');
            // Paolo (id: 10) è già titolare finto nel DB, non deve comparire tra le opzioni delle altre tendine
            expect(selects[0].innerHTML).not.toContain('Paolo Titolare');
        });
    });

    it('dovrebbe chiamare updateMatchPlayers con i soli slot modificati dall utente', async () => {
        mockMatchData.match_type = 'female';
        render(<JoinMatchPage />);

        await waitFor(() => {
            const selects = screen.getAllByRole('combobox');
            // Selezioniamo Sofia (id:30) nel primo slot libero disponibile (Team A DX)
            fireEvent.change(selects[0], { target: { value: '30' } });
        });

        const submitBtn = screen.getByRole('button', { name: /Salva ed Occupa Slot/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(updateMatchPlayers).toHaveBeenCalledWith(
                'match-existing-uuid',
                { team_a_right_id: 30 } // Invia solo il campo compilato, lasciando intatti gli altri
            );
            expect(mockPush).toHaveBeenCalledWith('/');
        });
    });
});
