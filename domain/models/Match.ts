// domain/models/Match.ts

/**
 * Pure representation of the Player interface in the domain
 */
export interface Player {
    id: string;
    name: string;
    ranking: number;
    preferred_side: 'SX' | 'DX' | 'Both';
    role?: 'user' | 'admin';
}

/**
 * Pure representation of the Match interface in the domain
 */
export interface Match {
    id?: string;
    created_at?: string;
    creator_id: string;
    player_a1: string;
    player_a2: string;
    player_b1: string;
    player_b2: string;
    status: 'pending' | 'resolved';
    // Optional relational data loaded via joins
    player_a1_data?: Player;
    player_a2_data?: Player;
    player_b1_data?: Player;
    player_b2_data?: Player;
}

/**
 * Structure for the domain validation response
 */
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

/**
 * MatchDomain Entity
 * Encapsulates core business rules and validations for RanKING Padel.
 */
export class MatchDomain {
    // Official rule: max allowed gap between team ranking averages
    private static readonly MAX_RANKING_GAP = 0.25;

    /**
     * Validates if a 4-player lineup complies with the tournament regulations.
     * Centralizes the validation logic previously scattered across multiple components.
     */
    public static validateLineup(
        a1: Player | null,
        a2: Player | null,
        b1: Player | null,
        b2: Player | null
    ): ValidationResult {
        const errors: string[] = [];

        // 1. Ensure all 4 players are selected
        if (!a1 || !a2 || !b1 || !b2) {
            return {
                isValid: false,
                errors: ['Tutti e 4 i giocatori devono essere selezionati per validare il match.']
            };
        }

        // 2. Prevent duplicate players (Clone check)
        const playerIds = [a1.id, a2.id, b1.id, b2.id];
        const uniquePlayerIds = new Set(playerIds);
        if (uniquePlayerIds.size !== 4) {
            errors.push('Ci sono giocatori duplicati nella formazione. Scegli 4 giocatori diversi.');
        }

        // 3. Calculate team ranking averages
        const avgTeamA = (a1.ranking + a2.ranking) / 2;
        const avgTeamB = (b1.ranking + b2.ranking) / 2;
        const gap = Math.abs(avgTeamA - avgTeamB);

        // 4. Validate the ranking gap constraint (0.25 rule)
        // Using a tiny epsilon to prevent JS floating-point precision issues
        if (gap > this.MAX_RANKING_GAP + 0.0001) {
            errors.push(
                `Il match è sbilanciato! Il gap tra le medie è di ${gap.toFixed(2)} (Max consentito: ${this.MAX_RANKING_GAP}).`
            );
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Analyzes tactical positioning based on players' preferred sides.
     * Returns non-blocking localized warning strings for the UI.
     */
    public static checkTacticalSides(
        p1: Player | null,
        p2: Player | null,
        teamLabel: string
    ): string[] {
        const warnings: string[] = [];
        if (!p1 || !p2) return warnings;

        // Both players conflict on the Left side
        if (p1.preferred_side === 'SX' && p2.preferred_side === 'SX') {
            warnings.push(`Nella ${teamLabel}, entrambi i giocatori preferiscono il lato Sinistro (SX).`);
        }
        // Both players conflict on the Right side
        if (p1.preferred_side === 'DX' && p2.preferred_side === 'DX') {
            warnings.push(`Nella ${teamLabel}, entrambi i giocatori preferiscono il lato Destro (DX).`);
        }

        return warnings;
    }
}
