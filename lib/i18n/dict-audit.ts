// ============================================================================
// DICT-AUDIT — Audit log action descriptions and helpers
// ============================================================================

const dictAudit = {
  ACTION_MATCH_DELETED: 'MATCH_DELETED',
  ACTION_MATCH_CREATED: 'MATCH_CREATED',
  ACTION_MATCH_RESOLVED: 'MATCH_RESOLVED',
  ACTION_MATCH_UPDATED: 'MATCH_UPDATED',
  ACTION_PLAYER_LEFT: 'PLAYER_LEFT_MATCH',
  ACTION_PLAYER_JOINED: 'PLAYER_JOINED_MATCH',
  ACTION_MATCH_DELETED_AUTO: 'MATCH_DELETED_AUTO',
  ACTION_LOGIN: 'USER_LOGIN',
  ACTION_REGISTRATION: 'USER_REGISTERED',

  LABEL_QUALIFICA_ADMIN: "L'admin",
  LABEL_QUALIFICA_MANAGER: 'Il Club Manager',
  LABEL_QUALIFICA_PLAYER: 'Il giocatore',
  LABEL_QUALIFICA_ORGANIZER: "L'Organizzatore",
  LABEL_QUALIFICA_GIOCATORE: 'Il Giocatore',

  LOG_MATCH_DELETED: '{qualifica} {operatore} ha annullato la partita in programma: {dettagli}',
  LOG_MATCH_CREATED: '{qualifica} {operatore} ha organizzato una nuova partita {tipo}: {dettagli} - {tipoMatch} - {data}',
  LOG_MATCH_RESOLVED_FRIENDLY: "Il {qualifica} {operatore} ha registrato l'AMICHEVOLE: {esito} [{punteggio}]. Nessuna variazione.",
  LOG_MATCH_RESOLVED_RANKED: 'Il {qualifica} {operatore} ha chiuso il match: {esito} [{punteggio}]. Elo: {rankingText}',
  LOG_PLAYER_LEFT: 'Il giocatore {nome} {punteggio} ha lasciato la partita (slot {slot}).',
  LOG_PLAYER_LEFT_ORGANIZER_TRANSFER: ' Il ruolo di Organizzatore è passato automaticamente al giocatore ID: {id}.',
  LOG_PLAYER_JOINED: 'Il giocatore {nome} {punteggio} si è unito alla partita nello slot {slot}.',
  LOG_MATCH_DELETED_AUTO: "Match eliminato automaticamente perché vuoto dopo l'uscita dell'ultimo giocatore.",
  LOG_MATCH_UPDATED: '{qualifica} {operatore} ha modificato il match: {modifiche}',

  LABEL_QUALIFICA_ADMIN_PRONOUN: "L'",
  LABEL_QUALIFICA_MANAGER_FULL: 'Il Club Manager',
  LABEL_QUALIFICA_PLAYER_FULL: 'Il giocatore',
  LABEL_QUALIFICA_GIOCATORE_FULL: 'Il Giocatore',

  QUALIFICA_ADMIN: 'admin',
  QUALIFICA_MANAGER: 'Gestore Campo',
  QUALIFICA_PLAYER: 'Giocatore',

  LOG_ADMIN_ACTION: "L'admin {name}",
  LOG_MANAGER_ACTION: 'Il Club Manager {name}',
  LOG_PLAYER_ACTION: 'Il giocatore {name}',
  LOG_ORGANIZER_ACTION: "L'Organizzatore {name}",

  LOG_ADMIN_UPDATE_PLAYER: 'Admin {admin} ha modificato {target}: {changes}',
  LOG_ADMIN_SAVED_PLAYER: 'Admin {admin} ha salvato il profilo di {target} senza modifiche.',
  LOG_ADMIN_DELETE_PLAYER: 'Admin {admin} ha eliminato definitivamente il giocatore {target}.',
  LOG_ADMIN_DELETE_MANAGER: 'Admin {admin} ha eliminato il gestore {target}.',
  LOG_ADMIN_UPDATE_MANAGER: 'Admin {admin} ha modificato il gestore {target}: {changes}',
  LOG_ADMIN_UPDATE_MANAGER_SIMPLE: 'Admin {admin} ha modificato il gestore {target}.',

  LOG_PLAYER_UPDATE_OWN: 'Il giocatore {name} ha aggiornato autonomamente i propri dati personali.',
  LOG_PLAYER_UPDATE_AVATAR: 'Il giocatore {name} ha aggiornato la propria foto profilo.',
  LOG_MANAGER_UPDATE_OWN: 'Il Club Manager {name} ha aggiornato il proprio nome.',

  LOG_USER_LOGIN: 'Accesso effettuato: {qualifica} {operatore}',
  LOG_REGISTRATION: 'Nuovo giocatore registrato: {name}',

  LOG_CLUB_CREATED: 'Creato circolo: {name}',
  LOG_CLUB_DELETED: 'Circolo eliminato: {name}',

  LOG_UNKNOWN_USER: 'Utente Sconosciuto',
  LOG_AMBIGUOUS: 'Amministratore',
} as const;

export default dictAudit;
