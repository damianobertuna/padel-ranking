// ============================================================================
// DICT-RANKING — Ranking table and sorting
// ============================================================================

const dictRanking = {
  TITLE: 'CLASSIFICA',
  TITLE_MALE: 'CLASSIFICA MASCHILE',
  TITLE_FEMALE: 'CLASSIFICA FEMMINILE',
  TITLE_ALL: 'CLASSIFICA GENERALE',

  LABEL_POS: 'Pos',
  LABEL_PLAYER: 'Giocatore',
  LABEL_POINTS: 'Punti',
  LABEL_MATCHES: 'Partite',
  LABEL_WINRATE: 'Win %',
  LABEL_SIDE: 'Lato',

  EMPTY: 'Nessun giocatore presente in classifica.',
  NO_DATA: 'Dati classifica non disponibili.',
} as const;

export default dictRanking;
