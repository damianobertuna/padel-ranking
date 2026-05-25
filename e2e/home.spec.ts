import { test, expect } from '@playwright/test';

test.describe('Home Page & Navigazione', () => {

    test('Dovrebbe caricare la home e mostrare il titolo principale', async ({ page }) => {
        // 1. Visita la pagina iniziale
        await page.goto('/');

        // 2. Verifica che il titolo H1 sia caricato
        const title = page.locator('h1');
        await expect(title).toContainText('RanKING Padel');
    });

    test('Dovrebbe navigare sul tab In Programma e mostrare lo stato vuoto', async ({ page }) => {
        await page.goto('/');

        // 1. Clicca sul tab "In Programma"
        // Usiamo getByRole per un approccio più accessibile e robusto
        const pendingTab = page.getByRole('link', { name: /🗓️ In Programma/i });
        await pendingTab.click();

        // 2. Verifica che l'URL si sia aggiornato correttamente col parametro tab
        await expect(page).toHaveURL(/tab=pending/);

        // 3. Poiché il DB locale non ha dati, dobbiamo vedere il messaggio di fallback
        const emptyStateMessage = page.getByText('Non ci sono partite in programma al momento.');
        await expect(emptyStateMessage).toBeVisible();
    });

    test('Dovrebbe mostrare le partite pending nel tab In Programma', async ({ page }) => {
        await page.goto('/');

        // Clicca sul tab "In Programma"
        await page.getByRole('link', { name: /🗓️ In Programma/i }).click();

        // Invece dello stato vuoto, ora ci aspettiamo di vedere la card del match
        // Cerchiamo il nome del club che abbiamo inserito nel seed
        await expect(page.getByText('Padel Club Catania')).toBeVisible();

        // Verifichiamo che i nomi dei giocatori del seed siano sulla card
        await expect(page.getByText('Mario Rossi')).toBeVisible();
        await expect(page.getByText('Luigi Verdi')).toBeVisible();

        // Verifichiamo che ci sia il bottone per unirsi
        const joinBtn = page.getByRole('button', { name: 'Unisciti / Invita' });
        await expect(joinBtn).toBeVisible();
    });
});
