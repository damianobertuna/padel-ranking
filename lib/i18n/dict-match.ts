// ============================================================================
// DICT-MATCH — Match types, statuses, action labels
// ============================================================================

const dictMatch = {
  TYPE_FRIENDLY: 'Amichevole',
  TYPE_RANKED: 'Classificata',
  TYPE_FRIENDLY_SHORT: 'Amichevole',
  TYPE_RANKED_SHORT: 'Classificata',

  BADGE_AMICHEVOLE: 'AMICHEVOLE',
  BADGE_CLASSIFICATA: 'Classificata',
  BADGE_AMICHEVOLE_PURPLE: 'Amichevole',
  BADGE_CLASSIFICATA_BLUE: 'Classificata',

  REGOLAMENTO_AMICHEVOLE: 'Regolamento Amichevole',
  REGOLAMENTO_CLASSIFICATO: 'Regolamento Classificato',

  STATUS_MATCH_READY: 'MATCH PRONTO',
  STATUS_OPEN_MATCH: 'OPEN MATCH',
  STATUS_SCADUTO: 'SCADUTO',
  STATUS_COMPLETED: 'COMPLETATO',

  ACTION_MANAGE: 'GESTISCI MATCH',
  ACTION_EDIT: 'MODIFICA MATCH',
  ACTION_LEAVE: 'LASCIA PARTITA',
  ACTION_JOIN: 'UNISCITI ORA',
  ACTION_VIEW: 'VEDI DETTAGLI',
  ACTION_DELETE: 'CANCELLA',
  ACTION_JOIN_SHORT: 'ISCRIVITI',
  ACTION_SIDE_INCOMPATIBLE: 'LATO INCOMPATIBILE',

  SLOT_LIBERO_SX: 'SLOT LIBERO (SX)',
  SLOT_LIBERO_DX: 'SLOT LIBERO (DX)',
  SLOT_LIBERO: 'Slot Libero',
  SLOT_SCONOSCIUTO: 'SCONOSCIUTO',

  REPORT_TITLE: 'Referto Gara',
  REPORT_TITLE_FRIENDLY: 'Referto Gara (AMICHEVOLE)',
  REPORT_LOADING: 'Caricamento referto...',
  BUTTON_RESOLVE_FRIENDLY: 'REGISTRA AMICHEVOLE',
  BUTTON_RESOLVE_RANKED: 'CONFERMA E CALCOLA RANKING',
  BUTTON_PROCESSING: 'ELABORAZIONE...',

  EDIT_TITLE: 'Modifica Partita',
  EDIT_SUBMIT: 'Salva Modifiche',
  EDIT_LOADING: 'Caricamento...',

  ERROR_SETS_INCOMPLETE: 'I primi 2 set sono obbligatori.',
  ERROR_SETS_TIED: 'Partita in pareggio: 3° set obbligatorio.',
  ERROR_SET_INVALID_PREFIX: 'Punteggio non valido al Set',
  ERROR_SET_NORMAL_RULES: 'I set normali finiscono a 6 (con 2 di scarto) o a 7 (7-5, 7-6).',
  ERROR_SET_TIEBREAK_RULES: 'Il terzo set deve finire a 6, 7 oppure essere un Super Tie-Break a 10 (con 2 di scarto).',
  ERROR_SETS_TIE_IMPOSSIBLE: 'Pareggio nei set impossibile. Inserisci il terzo set per decretare il vincitore.',

  BADGE_VITTORIA: 'Vittoria',
  BADGE_SCONFITTA: 'Sconfitta',
  LABEL_WITH: 'In coppia con:',
  LABEL_AGAINST: 'Contro:',
  LABEL_PLAYER_ND: 'N.D.',

  LOADING_SIMPLE: 'Caricamento...',
} as const;

export default dictMatch;
