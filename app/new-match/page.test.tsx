// @vitest-environment happy-dom
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CreateMatchForm from './page';
import { createPendingMatch } from '@/actions/match-actions';
import { Player } from '@/types';

// Mock delle dipendenze di navigazione e server actions
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush, refresh: mockRefresh })
}));

vi.mock('@/actions/match-actions', () => ({
    createPendingMatch: vi.fn()
}));

// Giocatori finti con combinazioni di lato, livello e genere diversi
const mockPlayers: Player[] = [
    { id: 1, first_name: 'Marco', last_name: 'UomoSX', ranking: 4.50, preferred_side: 'Left', gender: 'M' },
    { id: 2, first_name: 'Luca', last_name: 'UomoDX', ranking: 4.55, preferred_side: 'Right', gender: 'M' },
    { id: 3, first_name: 'Giulia', last_name: 'DonnaSX', ranking: 4.45, preferred_side: 'Left', gender: 'F' },
    { id: 4, first_name: 'Elena', last_name: 'DonnaDX', ranking: 4.80, preferred_side: 'Right', gender: 'F' },
];

// Mock parziale del client Supabase
const mockSelect = vi.fn().mockImplementation(() => ({
    order: vi.fn().mockResolvedValue({ data: mockPlayers, error: null })
}));
vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        from: () => ({ select: mockSelect })
    })
}));

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

        // Di default il match è "male" (Maschile). La tendina Left deve mostrare solo Marco.
        await waitFor(() => {
            const leftSelect = screen.getAllByRole('combobox')[0];
            expect(leftSelect.innerHTML).toContain('Marco UomoSX');
            expect(leftSelect.innerHTML).not.toContain('Giulia DonnaSX');
        });

        // Cambiamo la categoria in Femminile cliccando sul pulsante relativo
        const femaleButton = screen.getByText('👩 Femminile');
        fireEvent.click(femaleButton);

        // Ora la tendina Left deve contenere Giulia e non Marco
        await waitFor(() => {
            const leftSelect = screen.getAllByRole('combobox')[0];
            expect(leftSelect.innerHTML).toContain('Giulia DonnaSX');
            expect(leftSelect.innerHTML).not.toContain('Marco UomoSX');
        });
    });

    it('dovrebbe mostrare un errore visivo in caso di giocatori cloni', async () => {
        render(<CreateMatchForm />);

        // 👈 FISSAATO: Attendiamo che le tendine siano pronte prima di fare modifiche
        await screen.findAllByRole('option');

        const selects = screen.getAllByRole('combobox');
        // Selezioniamo lo stesso giocatore (Marco id: 1) sia in Team A Left che in Team B Left
        fireEvent.change(selects[0], { target: { value: '1' } });
        fireEvent.change(selects[2], { target: { value: '1' } });

        // 👈 FISSATO: waitFor garantisce che l'effetto useEffect si sia concluso
        await waitFor(() => {
            expect(screen.getByText(/Errore: Lo stesso giocatore è stato inserito in più posizioni/i)).toBeDefined();
            const submitBtn = screen.getByRole('button', { name: /Crea Partita/i });
            expect(submitBtn.hasAttribute('disabled')).toBe(true);
        });
    });

    it('dovrebbe innescare l alert di scompenso se la forbice tecnica supera lo 0.25', async () => {
        render(<CreateMatchForm />);

        // Attendiamo il caricamento iniziale dei mock
        await screen.findAllByRole('option');

        // Passiamo a match misto per poter inserire sia maschi che femmine liberamente
        fireEvent.click(screen.getByText('🌍 Misto'));

        const selects = screen.getAllByRole('combobox');
        // Inseriamo Giulia (4.45) ed Elena (4.80) -> Divario = 0.35
        fireEvent.change(selects[0], { target: { value: '3' } });
        fireEvent.change(selects[1], { target: { value: '4' } });

        // 👈 FISSATO: Aspettiamo l'aggiornamento dinamico dello sbilanciamento tecnico
        await waitFor(() => {
            expect(screen.getByText(/Attenzione: La differenza di livello supera il limite di 0.25/i)).toBeDefined();
            const submitBtn = screen.getByRole('button', { name: /Crea Partita/i });
            expect(submitBtn.hasAttribute('disabled')).toBe(true);
        });
    });

    it('dovrebbe inviare i dati corretti alla Server Action al submit del form', async () => {
        render(<CreateMatchForm />);

        // Attendiamo il caricamento iniziale dei mock
        await screen.findAllByRole('option');

        const selects = screen.getAllByRole('combobox');
        // Configurazione valida: Marco (4.50) e Luca (4.55) -> Divario = 0.05
        fireEvent.change(selects[0], { target: { value: '1' } });
        fireEvent.change(selects[1], { target: { value: '2' } });

        // 👈 FISSATO: Attendiamo che il bottone di sottomissione si sblocchi stabilmente
        await waitFor(() => {
            const submitBtn = screen.getByRole('button', { name: /Crea Partita/i });
            expect(submitBtn.hasAttribute('disabled')).toBe(false);
        });

        const formBtn = screen.getByRole('button', { name: /Crea Partita/i });
        fireEvent.click(formBtn);

        await waitFor(() => {
            expect(createPendingMatch).toHaveBeenCalledWith(expect.objectContaining({
                matchType: 'male',
                teamALeft: 1,
                teamARight: 2,
                teamBLeft: null,
                teamBRight: null
            }));
            expect(mockPush).toHaveBeenCalledWith('/');
        });
    });
});
