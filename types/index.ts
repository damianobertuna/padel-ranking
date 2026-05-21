export interface Player {
    id: number;
    first_name: string;
    last_name: string;
    ranking: number;
    preferred_side: string;
    gender: 'M' | 'F';
    total_played?: number;
    win_rate?: number;
}

export interface Match {
    id: string;
    team_a_left_id: number | null;
    team_a_right_id: number | null;
    team_b_left_id: number | null;
    team_b_right_id: number | null;
    status: string;
    match_type: 'male' | 'female' | 'mixed';
    created_at: string;
}

export interface MatchWithResult {
    id: string;
    team_a_left_id: number;
    team_a_right_id: number;
    team_b_left_id: number;
    team_b_right_id: number;
    userWon: boolean;
}

export interface PendingMatchCardProps {
    match: Match;
    rawPlayers: Player[];
    currentUserPlayer: { id: number; role: string } | null;
}
