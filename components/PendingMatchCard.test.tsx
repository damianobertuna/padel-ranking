// file: components/PendingMatchCard.test.tsx
// @vitest-environment happy-dom

import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PendingMatchCard from './PendingMatchCard';
import { canUserResolveMatch } from '@/lib/matchRules';
import { Match, Player } from '@/types';

// 1. MOCK DELLE DIPENDENZE E DEI COMPONENTI FIGLI
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush })
}));

vi.mock('@/lib/matchRules', () => ({
    canUserResolveMatch: vi.fn()
}));

// Mock dei componenti figli per isolare il test
vi.mock('@/components/DeleteMatchButton', () => ({
    default: () => <button data-testid="delete-btn">Elimina</button>
}));
vi.mock('@/components/ResolveMatchButton', () => ({
    default: () => <button data-testid="resolve-btn">Risolvi</button>
}));

// 2. DATI FINTI PER I TEST (Mock Data)
const mockPlayers: Player[] = [
    { id: 1, first_name: 'Mario', last_name: 'Rossi', ranking: 4.50, preferred_side: 'Left', gender: 'M' },
    { id: 2, first_name: 'Luigi', last_name: 'Verdi', ranking: 4.25, preferred_side: 'Right', gender: 'M' },
    { id: 3, first_name: 'Paolo', last_name: 'Neri', ranking: 4.50, preferred_side: 'Left', gender: 'M' },
    { id: 4, first_name: 'Marco', last_name: 'Bianchi', ranking: 4.75, preferred_side: 'Right', gender: 'M' },
];

const openMatch: Match = {
    id: 'match-123-uuid',
    team_a_left_id: 1, // Mario c'è
    team_a_right_id: null, // Slot vuoto
    team_b_left_id: null,
    team_b_right_id: null,
    match_type: 'male',
    status: 'pending',
    created_at: new Date('2026-05-21T10:00:00Z').toISOString()
};

const completeMatch: Match = {
    ...openMatch,
    id: 'match-456-uuid',
    team_a_right_id: 2,
    team_b_left_id: 3,
    team_b_right_id: 4
};

const adminUser: Player = { ...mockPlayers[0], role: 'admin' } as any;
const normalUser: Player = { ...mockPlayers[1], role: 'user' } as any;

describe('PendingMatchCard Component', () => {

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
        // Di default, diciamo che l'utente non può risolvere il match
        (canUserResolveMatch as any).mockReturnValue(false);
    });

    it('dovrebbe renderizzare una partita APERTA con gli Slot Liberi', () => {
        render(<PendingMatchCard match={openMatch} rawPlayers={mockPlayers} currentUserPlayer={null} />);

        // Verifica la presenza del badge "Partita Aperta"
        expect(screen.getByText('Partita Aperta')).toBeDefined();

        // Verifica che il nome di Mario Rossi sia visibile (l'unico in campo)
        expect(screen.getByText('Mario Rossi')).toBeDefined();

        // Verifica la presenza degli slot liberi (ci aspettiamo 3 slot vuoti)
        const emptySlots = screen.getAllByText(/Slot Libero/i);
        expect(emptySlots.length).toBe(3);

        // Il bottone per unirsi deve essere presente
        expect(screen.getByText('Unisciti / Completa Match')).toBeDefined();
    });

    it('dovrebbe renderizzare una partita COMPLETA con il badge "Match Pronto"', () => {
        render(<PendingMatchCard match={completeMatch} rawPlayers={mockPlayers} currentUserPlayer={null} />);

        expect(screen.getByText('Match Pronto')).toBeDefined();

        // Tutti e 4 i giocatori devono essere renderizzati
        expect(screen.getByText('Mario Rossi')).toBeDefined();
        expect(screen.getByText('Luigi Verdi')).toBeDefined();
        expect(screen.getByText('Paolo Neri')).toBeDefined();
        expect(screen.getByText('Marco Bianchi')).toBeDefined();

        // Nessuno slot libero
        const emptySlots = screen.queryAllByText(/Slot Libero/i);
        expect(emptySlots.length).toBe(0);
    });

    it('dovrebbe navigare verso la pagina di join quando si clicca su "Unisciti"', () => {
        render(<PendingMatchCard match={openMatch} rawPlayers={mockPlayers} currentUserPlayer={null} />);

        const joinButton = screen.getByText('Unisciti / Completa Match');
        fireEvent.click(joinButton);

        // Verifica che il router sia stato chiamato con l'URL corretto
        expect(mockPush).toHaveBeenCalledWith(`/match/${openMatch.id}/join`);
    });

    it('dovrebbe mostrare il bottone "Sola lettura" per un match completo se l\'utente NON è in campo', () => {
        render(<PendingMatchCard match={completeMatch} rawPlayers={mockPlayers} currentUserPlayer={null} />);

        // Poiché non passiamo currentUserPlayer e canUserResolveMatch è mockato a false
        expect(screen.getByText('Sola lettura (non sei in campo)')).toBeDefined();
        expect(screen.queryByTestId('resolve-btn')).toBeNull();
    });

    it('dovrebbe mostrare i bottoni "Risolvi" e "Elimina" se il match è completo e l\'utente ha i permessi', () => {
        // Diciamo che l'utente PUÒ risolvere il match
        (canUserResolveMatch as any).mockReturnValue(true);

        render(<PendingMatchCard match={completeMatch} rawPlayers={mockPlayers} currentUserPlayer={normalUser} />);

        // Dovrebbero apparire i nostri bottoni mockati
        expect(screen.getByTestId('resolve-btn')).toBeDefined();
        expect(screen.getByTestId('delete-btn')).toBeDefined();
    });

    it('dovrebbe mostrare il bottone Elimina all\'Admin anche per i match aperti', () => {
        render(<PendingMatchCard match={openMatch} rawPlayers={mockPlayers} currentUserPlayer={adminUser} />);

        // L'admin vede sempre il tasto elimina
        expect(screen.getByTestId('delete-btn')).toBeDefined();
    });

    it('dovrebbe generare correttamente il link di WhatsApp con il testo encodato', () => {
        render(<PendingMatchCard match={openMatch} rawPlayers={mockPlayers} currentUserPlayer={null} />);

        const waLink = screen.getByText('Convoca su WhatsApp').closest('a');
        expect(waLink).toBeDefined();

        const href = waLink?.getAttribute('href') || '';
        expect(href).toContain('https://wa.me/?text=');

        // Verifichiamo che il nome "Mario Rossi" e la dicitura "Slot Libero" siano stati encodati nell'URL
        expect(href).toContain('Mario%20Rossi');
        expect(href).toContain('Slot%20Libero');
    });

});
