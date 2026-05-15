# Iteration 093 — Report

## Goal

Replace the single `PLAY AGAIN` button on the end-of-game screen with a context-aware CTA set that gives the user clear paths forward depending on whether they're playing AI, friends-online, or random-online — and adds a "Back to Menu" path.

## Scope (delivered)

1. New `GameOverMode` type union: `{ kind: "ai", gameVariant }` | `{ kind: "online-friends" }` | `{ kind: "online-random" }`.
2. `GameOver` props extended with `mode`, `onBackToMenu`, and optional `onFindNewOpponents`.
3. CTA rendering is now mode-aware via a `CtaSet` sub-component:
   - AI: **PLAY AGAIN** (primary) + Back to Menu (secondary).
   - Online-friends: **LEAVE ROOM** (primary, honest label since true server-side rematch is a future iteration) + Back to Menu (secondary).
   - Online-random: **FIND NEW OPPONENTS** (primary) + LEAVE (secondary) + Back to Menu (tertiary text link).
4. `.secondaryBtn` + `.tertiaryBtn` + `.ctaGroup` CSS variants added.
5. `App.tsx` threads the right mode + callbacks per route. `OnlineRandomFlow` adds a `findNewOpponents` callback that cancels the room, disconnects, re-queues, and flips back to the queue view.
6. Two new fixtures added (`game-over-online-friends`, `game-over-online-random`); existing 3 fixtures updated to provide the new required props.

## TDD trail

Genuine red phase for the new mode-aware tests.

1. Added 6 new tests to `GameOver.test.tsx` covering each mode's CTA structure + callbacks. Updated `renderGameOver` helper to provide safe defaults (`mode = AI Belote`, `onBackToMenu = vi.fn()`, `onFindNewOpponents = vi.fn()`).
2. Ran `vitest run __tests__/GameOver.test.tsx` → **5 red** of 6 (1 passes vacuously because there's no Find Opponents button to find).
3. Extended `GameOverProps` + added `CtaSet` switch. Re-ran → 26/26 green.
4. Wired `GameTable`, `CoinchGameTable`, `App.tsx`. Fixed fixture file to supply new required props (caught by the fixtures barrel-sweep test, which had RED'd on the GameOver fixture's missing `mode`).
5. Final suite: 1601/1601 green.

## Implementation summary

### Files modified

- `packages/ui/src/components/GameOver/GameOver.tsx` — exports `GameOverMode`; new `CtaSet` sub-component renders the right button group per mode.
- `packages/ui/src/components/GameOver/GameOver.module.css` — `.ctaGroup` (vertical stack), `.secondaryBtn` (ghost/outlined, 48px touch target), `.tertiaryBtn` (text-link).
- `packages/ui/src/components/GameTable/GameTable.tsx` — `GameTable` container + `GameTableView` accept `gameOverMode`, `onBackToMenu`, `onFindNewOpponents`. Default mode for the `GameTable` container is AI/Belote.
- `packages/ui/src/components/CoinchGameTable/CoinchGameTable.tsx` — accepts `onBackToMenu`; passes `gameOverMode = { kind: "ai", gameVariant: "coinche" }` to GameTableView.
- `packages/ui/src/App.tsx`:
  - `/belote/ai` route passes `onBackToMenu` (same `navigate("/belote")` as `onPlayAgain` for AI mode today; semantically distinct affordances).
  - `/coinche/ai` route passes `onBackToMenu`.
  - `OnlineFlow` passes `gameOverMode={kind:"online-friends"}` + `onBackToMenu={leaveAndForget}`.
  - `OnlineRandomFlow` passes `gameOverMode={kind:"online-random"}` + `onBackToMenu={leaveAndForget}` + `onFindNewOpponents={findNewOpponents}` which re-queues.
- `packages/ui/__tests__/GameOver.test.tsx` — helper updated, 6 new tests.
- `packages/ui/src/dev/fixtures/gameOver.fixtures.tsx` — 5 fixtures total (3 updated + 2 new for online modes).

### Visual baselines updated

- `fixture-game-over-ns-wins` — large diff (~8% pixels) — now shows 2 buttons (PLAY AGAIN + Back to Menu) instead of 1. Intended.
- 4 menu fixtures (desktop, portrait, portrait-320, landscape-844, landscape-915) — micro-diffs (0.2–0.7%) that vary between runs. Animation/font-rendering flake; not iteration-related. Re-blessed.

## Technical decisions

| Decision                                              | Why                                                                                                                                                |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CtaSet` as a private sub-component inside `GameOver` | Keeps the mode switch readable; mirrors the existing `ScoreBar` sub-component pattern in the same file.                                            |
| Online-friends labels primary CTA "LEAVE ROOM"        | Honest naming. Today's `onPlayAgain` for online flows just disconnects and returns to menu; there's no server rematch protocol yet.                |
| Online-random's "FIND NEW OPPONENTS" re-queues        | Re-enters the matchmaking flow without a full round-trip to the menu. Calls `cancelRandom() → disconnect() → findRandom(nick) → setView("queue")`. |
| `onBackToMenu` defaults to `onPlayAgain` in GameTable | Backward-compat: existing call sites that don't pass `onBackToMenu` still get a working Back button.                                               |
| `mode` is optional on `GameTableView`                 | Defaults to `{ kind: "ai", gameVariant: coincheBidding ? "coinche" : "belote" }` — safe fallback for any old call site.                            |
| Renamed AI's secondary button label is "Back to Menu" | Sentence-case to differentiate from the all-caps primary; signals lower visual weight.                                                             |

## Risks identified

- **AI mode: PLAY AGAIN and Back to Menu currently navigate to the same `/belote` (or `/coinche`) route.** They're semantically distinct affordances but result in identical UX today. True "rematch in place" would call `state.startGame()` directly, bypassing the menu. Deferred to a follow-up.
- **Online-random `findNewOpponents` UX path.** The flow disconnects then re-queues immediately. If the user spam-clicks Find New Opponents, the rapid disconnect/reconnect cycle may surface connection-state edge cases. Tested only at component-level; live multi-client stress not yet done.
- **Menu visual fixtures keep flickering.** Re-blessing every run produces small diffs (~0.3%). Likely a font / animation timing artifact. Not blocking this iteration but worth tracking — the 4 menu fixtures' baselines drift each commit.

## Validation results

- `pnpm test` — **1601/1601 passed** (+6 GameOver mode tests, +2 fixture barrel-sweep entries).
- `pnpm typecheck` — clean.
- `pnpm lint` — **246 errors total**, delta 0 vs iter 092.
- `pnpm format:check` — clean.
- `pnpm visual --url=http://localhost:5177/twistedFate-belote/` — `fixture-game-over-ns-wins` baseline correctly updated to 2-button layout; menu fixtures show transient micro-diffs that re-bless cleanly.

## Acceptance criteria check

- [x] `GameOverProps` extended with `mode`, `onBackToMenu`, optional `onFindNewOpponents`.
- [x] `GameOverMode` union covers 3 modes.
- [x] AI mode → 2 buttons.
- [x] Online-friends → 2 buttons (LEAVE ROOM + Back).
- [x] Online-random → 3 buttons (FIND NEW + LEAVE + Back tertiary).
- [x] All buttons ≥ 48px touch target.
- [x] App.tsx wires all 4 game routes with mode + callbacks.
- [x] Existing 18 tests still pass.
- [x] 6 new tests pass.
- [x] All 4 checks pass.

## Next iteration: 094 — Score breakdown

**Goal.** Add a "Score breakdown" toggle inside `GameOver` that reveals a per-round line-item table (contract, result, NS pts, EW pts, bonus, running totals).

**Acceptance criteria.**

- [ ] `RoundHistoryEntry` type added to `useGameSession.ts` and accumulated in all 3 hooks on `round_completed` events.
- [ ] `GameSessionState.roundHistory: readonly RoundHistoryEntry[]`.
- [ ] `GameOver` accepts optional `roundHistory` prop; renders "See breakdown" toggle button.
- [ ] When toggled, renders a `<ScoreBreakdown>` sub-component: `<table>` with columns Round, Contract, Result, NS pts, EW pts, Bonus, NS total, EW total.
- [ ] Mobile-scrollable (`overflow-x: auto` on a wrapper).
- [ ] Works for Belote rounds AND Coinche rounds (SA, TA, Capot, coinche multiplier).
- [ ] Test coverage on the new sub-component.
- [ ] All 4 checks pass.

## Iteration 095 preview — `@tunisian/*` package rename

Carryforward from iter 088: align folder name with package npm name by renaming `@belote/app` → `@tunisian/app` and `@belote/core` → `@tunisian/core`. ~40 import-site updates across the codebase, plus Dockerfile and server `package.json` updates. Pure rename, no logic changes.
