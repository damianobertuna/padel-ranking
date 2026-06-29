// ============================================================================
// DICT-FORM — Generic form labels, create match, invite, admin edit
// ============================================================================

const dictForm = {
  LABEL_DATE: 'Data Match',
  LABEL_TIME: 'Orario',
  LABEL_CLUB: 'Circolo',
  LABEL_MATCH_TYPE: 'Tipo Partita',
  LABEL_REGULATION: 'Regolamento',
  LABEL_COURT_TYPE: 'Tipo Campo',
  LABEL_TEAM_A: 'TEAM A',
  LABEL_TEAM_B: 'TEAM B',
  LABEL_NOME: 'Nome',
  LABEL_COGNOME: 'Cognome',
  LABEL_RANKING: 'Ranking',
  LABEL_SIDE: 'Lato',
  LABEL_HAND: 'Mano',
  LABEL_ROLE: 'Ruolo',
  LABEL_USER_ID: 'User ID',
  LABEL_CLUB_TO_MANAGE: 'Circolo da gestire',
  LABEL_EMAIL: 'Indirizzo Email',

  PLACEHOLDER_CLUB: 'NESSUN CIRCOLO DEFINITO',
  PLACEHOLDER_NAME: 'Mario',
  PLACEHOLDER_SURNAME: 'Rossi',
  PLACEHOLDER_EMAIL: 'es. mario.rossi@email.it',
  PLACEHOLDER_RANKING_EXAMPLE: 'RANKING INIZIALE',

  TYPE_MALE: 'MASCHILE',
  TYPE_FEMALE: 'FEMMINILE',
  TYPE_MIXED: 'MISTO',

  RULE_RANKED: 'Classificata',
  RULE_RANKED_DESC: "Incide sull'Elo",
  RULE_FRIENDLY: 'Amichevole',
  RULE_FRIENDLY_DESC: 'Nessun vincolo',

  COURT_INDOOR: 'COPERTO',
  COURT_OUTDOOR: 'SCOPERTO',

  BUTTON_CREATE_NEW: 'Nuova Partita',
  BUTTON_SUBMIT: 'Crea',
  BUTTON_SAVE: 'Salva',

  CREATE_TITLE: 'Nuova Partita',
  CREATING: 'ATTENDI...',
  ERROR_LOADING: 'Errore nel caricamento dei dati:',

  INVITE_TITLE: 'Nuovo Gestore',
  INVITE_SUCCESS: 'Invito inviato con successo!',
  INVITE_SUBMIT: 'INVIA INVITO',
  INVITE_PLACEHOLDER_CLUB: '-- Seleziona un circolo --',

  ADMIN_PLAYER_TITLE: 'Gestione Atleti',
  ADMIN_PLAYER_OPTION_USER: 'USER',
  ADMIN_PLAYER_OPTION_ADMIN: 'ADMIN',
  ADMIN_PLAYER_SIDE_SX: 'SX',
  ADMIN_PLAYER_SIDE_DX: 'DX',
  ADMIN_PLAYER_SIDE_MIX: 'MIX',
  ADMIN_PLAYER_HAND_DX: 'DX',
  ADMIN_PLAYER_HAND_SX: 'SX',
  ADMIN_PLAYER_SAVE: 'Salva',
  ADMIN_PLAYER_DELETE: 'Elimina',

  MANAGER_INVITE_TITLE: 'Nuovo Gestore',
  MANAGER_INVITE_SUCCESS: 'Invito inviato con successo!',
  MANAGER_INVITE_CANCEL: 'Annulla',
  MANAGER_INVITE_SUBMIT: 'INVIA INVITO',

  PROFILE_TITLE_DATI: 'I Tuoi Dati',
  PROFILE_SAVE: 'Salva Modifiche',
  PROFILE_SAVING: 'Salvataggio...',

  CLUB_ADD_NAME: 'NOME CIRCOLO',
  CLUB_ADD_ADDRESS: 'INDIRIZZO',
  CLUB_ADD_CITY: "CITTA'",
  CLUB_ADD_BUTTON: 'AGGIUNGI CIRCOLO',
  CLUB_ADD_SAVING: 'SALVATAGGIO...',

  MODAL_CANCEL: 'Annulla',
  MODAL_DELETE: 'Sì, Elimina',

  PLAYER_GENDER_M: 'MASCHILE',
  PLAYER_GENDER_F: 'FEMMINILE',
} as const;

export default dictForm;
