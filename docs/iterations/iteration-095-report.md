# Iteration 095 — Report

## Goal

Address user feedback on what shipped in iter 091 (BidLog hidden behind BidPanel) and iter 092 (LastTrickPeek button visibility window too narrow, modal layout poor). Convert the last-trick affordance into a proper trick-history drawer reachable at all times during play. Audit the in-game layout for collisions and overflow at 390×844.

## Scope (delivered)

1. **BidLog repositioned to top of table.** No longer overlaps the BidPanel — verified at 390×844 via Playwright screenshot. The slot moved from `top: calc(50% - 220px)` (which collided with the panel) to `top: 130px` mobile / `top: 8px` default, placing it above the BidPanel's vertical zone.
2. **LastTrickPeek deleted, replaced by TrickHistoryPanel drawer.** Persistent "Tricks (N)" button anchored bottom-right, visible whenever any trick has been completed — no game-state dependency that makes it appear-and-vanish.
3. **TrickHistoryPanel drawer.** Slides in from right. One row per trick: `Trick N · {winner} · {points} pts` with expand caret. Click a row to reveal the 4 played cards in compass layout, with the winner's card outlined in terracotta. Multiple rows can be expanded simultaneously. Close button, backdrop tap, AND Escape key all dismiss.
4. **GameSessionState renamed fields.** `lastCompletedTrick`/`lastTrickWinnerPosition`/`peekingLastTrick`/`setPeekingLastTrick` removed. `tricksHistory: readonly TrickHistoryRecord[]`/`tricksPanelOpen`/`setTricksPanelOpen` added. Plumbed through all 3 hooks (useGameSession / useCoinchGameSession / useOnlineGameSession).
5. **Layout safe-area fixes.** Side avatars (.westAvatar / .eastAvatar) and west/east card stacks all anchor to `calc(env(safe-area-inset-X) + Npx)` instead of raw `Npx`, eliminating the viewport-edge overflow at 390×844. Score panel adjusted similarly.

## TDD trail

1. Wrote 9 tests in `TrickHistoryPanel.test.tsx` — all RED (module not found).
2. Implemented `TrickHistoryPanel.tsx` + CSS module. Re-ran → 9/9 green.
3. Plumbed hook changes through 3 hooks + GameTable + state-builders (the fixture helper). One unexpected red surfaced: the fixture barrel-sweep test caught that `tricksHistory: []` was missing in `state-builders.ts` (the test was calling `state.tricksHistory.length > 0` and crashing on `undefined.length`). Added the new fields with safe defaults.
4. Iterated on Vite HMR — first verification screenshot showed the OLD layout because `packages/ui/node_modules/.vite` cached the previous CSS module class hashes. Killed dev server, cleared `.vite`, restarted on port 5178. New screenshot confirmed BidLog above BidPanel.
5. Visual verification at 390×844 (Playwright):
   - **Bidding state**: BidLog shows "Villy: ♣ 90 / DilyanaBl: Pass / Vane_Bane: Pass" above the BidPanel, fully readable. ✅
   - **Play state after first trick**: "Tricks (1)" pill button visible bottom-right next to the south hand. ✅
   - **Drawer open**: "Trick history" heading, close button (×), one row "Trick 1 · Villy · 13 pts" with expand caret. ✅
   - **Row expanded**: 4 cards in compass layout (North/West/East/South), with West (Villy = winner) highlighted in terracotta. ✅

## Implementation summary

### Files created

- `packages/ui/src/components/TrickHistoryPanel/TrickHistoryPanel.tsx` (~130 lines) — exports `TrickHistoryPanel`, `TrickHistoryRecord`, `TrickHistoryPanelProps`. Drawer + accordion rows + close + escape + backdrop dismiss.
- `packages/ui/src/components/TrickHistoryPanel/TrickHistoryPanel.module.css` — drawer + row + expanded card grid with compass ordering.
- `packages/ui/__tests__/TrickHistoryPanel.test.tsx` — 9 tests.
- `packages/ui/src/dev/fixtures/trickHistoryPanel.fixtures.tsx` — 2 fixtures (open with 3 tricks; closed/null render).
- `docs/iterations/iteration-095-plan.md`, `docs/iterations/iteration-095-report.md`.

### Files modified

- `packages/ui/src/hooks/useGameSession.ts` — import `calculateTrickPoints`; replace single-trick derivation with full-history `tricksHistory: readonly TrickHistoryRecord[]`; rename peeking state.
- `packages/ui/src/hooks/useCoinchGameSession.ts` — same. Coinche `calculateTrickPoints` is the Coinche-specific implementation.
- `packages/ui/src/online/useOnlineGameSession.ts` — same. Online hook uses `getCardPoints` (summed per card) because the online `OnlinePublicShape.round.tricks` is a structural subset lacking the `state`/`id` fields that `calculateTrickPoints` validates.
- `packages/ui/src/components/GameTable/GameTable.tsx` — import `TrickHistoryPanel`; replace `<LastTrickPeek>` + visibility-windowed button with `tricksHistory.length > 0`-gated `tricksBtn` + always-mounted `<TrickHistoryPanel open={state.tricksPanelOpen} ...>`.
- `packages/ui/src/components/GameTable/GameTable.module.css` — `.peekBtn` renamed to `.tricksBtn`, anchored to `var(--safe-bottom)` + `var(--safe-right)`; `.bidLog` slot relocated to top of table; side-avatar safe-area fixes (`westAvatar`, `eastAvatar`, `westCards`, `eastCards` all use `calc(env(safe-area-inset-X) + Npx)` at every breakpoint); score panel safe-area lift.
- `packages/ui/src/dev/fixtures/state-builders.ts` — added `roundHistory: []`, `tricksHistory: []`, `tricksPanelOpen: false`, `setTricksPanelOpen: noop` to the base fixture state.
- `packages/ui/src/dev/fixtures/index.ts` — swap `lastTrickPeekFixtures` re-export for `trickHistoryPanelFixtures`.

### Files deleted

- `packages/ui/src/components/LastTrickPeek/LastTrickPeek.tsx`
- `packages/ui/src/components/LastTrickPeek/LastTrickPeek.module.css`
- `packages/ui/__tests__/LastTrickPeek.test.tsx`
- `packages/ui/src/dev/fixtures/lastTrickPeek.fixtures.tsx`

## Technical decisions

| Decision                                                                          | Why                                                                                                                                       |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Drawer (slide from right) over modal                                              | User's complaint about LastTrickPeek was the modal layout was poor. A side drawer keeps the trick area visible so the player has context. |
| Persistent button gated only by `tricksHistory.length > 0`                        | The iter-092 visibility window (`trickCards.length === 0` ∧ `lastCompletedTrick !== null`) was sub-second. Drop the second condition.     |
| Multiple rows expandable simultaneously                                           | User can compare trick N vs trick N-2 without re-clicking. Permissive UX.                                                                 |
| Online points calc via `getCardPoints` (per-card sum), not `calculateTrickPoints` | `OnlinePublicShape.round.tricks` is a structural subset of the full `Trick` type — missing `state`/`id`. Reproduce the sum directly.      |
| Coinche SA/TA/Capot tricks render points as 0                                     | The Coinche `calculateTrickPoints` requires a trump-suit; SA/TA have no trump. Proper SA/TA point lookup deferred to a follow-up.         |
| Vite cache clear required mid-iteration                                           | First Playwright check showed stale CSS even with a hard reload. CLAUDE.md's footgun confirmed. Cleared `packages/ui/node_modules/.vite`. |

## Risks identified

- **Coinche SA/TA/Capot trick points show 0** in the drawer. Documented limitation; not blocking because Coinche SA/TA games are rarer and the trick winner + cards are still visible.
- **Side avatar safe-area fix may shift the visual centerline of the side hands.** Verified at 390×844: side avatars + name labels fit cleanly inside the viewport. Larger viewports may show slight extra inset (~16-44px) — visually unobtrusive.
- **The "Tricks (N)" button counts COMPLETED tricks only.** When a new trick starts, the count doesn't bump until that trick is also swept. Acceptable UX.

## Validation results

- `pnpm test` — **1608/1608 passed** (was 1605; +9 TrickHistoryPanel tests − 6 deleted LastTrickPeek tests).
- `pnpm typecheck` — clean.
- `pnpm lint` — **246 errors total**, delta 0 vs iter 094.
- `pnpm format:check` — clean (one Prettier pass on docs and one source file).
- **Manual Playwright at 390×844**: bidding state, mid-trick state, drawer open, drawer expanded — all four captured with expected layout. No layout collisions. BidLog reads clearly. Tricks button reachable at all times during play.
- Side avatars (.westAvatar / .eastAvatar) verified inside viewport at 390×844 via Playwright `getBoundingClientRect()` inspection.

## Acceptance criteria check

- [x] BidLog no longer overlaps BidPanel at any breakpoint.
- [x] BidLog visible at all times during the auction phase.
- [x] TrickHistoryPanel component + always-visible Tricks button.
- [x] Click button → drawer opens.
- [x] One row per trick with `Trick N · {winner} · {points} pts`.
- [x] Click row → reveal 4 played cards inline.
- [x] Close + backdrop + Escape all dismiss.
- [x] `role="dialog"`, `aria-label="Trick history"`.
- [x] `tricksHistory` replaces `lastCompletedTrick`/`lastTrickWinnerPosition`.
- [x] `tricksPanelOpen` replaces `peekingLastTrick`.
- [x] Side avatars use safe-area at every breakpoint.
- [x] Score panel uses safe-area-inset top + left.
- [x] All 4 checks pass.

## Next iteration: 096 — Coinche SA/TA/Capot trick point calculation

**Goal.** Compute correct per-trick points for Coinche SA, TA, and Capot contracts in the TrickHistoryPanel (currently renders 0).

**Acceptance criteria.**

- [ ] When `contractType === "sans-atout"`, trick points sum via `SANS_ATOUT_POINTS` table.
- [ ] When `contractType === "tout-atout"`, trick points sum via `TOUT_ATOUT_POINTS` table.
- [ ] When `isCapot === true`, trick points display as "—" plus capot bonus shown elsewhere.
- [ ] Coinche-only — Tunisian unaffected.
- [ ] 3 new tests in `TrickHistoryPanel.test.tsx`.

## Iteration 097 preview — `@tunisian/*` rename (carryforward from iter 088)

Align folder name with package npm name: `@belote/app` → `@tunisian/app`, `@belote/core` → `@tunisian/core`. Pure rename, ~40 import sites.
