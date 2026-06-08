// @vitest-environment happy-dom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PendingMatchCard from './PendingMatchCard';
import { Match, Player, Club } from '@/types';
import * as matchRules from '@/lib/matchRules';
import { leaveMatchAction, joinMatchAction } from '@/actions/match-actions';

// 1. MOCK DELLE DIPENDENZE E NAVIGAZIONE
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush })
}));

vi.mock('@/lib/matchRules', () => ({
    canUserResolveMatch: vi.fn()
}));

// Mock delle nuove Server Action
vi.mock('@/actions/match-actions', () => ({
    leaveMatchAction: vi.fn(),
    joinMatchAction: vi.fn()
}));

vi.mock('@/components/DeleteMatchButton', () => ({
    default: () => <button data-testid="delete-btn">Elimina</button>
}));
vi.mock('@/components/ResolveMatchButton', () => ({
    default: () => <button data-testid="resolve-btn">Risolvi</button>
}));

// 2. DATI DI TEST FINTI E UTENTI MOCK
const baseUser = { id: 10, user_id: 'user-123', first_name: 'Base', last_name: 'User', role: 'user', preferred_side: 'Both', ranking: 3.0 } as Player;
const adminUser = { id: 99, user_id: 'admin-123', first_name: 'Admin', last_name: 'Super', role: 'admin', preferred_side: 'Both', ranking: 4.0 } as Player;
const organizerUser = { id: 1, user_id: 'mario-123', first_name: 'Mario', last_name: 'Rossi', role: 'user', preferred_side: 'Both', ranking: 4.0 } as Player;
const leftSideUser = { id: 11, user_id: 'lefty', first_name: 'Left', last_name: 'Player', role: 'user', preferred_side: 'Left', ranking: 3.5 } as Player;

const mockPlayers = [
    organizerUser,
    { id: 2, first_name: 'Luigi', last_name: 'Verdi', ranking: 3.5 },
    { id: 3, first_name: 'Pippo', last_name: 'Franco', ranking: 3.0 },
    { id: 4, first_name: 'Gino', last_name: 'Bramieri', ranking: 4.5 },
    baseUser,
    adminUser,
    leftSideUser
] as Player[];

const mockClubs = [
    { id: 100, name: 'Padel Club Catania', city: 'Catania' }
] as Club[];

// FIX: DATE DINAMICHE PER PREVENIRE IL FALLIMENTO NEL TEMPO
const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(); // Tra 7 giorni
const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString();   // 7 giorni fa

const openMatch = {
    id: 'match-123',
    status: 'pending',
    created_at: new Date().toISOString(),
    match_date: futureDate, // Impostiamo SEMPRE nel futuro per i test standard
    team_a_left_id: 1,
    team_a_right_id: null,
    team_b_left_id: null,
    team_b_right_id: null,
    club_id: 100,
    organizer_id: 1,
    is_friendly: false
} as Match;

const completeMatch = {
    ...openMatch,
    team_a_right_id: 2,
    team_b_left_id: 3,
    team_b_right_id: 4
} as Match;

describe('PendingMatchCard Component', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('dovrebbe renderizzare una partita APERTA con i relativi indicatori', () => {
        render(<PendingMatchCard match={openMatch} rawPlayers={mockPlayers} currentUserPlayer={null} />);
        expect(screen.getByText(/OPEN MATCH/i)).toBeDefined();
        const slotsLiberi = screen.getAllByText(/SLOT LIBERO/i);
        expect(slotsLiberi.length).toBe(3);
    });

    it('dovrebbe mostrare il badge ORG all\'organizzatore', () => {
        render(<PendingMatchCard match={openMatch} rawPlayers={mockPlayers} currentUserPlayer={baseUser} />);
        expect(screen.getByText(/ORG/i)).toBeDefined();
        expect(screen.getByText(/👑/i)).toBeDefined();
    });

    it('non dovrebbe mostrare i bottoni di azione se l\'utente NON è loggato', () => {
        render(<PendingMatchCard match={openMatch} rawPlayers={mockPlayers} currentUserPlayer={null} />);
        expect(screen.queryByText(/Condividi convocazione/i)).toBeNull();
        expect(screen.queryByRole('button', { name: /Unisciti \/ Invita/i })).toBeNull();
    });

    // --- NUOVI TEST ARCHITETTURALI ---

    it('dovrebbe navigare a /join quando l\'organizzatore o admin clicca su MODIFICA MATCH', () => {
        render(<PendingMatchCard match={openMatch} rawPlayers={mockPlayers} currentUserPlayer={organizerUser} />);
        const actionBtn = screen.getByRole('button', { name: /MODIFICA MATCH/i });
        fireEvent.click(actionBtn);

        expect(screen.getByText('ATTENDI...')).toBeDefined();
        expect(mockPush).toHaveBeenCalledWith('/match/match-123/join');
    });

    it('dovrebbe innescare joinMatchAction (Serverless) se utente standard clicca UNISCITI ORA', () => {
        render(<PendingMatchCard match={openMatch} rawPlayers={mockPlayers} currentUserPlayer={baseUser} />);
        const actionBtn = screen.getByRole('button', { name: /UNISCITI ORA/i });
        fireEvent.click(actionBtn);

        expect(joinMatchAction).toHaveBeenCalledWith('match-123');
        expect(mockPush).not.toHaveBeenCalled(); // Assicura che NON navighi!
    });

    it('dovrebbe innescare leaveMatchAction (Serverless) se utente interno clicca LASCIA PARTITA', () => {
        const matchWithUser = { ...openMatch, team_b_right_id: 10 } as Match; // Inseriamo baseUser
        render(<PendingMatchCard match={matchWithUser} rawPlayers={mockPlayers} currentUserPlayer={baseUser} />);

        const actionBtn = screen.getByRole('button', { name: /LASCIA PARTITA/i });
        fireEvent.click(actionBtn);

        expect(leaveMatchAction).toHaveBeenCalledWith('match-123');
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('dovrebbe mostrare LATO INCOMPATIBILE disabilitato se non ci sono slot adatti per il giocatore', () => {
        // Creiamo un match dove gli unici posti liberi sono a DESTRA (Right)
        const onlyRightFreeMatch = {
            ...openMatch,
            team_a_left_id: 1, // Occupato
            team_b_left_id: 2, // Occupato
            team_a_right_id: null, // Libero
            team_b_right_id: null  // Libero
        } as Match;

        // Passiamo leftSideUser, che gioca SOLO a Sinistra (Left)
        render(<PendingMatchCard match={onlyRightFreeMatch} rawPlayers={mockPlayers} currentUserPlayer={leftSideUser} />);

        const actionBtn = screen.getByRole('button', { name: /LATO INCOMPATIBILE/i });
        expect(actionBtn).toBeDefined();

        // Verifica che il bottone sia bloccato fisicamente e graficamente
        expect(actionBtn.hasAttribute('disabled')).toBe(true);
        expect(actionBtn.className).toContain('cursor-not-allowed');
    });

    // ---------------------------------

    it('dovrebbe mostrare VEDI DETTAGLI per un match completo se non ci sono permessi di risoluzione', () => {
        vi.spyOn(matchRules, 'canUserResolveMatch').mockReturnValue(false);
        render(<PendingMatchCard match={completeMatch} rawPlayers={mockPlayers} currentUserPlayer={baseUser} />);
        expect(screen.getByText('VEDI DETTAGLI')).toBeDefined();
    });

    it('dovrebbe mostrare i bottoni "Risolvi" e "Elimina" all\'Admin', () => {
        vi.spyOn(matchRules, 'canUserResolveMatch').mockReturnValue(true);
        render(<PendingMatchCard match={completeMatch} rawPlayers={mockPlayers} currentUserPlayer={adminUser} />);
        expect(screen.getByTestId('resolve-btn')).toBeDefined();
        expect(screen.getByTestId('delete-btn')).toBeDefined();
    });
});

describe('Controllo Autorizzazioni: Tasto Gestisci Incontro', () => {
    // Array fittizio minimo
    const mockRawPlayers = [
        { id: 99, ranking: 4.50, first_name: 'Admin', last_name: 'User', preferred_side: 'Both' },
        { id: 1, ranking: 4.00, first_name: 'Mario', last_name: 'Rossi', preferred_side: 'Left' },
        { id: 2, ranking: 4.10, first_name: 'Luigi', last_name: 'Verdi', preferred_side: 'Right' },
        { id: 3, ranking: 3.80, first_name: 'Peach', last_name: 'Pink', preferred_side: 'Left' },
        { id: 4, ranking: 3.90, first_name: 'Daisy', last_name: 'Yellow', preferred_side: 'Right' },
        { id: 5, ranking: 4.20, first_name: 'Toad', last_name: 'Mushroom', preferred_side: 'Both' }
    ] as any;

    it('dovrebbe mostrare il tasto se l\'utente è ADMIN (anche se non gioca)', () => {
        const adminPlayer = { id: 99, role: 'admin' } as any;
        const match = { id: 'm1', team_a_left_id: 1, team_a_right_id: 2, match_date: futureDate } as any;

        const { getByText, unmount } = render(<PendingMatchCard match={match} currentUserPlayer={adminPlayer} rawPlayers={mockRawPlayers} />);
        expect(getByText(/Gestisci Incontro|Modifica Match/i)).toBeDefined();
        unmount();
    });

    it('dovrebbe mostrare il tasto se l\'utente è USER ed è tra i giocatori in campo', () => {
        const playingUser = { id: 1, role: 'user' } as any;
        const match = { id: 'm2', team_a_left_id: 1, team_a_right_id: 2, match_date: futureDate } as any;

        const { getByText, unmount } = render(<PendingMatchCard match={match} currentUserPlayer={playingUser} rawPlayers={mockRawPlayers} />);
        expect(getByText(/Gestisci Incontro|Modifica Match/i)).toBeDefined();
        unmount();
    });

    it('NON dovrebbe mostrare il tasto se l\'utente è USER e NON è tra i giocatori', () => {
        const externalUser = { id: 5, role: 'user' } as any;
        const match = { id: 'm3', team_a_left_id: 1, team_a_right_id: 2, team_b_left_id: 3, team_b_right_id: 4, match_date: futureDate } as any;

        const { queryByText, unmount } = render(<PendingMatchCard match={match} currentUserPlayer={externalUser} rawPlayers={mockRawPlayers} />);
        expect(queryByText(/Gestisci Incontro|Modifica Match/i)).toBeNull();
        unmount();
    });
});

describe('Logica Match Scaduti', () => {
    // Array fittizio minimo
    const mockRawPlayers = [
        { id: 99, ranking: 4.50, first_name: 'Admin', last_name: 'User', preferred_side: 'Both' },
        { id: 10, ranking: 3.00, first_name: 'Base', last_name: 'User', preferred_side: 'Both' }
    ] as any;

    it('NON dovrebbe mostrare i bottoni d\'azione se il match è scaduto per un utente standard', () => {
        const expiredMatch = { ...openMatch, match_date: pastDate };

        render(<PendingMatchCard match={expiredMatch} rawPlayers={mockRawPlayers} currentUserPlayer={baseUser} />);

        // Cerca un tasto generico di azione (Unisciti, Lascia, Modifica, Dettagli)
        const actionBtn = screen.queryByRole('button', { name: /UNISCITI ORA|LASCIA PARTITA|MODIFICA MATCH|VEDI DETTAGLI/i });
        expect(actionBtn).toBeNull(); // Deve essere rimosso per l'utente normale
    });

    it('dovrebbe CONTINUARE a mostrare il bottone MODIFICA MATCH se l\'utente è ADMIN, anche per match scaduti', () => {
        const expiredMatch = { ...openMatch, match_date: pastDate };

        render(<PendingMatchCard match={expiredMatch} rawPlayers={mockRawPlayers} currentUserPlayer={adminUser} />);

        // L'admin scavalca le regole temporali e mantiene l'accesso al match
        const actionBtn = screen.getByRole('button', { name: /MODIFICA MATCH/i });
        expect(actionBtn).toBeDefined();
    });
});
