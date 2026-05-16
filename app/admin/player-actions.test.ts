import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updatePlayerByAdmin } from './player-actions';
import { createClient } from '@/lib/supabase/server';

// 1. Facciamo il mock dei moduli esterni
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

describe('updatePlayerByAdmin Server Action', () => {
    let mockSupabase: any;

    beforeEach(() => {
        vi.clearAllMocks();

        // Configura un mock di base per Supabase
        mockSupabase = {
            auth: {
                getUser: vi.fn(),
            },
            from: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn(),
            update: vi.fn().mockReturnThis(),
            insert: vi.fn(),
        };

        (createClient as any).mockResolvedValue(mockSupabase);
    });

    it('dovrebbe bloccare l azione se l utente non è un admin', async () => {
        // Simuliamo un utente loggato che però è un utente semplice ('user')
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
        mockSupabase.single.mockResolvedValue({ data: { role: 'user' } }); // Ruolo NON admin

        const formData = new FormData();
        formData.append('playerId', '10');

        // Ci aspettiamo che l'azione sollevi un errore di autorizzazione
        await expect(updatePlayerByAdmin(formData)).rejects.toThrow('Azione non autorizzata');
    });

    it('dovrebbe aggiornare il giocatore e scrivere il log se l utente è admin', async () => {
        // 1. Simuliamo l'utente loggato come ADMIN
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'admin-123' } } });

        // Primo traguardo: il controllo del ruolo dell'admin
        // Secondo traguardo: il recupero dei vecchi dati del giocatore
        mockSupabase.single
            .mockResolvedValueOnce({ data: { first_name: 'Fabio', last_name: 'Lombardo', role: 'admin' } }) // Ruolo admin
            .mockResolvedValueOnce({ data: { id: 10, first_name: 'Mario', last_name: 'Rossi', ranking: 4.50, preferred_side: 'Left', dominant_hand: 'Destro', role: 'user' } }); // Vecchio giocatore

        // Mock della risposta di Update e Insert (nessun errore)
        mockSupabase.update.mockReturnThis();
        mockSupabase.insert.mockResolvedValue({ error: null });

        // 2. Prepariamo i dati modificati nel form
        const formData = new FormData();
        formData.append('playerId', '10');
        formData.append('firstName', 'Mario Modificato');
        formData.append('lastName', 'Rossi');
        formData.append('ranking', '4.75');
        formData.append('preferredSide', 'Right');
        formData.append('dominantHand', 'Mancino');
        formData.append('role', 'user');

        // 3. Eseguiamo l'azione
        await expect(updatePlayerByAdmin(formData)).resolves.not.toThrow();

        // 4. Verifichiamo che i dati siano stati aggiornati con i valori corretti
        expect(mockSupabase.update).toHaveBeenCalledWith({
            first_name: 'Mario Modificato',
            last_name: 'Rossi',
            preferred_side: 'Right',
            dominant_hand: 'Mancino',
            ranking: 4.75,
            role: 'user',
        });

        // 5. Verifichiamo che il registro delle attività (Audit Log) sia stato scritto
        expect(mockSupabase.insert).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    admin_id: 'admin-123',
                    action_type: 'UPDATE_PLAYER',
                    target_player_id: 10,
                }),
            ])
        );
    });
});
