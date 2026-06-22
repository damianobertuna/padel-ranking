export type PlayerRole = 'user' | 'admin' | 'club_manager';

export interface Player {
    id: number;
    created_at: string;
    first_name: string | null;
    last_name: string | null;
    preferred_side: 'Left' | 'Right' | 'Both';
    ranking: number;
    absence_days: number | null;
    role: PlayerRole;
    user_id: string | null;
    dominant_hand: string | null;
    phone: string | null;
    gender: 'M' | 'F' | null;
    avatar_url: string | null;
}

export interface Match {
    id: string;
    team_a_left_id: number | null;
    team_a_right_id: number | null;
    team_b_left_id: number | null;
    team_b_right_id: number | null;
    status: 'pending' | 'completed';
    match_type: 'male' | 'female' | 'mixed';
    created_at: string;
    match_date?: string | null;
    club_id?: number | null;
    team_a_delta?: number | null;
    team_b_delta?: number | null;
    organizer_id: number | null;
    is_friendly: boolean;
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
    playerTitles?: Record<number, { type: 'KING' | 'FANALINO', label: string }>;
}

export interface Club {
    id: number;
    name: string;
    address?: string | null;
    city?: string | null;
    maps_url?: string | null;
    created_at?: string;
}
