// @vitest-environment happy-dom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CreateMatchPage from './page';
import { createClient } from '@/lib/supabase/client';
import { createPendingMatch } from '@/actions/match-actions';
import dictForm from '@/lib/i18n/dict-form';
import dictPlayer from '@/lib/i18n/dict-player';
import dictWhatsapp from '@/lib/i18n/dict-whatsapp';
import dictUi from '@/lib/i18n/dict-ui';
import dictError from '@/lib/i18n/dict-error';

// Mock di Next Navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush, refresh: vi.fn() })
}));

// Mock della Server Action
vi.mock('@/actions/match-actions', () => ({
    createPendingMatch: vi.fn().mockResolvedValue({ error: null })
}));

// Mock di Supabase Client
vi.mock('@/lib/supabase/client', () => ({
    createClient: vi.fn()
}));

const mockPlayers = [
    { id: 1, first_name: 'Mario', last_name: 'Rossi', ranking: 4.00, preferred_side: 'Left', gender: 'M' },
    { id: 2, first_name: 'Luigi', last_name: 'Verdi', ranking: 4.10, preferred_side: 'Right', gender: 'M' },
    { id: 3, first_name: 'Anna', last_name: 'Neri', ranking: 3.90, preferred_side: 'Both', gender: 'F' },
    { id: 4, first_name: 'Gino', last_name: 'Bramieri', ranking: 4.50, preferred_side: 'Right', gender: 'M' },
];

const mockClubs = [
    { id: 100, name: 'Padel Club Catania', city: 'Catania' }
];

describe('CreateMatchForm Component (Page Integration)', () => {
    let mockSupabase: any;

    beforeEach(() => {
        vi.clearAllMocks();

                mockSupabase = {
            auth: {
                getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null })
            },
            from: vi.fn((table) => ({
                select: vi.fn().mockReturnThis(),
                order: vi.fn().mockImplementation(() => {
                    if (table === 'players') return Promise.resolve({ data: mockPlayers, error: null });
                    if (table === 'clubs') return Promise.resolve({ data: mockClubs, error: null });
                    return Promise.resolve({ data: [], error: null });
                }),
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
            }))
        };

        (createClient as any).mockReturnValue(mockSupabase);
    });

    afterEach(() => {
        cleanup();
    });

    // Helper per interagire con i nostri SearchableSelect custom
    const selectOption = (placeholderText: string, optionTextRegExp: RegExp) => {
        const trigger = screen.getByText(placeholderText);
        fireEvent.click(trigger);
        const option = screen.getByText(optionTextRegExp);
        fireEvent.click(option);
    };

    it('dovrebbe filtrare i giocatori in base alla categoria (Genere)', async () => {
        render(<CreateMatchPage />);

        await screen.findByText(dictForm.CREATE_TITLE);
        const slotsSX = screen.getAllByText(dictPlayer.PLAYER_SX);
        fireEvent.click(slotsSX[0]);

        // Dovrebbe mostrare Rossi (Maschio) ma nascondere Anna Neri (Femmina)
        expect(screen.getByText(/Rossi Mario/i)).toBeDefined();
        expect(screen.queryByText(/Neri Anna/i)).toBeNull();
    });

    it('dovrebbe innescare l alert di scompenso se la forbice tecnica supera lo 0.25', async () => {
        render(<CreateMatchPage />);
        await screen.findByText(dictForm.CREATE_TITLE);

        const slotsSX = screen.getAllByText(dictPlayer.PLAYER_SX);
        const slotsDX = screen.getAllByText(dictPlayer.PLAYER_DX);

        // Selezioniamo Mario Rossi (4.00) nel Team A
        fireEvent.click(slotsSX[0]);
        fireEvent.click(screen.getByText(/Rossi Mario/i));

        // Selezioniamo Gino Bramieri (4.50) nel Team A -> Delta di 0.50
        fireEvent.click(slotsDX[0]);
        fireEvent.click(screen.getByText(/Bramieri Gino/i));

        // Verifica la comparsa del blocco sull'Elo
        // Use queryByText to avoid thrown error when element not found
        const errorEl = screen.queryByText(new RegExp(dictError.PLAYER_LEVEL_ERROR.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
        expect(errorEl).not.toBeNull();
    });

    it('in modalità AMICHEVOLE, un giocatore SX dovrebbe apparire anche nel dropdown DX', async () => {
        render(<CreateMatchPage />);
        await screen.findByText(dictForm.CREATE_TITLE);

        fireEvent.click(screen.getByText(dictWhatsapp.MATCH_TYPE_FRIENDLY));

        const slotsDX = screen.getAllByText(dictPlayer.PLAYER_DX);
        fireEvent.click(slotsDX[0]);

        // Mario Rossi (Left) deve essere visibile
        expect(screen.getByText(/Rossi Mario/i)).toBeDefined();
    });

    it('in modalità AMICHEVOLE, un giocatore DX dovrebbe apparire anche nel dropdown SX', async () => {
        render(<CreateMatchPage />);
        await screen.findByText(dictForm.CREATE_TITLE);

        fireEvent.click(screen.getByText(dictWhatsapp.MATCH_TYPE_FRIENDLY));

        const slotsSX = screen.getAllByText(dictPlayer.PLAYER_SX);
        fireEvent.click(slotsSX[0]);

        // Luigi Verdi (Right) deve essere visibile
        expect(screen.getByText(/Verdi Luigi/i)).toBeDefined();
    });

    it('dovrebbe inviare i dati corretti alla Server Action', async () => {
        render(<CreateMatchPage />);
        await screen.findByText(dictForm.CREATE_TITLE);

        selectOption(dictUi.CLUB_FILTER_NONE, /Padel Club Catania/i);

        const slotsSX = screen.getAllByText(dictPlayer.PLAYER_SX);
        const slotsDX = screen.getAllByText(dictPlayer.PLAYER_DX);

        // Compiliamo il Team A
        fireEvent.click(slotsSX[0]);
        fireEvent.click(screen.getByText(/Rossi Mario/i));

        fireEvent.click(slotsDX[0]);
        fireEvent.click(screen.getByText(/Verdi Luigi/i));

        // Invio del form
        const submitBtn = screen.getByRole('button', { name: /Crea Partita/i });
        fireEvent.click(submitBtn);

        expect(createPendingMatch).toHaveBeenCalledWith(expect.objectContaining({
            clubId: 100,
            teamALeft: 1,
            teamARight: 2,
            isFriendly: false
        }));
    });
});
