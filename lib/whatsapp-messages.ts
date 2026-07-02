// ============================================================================
// WHATSAPP MESSAGE BUILDER — Pure functions for WhatsApp message generation
// Used both server-side (match-actions.ts) and client-side (PendingMatchCard.tsx)
// ============================================================================

export interface PlayerBrief {
    id: number;
    first_name: string | null;
    last_name: string | null;
    ranking: number;
    preferred_side?: string | null;
}

export interface ClubBrief {
    name: string | null;
    city?: string | null;
}

export interface MatchBrief {
    id: string;
    match_date?: string | null;
    created_at?: string;
    court_type?: 'indoor' | 'outdoor' | null;
    is_friendly: boolean;
    team_a_left_id: number | null;
    team_a_right_id: number | null;
    team_b_left_id: number | null;
    team_b_right_id: number | null;
}

// ============================================================================
// Helpers
// ============================================================================

const BASE_URL = 'https://padel-ranking-plum.vercel.app';

function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'Da definire';
    return new Date(dateString).toLocaleString('it-IT', {
        weekday: 'short', day: '2-digit', month: 'short',
        hour: '2-digit', minute: '2-digit'
    });
}

function clubText(club: ClubBrief | null | undefined): string {
    if (!club?.name) return 'Campo non specificato';
    return club.city ? `${club.name} (${club.city})` : club.name;
}

function courtText(courtType: string | null | undefined): string {
    return courtType === 'indoor' ? 'Coperto 🌧️' : 'Scoperto ☀️';
}

function mapsUrl(club: ClubBrief | null | undefined): string | null {
    if (!club?.name) return null;
    const q = club.city ? `${club.name} ${club.city}` : club.name;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function matchLink(matchId: string): string {
    return `${BASE_URL}/match/${matchId}/join`;
}

/**
 * Returns the display name for a player (e.g. "Mario Rossi (4.20)") or "Slot Libero (0.00)"
 */
function formatPlayer(player: PlayerBrief | null): string {
    if (!player) return 'Slot Libero (0.00)';
    const name = `${player.first_name ?? ''} ${player.last_name ?? ''}`.trim() || 'Sconosciuto';
    return `${name} (${player.ranking.toFixed(2)})`;
}

/**
 * Resolve a player by ID from an array of players
 */
function resolvePlayer(players: PlayerBrief[], id: number | null): PlayerBrief | null {
    return id ? players.find(p => p.id === id) ?? null : null;
}

// ============================================================================
// Level/range computation (shared logic with PendingMatchCard)
// ============================================================================

function computeLevelText(players: (PlayerBrief | null)[]): string {
    const rankings = players
        .filter((p): p is PlayerBrief => p !== null)
        .map(p => p.ranking);

    if (rankings.length === 0) return 'DA DEFINIRE';

    const minLvl = Math.min(...rankings);
    const maxLvl = Math.max(...rankings);

    if (rankings.length === 4) {
        return minLvl === maxLvl
            ? `${minLvl.toFixed(2)}`
            : `${minLvl.toFixed(2)} - ${maxLvl.toFixed(2)}`;
    }

    return `${Math.max(0, maxLvl - 0.25).toFixed(2)} - ${(minLvl + 0.25).toFixed(2)}`;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * 1. CONVOCAZIONE — "Share Match" message, also usable for creation notifications
 *
 * Matches the format of PendingMatchCard.tsx's generaLinkWhatsAppLocal.
 * Returns the raw message text (not a wa.me link).
 */
export function buildSummonMessage(
    match: MatchBrief,
    players: PlayerBrief[],
    club: ClubBrief | null | undefined,
): string {
    const pA1 = resolvePlayer(players, match.team_a_left_id);
    const pA2 = resolvePlayer(players, match.team_a_right_id);
    const pB1 = resolvePlayer(players, match.team_b_left_id);
    const pB2 = resolvePlayer(players, match.team_b_right_id);

    const lvlText = computeLevelText([pA1, pA2, pB1, pB2]);

    // Date: prefer match_date, fallback to created_at (used in client-side share button)
    const dateSource = match.match_date || match.created_at;

    // Dynamic side labels when one partner is missing
    const labelA1 = !pA1 && pA2 ? (pA2.preferred_side === 'Both' ? '[SX/DX]' : '[SX]') : '[SX]';
    const labelA2 = pA1 && !pA2 ? (pA1.preferred_side === 'Both' ? '[SX/DX]' : '[DX]') : '[DX]';
    const labelB1 = !pB1 && pB2 ? (pB2.preferred_side === 'Both' ? '[SX/DX]' : '[SX]') : '[SX]';
    const labelB2 = pB1 && !pB2 ? (pB1.preferred_side === 'Both' ? '[SX/DX]' : '[DX]') : '[DX]';

    return [
        '🎾 *RanKING Padel - Convocazione Match* 🎾',
        '',
        `📅 *Data:* ${formatDate(dateSource)}`,
        `📍 *Campo:* ${clubText(club)}`,
        `🏟️ *Campo:* ${courtText(match.court_type)}`,
        ...(mapsUrl(club) ? [`🗺️ *Posizione:* ${mapsUrl(club)}`] : []),
        `📊 *Livello Attuale:* ${lvlText}`,
        '',
        '👥 *SQUADRA A:*',
        `• ${pA1 ? '[SX]' : labelA1} ${formatPlayer(pA1)}`,
        `• ${pA2 ? '[DX]' : labelA2} ${formatPlayer(pA2)}`,
        '',
        '👥 *SQUADRA B:*',
        `• ${pB1 ? '[SX]' : labelB1} ${formatPlayer(pB1)}`,
        `• ${pB2 ? '[DX]' : labelB2} ${formatPlayer(pB2)}`,
        '',
        '👉 *Tutte le info e gestione match qui:*',
        `🔗 ${matchLink(match.id)}`,
    ].join('\n');
}

/**
 * 2. AGGIORNAMENTO — Sent when a match is edited (players, date, club, etc.)
 */
export function buildUpdateMessage(
    match: MatchBrief,
    players: PlayerBrief[],
    club: ClubBrief | null | undefined,
    humanReadableChanges: string[],
    operatore: string,
): string {
    const pA1 = resolvePlayer(players, match.team_a_left_id);
    const pA2 = resolvePlayer(players, match.team_a_right_id);
    const pB1 = resolvePlayer(players, match.team_b_left_id);
    const pB2 = resolvePlayer(players, match.team_b_right_id);

    const lvlText = computeLevelText([pA1, pA2, pB1, pB2]);

    return [
        '🎾 *RanKING Padel - Aggiornamento Match* 🎾',
        '',
        `⚠️ *Match #${match.id.slice(0, 8)} modificato da ${operatore}*`,
        '',
        '*📝 Dettaglio modifiche:*',
        ...humanReadableChanges.map(m => `• ${m}`),
        '',
        `📅 *Data:* ${formatDate(match.match_date)}`,
        `📍 *Campo:* ${clubText(club)}`,
        `🏟️ *Campo:* ${courtText(match.court_type)}`,
        ...(mapsUrl(club) ? [`🗺️ *Posizione:* ${mapsUrl(club)}`] : []),
        `📊 *Livello Attuale:* ${lvlText}`,
        '',
        '👥 *SQUADRA A:*',
        `• [SX] ${formatPlayer(pA1)}`,
        `• [DX] ${formatPlayer(pA2)}`,
        '',
        '👥 *SQUADRA B:*',
        `• [SX] ${formatPlayer(pB1)}`,
        `• [DX] ${formatPlayer(pB2)}`,
        '',
        '👉 *Tutte le info e gestione match qui:*',
        `🔗 ${matchLink(match.id)}`,
    ].join('\n');
}

/**
 * 3. RISULTATO — Sent when a match is resolved with a score
 */
export interface ResultDeltas {
    teamADelta: number;
    teamBDelta: number;
}

export interface PlayerRankingSnapshot {
    id: number;
    name: string;
    old_ranking: number;
    new_ranking: number;
    delta: number;
}

export function buildResultMessage(
    match: MatchBrief,
    teamANames: string,
    teamBNames: string,
    winningTeam: 'A' | 'B',
    scoreString: string,
    deltas: ResultDeltas,
    rankingSnapshots: PlayerRankingSnapshot[],
): string {
    const esitoDescrizione = winningTeam === 'A'
        ? `Vince il Team A (${teamANames}) contro il Team B (${teamBNames})`
        : `Vince il Team B (${teamBNames}) contro il Team A (${teamANames})`;

    const tipoPartitaText = match.is_friendly ? '🤝 AMICHEVOLE' : '🔥 MATCH CLASSIFICATO';

    const rankingLogText = rankingSnapshots
        .map(p => `${p.name} (${p.old_ranking.toFixed(2)} ➡️ ${p.new_ranking.toFixed(2)})`)
        .join(' | ');

    return [
        '🎾 *RISULTATO REGISTRATO* 🎾',
        '',
        `🏆 *${esitoDescrizione}*`,
        `📊 *Set:* ${scoreString}`,
        `⚙️ *Tipo:* ${tipoPartitaText}`,
        '',
        ...(match.is_friendly
            ? ['Nessuna variazione di ranking.']
            : [`📈 *Variazioni Elo:*`, rankingLogText]),
        '',
        'Controlla le classifiche aggiornate nell\'app! 🏆',
        `🔗 ${matchLink(match.id)}`,
    ].join('\n');
}
