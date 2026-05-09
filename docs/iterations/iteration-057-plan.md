# Iteration 057 — Plan: Wire announcements into round lifecycle + scoring

## Goal

Wire the announcement model (iter 056) into the coinche round lifecycle so that:

1. Announcements are auto-detected from player hands when bidding completes.
2. The winner of the announcement comparison is resolved and stored on `Round`.
3. `calculateRoundScore` adds announcement points to the correct team's final score.

## Scope

### `packages/coinche/core/src/models/scoring.ts`

- Add `announcementWinner: "ns" | "ew" | null` and `announcementPoints: number` to `RoundScore`.
- Update `calculateRoundScore` signature: optional `announcementWinner` and `announcementPoints` params (default `null`/`0` for backward compat).
- Apply announcement bonus to `contractingTeamFinalScore` or `opponentTeamFinalScore` after belote bonus, using NS/EW vs contracting-team mapping.

### `packages/coinche/core/src/models/round.ts`

- Import `findAnnouncements`, `resolveAnnouncementWinner`, `calculateAnnouncementTotal` from `announcements.ts`.
- Add `nsAnnouncements`, `ewAnnouncements`, `announcementWinner`, `announcementPoints` to `Round`.
- Initialize to `[]` / `null` / `0` in `createRound`.
- Populate when bidding completes in `placeBidInRound` (V1: auto-detect from hands at bidding-complete moment).
- Carry fields through all other `Round` return paths.
- Pass `announcementWinner` and `announcementPoints` to `calculateRoundScore` when round completes.

## V1 simplification

Announcements are automatically detected from each player's hand the moment bidding completes — same approach as belote auto-detection in the belote package. The FFB tournament-style "declare then reveal" mechanic is deferred to a later iteration.

## Tests (TDD: RED first)

New file: `packages/coinche/core/__tests__/models/announcement-scoring.test.ts`

- Test 1: `nsAnnouncements`/`ewAnnouncements` are arrays after bidding completes.
- Test 2: NS tierce → `announcementWinner = "ns"`, `announcementPoints = 20`.
- Test 3: EW carré of jacks (all 4 in one hand) vs NS tierce → `announcementWinner = "ew"`, `announcementPoints = 200`.
- Test 4: `calculateRoundScore` NS announcement + NS contracting → contracting gets +20.
- Test 5: `calculateRoundScore` EW announcement + NS contracting → opponent gets +50.
- Test 6: Contract fails but EW wins announcement → EW still gets points.
- Test 7: No announcement args / null → `announcementWinner = null`, unchanged scores.

## 4 Mandatory Checks

- `pnpm test`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm format:check`

## Forward planning

- **N+1 (iter 058)**: Expose `nsAnnouncements`/`ewAnnouncements`/`announcementWinner` through the `@coinche/app` session events so the UI can render announcement bubbles.
- **N+2 (iter 059)**: Visual display of announcements in `@coinche/ui` — show announcement badges near the relevant player's hand area at the start of the playing phase.
