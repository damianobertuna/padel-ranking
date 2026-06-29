// ============================================================================
// DICT-STATS — Stats widgets labels
// ============================================================================

const dictStats = {
  TITLE_WIN_RATE: 'Efficacia in Campo',
  LABEL_TOP_PLAYER: 'TOP PLAYER',
  LABEL_MEDIA: 'IN MEDIA',
  LABEL_LOW: 'SOTTO TONO',
  LABEL_TOTALE: 'Totale',
  LABEL_VINTE: 'Vinte',
  LABEL_PERSE: 'Perse',

  TITLE_FORM: 'Stato di Forma',
  LABEL_STRISCIA: 'Striscia:',
  LABEL_VITTORIE_CONSECUTIVE: '{count} Vittorie',
  LABEL_SCONFITTE_CONSECUTIVE: '{count} Sconfitte',
  LABEL_STRISCE_V: 'V',
  LABEL_STRISCE_P: 'P',
  LABEL_STRISCE_EMPTY: '-',
  LABEL_STRISCE_NA: 'N/A',

  TITLE_INCROCI: 'Incroci Pericolosi',
  LABEL_PARTNER: 'Partner Ideale',
  LABEL_NEMESIS: 'La tua Nemesi',
  LABEL_NESSUNO: 'NESSUNO',
  LABEL_NESSUNA: 'NESSUNA',
  LABEL_NO_MATCH_PLAYED: 'NESSUN MATCH GIOCATO',
  LABEL_IMBATTUTO: 'IMBATTUTO',
  LABEL_VITTORIE_INSIEME: '{count} VITTORIE INSIEME',
  LABEL_SCONFITTE_SUBITE: '{count} SCONFITTE SUBITE',

  TITLE_EFFICIENCY: 'Efficienza Game',
  LABEL_GAME_PER_MATCH: 'game/match',
  LABEL_GAME_WIN_PERC: 'Rendimento Game',
  LABEL_SET_BILANCIO: 'BILANCIO SET',
  LABEL_CONTO_GAME: 'CONTO GAME',
  LABEL_SET_FORMAT: '{won}V - {lost}P ({rate}%)',
  LABEL_GAME_FORMAT: '{won} Fatti / {lost} Subiti',
} as const;

export default dictStats;
