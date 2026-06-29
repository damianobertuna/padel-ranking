// ============================================================================
// DICT-UI — Generic UI component strings
// ============================================================================

const dictUi = {
  BACK_TO_HOME: 'TORNA ALLA HOME',
  BACK: 'INDIETRO',

  PAGINATION_FIRST: 'Prima Pagina',
  PAGINATION_PREV: 'Precedente',
  PAGINATION_NEXT: 'Successiva',
  PAGINATION_LAST: 'Ultima Pagina',
  PAGINATION_PAGE: 'Pagina',

  SEARCH_PLACEHOLDER: 'CERCA ATLETA PER NOME O COGNOME...',
  SEARCH_PLACEHOLDER_HISTORY: 'FILTRA STORICO PER NOME GIOCATORE...',
  SEARCH_PLACEHOLDER_PLAYER: 'Cerca nome...',
  SEARCH_DESELECT: '-- DESELEZIONA ({placeholder}) --',

  EMPTY_NO_RESULTS: 'Nessun risultato',
  EMPTY_NO_PLAYERS: 'Nessun atleta corrisponde alla ricerca',
  EMPTY_NO_MATCHES: 'Nessun match in bacheca',
  EMPTY_NO_MATCHES_FILTERED: 'Nessun match registrato corrisponde ai criteri cercati',
  EMPTY_NO_LOGS: 'Nessun registro trovato con i filtri attuali',
  EMPTY_NO_PLAYERS_PAGE: 'Nessun atleta trovato in questa pagina.',
  EMPTY_NO_MANAGERS: 'Nessun gestore registrato.',
  EMPTY_NO_MANAGERS_HINT: 'Utilizza il pulsante "Invita Gestore" per aggiungerne uno.',
  EMPTY_NO_CLUBS: 'Nessun circolo registrato',

  LOGIN_PROMPT: 'Accedi per visualizzare lo storico personale.',
  LOGIN_REQUIRED: 'Devi effettuare il login',

  WAIT: 'ATTENDI...',
  LOADING: 'Caricamento...',
  LOADING_DATA: 'Caricamento dati...',
  REDIRECTING: 'Reindirizzamento in corso...',
  LOADING_FEDERALE: 'Caricamento dati federali...',

  CANCEL: 'Annulla',
  SAVE: 'Salva',
  CONFIRM: 'CONFERMA',
  CLOSE: 'Chiudi',
  SEND: 'INVIA',
  SENDING: 'INVIO...',
  SALVA: 'SALVA',
  SALVATAGGIO: 'SALVATAGGIO...',
  ELIMINA: 'ELIMINA',
  CONFIRM_DELETE: 'Sì, Elimina',
  SAVE_AND_LOGIN: 'Salva e Accedi',
  AGGIORNAMENTO: 'Aggiornamento...',
  RESET_FILTERS: 'Resetta Filtri',
  CARICAMENTO_UPPER: 'CARICAMENTO...',
  NO_IMAGE: 'NO IMG',
  ATTENDI_UPPER: 'ATTENDI...',

  MATCH_ID_PREFIX: 'ID: #',

  SET_N: 'Set {n}',

  CLUB_FILTER_NONE: 'NESSUN CIRCOLO DEFINITO',
  CLUB_FILTER_DISABLED_CLUB: 'Circolo assegnato',
  CLUB_FILTER_LOCKED: 'Bloccato',
  CLUB_LOCATION_ND: 'Location N/D',
  CLUB_FIELD_TBD: 'CAMPO DA DEFINIRE',
  CLUB_DA_DEFINIRE: 'Da definire',

  LEVEL_LABEL: 'LIVELLO:',
  LEVEL_UNDEFINED: 'DA DEFINIRE',
  LEVEL_MATCH_LABEL: 'LIVELLO MATCH:',
  LEVEL_RANGE_LABEL: 'RANGE CONSENTITO:',

  SLOT_ALL: 'Tutti',
  SLOT_FREE: 'Liberi',

  LEVEL_COMPATIBLE: 'Compatibile',

  COURT_INDOOR: 'COPERTO',
  COURT_OUTDOOR: 'SCOPERTO',
  COURT_INDOOR_LABEL: 'COPERTO',
  COURT_OUTDOOR_LABEL: 'SCOPERTO',
  COURT_INDOOR_UPPER: 'COPERTO',
  COURT_OUTDOOR_UPPER: 'SCOPERTO',
  COURT_TITLE_OUTDOOR: 'SCOPERTO',
  COURT_TITLE_INDOOR: 'COPERTO',
} as const;

export default dictUi;
