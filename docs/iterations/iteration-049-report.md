# Iteration 049 Report — SA/TA bid types in the bidding model

**Date**: 2026-05-09
**Status**: Complete

## Goal

Add `sans-atout` and `tout-atout` as first-class bid types in
`@coinche/core`'s bidding model so a won contract carries the correct
`contractType` and `calculateRoundScore` activates the right
card-point table (iteration 048 work).

## Scope

1. `packages/coinche/core/src/models/bid.ts` — extended `BidType`,
   added `createSansAtoutBid` / `createToutAtoutBid` factories,
   updated `isValidBid`, `placeBid`, `getValidBids`, `getContract`.
2. `packages/coinche/core/src/models/index.ts` — exported new
   factories.
3. `packages/coinche/core/src/index.ts` — re-exported from root
   barrel.
4. New test file + updated one existing test.
5. `docs/iterations/iteration-049-plan.md`.

## PO Decisions Locked

- SA/TA follow the same value-escalation rules as suit bids (must
  strictly exceed current highest bid value). No suit-type priority.
- SA/TA bids have `suit: null` on `Bid`; the resulting `Contract`
  stores `"hearts"` as a sentinel suit (unused by scoring, to be
  replaced when `trick.ts` gains SA/TA support in iteration 050).
- Coinche/surcoinche is valid on SA/TA bids (same as suit bids).
- AI strategy unchanged — `chooseBid` still emits suit-only bids
  via `createSuitBid`; it will not bid SA/TA until a strategy
  extension iteration.

## Tests Written (18 new, written before implementation)

| Test name                                                         | Asserts                     |
| ----------------------------------------------------------------- | --------------------------- |
| `createSansAtoutBid` — type, value, null suit                     | Factory output correct      |
| `createToutAtoutBid` — type, value, null suit                     | Factory output correct      |
| SA bid valid as opening bid                                       | `isValidBid = true`         |
| SA bid valid when value > current highest                         | `isValidBid = true`         |
| SA bid invalid when value = current highest                       | `isValidBid = false`        |
| SA bid invalid when value < current highest                       | `isValidBid = false`        |
| TA bid valid when value > SA bid                                  | `isValidBid = true`         |
| SA bid becomes highestBid after placeBid                          | State transition correct    |
| TA bid replaces SA as highestBid                                  | State transition correct    |
| SA/TA bid resets consecutivePasses to 0                           | Counter reset               |
| `getValidBids` includes SA bids when bidding is open              | SA bids present             |
| `getValidBids` includes TA bids when bidding is open              | TA bids present             |
| SA bids only above current highest                                | All values > 100            |
| `getContract` SA bid → `contractType: "sans-atout"`               | Field derived from bid type |
| `getContract` TA bid → `contractType: "tout-atout"`               | Field derived from bid type |
| `getContract` suit bid → `contractType: "suit"` (backward-compat) | Unchanged                   |
| Opponent can coinche an SA bid                                    | `isValidBid = true`         |
| End-to-end: SA contract from `getContract` → jack scores 0        | SA table active             |

**Red phase confirmed**: all 18 failed before implementation (4 suit
backward-compat tests passed immediately as expected).

## Implementation Summary

### Files Modified

- `packages/coinche/core/src/models/bid.ts`:
  - `BidType` → `"pass" | "suit" | "sans-atout" | "tout-atout" | "coinche" | "surcoinche"`.
  - `createSansAtoutBid(pos, value, idGen)` and `createToutAtoutBid(…)` factories.
  - `isValidBid`: new `case "sans-atout": case "tout-atout"` block
    mirrors suit logic but without suit check.
  - `placeBid`: `"sans-atout"` and `"tout-atout"` fall through to
    `"suit"` case — all three set `highestBid` and reset passes.
  - `getValidBids`: iterates `BID_VALUES` twice more for SA and TA.
  - `getContract`: derives `contractType` from `highestBid.type`;
    uses `highestBid.suit ?? "hearts"` as sentinel for SA/TA.
- `packages/coinche/core/src/models/index.ts` and
  `packages/coinche/core/src/index.ts` — export new factories.
- `packages/coinche/core/__tests__/models/bid.test.ts` — updated
  `getValidBids` count test: 33 → 49 (32 suit + 8 SA + 8 TA + 1 pass).

### Key functions

- `createSansAtoutBid(pos, value, idGen): Bid`
- `createToutAtoutBid(pos, value, idGen): Bid`

## Technical Decisions

| Decision                          | Choice                               | Rationale                                                                          |
| --------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------- |
| Sentinel `"hearts"` in Contract   | `highestBid.suit ?? "hearts"`        | `Contract.suit` kept non-nullable; scoring already ignores it for SA/TA via guard  |
| SA/TA same value rules as suit    | Identical `isValidBid` logic         | GAME_RULES.md §5: same bid value range 80-160, strict escalation                   |
| No SA/TA in AI strategy           | `chooseBid` unchanged                | AI strategy extension is a separate iteration; not part of core bidding model work |
| Fall-through in `placeBid` switch | `"sans-atout"/"tout-atout"` → `suit` | All three bid types advance `highestBid` — one branch, no duplication              |

## Refactoring Performed

None.

## Risks Identified

- **Trick-winning order** still uses `"hearts"` as trump for SA/TA
  contracts (sentinel). Iteration 050 fixes `trick.ts` to use
  `contractType` for correct trick resolution (SA: no trump; TA: all
  trump).
- **AI never bids SA/TA** — `chooseBid` still generates only suit
  bids. An SA/TA AI strategy is deferred.

## Validation Results

| Check               | Result                                     |
| ------------------- | ------------------------------------------ |
| `pnpm test`         | ✅ **1932 / 1932 passing** (86 test files) |
| `pnpm typecheck`    | ✅ Clean                                   |
| `pnpm lint`         | ✅ Delta-clean                             |
| `pnpm format:check` | ✅ Clean                                   |

## Next Iteration: 050 — Trick-winning order for SA and TA

**Goal**: Update `trick.ts` so SA and TA contracts use the correct
card-ranking and overtrump-obligation rules.

**Scope:**

- `Trick.trumpSuit: Suit | null` — nullable (SA has no trump).
- `createTrick` accepts `Suit | null`.
- `isValidPlay`:
  - SA: no overtrump obligation; treat all suits as equal-rank
    (no suit is trump).
  - TA: overtrump obligation applies universally; all suits rank
    like trump (use `TRUMP_ORDER`).
- `getTrickWinner`:
  - SA: winner = highest-ranked card in the led suit (using
    `NON_TRUMP_ORDER`); ties broken by play order.
  - TA: winner = highest `TRUMP_ORDER` rank across all suits (J
    beats everything).
- Thread `contractType` into `round.ts`'s `createTrick` calls.
- Tests: SA trick winner ignores jacks; TA trick overtrumped by jack
  across suit boundaries.

**Acceptance criteria:**

- `isValidPlay` passes for SA/TA contracts.
- `getTrickWinner` returns correct winner for SA (no trump) and TA
  (all trump).
- `@coinche/app` round tests still pass.
- All 4 checks clean.

## Iteration 051 Preview — Announcements (Belote/Rebelote, tierce, cinquante)

Add the announcement model to `@coinche/core`:
`AnnouncementType`, `createAnnouncement(type, suit, rank)`,
`validateAnnouncements(hand, announcements)`, scoring hooks.
Per `docs/games/coinche/GAME_RULES.md` §8.
