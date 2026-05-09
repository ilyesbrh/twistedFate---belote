# Iteration 048 Report — Sans-Atout & Tout-Atout card-point tables

**Date**: 2026-05-09
**Status**: Complete

## Goal

Add `ContractType` (suit / sans-atout / tout-atout) and
contract-type-aware card-point tables to `@coinche/core` so
`calculateRoundScore` uses the correct scoring table per
`docs/games/coinche/GAME_RULES.md` §3.

## Scope

1. `packages/coinche/core/src/models/card.ts` — added `ContractType`,
   `SANS_ATOUT_POINTS`, `TOUT_ATOUT_POINTS`, `getCoincheCardPoints`.
2. `packages/coinche/core/src/models/bid.ts` — added
   `contractType: ContractType` to `Contract`; `getContract` defaults
   to `"suit"` until SA/TA bidding arrives.
3. `packages/coinche/core/src/models/scoring.ts` — replaced
   `getCardPoints` with `getCoincheCardPoints`, added `contractType`
   parameter to `calculateTrickPoints`, `calculateRunningPoints`,
   `calculateTeamPoints`; `calculateRoundScore` derives `trumpSuit`
   from `contractType`; belote/rebelote disabled for SA/TA contracts.
4. `packages/coinche/core/src/models/index.ts` — exported new symbols.
5. New test file + updated existing tests.
6. `docs/iterations/iteration-048-plan.md`.

## PO Decisions Locked

- SA table: A=19, 10=10, K=4, Q=3, J=0, 9/8/7=0 → 36/suit (144 deck).
- TA table: J=14, 9=9, A=6, 10=5, K=3, Q=1, 8/7=0 → 38/suit (152 deck).
- Belote/rebelote disabled for SA and TA (no trump suit to hold K+Q of).
- `getContract` defaults `contractType: "suit"` — SA/TA _bidding_
  is deferred to iteration 049.

## Tests Written (12 new, written before implementation)

| Test name                                              | Asserts                     |
| ------------------------------------------------------ | --------------------------- |
| SA — Jack scores 0 in every suit                       | 4 suits × J=0               |
| SA — Ace scores 19 in every suit                       | 4 suits × A=19              |
| SA — 10, K, Q keep non-trump values                    | 10=10, K=4, Q=3             |
| SA — 9, 8, 7 score 0                                   | 0 each                      |
| SA — per-suit total = 36                               | sum = 36                    |
| TA — Jack scores 14 in every suit                      | 4 suits × J=14              |
| TA — 9=9, A=6, 10=5, K=3, Q=1, 8=0, 7=0                | all values match            |
| TA — per-suit total = 38                               | sum = 38                    |
| suit — trump J = 20, non-trump J = 2 (backward-compat) | unchanged behaviour         |
| suit — trump 9 = 14, non-trump 9 = 0                   | unchanged behaviour         |
| `calculateRoundScore` SA — jacks contribute 0          | contractingTeamPoints = 10  |
| `calculateRoundScore` TA — jack of any suit scores 14  | contractingTeamPoints = 122 |

**Red phase confirmed**: all 12 failed before implementation.

## Implementation Summary

### Files Created

- `packages/coinche/core/__tests__/models/contract-types.test.ts` —
  12-test file pinning all three contract-type tables.

### Files Modified

- `packages/coinche/core/src/models/card.ts` — added `ContractType`
  type alias, `SANS_ATOUT_POINTS` and `TOUT_ATOUT_POINTS` tables,
  `getCoincheCardPoints(card, trumpSuit, contractType)`.
- `packages/coinche/core/src/models/bid.ts` — added
  `contractType: ContractType` field to `Contract`; `getContract`
  sets `contractType: "suit"`.
- `packages/coinche/core/src/models/scoring.ts` — all point lookups
  now use `getCoincheCardPoints`; signatures of
  `calculateTrickPoints`, `calculateRunningPoints`,
  `calculateTeamPoints` gained a `contractType` parameter.
  `calculateRoundScore` derives `trumpSuit` as
  `contract.contractType === "suit" ? contract.suit : null`.
- `packages/coinche/core/src/models/index.ts` — exports
  `ContractType`, `SANS_ATOUT_POINTS`, `TOUT_ATOUT_POINTS`,
  `getCoincheCardPoints`.
- `packages/coinche/core/__tests__/models/scoring.test.ts` — updated
  all `calculateTrickPoints` and `calculateTeamPoints` call sites to
  pass the new `contractType` argument (`"suit"`).
- `packages/coinche/core/__tests__/models/coinche-scoring.test.ts` —
  added `contractType: "suit"` to the contract factory.

### Key types / functions

- `ContractType = "suit" | "sans-atout" | "tout-atout"` — exported
  from `@coinche/core`.
- `getCoincheCardPoints(card, trumpSuit, contractType)` — the
  contract-type-aware replacement for `getCardPoints`.
- `Contract.contractType` — new required field on the contract.

## Technical Decisions

| Decision                                  | Choice                                           | Rationale                                                                                                                     |
| ----------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `ContractType` lives in `card.ts`         | Defined alongside point tables                   | Avoids circular dep: `bid.ts` already imports from `card.ts`; putting `ContractType` in `bid.ts` would close the circle       |
| `getContract` defaults to `"suit"`        | `contractType: "suit" as const`                  | SA/TA bidding isn't wired yet. Defaulting keeps existing tests and session code working without a breaking change             |
| `beloteBonusTeam = null` for SA/TA        | Guard `trumpSuit !== null` before detecting      | Belote/rebelote requires a named trump suit; SA/TA have none                                                                  |
| `calculateRoundScore` derives `trumpSuit` | `contract.contractType === "suit" ? suit : null` | Single source of truth — scoring never uses `contract.suit` as trump when contract type isn't "suit"                          |
| Backward-compat via `"suit"` default      | Existing callers pass no `contractType`          | `@coinche/app` uses `Contract` as a type; `getContract` is the only factory — adding the field with a default covers all uses |

## Refactoring Performed

None beyond the targeted feature addition.

## Risks Identified

- **SA/TA scoring is inert**: `getContract` always emits
  `contractType: "suit"`. The scoring code is correct but will only
  activate once iteration 049 wires SA/TA bid types through the
  bidding model.
- **`@coinche/app` session and AI strategy** still bid "suit" only.
  No regression — they never produce SA/TA contracts so existing
  behaviour is unchanged.

## Validation Results

| Check               | Result                                     |
| ------------------- | ------------------------------------------ |
| `pnpm test`         | ✅ **1896 / 1896 passing** (84 test files) |
| `pnpm typecheck`    | ✅ Clean                                   |
| `pnpm lint`         | ✅ Delta-clean                             |
| `pnpm format:check` | ✅ Clean                                   |

## Next Iteration: 049 — SA/TA bid types in the bidding model

**Goal**: Add `sans-atout` and `tout-atout` as first-class bid types
in `@coinche/core`'s bidding model so contracts can carry the correct
`contractType`.

**Scope:**

- `BidType` extends to `"suit" | "sans-atout" | "tout-atout" | "pass" | "coinche" | "surcoinche"`.
- `Bid.contractType?: ContractType` on suit-variant bids.
- `createSansAtoutBid(playerPosition, value, idGenerator): Bid` and
  `createToutAtoutBid(...)` factories.
- `isValidBid` and `placeBid` handle the new bid types (same value
  range/increment rules as suit bids — only the type changes).
- `getContract` reads `contractType` from `highestBid` instead of
  defaulting to `"suit"`.
- Tests: SA bid wins over lower suit bid, TA bid wins over SA,
  coinche is valid on SA/TA bids, `getContract` sets correct
  `contractType`.

**Acceptance criteria:**

- `getCoincheCardPoints` is called with `"sans-atout"` / `"tout-atout"`
  in a real `calculateRoundScore` call driven by an SA/TA contract
  that came out of `getContract`.
- Existing suit-bid tests unaffected.
- All 4 checks clean.

## Iteration 050 Preview — Trick-winning order for SA and TA

Add suit-ranking changes for SA and TA contracts to `trick.ts`:

- SA: `isValidPlay` treats all suits as non-trump (no overtrumping
  obligation).
- TA: `isValidPlay` treats all suits as trump (overtrumping
  obligation applies universally).
- `getTrickWinner` uses the correct rank order (SA uses
  `NON_TRUMP_ORDER` for all suits; TA uses `TRUMP_ORDER` for all
  suits).
- Tests: SA trick won by highest ace regardless of suit; TA trick
  overtrumped by jack across suits.
