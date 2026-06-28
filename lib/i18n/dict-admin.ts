// ============================================================================
// DICT-ADMIN — Admin panel strings
// ============================================================================

const dictAdmin = {
  PAGE_TITLE_CLUBS: 'Gestione Circoli',
  PAGE_TITLE_MANAGERS: 'Gestione Gestori',
  PAGE_TITLE_PLAYERS: 'Gestione Atleti',
  PAGE_TITLE_LOGS: 'Registro Attività',

  BUTTON_INVITE_MANAGER: 'INVITA GESTORE',
  BUTTON_NEW_CLUB: 'Nuovo Circolo',

  LOG_COL_DATE: 'Data',
  LOG_COL_ACTION: 'Azione',
  LOG_COL_DETAILS: 'Dettagli',
  LOG_OPERATOR: 'Operatore: {name}',

  LOG_FILTER_SEARCH: 'Cerca nei log...',
  LOG_FILTER_TYPE: 'Tipo',
  LOG_FILTER_TYPE_ALL: 'Tutti',

  CLUB_PAGE_ADD_TITLE: 'Aggiungi Nuovo Circolo',
  CLUB_PAGE_ADD_SUBMIT: 'AGGIUNGI CIRCOLO',
  CLUB_NO_RECORDS: 'Nessun circolo registrato',
  CLUB_DELETE_BUTTON: 'ELIMINA',

  MANAGER_DELETE_TITLE: 'Eliminare Gestore?',
  MANAGER_DELETE_BODY: "Sei sicuro di voler eliminare {name}? Il suo ruolo di gestore verrà rimosso. Potrà comunque accedere all'app come giocatore standard se già registrato.",

  PLAYER_DELETE_TITLE: 'Eliminare Giocatore?',
  PLAYER_DELETE_BODY: "Sei sicuro di voler eliminare {name}? Questa azione è irreversibile. Il sistema bloccherà l'eliminazione se l'atleta ha già disputato match ufficiali.",
  PLAYER_DELETE_IRREVERSIBLE: 'Attenzione: questa azione è irreversibile.',

  LOG_FILTER_SEARCH_LABEL: 'Cerca nei dettagli o admin',
  LOG_FILTER_TYPE_LABEL: 'Tipo di Azione',

  LOADING_TEXT: 'Caricamento dati federali...',
} as const;

export default dictAdmin;
