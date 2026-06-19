# Requirements Document

## Introduction

This spec defines the requirements for a comprehensive test suite improvement of the padel-ranking application. The goal is to harden the existing test infrastructure by identifying and filling coverage gaps in the core ranking engine, match logging system, and authorization layer. The improvements focus on edge cases (concurrent submissions, null inputs, extreme ranking differences, tie-breakers), Supabase mock quality to prevent false positives, and integration tests that verify end-to-end ranking update behavior after match state changes.

## Glossary

- **Test_Suite**: The collection of Vitest unit, integration, and property-based tests covering the padel-ranking application
- **Ranking_Engine**: The pure business logic in `lib/rankingCalc.ts` and `lib/matchRules.ts` responsible for computing King/Fanalino titles and ELO deltas
- **Match_Actions**: The server actions in `actions/match-actions.ts` responsible for match lifecycle (create, join, leave, resolve, delete)
- **Supabase_Mock**: The mock objects simulating Supabase client behavior (query chaining, auth, storage) used in unit tests
- **Score_Validator**: The `evaluateMatchScore` and `isSetValid` helper functions that validate padel set scores
- **Authorization_Guard**: The security checks in server actions that verify user identity, role, and match participation before allowing operations
- **Player_Win_Rate_Calculator**: The `calculatePlayerWinRate` function computing a player's win percentage from completed matches
- **Delta_Calculator**: The `calculateCompetitiveDeltas` function in match-actions that applies King/Fanalino bonus/malus rules

## Requirements

### Requirement 1: Score Validation Edge Case Coverage

**User Story:** As a QA lead, I want exhaustive tests for the score validation logic, so that invalid or ambiguous scores are always rejected and valid edge-case scores are always accepted.

#### Acceptance Criteria

1. WHEN a score with negative game values is provided, THE Score_Validator SHALL reject it with an error message indicating the set index and the invalid game values
2. WHEN a score with equal game values in a set (e.g. 6-6 without tiebreak) is provided, THE Score_Validator SHALL reject it with an error message indicating the set index and the invalid game values
3. WHEN a regular set (set 1 or set 2) is provided with a winner score of 6 and loser score of 0 to 4, or a winner score of 7 and loser score of 5 or 6, THE Score_Validator SHALL accept it as valid
4. IF a regular set (set 1 or set 2) is provided with game values that do not match the valid combinations (winner 6, loser 0–4 or winner 7, loser 5–6), THEN THE Score_Validator SHALL reject it with an error message indicating the set index and invalid game values
5. WHEN a third set with a valid Super Tie-Break (winner score >= 10, difference of at least 2, and loser score <= winner minus 2) is provided, THE Score_Validator SHALL accept it
6. IF a third set has a Super Tie-Break where the winner score is below 10, or the difference between winner and loser is less than 2, THEN THE Score_Validator SHALL reject it with an error message indicating the set index and invalid game values
7. WHEN fewer than 2 sets are provided, THE Score_Validator SHALL reject the score with an error message indicating at least 2 sets are required
8. WHEN a score results in equal sets won (1-1 without a third set), THE Score_Validator SHALL reject it with an error message indicating the match cannot end in a tie
9. WHEN more than 3 sets are provided, THE Score_Validator SHALL reject the score as invalid
10. THE Score_Validator SHALL produce a deterministic winning team ('A' or 'B') and a formatted score string in the format "X-Y / X-Y" (with sets separated by " / ") for all valid SetScore arrays

### Requirement 2: Ranking Engine Property-Based Testing

**User Story:** As a QA lead, I want property-based tests for the ranking calculation engine, so that invariants hold across all possible player configurations and ranking distributions.

#### Acceptance Criteria

1. FOR ALL non-empty player arrays where each player has a preferred_side in ('Left', 'Right', 'Both') and a ranking between 1.00 and 10.00, THE Ranking_Engine SHALL assign at least one King per preferred_side category that contains one or more players
2. FOR ALL player arrays where all players in a preferred_side category share the same ranking value, THE Ranking_Engine SHALL assign zero Fanalino entries for that category (since max equals min, no gap exists)
3. FOR ALL player arrays, THE Ranking_Engine SHALL never assign the same player ID to both King and Fanalino arrays within the same preferred_side category
4. FOR ALL MatchContext inputs where winnerIds and loserIds are each non-empty, contain no shared IDs, and kingLeftIds/kingRightIds/lastPlaceIds are subsets of the union of winnerIds and loserIds, THE Ranking_Engine SHALL produce updates where every winner ID receives a delta greater than 0 and every loser ID receives a delta less than 0
5. FOR ALL valid MatchContext inputs as defined in criterion 4, THE Ranking_Engine SHALL produce winner deltas in the set {+0.05, +0.10} and loser deltas in the set {-0.05, -0.10}
6. FOR ALL player arrays containing at least two players in a preferred_side category with distinct ranking values, THE Ranking_Engine SHALL assign at least one Fanalino entry for that category

### Requirement 3: Supabase Mock Fidelity Improvement

**User Story:** As a QA lead, I want Supabase mocks that faithfully replicate real query builder behavior, so that tests do not produce false positives from mock shortcomings.

#### Acceptance Criteria

1. WHEN a Supabase mock receives a `.eq(field, value)` call, THE Supabase_Mock SHALL filter the in-memory data set for that table to only rows where the specified field strictly equals the specified value
2. WHEN a chained query includes `.select().eq().single()`, THE Supabase_Mock SHALL return `{ data: null, error: { code: 'PGRST116' } }` if no matching record exists in the mock data, and SHALL return `{ data: null, error: { code: 'PGRST116' } }` if more than one matching record exists
3. WHEN a mutation (`.update()` or `.delete()`) targets a record that does not exist in the mock data set after applying all chained `.eq()` filters, THE Supabase_Mock SHALL return `{ data: null, error: { code: 'PGRST116' } }` and SHALL NOT modify the mock data set
4. THE Supabase_Mock SHALL expose a factory function that accepts an initial data set keyed by table name and produces a mock client whose method signatures pass TypeScript compilation against the `createClient` return type without type errors
5. IF a test performs a `.from('unknown_table')` call where the table name is not a key in the initial data set, THEN THE Supabase_Mock SHALL throw an error indicating the table is not registered in the mock data set
6. WHEN a chained query includes `.eq().maybeSingle()`, THE Supabase_Mock SHALL return `{ data: null, error: null }` if no matching record exists, and SHALL return `{ data: null, error: { code: 'PGRST116' } }` if more than one matching record exists
7. WHEN multiple `.eq()` filters are chained on the same query, THE Supabase_Mock SHALL apply all filters cumulatively using AND logic, returning only rows that satisfy every specified field-value condition

### Requirement 4: Null and Undefined Input Handling

**User Story:** As a QA lead, I want tests covering null and undefined inputs to all public server actions, so that the system fails gracefully with descriptive errors instead of runtime crashes.

#### Acceptance Criteria

1. WHEN `updatePlayerByAdmin` receives a FormData without a `playerId` field, THE Match_Actions SHALL throw an error with message "ID mancante"
2. WHEN `resolveMatchWithRanking` receives a matchId that does not correspond to any existing record in the matches table, THE Match_Actions SHALL throw an error indicating "Partita non trovata"
3. WHEN `joinMatchAction` is called and `supabase.auth.getUser()` returns a null user, THE Match_Actions SHALL throw an error indicating "Utente non autenticato"
4. WHEN `createPendingMatch` receives player slot values where the authenticated creator's player ID is not included among the non-null selected player IDs, and the creator has neither admin role nor club_manager role for the target club, THE Match_Actions SHALL throw an error indicating the creator must occupy at least one slot
5. WHEN `calculatePlayerWinRate` receives a playerId and an empty match array (length 0), THE Player_Win_Rate_Calculator SHALL return a PlayerWinRateStats object with totalPlayed equal to 0, totalWon equal to 0, totalLost equal to 0, and winRate equal to 0, without throwing an error
6. WHEN `joinMatchAction` is called by an authenticated user whose user_id does not correspond to any record in the players table, THE Match_Actions SHALL throw an error indicating "Profilo giocatore non trovato"

### Requirement 5: Authorization Guard Exhaustive Testing

**User Story:** As a QA lead, I want tests covering every authorization path in match and player actions, so that privilege escalation and unauthorized access are impossible.

#### Acceptance Criteria

1. WHEN a non-admin user calls `updatePlayerByAdmin`, THE Authorization_Guard SHALL throw "Azione non autorizzata"
2. WHEN a non-admin user calls `deletePlayerByAdmin`, THE Authorization_Guard SHALL throw "Azione non autorizzata"
3. WHEN a user calls `updateOwnProfile` with a playerId whose `user_id` does not match the authenticated user's ID, THE Authorization_Guard SHALL throw "Non sei autorizzato a modificare il profilo di un altro giocatore."
4. WHEN a club_manager calls `resolveMatchWithRanking` for a match whose `club_id` does not appear in the `club_managers` table for that player, THE Authorization_Guard SHALL throw "VIOLAZIONE DI SICUREZZA"
5. WHEN a standard user (role "user") calls `deletePendingMatch` for a match where their player ID is not in any of the four team slots and they are not a club_manager of the match's club, THE Authorization_Guard SHALL throw "ACCESSO NEGATO"
6. WHEN a user calls `updateMatchPlayers` without being the organizer, an admin, a club_manager of the match's club, or a participant in a match that has no organizer, THE Authorization_Guard SHALL throw "ACCESSO NEGATO"
7. IF no authenticated session exists when any protected action (`updatePlayerByAdmin`, `deletePlayerByAdmin`, `updateOwnProfile`, `deletePendingMatch`, `resolveMatchWithRanking`, `updateMatchPlayers`) is called, THEN THE Authorization_Guard SHALL throw "Utente non autenticato" or "Non autenticato" before any data mutation occurs
8. WHEN a club_manager calls `updateMatchPlayers` and changes `club_id` to a club where they are not listed in the `club_managers` table, THE Authorization_Guard SHALL throw "ACCESSO NEGATO"
9. WHEN a standard user (role "user") who is not in the match's team slots calls `resolveMatchWithRanking`, THE Authorization_Guard SHALL throw "VIOLAZIONE DI SICUREZZA"

### Requirement 6: Integration Tests for Ranking Update Flow

**User Story:** As a QA lead, I want integration tests that verify end-to-end ranking changes after match resolution, so that the full pipeline (score validation → delta calculation → database update) is tested as a cohesive unit.

#### Acceptance Criteria

1. WHEN a competitive match is resolved with Team A winning, THE Delta_Calculator SHALL produce a delta of +0.05 for each Team A player and -0.05 for each Team B player
2. WHEN a friendly match is resolved, THE Delta_Calculator SHALL produce a delta of 0 for all four players regardless of the winning team
3. WHEN a competitive match is resolved where the losing team contains at least one King and the winning team contains no King, THE Delta_Calculator SHALL apply a +0.10 delta to each winner
4. WHEN a competitive match is resolved where the winning team contains at least one Fanalino and the losing team contains no Fanalino, THE Delta_Calculator SHALL apply a +0.10 delta to each winner
5. WHEN a competitive match is resolved and both teams contain at least one King, THE Delta_Calculator SHALL neutralize the King bonus and apply standard deltas of +0.05 to winners and -0.05 to losers
6. WHEN a competitive match is resolved and both teams contain at least one Fanalino, THE Delta_Calculator SHALL neutralize the Fanalino bonus and apply standard deltas of +0.05 to winners and -0.05 to losers
7. WHEN a match is resolved, THE Match_Actions SHALL update the match record setting status to 'completed', winning_team to the team that won more sets, score to the array of set scores provided, and team_a_delta and team_b_delta to the calculated values
8. WHEN a match is resolved with a valid score, THE Match_Actions SHALL update each player's ranking field by adding the corresponding team delta to their pre-match ranking value
9. IF a match resolution is attempted with fewer than 2 sets or with set scores that violate padel scoring rules, THEN THE Match_Actions SHALL reject the resolution with an error message indicating invalid score data without modifying the match or player records

### Requirement 7: Player Win Rate Calculator Coverage

**User Story:** As a QA lead, I want exhaustive tests for the player win rate calculator, so that statistics are accurate across all edge cases.

#### Acceptance Criteria

1. WHEN a player has participated in 10 completed matches and won 7, THE Player_Win_Rate_Calculator SHALL return a stats object with totalPlayed of 10, totalWon of 7, totalLost of 3, and winRate of 70.0
2. WHEN a player has zero completed matches, THE Player_Win_Rate_Calculator SHALL return a stats object with winRate of 0, totalPlayed of 0, totalWon of 0, and totalLost of 0 without throwing an error or returning NaN
3. WHEN the match array contains matches with status 'pending' alongside completed matches, THE Player_Win_Rate_Calculator SHALL exclude pending matches from calculation and compute winRate, totalPlayed, totalWon, and totalLost using only matches with status 'completed'
4. WHEN a player appears in Team A in 3 matches (winning 2) and in Team B in 2 matches (winning 1), THE Player_Win_Rate_Calculator SHALL return totalPlayed of 5, totalWon of 3, totalLost of 2, and winRate of 60.0 by attributing each win based on the team the player occupied and the winning_team value in that match
5. THE Player_Win_Rate_Calculator SHALL return a winRate value between 0 and 100 inclusive, rounded to 1 decimal place, for any combination of playerId and match array inputs
6. IF the match array contains a completed match where winning_team is neither 'A' nor 'B', THEN THE Player_Win_Rate_Calculator SHALL count that match as a loss for the participating player

### Requirement 8: Concurrent and Race Condition Test Scenarios

**User Story:** As a QA lead, I want tests that simulate concurrent match submissions, so that the system's behavior under parallel operations is documented and verified.

#### Acceptance Criteria

1. WHEN two users attempt to join the same last available slot by invoking joinMatchAction concurrently (both requests issued before either completes), THE Match_Actions SHALL allow exactly one to succeed and return an error containing "nessuno slot disponibile" to the other within 5 seconds of both requests being issued
2. WHEN a match is resolved while another user simultaneously invokes resolveMatchWithRanking for the same match, THE Match_Actions SHALL complete exactly one resolution and reject the second with an error containing "già stata risolta"
3. WHEN a user invokes leaveMatchAction while another user simultaneously invokes joinMatchAction for the same match, THE Match_Actions SHALL maintain slot assignment integrity such that after both operations complete, each occupied slot contains exactly one valid player ID with no player ID appearing in more than one slot and no slot referencing a player who has left
4. IF a database error occurs during the player ranking update phase after the match status has been set to "completed", THEN THE Match_Actions SHALL either roll back the match status to "pending" or complete all ranking updates, ensuring no state exists where match status is "completed" while any participating player's ranking remains unchanged from its pre-resolution value
5. WHEN concurrent operations are simulated, THE Match_Actions SHALL be tested by dispatching both async action calls within the same event loop tick (e.g., via Promise.all) and asserting outcomes after both promises settle

### Requirement 9: Test Infrastructure and Mock Factory

**User Story:** As a QA lead, I want a reusable mock factory and test utilities module, so that new tests can be written quickly with consistent, high-fidelity mocks.

#### Acceptance Criteria

1. THE Test_Suite SHALL provide a `createMockSupabaseClient` factory that accepts a typed data set (keyed by table name) and returns a mock implementing the Supabase query builder chain methods: `from`, `select`, `eq`, `in`, `single`, `maybeSingle`, `update`, `delete`, and `insert`, where each chained method returns `this` to allow further chaining, and terminal methods (`single`, `maybeSingle`, `then`) resolve with the corresponding table data from the provided data set
2. THE Test_Suite SHALL provide a `createMockPlayer` utility that returns a valid Player object with defaults (`id: 1`, `first_name: 'Test'`, `last_name: 'Player'`, `ranking: 4.0`, `preferred_side: 'Both'`, `gender: 'M'`, `role: 'user'`, `absence_days: 0`, remaining nullable fields set to `null`) and accepts a `Partial<Player>` override parameter to replace any default field
3. THE Test_Suite SHALL provide a `createMockMatch` utility that returns a valid Match object in `'pending'` status with `match_type: 'male'`, `is_friendly: false`, four player slot fields (`team_a_left_id`, `team_a_right_id`, `team_b_left_id`, `team_b_right_id`) populated with sequential numeric IDs starting from 1, and accepts a `Partial<Match>` override parameter to replace any default field
4. THE Test_Suite SHALL provide a `createMockFormData` utility that accepts a `Record<string, string>` and returns a FormData instance where each key-value pair has been appended via `FormData.append`
5. WHEN any mock factory or utility function is called with an override parameter, THE Test_Suite SHALL enforce TypeScript compile-time type checking so that override keys not present in the corresponding interface (Player, Match, or Club) produce a type error
