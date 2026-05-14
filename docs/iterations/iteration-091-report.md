# Iteration 091 — Report

## Goal

Render `biddingRound.bids[]` as a real-time scrolling log alongside the bid panel during the auction phase, attributed by player name. One unified component handles both Belote and Coinche bid types.

## Scope (delivered)

1. New `BidLog` component (`packages/ui/src/components/BidLog/`) — structural `LogBid` interface accepts both Belote and Coinche `Bid` shapes without importing from either core package.
2. `formatBidText` pure function covering all 7 bid types: `pass`, `suit`, `sans-atout`, `tout-atout`, `capot`, `coinche`, `surcoinche`.
3. Profile resolution with fallback to seat label.
4. A11y: `role="log"`, `aria-live="polite"`, `aria-atomic="false"`, `aria-label="Bid history"`.
5. Auto-scroll to newest entry via `useEffect` watching `bids.length`.
6. Visual treatment: pass entries fade to 50% opacity; coinche/surcoinche entries get terracotta accent + bold weight.
7. Integrated in `GameTableView` — visible whenever `state.biddingRound !== null && bids.length > 0` (NOT gated by `state.isMyTurn`).
8. Three new fixtures in `bidLog.fixtures.tsx`, registered in the barrel.

## TDD trail

Genuine red phase this iteration (new component, no pre-existing structural contract).

1. Wrote `BidLog.test.tsx` with 12 tests. Ran `vitest run __tests__/BidLog.test.tsx` — **all red** (TransformPluginContext error: module not found, no component to import).
2. Created `BidLog.tsx` + `BidLog.module.css`. Re-ran — **all 12 green**.
3. Integrated into `GameTableView`. Full suite green (1589 tests).

## Implementation summary

### Files created

- `packages/ui/src/components/BidLog/BidLog.tsx` (96 lines) — exports `BidLog`, `LogBid`, `BidLogProfile`, `BidLogProps`, `formatBidText`, `LogBidType`, `LogBidSuit`.
- `packages/ui/src/components/BidLog/BidLog.module.css` — log + entry styles, pass/coinche variants.
- `packages/ui/__tests__/BidLog.test.tsx` — 12 tests.
- `packages/ui/src/dev/fixtures/bidLog.fixtures.tsx` — 3 fixtures (early auction, mid auction with coinche, Coinche-only bid types).
- `docs/iterations/iteration-091-plan.md`, `docs/iterations/iteration-091-report.md`.

### Files modified

- `packages/ui/src/components/GameTable/GameTable.tsx` — imports `BidLog`; renders `<BidLog>` slot when `state.biddingRound !== null && state.biddingRound.bids.length > 0`; builds `bidLogProfiles` from `state.players`.
- `packages/ui/src/components/GameTable/GameTable.module.css` — new `.bidLog` slot with mobile-portrait + landscape responsive overrides.
- `packages/ui/src/dev/fixtures/index.ts` — added `bidLogFixtures` import + re-export.

## Technical decisions

| Decision                                                                         | Why                                                                                                                                                      |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Structural `LogBid` interface, not import from `@belote/core` or `@coinche/core` | Keeps `BidLog` game-agnostic per platform manifesto. Both packages' `Bid` types are structural subtypes of `LogBid` (Coinche's `BidType` is a superset). |
| Visible whenever `bids.length > 0`, not gated by `isMyTurn`                      | The log narrates AI bids in real time. If gated by turn, the player wouldn't see what AIs bid during their own pause.                                    |
| `aria-atomic="false"`                                                            | Screen readers announce only the newly added entry on each update, not the whole list — critical for live-region UX.                                     |
| Renders `null` for empty bids (vs hidden div)                                    | Cleaner DOM and lets the screen-reader region be created fresh when bidding starts.                                                                      |
| Control-flow narrowing on `state.biddingRound`                                   | Avoid `!` non-null assertions to stay lint delta-clean. Used `state.biddingRound !== null && state.biddingRound.bids.length > 0` inline.                 |

## Risks identified

- **Visual diff doesn't cover BidLog.** The 10 pre-existing fixture screenshots in `e2e/baseline/` don't include the BidLog component. New BidLog fixtures live in `?screens` for manual inspection, but pixel regressions won't be caught until they're added to `visual-diff.mjs`'s fixture list.
- **Position overlap on tight landscape.** The `.bidLog` slot uses `top: 8px` in landscape — sits at the top edge. The chat button and contract stamp may collide if the player has a long bid history scrolled. The `max-height: 4rem` ceiling limits the log's height in landscape.
- **`as readonly LogBid[]` cast.** The integration in `GameTable.tsx` casts `state.biddingRound.bids` (typed against `@belote/core`'s `Bid`) to `readonly LogBid[]`. The cast is sound because `Bid` is a structural subtype, but it's an explicit `as` cast that could mask a future type drift if either package adds a new field that `LogBid` doesn't have.

## Validation results

- `pnpm test` — **1589/1589 passed** (+12 BidLog tests).
- `pnpm typecheck` — clean.
- `pnpm lint` — **246 errors total**, delta 0 vs iter 090. (Initial integration added one `state.biddingRound!.bids` non-null assertion; refactored to use control-flow narrowing to stay delta-clean.)
- `pnpm format:check` — clean.
- `pnpm visual --url=http://localhost:5175/twistedFate-belote/` — 15/15 pass (no baseline diff: BidLog fixtures aren't in the visual-diff fixture list; existing bidding fixtures show no log because their mock data has empty `bids[]`).

## Acceptance criteria check

- [x] New `BidLog` component + CSS module exist.
- [x] Renders nothing when `bids` is empty.
- [x] One entry per bid in chronological order.
- [x] All 7 bid types formatted correctly.
- [x] Profile resolution with fallback to seat label.
- [x] `role="log"`, `aria-live="polite"`, `aria-atomic="false"`.
- [x] Pass entries fade; coinche/surcoinche entries get terracotta accent.
- [x] Integrated in `GameTableView`, gated by `state.biddingRound !== null && bids.length > 0` (NOT by `isMyTurn`).
- [x] Fixture file registered, captured by barrel-sweep auto-test.
- [x] 12 tests pass.
- [x] All 4 checks pass.

## Next iteration: 092 — Last trick peek

**Goal.** Add a button + modal that shows the n-1 trick (the trick that was just swept). One-tap reveal of the four cards + who won; tap-to-dismiss.

**Acceptance criteria.**

- [ ] `lastCompletedTrick: TrickCardData[] | null` and `lastTrickWinnerPosition: Position | null` derived on `GameSessionState` in all three hooks (`useGameSession`, `useCoinchGameSession`, `useOnlineGameSession`).
- [ ] `peekingLastTrick: boolean` + `setPeekingLastTrick` callback on `GameSessionState`.
- [ ] New `LastTrickPeek` component renders the 4 cards in compass positions + winner name; close-on-tap.
- [ ] "Last trick" button visible in `GameTableView` only when `lastCompletedTrick !== null && trickCards.length === 0` (between tricks, not during one).
- [ ] No protocol/server change required — `tricks[]` is already in `public_state`.
- [ ] All 4 checks pass.

## Iteration 093 preview — GameOver CTAs

Replace single Play Again with a mode-aware button set: AI gets Play Again + Back to Menu; Online-Friends gets Leave Room + Back; Online-Random gets Find New Opponents (primary) + Leave + Back. Threaded via new `mode` and callback props on `GameOver`.
