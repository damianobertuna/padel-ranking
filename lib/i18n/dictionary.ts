// ============================================================================
// RanKING Padel — Dizionario Centralizzato (IT locale)
// ============================================================================
// Racchiude TUTTE le stringhe italiane (errori, etichette, messaggi UI)
// in un unico punto. Ogni chiave segue il pattern:
//
//     CATEGORIA.CONTESTO_CHIAVE
//
// Esempi:
//   MATCH.STATUS_FRIENDLY       = "🤝 Amichevole"
//   ERROR.MATCH_NOT_FOUND       = "Match non trovato"
//
// Usa la funzione `t()` per risolvere le chiavi nei componenti.
// ============================================================================

// Types per type-safe dictionary access
export type DictCategory = keyof typeof dictionary;
export type DictKey<C extends DictCategory> = keyof typeof dictionary[C];

// ============================================================================
// DICTIONARY
// ============================================================================
const dictionary = {
  // ---------------------------------------------------------------------------
  // MATCH — Tipologie, stati, etichette partita
  // ---------------------------------------------------------------------------
  match: {
    // Tipologia partita
    TYPE_FRIENDLY: '🤝 Amichevole',
    TYPE_RANKED: '🔥 Classificata',
    TYPE_FRIENDLY_SHORT: 'Amichevole',
    TYPE_RANKED_SHORT: 'Classificata',

    // Badge etichette
    BADGE_AMICHEVOLE: '🤝 AMICHEVOLE',
    BADGE_CLASSIFICATA: '🔥 Classificata',
    BADGE_AMICHEVOLE_PURPLE: '🤝 Amichevole',
    BADGE_CLASSIFICATA_BLUE: '🔥 Classificata',

    // Regolamento
    REGOLAMENTO_AMICHEVOLE: '🤝 Regolamento Amichevole',
    REGOLAMENTO_CLASSIFICATO: '🔥 Regolamento Classificato',

    // Stato match
    STATUS_MATCH_READY: 'MATCH PRONTO',
    STATUS_OPEN_MATCH: 'OPEN MATCH',
    STATUS_SCADUTO: 'SCADUTO ⚠️',
    STATUS_COMPLETED: 'COMPLETATO',

    // Azioni
    ACTION_MANAGE: 'GESTISCI MATCH',
    ACTION_EDIT: 'MODIFICA MATCH',
    ACTION_LEAVE: 'LASCIA PARTITA',
    ACTION_JOIN: 'UNISCITI ORA',
    ACTION_VIEW: 'VEDI DETTAGLI',
    ACTION_DELETE: 'CANCELLA',
    ACTION_JOIN_SHORT: 'ISCRIVITI',

    // Slot
    SLOT_LIBERO_SX: '➕ SLOT LIBERO (SX)',
    SLOT_LIBERO_DX: '➕ SLOT LIBERO (DX)',
    SLOT_LIBERO: 'Slot Libero',
    SLOT_SCONOSCIUTO: 'SCONOSCIUTO',

    // Referto / risoluzione
    REPORT_TITLE: 'Referto Gara',
    REPORT_TITLE_FRIENDLY: 'Referto Gara (AMICHEVOLE)',
    REPORT_LOADING: 'Caricamento referto...',
    BUTTON_RESOLVE_FRIENDLY: 'REGISTRA AMICHEVOLE',
    BUTTON_RESOLVE_RANKED: 'CONFERMA E CALCOLA RANKING',
    BUTTON_PROCESSING: 'ELABORAZIONE...',

    // Modifica match
    EDIT_TITLE: 'Modifica Partita',
    EDIT_SUBMIT: 'Salva Modifiche',
    EDIT_LOADING: 'Caricamento...',

    // Set validation (resolve-match)
    ERROR_SETS_INCOMPLETE: 'I primi 2 set sono obbligatori.',
    ERROR_SETS_TIED: 'Partita in pareggio: 3° set obbligatorio.',
    ERROR_SET_INVALID_PREFIX: 'Punteggio non valido al Set',
    ERROR_SET_NORMAL_RULES: 'I set normali finiscono a 6 (con 2 di scarto) o a 7 (7-5, 7-6).',
    ERROR_SET_TIEBREAK_RULES: 'Il terzo set deve finire a 6, 7 oppure essere un Super Tie-Break a 10 (con 2 di scarto).',
    ERROR_SETS_TIE_IMPOSSIBLE: 'Pareggio nei set impossibile. Inserisci il terzo set per decretare il vincitore.',
  },

  // ---------------------------------------------------------------------------
  // ERROR — Messaggi di errore e violazioni
  // ---------------------------------------------------------------------------
  error: {
    // Generici
    GENERIC: 'Si è verificato un errore.',
    UNKNOWN: 'Errore sconosciuto',
    INTERNAL_SERVER: 'Errore interno del server',

    // Autenticazione/autorizzazione
    AUTH_REQUIRED: "Devi effettuare l'accesso.",
    AUTH_REQUIRED_ALT: "Utente non autenticato",
    AUTH_LOGIN_REQUIRED: "Accesso negato: devi effettuare il login per modificare una partita.",
    AUTH_PROFILE_NOT_RECOGNIZED: "ACCESSO NEGATO: Profilo utente non riconosciuto.",
    AUTH_SESSION_ERROR: 'Errore di validazione: ',
    AUTH_TOKEN_EXPIRED: 'Nessun token valido trovato. Il link potrebbe essere scaduto.',
    LOGIN_FAILED: 'Logging fallito: Utente non autenticato',

    // Match
    MATCH_NOT_FOUND: 'Match non trovato',
    MATCH_NOT_FOUND_DB: 'Partita non trovata nel database',
    MATCH_NOT_FOUND_GENERIC: 'Partita non trovata.',
    MATCH_NOT_FOUND_REPORT: 'Partita non trovata o referto inesistente.',
    MATCH_ALREADY_RESOLVED: 'Questa partita è già stata risolta',
    MATCH_NOT_PENDING: 'Puoi cancellare solo partite in programma',
    MATCH_DELETE_RLS_BLOCKED: 'ACCESSO NEGATO: Impossibile cancellare la partita. Verifica i permessi (RLS).',
    MATCH_DELETE_LOG_FAILED: 'Impossibile procedere: Errore nel registro delle attività',
    MATCH_NO_4_PLAYERS: "Impossibile risolvere: la partita non ha 4 giocatori validi.",
    MATCH_UPDATE_DB_FAILED: 'Errore database: ',

    // Giocatori
    PLAYER_NOT_FOUND: 'Giocatore non trovato',
    PLAYER_DUPLICATE: 'ERRORE: GIOCATORE DUPLICATO.',
    PLAYER_DUPLICATE_SLOT: 'ERRORE: Non puoi inserire lo stesso giocatore in più slot.',
    PLAYER_ALREADY_JOINED: 'Sei già iscritto a questa partita.',
    PLAYER_NOT_IN_MATCH: "Impossibile uscire: non sei iscritto a questa partita.",
    PLAYER_NO_SLOT_AVAILABLE: 'Impossibile unirsi: nessuno slot disponibile per la tua preferenza (',
    PLAYER_NO_SLOT_AVAILABLE_SUFFIX: ').',
    PLAYER_LEVEL_ERROR: 'ERRORE: DIVARIO TECNICO > 0.25.',
    PLAYER_MUST_OCCUPY_SLOT: 'OPERAZIONE NEGATA: Devi occupare almeno uno slot per creare una partita.',

    // Club Manager
    MANAGER_CANNOT_JOIN: 'I Club Manager non possono unirsi a una partita perché non hanno un profilo giocatore.',
    MANAGER_CANNOT_LEAVE: 'I Club Manager non possono abbandonare una partita perché non sono in campo.',
    MANAGER_CANNOT_MOVE_CLUB: 'ACCESSO NEGATO: Non puoi spostare la partita in un circolo che non gestisci.',

    // Permessi
    PERMISSION_DENIED: 'ACCESSO NEGATO',
    PERMISSION_DENIED_MANAGE: 'ACCESSO NEGATO: Non hai i permessi per gestire questa partita.',
    PERMISSION_DENIED_DELETE: "ACCESSO NEGATO: Non hai i permessi per cancellare questa partita.",
    PERMISSION_DENIED_EDIT: 'ACCESSO NEGATO: Non sei autorizzato a gestire o modificare questa partita.',
    PERMISSION_DENIED_RESOLVE: 'ACCESSO NEGATO: Non sei autorizzato a inserire il risultato per questa partita.',
    PERMISSION_DENIED_RESOLVE_VIOLATION: 'VIOLAZIONE DI SICUREZZA: Non sei autorizzato a inserire il risultato per questa partita.',
    PERMISSION_DENIED_ADMIN: '🚫 Accesso Negato.',
    PERMISSION_DENIED_NOT_ADMIN: "Accesso negato: non sei un amministratore.",

    // Database / operazioni
    DB_ERROR_PREFIX: 'Errore database: ',
    DB_UPDATE_FAILED: 'Errore aggiornamento slot: ',
    DB_DELETE_FAILED: 'Errore eliminazione match vuoto: ',
    DB_JOIN_FAILED: "Errore durante l'iscrizione: ",
    DB_MATCH_DELETE_FAILED: "Errore database: ",
    DB_LOG_FAILED: '❌ ERRORE CRITICO SCRITTURA AUDIT LOG',
    DB_LOG_CREATE_FAILED: '❌ ERRORE LOG CREAZIONE MATCH:',

    // Invito manager
    MANAGER_INVITE_FIELDS_REQUIRED: 'Compila tutti i campi: nome, cognome, circolo ed email.',
    MANAGER_INVITE_GENERIC: "Errore durante l'invio dell'invito.",

    // Not found 404
    NOT_FOUND_404: 'ERRORE 404',
  },

  // ---------------------------------------------------------------------------
  // AUTH — Login, registrazione, profilo
  // ---------------------------------------------------------------------------
  auth: {
    TAB_LOGIN: 'Login',
    TAB_REGISTER: 'Registrati',
    BUTTON_LOGIN: 'ACCEDI',
    BUTTON_REGISTER: 'REGISTRATI',
    BUTTON_LOGOUT: 'ESCI',
    BUTTON_PROCESSING: 'ELABORAZIONE...',

    LABEL_EMAIL: 'EMAIL',
    LABEL_PASSWORD: 'PASSWORD',
    LABEL_NAME: 'NOME',
    LABEL_SURNAME: 'COGNOME',
    LABEL_PHONE: 'TELEFONO',
    LABEL_GENDER: 'SESSO',
    LABEL_RANKING_INITIAL: 'RANKING INIZIALE',
    LABEL_PREFERRED_SIDE: 'LATO PREFERITO',
    LABEL_DOMINANT_HAND: 'MANO DOMINANTE',

    PLACEHOLDER_EMAIL: 'EMAIL',
    PLACEHOLDER_PASSWORD: 'PASSWORD',
    PLACEHOLDER_NAME: 'NOME',
    PLACEHOLDER_SURNAME: 'COGNOME',
    PLACEHOLDER_PHONE: 'TELEFONO',
    PLACEHOLDER_RANKING: 'RANKING INIZIALE',
    PLACEHOLDER_TELEFONO: 'TELEFONO',

    OPTION_GENDER_MALE: 'MASCHILE',
    OPTION_GENDER_FEMALE: 'FEMMINILE',
    OPTION_SIDE_LEFT: 'LATO SX',
    OPTION_SIDE_RIGHT: 'LATO DX',
    OPTION_SIDE_BOTH: 'BOTH',
    OPTION_HAND_RIGHT: 'DESTRO',
    OPTION_HAND_LEFT: 'MANCINO',

    PRIVACY_CHECKBOX_LABEL: 'Ho letto e accetto la ',
    PRIVACY_CONSENT: "e acconsento al trattamento dei miei dati personali per la gestione del servizio.",
    PRIVACY_POLICY_LINK: 'Privacy Policy',

    PROFILE_UPDATE_SUCCESS: 'Profilo aggiornato con successo!',
    PROFILE_UPDATE_ERROR: 'Errore durante il salvataggio: ',
    PROFILE_TITLE: 'Profilo',
    PROFILE_LOADING: 'Caricamento profilo...',
  },

  // ---------------------------------------------------------------------------
  // UI — Componenti generici
  // ---------------------------------------------------------------------------
  ui: {
    // Back to home
    BACK_TO_HOME: '← TORNA ALLA HOME',
    BACK: 'INDIETRO',

    // Paginazione
    PAGINATION_FIRST: 'Prima Pagina',
    PAGINATION_PREV: 'Precedente',
    PAGINATION_NEXT: 'Successiva',
    PAGINATION_LAST: 'Ultima Pagina',
    PAGINATION_PAGE: 'Pagina',

    // Cerca
    SEARCH_PLACEHOLDER: 'CERCA ATLETA PER NOME O COGNOME...',
    SEARCH_PLACEHOLDER_HISTORY: 'FILTRA STORICO PER NOME GIOCATORE...',
    SEARCH_PLACEHOLDER_PLAYER: 'Cerca nome...',
    SEARCH_DESELECT: '-- DESELEZIONA ({placeholder}) --',

    // Risultati vuoti
    EMPTY_NO_RESULTS: 'Nessun risultato',
    EMPTY_NO_PLAYERS: 'Nessun atleta corrisponde alla ricerca',
    EMPTY_NO_MATCHES: 'Nessun match in bacheca',
    EMPTY_NO_MATCHES_FILTERED: 'Nessun match registrato corrisponde ai criteri cercati',
    EMPTY_NO_LOGS: 'Nessun registro trovato con i filtri attuali',
    EMPTY_NO_PLAYERS_PAGE: 'Nessun atleta trovato in questa pagina.',
    EMPTY_NO_MANAGERS: 'Nessun gestore registrato.',
    EMPTY_NO_MANAGERS_HINT: 'Utilizza il pulsante "Invita Gestore" per aggiungerne uno.',
    EMPTY_NO_CLUBS: 'Nessun circolo registrato',

    // Login prompt
    LOGIN_PROMPT: 'Accedi per visualizzare lo storico personale.',
    LOGIN_REQUIRED: 'Devi effettuare il login',

    // Wait / loading
    WAIT: 'ATTENDI...',
    LOADING: 'Caricamento...',

    // Generali
    CANCEL: 'Annulla',
    SAVE: 'Salva',
    CONFIRM: 'CONFERMA',
    CLOSE: 'Chiudi',
    SEND: 'INVIA',
    SENDING: 'INVIO...',

    // Club filter
    CLUB_FILTER_NONE: 'NESSUN CIRCOLO DEFINITO',
    CLUB_FILTER_DISABLED_CLUB: 'Circolo assegnato',
    CLUB_FILTER_LOCKED: 'Bloccato',
    CLUB_LOCATION_ND: 'Location N/D',
    CLUB_FIELD_TBD: 'CAMPO DA DEFINIRE',
    CLUB_DA_DEFINIRE: 'Da definire',

    // Livello
    LEVEL_LABEL: 'LIVELLO:',
    LEVEL_UNDEFINED: 'DA DEFINIRE',
    LEVEL_MATCH_LABEL: 'LIVELLO MATCH:',
    LEVEL_RANGE_LABEL: 'RANGE CONSENTITO:',

    // Slot filter
    SLOT_ALL: 'Tutti',
    SLOT_FREE: 'Liberi',

    // Level filter
    LEVEL_COMPATIBLE: 'Compatibile',

    // Campi
    COURT_INDOOR: '🏠 COPERTO',
    COURT_OUTDOOR: '☀️ SCOPERTO',
    COURT_INDOOR_LABEL: '🏠 COPERTO',
    COURT_OUTDOOR_LABEL: '☀️ SCOPERTO',
    COURT_INDOOR_UPPER: 'COPERTO',
    COURT_OUTDOOR_UPPER: 'SCOPERTO',
    COURT_TITLE_OUTDOOR: '☀️ SCOPERTO',
    COURT_TITLE_INDOOR: '🏠 COPERTO',
  },

  // ---------------------------------------------------------------------------
  // TOPBAR / NAV — Navigazione principale
  // ---------------------------------------------------------------------------
  nav: {
    TAB_RANKING: 'Rankings',
    TAB_MATCHES: 'Match',
    TAB_RESULTS: 'Risultati',
    TAB_PLAYERS: 'Giocatori',
    TAB_ADMIN: 'Admin',

    // Sotto-tab classifica
    FILTER_GENDER_MALE: 'Maschile',
    FILTER_GENDER_FEMALE: 'Femminile',
    FILTER_GENDER_ALL: 'Tutti',

    // Ordinamento classifica
    SORT_POINTS: 'Punti',
    SORT_MATCHES: 'Match',
    SORT_WIN_RATE: 'Win %',

    // Risultati — Filtri
    RESULT_ALL: 'Tutti i Risultati',
    RESULT_MY_CLUBS: 'I Miei Circoli',
    RESULT_MY_MATCHES: 'I Miei Match',

    // Admin
    ADMIN_PLAYERS: 'Gestione Atleti',
    ADMIN_MANAGERS: 'Gestione Gestori',
    ADMIN_LOGS: 'Registro Attività',
    ADMIN_CLUBS: 'Gestione Circoli',
    ADMIN_AREA: 'Area Amministrativa Federale',
    ADMIN_AUDIT_TITLE: 'Registro Attività',
    ADMIN_AUDIT_SUBTITLE: 'Audit di sistema - Tracciamento operazioni',
  },

  // ---------------------------------------------------------------------------
  // PLAYER — Schede giocatore, statistiche
  // ---------------------------------------------------------------------------
  player: {
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

    // Titoli
    TITLE_KING_SX: 'KING SX',
    TITLE_KING_DX: 'KING DX',
    TITLE_KING_MIX: 'KING MIX',
    TITLE_FAN_SX: 'FAN SX',
    TITLE_FAN_DX: 'FAN DX',
    TITLE_FAN_MIX: 'FAN MIX',

    // Statistiche
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

    // Squadre
    TEAM_A: 'TEAM A',
    TEAM_B: 'TEAM B',
    TEAM_A_BLUE: 'TEAM A (BLU)',
    TEAM_B_RED: 'TEAM B (ROSSO)',
    WINNER: 'WINNER',
    PLAYER_SX: 'GIOCATORE SX',
    PLAYER_DX: 'GIOCATORE DX',
    VS: 'VS',

    // Avatar
    AVATAR_UPLOAD: 'Carica foto',
    AVATAR_CHANGE: 'Cambia foto',
  },

  // ---------------------------------------------------------------------------
  // FORM — Etichette form generiche
  // ---------------------------------------------------------------------------
  form: {
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

    // Tipo partita
    TYPE_MALE: 'MASCHILE',
    TYPE_FEMALE: 'FEMMINILE',
    TYPE_MIXED: 'MISTO',

    // Regolamento
    RULE_RANKED: '🔥 Classificata',
    RULE_RANKED_DESC: "Incide sull'Elo",
    RULE_FRIENDLY: '🤝 Amichevole',
    RULE_FRIENDLY_DESC: 'Nessun vincolo',

    // Campi
    COURT_INDOOR: '🏠 COPERTO',
    COURT_OUTDOOR: '☀️ SCOPERTO',

    // Azioni
    BUTTON_CREATE_NEW: 'Nuova Partita',
    BUTTON_SUBMIT: 'Crea',
    BUTTON_SAVE: 'Salva',

    // Creazione nuova partita
    CREATE_TITLE: 'Nuova Partita',
    CREATING: 'ATTENDI...',
    ERROR_LOADING: 'Errore nel caricamento dei dati:',

    // Invito manager
    INVITE_TITLE: 'Nuovo Gestore',
    INVITE_SUCCESS: '✅ Invito inviato con successo!',
    INVITE_SUBMIT: 'INVIA INVITO',
    INVITE_PLACEHOLDER_CLUB: '-- Seleziona un circolo --',

    // Admin player edit
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

    // Manager invite modal
    MANAGER_INVITE_TITLE: 'Nuovo Gestore',
    MANAGER_INVITE_SUCCESS: '✅ Invito inviato con successo!',
    MANAGER_INVITE_CANCEL: 'Annulla',
    MANAGER_INVITE_SUBMIT: 'INVIA INVITO',
  },

  // ---------------------------------------------------------------------------
  // ADMIN — Pannello amministrativo
  // ---------------------------------------------------------------------------
  admin: {
    PAGE_TITLE_CLUBS: 'Gestione Circoli',
    PAGE_TITLE_MANAGERS: 'Gestione Gestori',
    PAGE_TITLE_PLAYERS: 'Gestione Atleti',
    PAGE_TITLE_LOGS: 'Registro Attività',

    BUTTON_INVITE_MANAGER: '➕ INVITA GESTORE',
    BUTTON_NEW_CLUB: '➕ Nuovo Circolo',

    // Colonne tabella log
    LOG_COL_DATE: 'Data',
    LOG_COL_ACTION: 'Azione',
    LOG_COL_DETAILS: 'Dettagli',
    LOG_OPERATOR: 'Operatore: {name}',

    // Filtri log
    LOG_FILTER_SEARCH: 'Cerca nei log...',
    LOG_FILTER_TYPE: 'Tipo',
    LOG_FILTER_TYPE_ALL: 'Tutti',
  },

  // ---------------------------------------------------------------------------
  // WHATSAPP — Template messaggio condivisione
  // ---------------------------------------------------------------------------
  whatsapp: {
    BUTTON_SHARE: '💬 CONDIVIDI CONVOCAZIONE',
    MESSAGE_TITLE: '🎾 *RanKING Padel - Convocazione Match* 🎾',
    LABEL_DATE: '📅 *Data:*',
    LABEL_CLUB: '📍 *Campo:*',
    LABEL_COURT: '🏟️ *Campo:*',
    LABEL_LOCATION: '🗺️ *Posizione:*',
    LABEL_LEVEL: '📊 *Livello Attuale:*',
    LABEL_TEAM_A: '👥 *SQUADRA A:*',
    LABEL_TEAM_B: '👥 *SQUADRA B:*',
    LABEL_INFO: '👉 *Tutte le info e gestione match qui:*',
    SLOT_FREE: 'Slot Libero',
    COURT_INDOOR: 'Coperto 🌧️',
    COURT_OUTDOOR: 'Scoperto ☀️',
  },

  // ---------------------------------------------------------------------------
  // AUDIT LOG — Descrizioni per le tipologie di azioni
  // ---------------------------------------------------------------------------
  audit: {
    ACTION_MATCH_DELETED: 'MATCH_DELETED',
    ACTION_MATCH_CREATED: 'MATCH_CREATED',
    ACTION_MATCH_RESOLVED: 'MATCH_RESOLVED',
    ACTION_MATCH_UPDATED: 'MATCH_UPDATED',
    ACTION_PLAYER_LEFT: 'PLAYER_LEFT_MATCH',
    ACTION_PLAYER_JOINED: 'PLAYER_JOINED_MATCH',
    ACTION_MATCH_DELETED_AUTO: 'MATCH_DELETED_AUTO',
    ACTION_LOGIN: 'LOGIN',
    ACTION_REGISTRATION: 'REGISTRATION',

    LABEL_QUALIFICA_ADMIN: "L'admin",
    LABEL_QUALIFICA_MANAGER: 'Il Club Manager',
    LABEL_QUALIFICA_PLAYER: 'Il giocatore',
    LABEL_QUALIFICA_ORGANIZER: "L'Organizzatore",
    LABEL_QUALIFICA_GIOCATORE: 'Il Giocatore',

    LOG_MATCH_DELETED: '{qualifica} {operatore} ha annullato la partita in programma: {dettagli}',
    LOG_MATCH_CREATED: '{qualifica} {operatore} ha organizzato una nuova partita {tipo}: {dettagli} - {tipoMatch} - {data}',
    LOG_MATCH_RESOLVED_FRIENDLY: 'Il {qualifica} {operatore} ha registrato l\'AMICHEVOLE: {esito} [{punteggio}]. Nessuna variazione.',
    LOG_MATCH_RESOLVED_RANKED: 'Il {qualifica} {operatore} ha chiuso il match: {esito} [{punteggio}]. Elo: {rankingText}',
    LOG_PLAYER_LEFT: 'Il giocatore {nome} {punteggio} ha lasciato la partita (slot {slot}).',
    LOG_PLAYER_LEFT_ORGANIZER_TRANSFER: ' Il ruolo di Organizzatore è passato automaticamente al giocatore ID: {id}.',
    LOG_PLAYER_JOINED: 'Il giocatore {nome} {punteggio} si è unito alla partita nello slot {slot}.',
    LOG_MATCH_DELETED_AUTO: 'Match eliminato automaticamente perché vuoto dopo l\'uscita dell\'ultimo giocatore.',
    LOG_MATCH_UPDATED: '{qualifica} {operatore} ha modificato il match: {modifiche}',
  },
} as const;

// ============================================================================
// HELPER: Type-safe dictionary resolver
// ============================================================================
export function t<C extends DictCategory, K extends DictKey<C>>(
  category: C,
  key: K,
  ...args: Record<string, string | number>[]
): string {
  let value = dictionary[category][key] as string;

  // Simple template var replacement: {varName}
  if (args.length > 0) {
    for (const [k, v] of Object.entries(args[0])) {
      value = value.replace(`{${k}}`, String(v));
    }
  }

  return value;
}

export default dictionary;
