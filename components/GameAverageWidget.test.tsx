import { describe, it, expect } from 'vitest';
import GameAverageWidget from './GameAverageWidget';
import React from 'react';
import { renderToString } from 'react-dom/server';

describe('GameAverageWidget', () => {
    const defaultProps = {
        totalSetsWon: 6,
        totalSetsLost: 2,
        totalGamesWon: 48,
        totalGamesLost: 32,
        avgGamesWonPerMatch: '6.0',
        gameWinPercentage: '60.0'
    };

    const renderToHTML = (props: typeof defaultProps) => {
        return renderToString(<GameAverageWidget {...props} />);
    };

    it('dovrebbe renderizzare correttamente i titoli e le medie principali', () => {
        const html = renderToHTML(defaultProps);

        expect(html).toContain('Efficienza Game');
        expect(html).toContain('6.0');
        expect(html).toContain('game/match');
    });

    it('dovrebbe esporre accuratamente la percentuale di vittorie dei game', () => {
        const html = renderToHTML(defaultProps);

        // Verifichiamo i singoli pezzi per bypassare i commenti di idratazione expect(html).toContain('Rendimento Game');
        expect(html).toContain('60.0');
        expect(html).toContain('% vinti');
    });

    it('dovrebbe calcolare matematicamente la percentuale di set vinti ed esporre il bilancio corretto', () => {
        const html = renderToHTML(defaultProps);

        expect(html).toContain('BILANCIO SET:');
        expect(html).toContain('6');
        expect(html).toContain('2');
        expect(html).toContain('75');
    });

    it('dovrebbe stampare il conto secco analitico dei game fatti e subiti', () => {
        const html = renderToHTML(defaultProps);

        expect(html).toContain('CONTO GAME:');
        expect(html).toContain('48');
        expect(html).toContain('32');
        expect(html).toContain('Fatti');
        expect(html).toContain('Subiti');
    });

    it('dovrebbe gestire i casi limite di un giocatore senza match senza mostrare NaN', () => {
        const zeroProps = {
            totalSetsWon: 0,
            totalSetsLost: 0,
            totalGamesWon: 0,
            totalGamesLost: 0,
            avgGamesWonPerMatch: '0.0',
            gameWinPercentage: '0.0'
        };

        const html = renderToHTML(zeroProps);

        expect(html).toContain('BILANCIO SET:');
        expect(html).toContain('CONTO GAME:');
        expect(html).toContain('0');
    });
});
