// @vitest-environment happy-dom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import MatchForm from './MatchForm';
import { Player, Club } from '@/types';

// Dati finti minimi per il testing
const mockPlayers = [
    { id: 1, first_name: 'Mario', last_name: 'Rossi', ranking: 4.00, preferred_side: 'Left', gender: 'M' },
    { id: 2, first_name: 'Luigi', last_name: 'Verdi', ranking: 4.10, preferred_side: 'Right', gender: 'M' },
    { id: 3, first_name: 'Pippo', last_name: 'Franco', ranking: 3.90, preferred_side: 'Both', gender: 'M' },
    { id: 4, first_name: 'Gino', last_name: 'Bramieri', ranking: 4.50, preferred_side: 'Right', gender: 'M' }, // Divario alto (>0.25)
] as Player[];

const mockClubs = [
    { id: 100, name: 'Padel Club Catania', city: 'Catania' }
] as Club[];

describe('MatchForm Component (Unificato)', () => {
    const mockOnSubmit = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    // FUNZIONE HELPER: Simula la selezione nel nostro SearchableSelect custom
    const selectOption = (placeholderText: string, optionTextRegExp: RegExp) => {
        // 1. Clicca sul trigger per aprire la tendina
        const trigger = screen.getByText(placeholderText);
        fireEvent.click(trigger);

        // 2. Clicca sull'opzione emersa nel menu dropdown
        const option = screen.getByText(optionTextRegExp);
        fireEvent.click(option);
    };

    it('dovrebbe renderizzare correttamente i campi iniziali del form', () => {
        render(<MatchForm title="Nuova Partita" submitLabel="Crea" players={mockPlayers} clubs={mockClubs} onSubmit={mockOnSubmit} />);

        expect(screen.getByText('Nuova Partita')).toBeDefined();
        expect(screen.getByText('NESSUN CIRCOLO DEFINITO')).toBeDefined();
        expect(screen.getAllByText('GIOCATORE SX').length).toBe(2);
        expect(screen.getAllByText('GIOCATORE DX').length).toBe(2);
    });

    it('dovrebbe consentire la compilazione e l\'invio dei dati del match', async () => {
        render(<MatchForm title="Nuova Partita" submitLabel="Conferma" players={mockPlayers} clubs={mockClubs} onSubmit={mockOnSubmit} />);

        // Seleziona Circolo
        selectOption('NESSUN CIRCOLO DEFINITO', /Padel Club Catania/i);

        // Compila Team A (Mario Rossi SX, Luigi Verdi DX)
        const slotsSX = screen.getAllByText('GIOCATORE SX');
        const slotsDX = screen.getAllByText('GIOCATORE DX');

        // Clicchiamo sul primo slot SX (Team A)
        fireEvent.click(slotsSX[0]);
        fireEvent.click(screen.getByText(/Rossi Mario/i));

        // Clicchiamo sul primo slot DX (Team A)
        fireEvent.click(slotsDX[0]);
        fireEvent.click(screen.getByText(/Verdi Luigi/i));

        // Invia il form
        const submitBtn = screen.getByRole('button', { name: 'Conferma' });
        fireEvent.click(submitBtn);

        expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
            clubId: 100,
            teamALeft: 1,
            teamARight: 2,
            isFriendly: false
        }));
    });

    it('dovrebbe attivare la ricerca dentro la dropdown filtrando i risultati', () => {
        render(<MatchForm title="Nuova Partita" submitLabel="Crea" players={mockPlayers} clubs={mockClubs} onSubmit={mockOnSubmit} />);

        // Apriamo la tendina del Giocatore SX del Team A
        const slotSX = screen.getAllByText('GIOCATORE SX')[0];
        fireEvent.click(slotSX);

        // Troviamo l'input di ricerca ed digitiamo "Franco"
        const searchInput = screen.getByPlaceholderText('Cerca nome...');
        fireEvent.change(searchInput, { target: { value: 'Franco' } });

        // Rossi non deve più essere visibile, Pippo Franco sì
        expect(screen.queryByText(/Rossi Mario/i)).toBeNull();
        expect(screen.getByText(/Franco Pippo/i)).toBeDefined();
    });

    it('dovrebbe mostrare l\'errore del divario tecnico se si supera lo 0.25 in modalità Classificata', () => {
        render(<MatchForm title="Nuova Partita" submitLabel="Crea" players={mockPlayers} clubs={mockClubs} onSubmit={mockOnSubmit} />);

        const slotsSX = screen.getAllByText('GIOCATORE SX');
        const slotsDX = screen.getAllByText('GIOCATORE DX');

        // Inseriamo Mario Rossi (4.00) e Gino Bramieri (4.50) -> Delta 0.50
        fireEvent.click(slotsSX[0]);
        fireEvent.click(screen.getByText(/Rossi Mario/i));

        fireEvent.click(slotsDX[0]);
        fireEvent.click(screen.getByText(/Bramieri Gino/i));

        // Deve comparire l'alert bloccante dell'ateneo
        expect(screen.getByText(/ERRORE: DIVARIO TECNICO > 0.25/i)).toBeDefined();
        expect(screen.getByRole('button', { name: 'Crea' }).hasAttribute('disabled')).toBe(true);
    });

        it('NON dovrebbe bloccare il form per divario tecnico se impostato su AMICHEVOLE', () => {
        render(<MatchForm title="Nuova Partita" submitLabel="Crea" players={mockPlayers} clubs={mockClubs} onSubmit={mockOnSubmit} />);

        // Attiviamo la modalità Amichevole
        const btnAmichevole = screen.getByText('🤝 Amichevole');
        fireEvent.click(btnAmichevole);

        const slotsSX = screen.getAllByText('GIOCATORE SX');
        const slotsDX = screen.getAllByText('GIOCATORE DX');

        // Reinseriamo gli stessi giocatori con divario alto
        fireEvent.click(slotsSX[0]);
        fireEvent.click(screen.getByText(/Rossi Mario/i));

        fireEvent.click(slotsDX[0]);
        fireEvent.click(screen.getByText(/Bramieri Gino/i));

        // L'errore non deve apparire e il bottone deve rimanere abilitato
        expect(screen.queryByText(/ERRORE: DIVARIO TECNICO > 0.25/i)).toBeNull();
        expect(screen.getByRole('button', { name: 'Crea' }).hasAttribute('disabled')).toBe(false);
    });

    it('in modalità AMICHEVOLE, dovrebbe mostrare un giocatore SX anche nel dropdown DX', () => {
        render(<MatchForm title="Nuova Partita" submitLabel="Crea" players={mockPlayers} clubs={mockClubs} onSubmit={mockOnSubmit} />);

        // Attiviamo amichevole
        fireEvent.click(screen.getByText('🤝 Amichevole'));

        // Apriamo il dropdown DX del Team A
        const slotsDX = screen.getAllByText('GIOCATORE DX');
        fireEvent.click(slotsDX[0]);

        // Mario Rossi (Left) deve apparire nel menu DX
        expect(screen.getByText(/Rossi Mario/i)).toBeDefined();
    });

    it('in modalità AMICHEVOLE, dovrebbe mostrare un giocatore DX anche nel dropdown SX', () => {
        render(<MatchForm title="Nuova Partita" submitLabel="Crea" players={mockPlayers} clubs={mockClubs} onSubmit={mockOnSubmit} />);

        // Attiviamo amichevole
        fireEvent.click(screen.getByText('🤝 Amichevole'));

        // Apriamo il dropdown SX del Team A
        const slotsSX = screen.getAllByText('GIOCATORE SX');
        fireEvent.click(slotsSX[0]);

        // Luigi Verdi (Right) deve apparire nel menu SX
        expect(screen.getByText(/Verdi Luigi/i)).toBeDefined();
    });

    it('in modalità CLASSIFICATA, dovrebbe nascondere un giocatore SX dal dropdown DX', () => {
        render(<MatchForm title="Nuova Partita" submitLabel="Crea" players={mockPlayers} clubs={mockClubs} onSubmit={mockOnSubmit} />);

        // Modalità classificata è il default
        const slotsDX = screen.getAllByText('GIOCATORE DX');
        fireEvent.click(slotsDX[0]);

        // Mario Rossi (Left) NON deve apparire nel menu DX
        expect(screen.queryByText(/Rossi Mario/i)).toBeNull();
    });

        it('in modalità CLASSIFICATA, dovrebbe nascondere un giocatore DX dal dropdown SX', () => {
        render(<MatchForm title="Nuova Partita" submitLabel="Crea" players={mockPlayers} clubs={mockClubs} onSubmit={mockOnSubmit} />);

        // Modalità classificata è il default
        const slotsSX = screen.getAllByText('GIOCATORE SX');
        fireEvent.click(slotsSX[0]);

        // Luigi Verdi (Right) NON deve apparire nel menu SX
        expect(screen.queryByText(/Verdi Luigi/i)).toBeNull();
    });

    it('in modalità CLASSIFICATA, un giocatore MIX (Both) dovrebbe apparire sia nel dropdown SX che DX', () => {
        render(<MatchForm title="Nuova Partita" submitLabel="Crea" players={mockPlayers} clubs={mockClubs} onSubmit={mockOnSubmit} />);

        // Apri SX dropdown: Both deve essere visibile
        const slotsSX = screen.getAllByText('GIOCATORE SX');
        fireEvent.click(slotsSX[0]);
        expect(screen.getByText(/Franco Pippo/i)).toBeDefined();

        // Chiudi e apri DX dropdown: Both deve essere visibile
        fireEvent.click(slotsSX[0]); // chiude
        const slotsDX = screen.getAllByText('GIOCATORE DX');
        fireEvent.click(slotsDX[0]);
        expect(screen.getByText(/Franco Pippo/i)).toBeDefined();
    });

    it('in modalità CLASSIFICATA, un giocatore DX (Right) dovrebbe apparire nel dropdown SX se il partner è MIX (Both)', () => {
        render(<MatchForm title="Nuova Partita" submitLabel="Crea" players={mockPlayers} clubs={mockClubs} onSubmit={mockOnSubmit} />);

        const slotsSX = screen.getAllByText('GIOCATORE SX');

        // Prima selezioniamo Pippo Franco (Both) nel DX dello stesso team
        const slotsDX = screen.getAllByText('GIOCATORE DX');
        fireEvent.click(slotsDX[0]);
        fireEvent.click(screen.getByText(/Franco Pippo/i));

        // Ora apriamo SX dello stesso team: Luigi Verdi (Right) deve apparire perché il partner è Both
        fireEvent.click(slotsSX[0]);
        expect(screen.getByText(/Verdi Luigi/i)).toBeDefined();
    });

    it('in modalità CLASSIFICATA, un giocatore SX (Left) dovrebbe apparire nel dropdown DX se il partner è MIX (Both)', () => {
        render(<MatchForm title="Nuova Partita" submitLabel="Crea" players={mockPlayers} clubs={mockClubs} onSubmit={mockOnSubmit} />);

        const slotsSX = screen.getAllByText('GIOCATORE SX');
        const slotsDX = screen.getAllByText('GIOCATORE DX');

        // Prima selezioniamo Pippo Franco (Both) nel SX dello stesso team
        fireEvent.click(slotsSX[0]);
        fireEvent.click(screen.getByText(/Franco Pippo/i));

        // Ora apriamo DX dello stesso team: Mario Rossi (Left) deve apparire perché il partner è Both
        fireEvent.click(slotsDX[0]);
        expect(screen.getByText(/Rossi Mario/i)).toBeDefined();
    });
});
