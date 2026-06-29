// ============================================================================
// DICT-PLAYER — Player cards, stats, team labels
// ============================================================================

const dictPlayer = {
  LABEL_RANK: 'Rank',
  LABEL_PLAYER: 'Giocatore',
  LABEL_SIDE: 'Lato / Mano',
  LABEL_MATCHES: 'Partite',
  LABEL_POINTS: 'Punti',
  LABEL_WIN_RATE: 'Win %',
  LABEL_TOTAL_PLAYED: 'Match',
  LABEL_RATE: 'Rate',
  LABEL_PTS: 'Pts',
  LABEL_LEFT: 'Sx',
  LABEL_RIGHT: 'Dx',
  LABEL_MIX: 'Mix',

  HAND_LEFT: 'Mancino',
  HAND_RIGHT: 'Destro',
  HAND_SHORT_LEFT: 'L',
  HAND_SHORT_RIGHT: 'R',

  TITLE_KING_SX: 'KING SX',
  TITLE_KING_DX: 'KING DX',
  TITLE_KING_MIX: 'KING MIX',
  TITLE_FAN_SX: 'FAN SX',
  TITLE_FAN_DX: 'FAN DX',
  TITLE_FAN_MIX: 'FAN MIX',

  STATS_NO_MATCHES: 'Nessun match',
  STATS_CALCULATED_ON: 'Calcolato su {count} match',
  STATS_PARTNER_IDEAL: 'Partner Ideale',
  STATS_NEMESIS: 'La tua Nemesi',
  STATS_NEMESIS_NONE: 'NESSUNA',
  STATS_PARTNER_NONE: 'NESSUNO',
  STATS_WINS_TOGETHER: '{wins} VITTORIE INSIEME',
  STATS_NO_MATCH_PLAYED: 'NESSUN MATCH GIOCATO',
  STATS_STREAK: 'Striscia:',
  STATS_CONSECUTIVE_WINS: 'Vittorie consecutive',
  STATS_CONSECUTIVE_LOSSES: 'Sconfitte consecutive',
  STATS_STREAK_NONE: 'Nessuna',

  TEAM_A: 'TEAM A',
  TEAM_B: 'TEAM B',
  TEAM_A_BLUE: 'TEAM A (BLU)',
  TEAM_B_RED: 'TEAM B (ROSSO)',
  WINNER: 'WINNER',
  PLAYER_SX: 'GIOCATORE SX',
  PLAYER_DX: 'GIOCATORE DX',
  VS: 'VS',

  AVATAR_UPLOAD: 'CARICA FOTO',
  AVATAR_CHANGE: 'Cambia foto',

  PROFILE_NOT_FOUND: 'Atleta non trovato.',

  WIDGET_WIN_RATE: 'Efficacia in Campo',
  WIDGET_WIN_RATE_TOP: 'TOP PLAYER',
  WIDGET_WIN_RATE_AVG: 'IN MEDIA',
  WIDGET_WIN_RATE_LOW: 'SOTTO TONO',
  WIDGET_FORM: 'Stato di Forma',
  WIDGET_INCROCI: 'Incroci Pericolosi',
  WIDGET_EFFICIENCY: 'Efficienza Game',
  WIDGET_GAME_PER_MATCH: 'game/match',

  WIDGET_VITTORIE: 'Vinte',
  WIDGET_PERSE: 'Perse',
  WIDGET_TOTALE: 'Totale',
  WIDGET_STRISCE_V: 'V',
  WIDGET_STRISCE_P: 'P',
  WIDGET_STRISCE_EMPTY: '-',
  WIDGET_STRISCE_NA: 'N/A',

  LABEL_SET_BILANCIO: 'BILANCIO SET',
  LABEL_CONTO_GAME: 'CONTO GAME',
  LABEL_GAME_WIN_PERC: 'Rendimento Game',
  STATS_SET_RATE: '{won}V - {lost}P ({rate}%)',
  STATS_GAME_DETAIL: '{won} Fatti / {lost} Subiti',
} as const;

export default dictPlayer;
