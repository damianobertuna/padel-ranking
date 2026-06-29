// ============================================================================
// DICT-UPDATE-PASSWORD — Manager password update page
// ============================================================================

const dictUpdatePassword = {
  WELCOME: 'Benvenuto Gestore',
  VERIFYING: 'Verifica link sicuro in corso...',
  VERIFIED: '✓ Identità verificata. Imposta la tua password.',
  LABEL_NOME: 'Nome',
  LABEL_COGNOME: 'Cognome',
  LABEL_NEW_PASSWORD: 'Nuova Password',
  LABEL_CONFIRM: 'Conferma Password',
  PLACEHOLDER_NOME: 'Mario',
  PLACEHOLDER_COGNOME: 'Rossi',
  ERROR_MIN_LENGTH: 'La password deve avere almeno 6 caratteri.',
  ERROR_MISMATCH: 'Le password non coincidono.',
  ERROR_UPDATE: 'Impossibile aggiornare la password.',
  ERROR_NO_TOKEN: 'Nessun token valido trovato. Il link potrebbe essere scaduto.',
  BUTTON_SAVE: 'Salva e Accedi',
  BUTTON_SAVING: 'Salvataggio...',
} as const;

export default dictUpdatePassword;
