# Iteration 047 Report — Coinche multiplier formula

**Date**: 2026-05-09
**Status**: Complete

## Goal

Fix `calculateRoundScore` in `@coinche/core` to use the Coinche-correct
`(contract.value + 160) × coincheLevel` formula instead of the
inherited Belote formula `160 × coincheLevel`.

## Scope

1. New `packages/coinche/core/__tests__/models/coinche-scoring.test.ts`
   — 10 tests pinning the correct Coinche formula (RED first).
2. `packages/coinche/core/src/models/scoring.ts` — one-line change
   replacing `FAILED_CONTRACT_POINTS * coincheLevel` with
   `(contract.value + FAILED_CONTRACT_POINTS) * coincheLevel` via a
   shared `coinchePayout` constant.
3. `packages/coinche/core/__tests__/models/scoring.test.ts` — updated 5
   inherited Belote-formula expectations to correct Coinche values.
4. `vitest.config.ts` (root) — added `"packages/coinche/*"` to
   `projects` so coinche packages run in the full workspace test suite.
5. `docs/iterations/iteration-047-coinche-scoring-plan.md`.

## PO Decisions Locked

- Formula `(contract.value + 160) × coincheLevel` applies to all
  failures (any level) and all coinched/surcoinched successes (×2/×4).
- Plain success (×1) keeps card-based scoring: each team scores its
  earned card points. The contract value does not add to the winner's
  score in that case.
- Belote bonus (+20) is always added flat to the holding team,
  unaffected by the coinche multiplier.

## Tests Written (10 new, written before implementation)

| Test name                                                   | Asserts                            |
| ----------------------------------------------------------- | ---------------------------------- |
| plain success (×1) bidder gets card points                  | Card-based scoring unchanged       |
| plain failure (×1) opponents get contract + 160             | `(100 + 160) × 1 = 260`            |
| different contract values produce different failure scores  | `250`, `320` for contracts 90, 160 |
| coinché failure (×2) opponents get (contract + 160) × 2     | `520`                              |
| coinché success (×2) bidder gets (contract + 160) × 2       | `520`                              |
| surcoinché failure (×4) opponents get (contract + 160) × 4  | `1040`                             |
| surcoinché success (×4) bidder gets (contract + 160) × 4    | `1040`                             |
| belote +20 added to bidder even when coinched success       | `beloteBonus = 20` preserved       |
| belote +20 is NOT multiplied by coinche level               | Bonus is flat 20                   |
| formula regression guard: contract=90, ×2 gives 500 not 320 | `500 ≠ 320`                        |

**Red phase confirmed**: 9/10 failed before implementation (plain
success was already correct).

## Implementation Summary

### Files Created

- `packages/coinche/core/__tests__/models/coinche-scoring.test.ts` —
  10-test file; self-contained with its own trick/contract helpers.

### Files Modified

- `packages/coinche/core/src/models/scoring.ts` — replaced two
  occurrences of `FAILED_CONTRACT_POINTS * contract.coincheLevel` with
  a shared `coinchePayout = (contract.value + FAILED_CONTRACT_POINTS) * contract.coincheLevel`.
- `packages/coinche/core/__tests__/models/scoring.test.ts` — updated 5
  expected values inherited from the `@belote/core` copy:
  - failure ×1: `160 → 260`
  - failure ×2: `320 → 520`
  - failure ×4: `640 → 1040`
  - success ×2: `320 → 520`
  - success ×4: `640 → 1040`
    Also updated test descriptions to reflect the correct formula.
- `vitest.config.ts` — added `"packages/coinche/*"` to `projects`.

### Key types / functions

No new exported types. `coinchePayout` is a local constant inside
`calculateRoundScore`.

## Technical Decisions

| Decision                       | Choice                                 | Rationale                                                                                                                                                                    |
| ------------------------------ | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unify formula                  | Single `coinchePayout` local constant  | DRY — success coinched and failure use the same expression; extracted once                                                                                                   |
| Plain success stays card-based | No change                              | In French Coinche, the multiplier only applies when the contract bet is active (i.e. when coinche was called). Plain success still gives each team their earned card points. |
| `vitest.config.ts` update      | Added `packages/coinche/*` to projects | Coinche packages nested one level deeper than belote packages; `packages/*` glob only matched the `coinche/` directory, not its sub-packages.                                |

## Refactoring Performed

None beyond the targeted formula fix.

## Risks Identified

- **`@coinche/app` session not updated**: `GameSession` in
  `@coinche/app` still dispatches bids without a `coincheLevel`
  parameter (inherited belote behaviour). The scoring fix is inert
  until the session wires coinche/surcoinche commands properly. That's
  iteration 049 territory.
- **`@belote/core` scoring unchanged**: Verified by grepping — no
  changes to `packages/core/src/models/scoring.ts`. The belote and
  coinche engines are fully independent.

## Validation Results

| Check               | Result                                     |
| ------------------- | ------------------------------------------ |
| `pnpm test`         | ✅ **1872 / 1872 passing** (82 test files) |
| `pnpm typecheck`    | ✅ Clean                                   |
| `pnpm lint`         | ✅ Delta-clean                             |
| `pnpm format:check` | ✅ Clean                                   |

## Next Iteration: 048 — Sans-Atout + Tout-Atout contracts

**Goal**: Add contract-type-aware card-point tables to `@coinche/core`.

**Scope:**

- `ContractType = "suit" | "sans-atout" | "tout-atout"` type.
- `getCoincheCardPoints(card, trumpSuit, contractType)` function:
  - `"suit"`: existing trump/non-trump tables (unchanged).
  - `"sans-atout"`: ace=19, all jacks=0, no trump.
  - `"tout-atout"`: J=14, 9=9, A=6, 10=5, K=3, Q=1 (flat-rebalanced,
    sums to 152).
- Thread `contractType` through `calculateTeamPoints` and
  `calculateRoundScore` in `@coinche/core`.
- Failing tests first against `docs/games/coinche/GAME_RULES.md` §3.

**Acceptance criteria:**

- `getCoincheCardPoints` passes all 3 contract-type tables.
- `calculateRoundScore` uses the right table per contract type.
- No changes to `@belote/core`.
- All 4 checks clean.

## Iteration 049 Preview — Capot bid type

Add `"capot"` to the bid model in `@coinche/core`.
`calculateCapotScore` per §7: not-bid capot=250+contract; bid+made=500;
bid+failed=500 to opponents; coinched capot=1000/2000. Session wires
the coinche/surcoinche commands so `coincheLevel` is set at runtime.
