// @vitest-environment happy-dom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PendingMatchCard from './PendingMatchCard';
import { Match, Player, Club } from '@/types';
import * as matchRules from '@/lib/matchRules';

// 1. MOCK DELLE DIPENDENZE E NAVIGAZIONE
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush })
}));

vi.mock('@/lib/matchRules', () => ({
    canUserResolveMatch: vi.fn()
}));

vi.mock('@/components/DeleteMatchButton', () => ({
    default: () => <button data-testid="delete-btn">Elimina</button>
}));
vi.mock('@/components/ResolveMatchButton', () => ({
    default: () => <button data-testid="resolve-btn">Risolvi</button>
}));

// 2. DATI DI TEST FINTI
const mockPlayers = [
    { id: 1, first_name: 'Mario', last_name: 'Rossi', ranking: 4.0 },
    { id: 2, first_name: 'Luigi', last_name: 'Verdi', ranking: 3.5 },
    { id: 3, first_name: 'Pippo', last_name: 'Franco', ranking: 3.0 },
    { id: 4, first_name: 'Gino', last_name: 'Bramieri', ranking: 4.5 },
] as Player[];

const mockClubs = [
    { id: 100, name: 'Padel Club Catania', city: 'Catania' }
] as Club[];

const openMatch = {
    id: 'match-123',
    status: 'pending',
    created_at: '2026-05-23T18:00:00Z',
    match_date: '2026-05-25T18:00:00Z', // Aggiunto per far comparire il calendario
    team_a_left_id: 1,
    team_a_right_id: null,
    team_b_left_id: null,
    team_b_right_id: null,
    club_id: 100
} as Match;

const completeMatch = {
    ...openMatch,
    team_a_right_id: 2,
    team_b_left_id: 3,
    team_b_right_id: 4
} as Match;

describe('PendingMatchCard Component', () => {

    // Pulizia fondamentale per evitare i cloni nel DOM
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('dovrebbe renderizzare una partita APERTA con i relativi indicatori', () => {
        render(<PendingMatchCard match={openMatch} rawPlayers={mockPlayers} currentUserPlayer={null} />);

        expect(screen.getByText('Aperto')).toBeDefined();

        // Siccome ci sono DUE slot "DX" vuoti (Team A e Team B), usiamo getAllByText
        const emptyDxSlots = screen.getAllByText('➕ DX');
        expect(emptyDxSlots.length).toBe(2);
    });

    it('dovrebbe renderizzare una partita COMPLETA con il badge "Match Pronto"', () => {
        render(<PendingMatchCard match={completeMatch} rawPlayers={mockPlayers} currentUserPlayer={null} />);
        expect(screen.getByText('Match Pronto')).toBeDefined();
    });

    it('dovrebbe mostrare Data e Club correttamente', () => {
        render(<PendingMatchCard match={openMatch} rawPlayers={mockPlayers} currentUserPlayer={null} clubs={mockClubs} />);
        expect(screen.getByText(/Padel Club Catania/i)).toBeDefined();
        expect(screen.getByText(/📅/i)).toBeDefined();
    });

    it('dovrebbe navigare verso la pagina di join quando si clicca su Unisciti/Gestisci', () => {
        render(<PendingMatchCard match={openMatch} rawPlayers={mockPlayers} currentUserPlayer={null} />);
        const actionBtn = screen.getByRole('button', { name: /Unisciti \/ Invita/i });
        fireEvent.click(actionBtn);

        expect(screen.getByText('Caricamento...')).toBeDefined();
        expect(mockPush).toHaveBeenCalledWith('/match/match-123/join');
    });

    it('dovrebbe mostrare "Gestisci / Modifica" per un match completo se non ci sono permessi di risoluzione', () => {
        vi.spyOn(matchRules, 'canUserResolveMatch').mockReturnValue(false);
        render(<PendingMatchCard match={completeMatch} rawPlayers={mockPlayers} currentUserPlayer={null} />);

        expect(screen.getByText('Gestisci / Modifica')).toBeDefined();
        expect(screen.queryByTestId('resolve-btn')).toBeNull();
    });

    it('dovrebbe mostrare i bottoni "Risolvi" e "Elimina" se il match è completo e l\'utente ha i permessi', () => {
        vi.spyOn(matchRules, 'canUserResolveMatch').mockReturnValue(true);
        const adminUser = { id: 1, user_id: 'abc', role: 'admin' };

        render(<PendingMatchCard match={completeMatch} rawPlayers={mockPlayers} currentUserPlayer={adminUser as any} />);

        expect(screen.getByTestId('resolve-btn')).toBeDefined();
        expect(screen.getByTestId('delete-btn')).toBeDefined();
    });

    it('dovrebbe mostrare il bottone Elimina all\'Admin anche per i match aperti', () => {
        const adminUser = { id: 99, user_id: 'admin', role: 'admin' };
        render(<PendingMatchCard match={openMatch} rawPlayers={mockPlayers} currentUserPlayer={adminUser as any} />);

        expect(screen.getByTestId('delete-btn')).toBeDefined();
        expect(screen.queryByTestId('resolve-btn')).toBeNull();
    });

    it('dovrebbe generare correttamente il link di WhatsApp con il testo aggiornato', () => {
        render(<PendingMatchCard match={openMatch} rawPlayers={mockPlayers} currentUserPlayer={null} />);

        const waLink = screen.getByText(/Condividi su WhatsApp/i).closest('a');
        expect(waLink).toBeDefined();

        const href = waLink?.getAttribute('href');
        expect(href).toContain('https://wa.me/?text=');
        expect(href).toContain('Mario');
    });
});
