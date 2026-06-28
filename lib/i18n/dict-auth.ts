// ============================================================================
// DICT-AUTH — Login, registration, profile strings
// ============================================================================

const dictAuth = {
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

  UPDATE_PASSWORD_WELCOME: 'Benvenuto Gestore',
  UPDATE_PASSWORD_VERIFYING: 'Verifica link sicuro in corso...',
  UPDATE_PASSWORD_VERIFIED: '✓ Identità verificata. Imposta la tua password.',
  UPDATE_PASSWORD_NEW: 'Nuova Password',
  UPDATE_PASSWORD_CONFIRM: 'Conferma Password',
  UPDATE_PASSWORD_MIN_LENGTH: 'La password deve avere almeno 6 caratteri.',
  UPDATE_PASSWORD_MISMATCH: 'Le password non coincidono.',
  UPDATE_PASSWORD_ERROR: 'Impossibile aggiornare la password.',
} as const;

export default dictAuth;
