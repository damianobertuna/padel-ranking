# Test Suite Hardening — Task List

> Generated from QA review of `match-actions.ts`, `player-actions.ts`, and `lib/rankingCalc.ts`.
> Priority: Critical score validation gaps, concurrency risks, and mock fragility.

---

## Phase 1 — Structural Refactors (Enable Testability)

| # | Task | File | Description |
|---|------|------|-------------|
| 1.1 | Export `evaluateMatchScore` | `actions/match-actions.ts` | Add `export` keyword. Pure function — no reason to keep it private. |
| 1.2 | Export `isSetValid` | `actions/match-actions.ts` | Same rationale. Enables boundary-value testing without Supabase mocks. |
| 1.3 | Export `calculateCompetitiveDeltas` | `actions/match-actions.ts` | Enables isolated testing of ELO delta logic with controlled player arrays. |
| 1.4 | Create a shared mock factory | `tests/helpers/supabase-mock.ts` (new) | Build a reusable `createMockSupabase()` that tracks `.eq()` arguments, supports per-table response overrides, and can simulate errors. Eliminates copy-paste mock setup across test files. |

---

## Phase 2 — Unit Tests: Score Validation (`evaluateMatchScore` + `isSetValid`)

| # | Task | Test File | Scenarios |
|---|------|-----------|-----------|
| 2.1 | Empty/insufficient input | `actions/match-actions.test.ts` | `[]`, single set, `null`, `undefined` |
| 2.2 | Invalid normal sets (set 1 & 2) | same | `8-6`, `6-6`, `7-4`, `7-3`, `5-5`, `-1-6`, `NaN` |
| 2.3 | Valid normal sets | same | `6-0`, `6-1`, `6-2`, `6-3`, `6-4`, `7-5`, `7-6` |
| 2.4 | Third set: standard wins | same | `6-0` through `6-4`, `7-5`, `7-6` |
| 2.5 | Third set: super tie-break valid | same | `10-0`, `10-8`, `12-10`, `15-13` |
| 2.6 | Third set: super tie-break invalid | same | `10-9`, `9-7` (< 10), `15-12` (gap != 2 and winner > 10) |
| 2.7 | Set-level tie detection | same | 1-1 in sets with no 3rd set → throw "Pareggio" |
| 2.8 | Three sets: correct winner determination | same | A wins 2-1, B wins 2-1 |

---

## Phase 3 — Unit Tests: `computeKingAndFanalino`

| # | Task | Test File (new) | Scenarios |
|---|------|-----------------|-----------|
| 3.1 | Create test file | `lib/rankingCalc.test.ts` | — |
| 3.2 | Single player per side | same | Only player → is King, is NOT Fanalino (no gap) |
| 3.3 | All players same ranking | same | Everyone is King, nobody is Fanalino |
| 3.4 | Clear hierarchy | same | Distinct rankings → top is King, bottom is Fanalino |
| 3.5 | Tied Kings | same | Two players share max ranking → both are King |
| 3.6 | Tied Fanalinos | same | Two players share min ranking → both are Fanalino |
| 3.7 | "Both" side players | same | Players with `preferred_side: 'Both'` evaluated independently |
| 3.8 | Empty player array | same | Returns empty arrays, no crash |
| 3.9 | Mixed population: Left + Right + Both | same | Titles assigned correctly per category |

---

## Phase 4 — Unit Tests: `calculateCompetitiveDeltas` (ELO Rules)

| # | Task | Test File | Scenarios |
|---|------|-----------|-----------|
| 4.1 | Normal vs Normal | `actions/match-actions.test.ts` | +0.05 / -0.05 |
| 4.2 | Normal beats King | same | Winners get +0.10 |
| 4.3 | Normal beats 2 Kings | same | Winners +0.10, Losers -0.10 |
| 4.4 | King vs King (neutralization) | same | +0.05 / -0.05 |
| 4.5 | Fanalino wins | same | Winners get +0.10 |
| 4.6 | Fanalino vs Fanalino (neutralization) | same | +0.05 / -0.05 |
| 4.7 | King + Fanalino on same team | same | Verify edge case: a player cannot be both King and Fanalino by definition |
| 4.8 | Cross-category King neutralization | same | King Left vs King Both → neutralize |

---

## Phase 5 — Integration Tests: Authorization Boundaries

| # | Task | Test File | Scenarios |
|---|------|-----------|-----------|
| 5.1 | Unauthenticated user (null user) | `actions/match-actions.test.ts` | Every exported action throws "non autenticato" |
| 5.2 | User with no player profile | same | Auth succeeds but no player row → throws "Profilo non trovato" |
| 5.3 | `deletePendingMatch` by admin | same | Allowed |
| 5.4 | `deletePendingMatch` by player in match | same | Allowed |
| 5.5 | `deletePendingMatch` by club_manager of the club | same | Allowed |
| 5.6 | `deletePendingMatch` by outsider | same | Throws "ACCESSO NEGATO" |
| 5.7 | `deletePendingMatch` on completed match | same | Throws "solo partite in programma" |
| 5.8 | `updateMatchPlayers` full coverage | same | Currently **zero** tests — add admin, organizer, player-in-match, outsider, club_manager cross-club |

---

## Phase 6 — Integration Tests: End-to-End Data Flow

| # | Task | Test File | Scenarios |
|---|------|-----------|-----------|
| 6.1 | Ranking actually updates per player | `actions/match-actions.test.ts` | Assert `supabaseAdmin.from('players').update({ ranking: X }).eq('id', playerId)` is called with the **correct new ranking** for each of the 4 players |
| 6.2 | Friendly match: zero player ranking updates | same | Verify `.update()` is **never** called on the `players` table |
| 6.3 | Audit log receives correct snapshot | same | Assert `logAction` payload contains `player_rankings` array with correct old/new values |
| 6.4 | Match status transitions correctly | same | Verify the match row gets `status: 'completed'`, `winning_team`, `score`, all deltas |
| 6.5 | `revalidatePath` called for all affected routes | same | `/`, `/admin/logs`, `/player/1`, `/player/2`, `/player/3`, `/player/4` |

---

## Phase 7 — Concurrency & Error Handling

| # | Task | Test File | Scenarios |
|---|------|-----------|-----------|
| 7.1 | Race condition: double resolution | `actions/match-actions.test.ts` | Simulate two calls — second one should fail with "già stata risolta" because `status !== 'pending'` |
| 7.2 | Supabase error on match update | same | Mock `.update()` returning `{ error: { message: '...' } }` → throws |
| 7.3 | Supabase error on player ranking update | same | One of the `Promise.all` player updates fails → verify behavior (currently unhandled!) |
| 7.4 | `logAction` failure on `deletePendingMatch` | same | Should throw and **prevent** deletion (current code behavior) |
| 7.5 | `logAction` failure on `resolveMatchWithRanking` | same | Should NOT prevent resolution (current code only logs warning) — verify this contract |
| 7.6 | Match with fewer than 4 valid players | same | `playersInMatch.length !== 4` → throws |
| 7.7 | `createPendingMatch` with empty slot array | same | `.in('id', [])` behavior — verify no crash or accidental full-table scan |

---

## Phase 8 — Mock Quality Improvements

| # | Task | File | Description |
|---|------|------|-------------|
| 8.1 | Track `.eq()` call arguments | `tests/helpers/supabase-mock.ts` | Record `[column, value]` pairs so tests can assert `.eq('id', 'match-123')` was passed |
| 8.2 | Separate admin vs regular client | All test files | Use two distinct mock instances so tests can detect when wrong client is used |
| 8.3 | Add error simulation capability | `tests/helpers/supabase-mock.ts` | `.mockNextError('table', { code: '23503', message: '...' })` for FK violations etc. |
| 8.4 | Remove `.then()` pattern from mocks | All test files | Replace with proper `async/await` return values — current `.then` hack makes mocks hard to reason about |

---

## Phase 9 — `player-actions.test.ts` Expansion

| # | Task | Scenarios |
|---|------|-----------|
| 9.1 | `deletePlayerByAdmin`: success path | Admin deletes player → DB call + audit log |
| 9.2 | `deletePlayerByAdmin`: FK constraint (23503) | Player has matches → user-friendly error |
| 9.3 | `deletePlayerByAdmin`: non-admin attempt | Throws "non autorizzata" |
| 9.4 | `updateOwnProfile`: ownership check | User can't edit another player's profile |
| 9.5 | `updateOwnProfile`: avatar upload flow | File provided → storage upload → public URL stored |
| 9.6 | `updateOwnProfile`: no avatar change | Existing `avatar_url` preserved |
| 9.7 | `updatePlayerAvatar`: cross-user attempt | Throws "non puoi modificare" |

---

## Execution Priority

1. **Phase 1** first (5 min) — unlocks everything else
2. **Phase 2** next (highest ROI — pure logic, zero mock complexity, catches real bugs)
3. **Phase 3** (also pure logic, quick win)
4. **Phase 7.1–7.3** (concurrency/error paths are where production bugs live)
5. **Phase 5–6** (integration confidence)
6. **Phase 8** (mock refactor — do this when touching existing tests)
7. **Phase 4, 9** (fill remaining gaps)

---

## Notes

- **Production bug risk:** The `resolveMatchWithRanking` function has a TOCTOU race condition. Between reading `match.status === 'pending'` and calling `.update({ status: 'completed' })`, another request can resolve the same match. Fix: use `.update().eq('status', 'pending')` and check affected row count.
- **Mock fragility:** Current `.eq()` chains are no-ops — they don't filter anything. This means tests pass even if the code targets the wrong database row.
- **`updateMatchPlayers`** has zero test coverage despite being a complex action with multiple authorization paths.
