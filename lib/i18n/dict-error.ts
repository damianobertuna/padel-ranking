// ============================================================================
// DICT-ERROR — Error messages and violations
// ============================================================================

const dictError = {
  GENERIC: 'Si è verificato un errore.',
  UNKNOWN: 'Errore sconosciuto',
  INTERNAL_SERVER: 'Errore interno del server',

  AUTH_REQUIRED: "Devi effettuare l'accesso.",
  AUTH_REQUIRED_ALT: "Utente non autenticato",
  AUTH_LOGIN_REQUIRED: "Accesso negato: devi effettuare il login per modificare una partita.",
  AUTH_PROFILE_NOT_RECOGNIZED: "ACCESSO NEGATO: Profilo utente non riconosciuto.",
  AUTH_SESSION_ERROR: 'Errore di validazione: ',
  AUTH_TOKEN_EXPIRED: 'Nessun token valido trovato. Il link potrebbe essere scaduto.',
  LOGIN_FAILED: 'Logging fallito: Utente non autenticato',

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

  PLAYER_NOT_FOUND: 'Giocatore non trovato',
  PLAYER_DUPLICATE: 'ERRORE: GIOCATORE DUPLICATO.',
  PLAYER_DUPLICATE_SLOT: 'ERRORE: Non puoi inserire lo stesso giocatore in più slot.',
  PLAYER_ALREADY_JOINED: 'Sei già iscritto a questa partita.',
  PLAYER_NOT_IN_MATCH: "Impossibile uscire: non sei iscritto a questa partita.",
  PLAYER_NO_SLOT_AVAILABLE: 'Impossibile unirsi: nessuno slot disponibile per la tua preferenza (',
  PLAYER_NO_SLOT_AVAILABLE_SUFFIX: ').',
  PLAYER_LEVEL_ERROR: 'ERRORE: DIVARIO TECNICO > 0.25.',
  PLAYER_MUST_OCCUPY_SLOT: 'OPERAZIONE NEGATA: Devi occupare almeno uno slot per creare una partita.',

  MANAGER_CANNOT_JOIN: 'I Club Manager non possono unirsi a una partita perché non hanno un profilo giocatore.',
  MANAGER_CANNOT_LEAVE: 'I Club Manager non possono abbandonare una partita perché non sono in campo.',
  MANAGER_CANNOT_MOVE_CLUB: 'ACCESSO NEGATO: Non puoi spostare la partita in un circolo che non gestisci.',

  PERMISSION_DENIED: 'ACCESSO NEGATO',
  PERMISSION_DENIED_MANAGE: 'ACCESSO NEGATO: Non hai i permessi per gestire questa partita.',
  PERMISSION_DENIED_DELETE: "ACCESSO NEGATO: Non hai i permessi per cancellare questa partita.",
  PERMISSION_DENIED_EDIT: 'ACCESSO NEGATO: Non sei autorizzato a gestire o modificare questa partita.',
  PERMISSION_DENIED_RESOLVE: 'ACCESSO NEGATO: Non sei autorizzato a inserire il risultato per questa partita.',
  PERMISSION_DENIED_RESOLVE_VIOLATION: 'VIOLAZIONE DI SICUREZZA: Non sei autorizzato a inserire il risultato per questa partita.',
  PERMISSION_DENIED_ADMIN: 'Accesso Negato.',
  PERMISSION_DENIED_NOT_ADMIN: "Accesso negato: non sei un amministratore.",

  DB_ERROR_PREFIX: 'Errore database: ',
  DB_UPDATE_FAILED: 'Errore aggiornamento slot: ',
  DB_DELETE_FAILED: 'Errore eliminazione match vuoto: ',
  DB_JOIN_FAILED: "Errore durante l'iscrizione: ",
  DB_MATCH_DELETE_FAILED: "Errore database: ",
  DB_LOG_FAILED: 'ERRORE CRITICO SCRITTURA AUDIT LOG',
  DB_LOG_CREATE_FAILED: 'ERRORE LOG CREAZIONE MATCH:',

  MANAGER_INVITE_FIELDS_REQUIRED: 'Compila tutti i campi: nome, cognome, circolo ed email.',
  MANAGER_INVITE_GENERIC: "Errore durante l'invio dell'invito.",

  MATCH_CREATE_ERROR: 'Errore durante la creazione: ',
  MATCH_LOAD_ERROR: 'Errore caricamento dati.',
  MATCH_DELETE_CONFIRM: 'ELIMINARE DEFINITIVAMENTE IL MATCH?',
  MATCH_DELETE_ERROR_PREFIX: 'ERRORE: ',
  MATCH_DELETE_EMPTY_CONFIRM: 'Eliminare partita?',

  PLAYER_DELETE_ADMIN_SUCCESS: 'Giocatore {name} eliminato con successo.',
  PLAYER_DELETE_BLOCKED: "Impossibile eliminare: questo giocatore ha già disputato delle partite. Se è un duplicato, contatta l'assistenza tecnica.",

  MANAGER_DELETE_SUCCESS: 'Gestore {name} eliminato con successo.',
  MANAGER_NOT_FOUND: 'Gestore non trovato.',
  MANAGER_RLS_BLOCKED: 'ACCESSO NEGATO: Impossibile aggiornare il profilo. Verifica i permessi (RLS).',
  MANAGER_INVITE_DB_ERROR: "Errore durante l'invio dell'invito.",

  CLUB_NAME_REQUIRED: 'Il nome del circolo è obbligatorio.',
  CLUB_CREATE_ADMIN_ONLY: 'Accesso negato: Solo gli amministratori possono aggiungere campi.',
  CLUB_DELETE_ERROR: 'Impossibile eliminare il circolo: ',
  CLUB_DELETE_CONFIRM: 'Eliminare questo circolo?',

  AVATAR_FILE_TOO_LARGE: 'MAX 2MB',
  AVATAR_FORMAT_ERROR: 'SOLO IMMAGINI',

  AUTH_REQUIRED_OWN_PROFILE: "Devi effettuare l'accesso per modificare il tuo profilo.",
  AUTH_NOT_OWNER: 'Non sei autorizzato a modificare il profilo di un altro giocatore.',
  AUTH_SAME_PROFILE_AVATAR: 'Non puoi modificare la foto profilo di un altro giocatore.',
  AUTH_ACTION_NOT_ALLOWED: 'Azione non autorizzata.',

  ERROR_SETS_INVALID_FORMAT: 'I dati dei set sono incompleti. Almeno i primi 2 set sono obbligatori.',

  NOT_FOUND_404: 'ERRORE 404',
  NOT_FOUND_REPORT: 'Referto non trovato o partita non valida.',
} as const;

export default dictError;
