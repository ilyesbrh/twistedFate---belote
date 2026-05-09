# Iteration 051 Report — CoinchBidPanel (SA · TA bid buttons)

**Date**: 2026-05-09
**Status**: Complete

## Goal

Add Sans-Atout and Tout-Atout bid buttons to the Coinche game so the
human player can bid these contract types. Previously only suit bids
were available.

## Scope

1. `packages/ui/src/components/CoinchBidPanel/CoinchBidPanel.tsx` —
   new component with three contract-type tabs.
2. `packages/ui/src/components/CoinchBidPanel/CoinchBidPanel.module.css` —
   styling.
3. `packages/ui/src/hooks/useGameSession.ts` — widened
   `GameSessionState.placeBid` type to include SA/TA.
4. `packages/ui/src/hooks/useCoinchGameSession.ts` — widened local
   `placeBid` to dispatch SA/TA commands.
5. `packages/ui/src/components/GameTable/GameTable.tsx` — added
   `coincheBidding?: boolean` prop; imports and renders
   `CoinchBidPanel` when `true`.
6. `packages/ui/src/components/CoinchGameTable/CoinchGameTable.tsx` —
   passes `coincheBidding`.
7. `docs/iterations/iteration-051-plan.md`.

## PO Decisions Locked

- Contract-type is selected via a 3-tab strip: **Suit** / **SA** /
  **TA** at the top of the bid panel.
- Suit tab: same suit-picker + value-picker as before.
- SA tab: value-picker only — no suit needed.
- TA tab: value-picker only — no suit needed.
- Pass / Contrer / Surcontrer buttons unchanged.
- The tab strip is hidden after a coinche (only Pass / Surcontrer
  remain, same as the existing belote BidPanel).

## Implementation Summary

### Files Created

- `packages/ui/src/components/CoinchBidPanel/CoinchBidPanel.tsx`
- `packages/ui/src/components/CoinchBidPanel/CoinchBidPanel.module.css`

### Files Modified

- `packages/ui/src/hooks/useGameSession.ts` — `placeBid` type
  extended: `"pass" | "suit" | "sans-atout" | "tout-atout" | "coinche" | "surcoinche"`.
- `packages/ui/src/hooks/useCoinchGameSession.ts` — same widening;
  `createPlaceBidCommand` already supports SA/TA (from iter 049).
- `packages/ui/src/components/GameTable/GameTable.tsx` — added
  `coincheBidding?: boolean` to `GameTableViewProps`; renders
  `CoinchBidPanel` when `true`, existing `BidPanel` otherwise.
- `packages/ui/src/components/CoinchGameTable/CoinchGameTable.tsx` —
  added `coincheBidding` prop.

### Key component

`CoinchBidPanel` is a standalone drop-in at `data-testid="bid-panel"`.
Internal state: `tab: ContractTab`, `selectedSuit`, `selectedValue`.
Bid dispatched via `onBid(type, value, suit?)` exactly matching
`GameSessionState.placeBid`.

## Technical Decisions

| Decision                               | Choice                               | Rationale                                                                                                  |
| -------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| New component, not extend BidPanel     | `CoinchBidPanel` duplicates BidPanel | Game-isolation: Coinche bidding is different enough; duplication is correct until a 3-game pattern emerges |
| `coincheBidding` prop on GameTableView | Opt-in flag                          | Belote remains fully unchanged; no risk of regressions                                                     |
| Tab strip hidden post-coinche          | `postCoinche` guard same as BidPanel | After coinche only Pass/Surcontrer are legal; SA/TA are not valid bids at that point                       |
| `data-testid="bid-panel"` kept         | Same test-id as BidPanel             | Existing `bid-panel` tests still locate the panel regardless of game type                                  |

## Refactoring Performed

None.

## Risks Identified

- **SA/TA trick-winning order**: Bidding SA/TA now works, but tricks
  are resolved using the `"hearts"` sentinel trump (iteration 052).
  The human can bid SA/TA but winning tricks uses wrong order.
- **AI never bids SA/TA**: The AI still uses only suit bids.

## Validation Results

| Check               | Result                                     |
| ------------------- | ------------------------------------------ |
| `pnpm test`         | ✅ **1932 / 1932 passing** (86 test files) |
| `pnpm typecheck`    | ✅ Clean                                   |
| `pnpm lint`         | ✅ Delta-clean                             |
| `pnpm format:check` | ✅ Clean                                   |

## Next Iteration: 052 — SA/TA trick-winning order

**Goal**: Fix `trick.ts` so SA and TA contracts use the correct
card-ranking rules.

**Scope:**

- `Trick.trumpSuit: Suit | null` — nullable (SA has no trump).
- `createTrick(leader, trumpSuit: Suit | null, idGen)`.
- `isValidPlay` and `getTrickWinner` accept `contractType: ContractType`
  to apply SA/TA rules correctly.
- `round.ts` threads `contractType` from `round.contract` when
  creating tricks.
- Tests: SA trick winner = highest non-trump rank; TA trick
  overtrumped by jack across suits.
- All 4 checks clean.

## Iteration 053 Preview — Announcements model

Add `AnnouncementType` (tierce, quarte/cinquante, quinte/cent, carré)
to `@coinche/core`, with `validateAnnouncements(hand)` and
announcement scoring hooks per `docs/games/coinche/GAME_RULES.md` §8.
