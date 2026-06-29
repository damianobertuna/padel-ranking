// ============================================================================
// RanKING Padel — Dizionario Centralizzato (IT locale)
// ============================================================================
// Composes all category dictionaries into a single object.
// Use the `t()` helper for type-safe string resolution.
//
// Esempi:
//   t('match', 'TYPE_FRIENDLY')  => "Amichevole"
//   t('error', 'MATCH_NOT_FOUND') => "Match non trovato"
// ============================================================================

import dictMatch from './dict-match';
import dictError from './dict-error';
import dictAuth from './dict-auth';
import dictUi from './dict-ui';
import dictNav from './dict-nav';
import dictPlayer from './dict-player';
import dictForm from './dict-form';
import dictAdmin from './dict-admin';
import dictWhatsapp from './dict-whatsapp';
import dictAudit from './dict-audit';
import dictStats from './dict-stats';
import dictProfile from './dict-profile';
import dictRanking from './dict-ranking';
import dictUpdatePassword from './dict-update-password';

const dictionary = {
  match: dictMatch,
  error: dictError,
  auth: dictAuth,
  ui: dictUi,
  nav: dictNav,
  player: dictPlayer,
  form: dictForm,
  admin: dictAdmin,
  whatsapp: dictWhatsapp,
  audit: dictAudit,
  stats: dictStats,
  profile: dictProfile,
  ranking: dictRanking,
  updatePassword: dictUpdatePassword,
} as const;

// Types per type-safe dictionary access
export type DictCategory = keyof typeof dictionary;
export type DictKey<C extends DictCategory> = keyof typeof dictionary[C];

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
