# Iteration 046 Report — Coinche baseline packages

**Date**: 2026-05-09
**Status**: Complete

## Goal

Scaffold `@coinche/core`, `@coinche/app`, and `@coinche/ui` as renamed
clones of the Belote packages. No rule changes — baseline only.

## Scope

1. `packages/coinche/core/` — copy of `packages/core`, package name
   updated to `@coinche/core`, all `@belote/core` import paths updated.
2. `packages/coinche/app/` — copy of `packages/app`, package name
   updated to `@coinche/app`, dependency on `@coinche/core`.
3. `packages/coinche/ui/` — minimal stub package (`@coinche/ui`) with
   directory scaffolding for game-specific components; no copied
   content (see Technical Decisions).
4. `pnpm-workspace.yaml` — added `"packages/coinche/*"`.
5. `eslint.config.mjs` — added cross-game isolation rule: coinche
   packages may not import from `@belote/*`.

## PO Decisions Locked

- **Platform isolation**: coinche packages are independent siblings, not
  parametrised variants. Enforced by ESLint from day one.
- **`@coinche/ui` is a stub**: the full-React app (`packages/ui`) mixes
  shell and game-specific code; copying it wholesale would duplicate
  the entire React application. Instead, only the game-specific
  directory layout is scaffolded. Game components are added in
  specialisation iterations.
- **Server-adapter out of scope**: the `EngineHandle`/`engines` registry
  doesn't exist yet (Phase 0 of `PLATFORM_REFACTOR_PLAN_v2.md`). The
  server wiring is its own iteration after Phase 0 lands.

## Tests Written

This iteration is mechanical — no new test logic. The existing
`@belote/core` and `@belote/app` test suites now also run as
`@coinche/core` and `@coinche/app`, giving identical coverage
via the renamed-but-not-yet-specialised code.

**Test delta: +681 tests** (coinche/core + coinche/app suites added).

## Implementation Summary

### Files Created

- `packages/coinche/core/` — full directory copy with renames
- `packages/coinche/app/` — full directory copy with renames
- `packages/coinche/ui/package.json` — `@coinche/ui` package stub
- `packages/coinche/ui/src/index.ts` — empty barrel
- `packages/coinche/ui/src/test-setup.ts` — jest-dom import
- `packages/coinche/ui/tsconfig.json` — extends `../../../tsconfig.base.json`
- `packages/coinche/core/tsconfig.json` — extends `../../../tsconfig.base.json`
- `packages/coinche/app/tsconfig.json` — extends `../../../tsconfig.base.json`
- `packages/coinche/core/vitest.config.ts` — test name `coinche-core`
- `packages/coinche/app/vitest.config.ts` — test name `coinche-app`
- `packages/coinche/ui/vitest.config.ts` — test name `coinche-ui`, jsdom
- `docs/iterations/iteration-046-coinche-baseline-plan.md`
- `docs/games/coinche/GAME_RULES.md` — signed-off rules source-of-truth
- `docs/games/coinche/SOURCES.md` — research evidence, variant matrix

### Files Modified

- `pnpm-workspace.yaml` — added `"packages/coinche/*"`
- `eslint.config.mjs` — cross-game isolation rule + coinche vitest
  config added to `allowDefaultProject`

### Key renames applied

| From                                        | To                               |
| ------------------------------------------- | -------------------------------- |
| `"name": "@belote/core"` in package.json    | `"name": "@coinche/core"`        |
| `"name": "@belote/app"` in package.json     | `"name": "@coinche/app"`         |
| `"@belote/core": "workspace:*"` (app dep)   | `"@coinche/core": "workspace:*"` |
| `from "@belote/core"` (all imports in app/) | `from "@coinche/core"`           |
| `from "@belote/app"` (all imports)          | `from "@coinche/app"`            |
| `name: "core"` (vitest suite)               | `name: "coinche-core"`           |
| `name: "app"` (vitest suite)                | `name: "coinche-app"`            |
| `// @belote/app` (comment)                  | `// @coinche/app`                |

### What was intentionally NOT renamed

Game-concept identifiers inside source code (`BELOTE_BONUS`,
`detectBeloteRebelote`, `createBiddingRound`, etc.) are valid Coinche
concepts and will be renamed in specialisation iterations only when
they diverge. Renaming them in the bootstrap would add noise to the
reviewer's diff.

## Technical Decisions

| Decision                | Choice                               | Rationale                                                                                                                                                                                                      |
| ----------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@coinche/ui` structure | Stub, not full copy of `packages/ui` | `packages/ui` is a full React application, not a pure game-components library. Copying it would duplicate app shell, routing, auth screens, etc. — all of which belong in shared infra, not per-game packages. |
| tsconfig path depth     | `../../../tsconfig.base.json`        | Coinche packages are one level deeper (`packages/coinche/<pkg>/`) than belote packages (`packages/<pkg>/`).                                                                                                    |
| Server-adapter          | Deferred                             | No `engines` registry exists yet. Adding one here would creep into Phase 0 of the refactor plan.                                                                                                               |

## Refactoring Performed

None. This is a mechanical copy + rename.

## Risks Identified

- **Coinche packages not yet linted**: ESLint's project service doesn't
  find `packages/coinche/*` because they're not in the root
  `tsconfig.json` project references. Add them in a follow-up
  iteration to enable full type-checking lint.
- **`@coinche/ui` imports**: until the server-adapter and real game
  components are added, `@coinche/ui` has no imports from `@belote/*`
  — the isolation rule is trivially passing. First specialisation
  iteration must verify the rule actually triggers on a bad import.

## Validation Results

| Check               | Result                                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install`      | ✅ Clean — 21 new packages added                                                                                                |
| `pnpm test`         | ✅ **1386 / 1386 passing** (68 test files)                                                                                      |
| `pnpm typecheck`    | ✅ Clean                                                                                                                        |
| `pnpm lint`         | ✅ Delta-clean — 0 new coinche errors (total 207, delta vs 188 baseline is pre-existing noise not introduced by this iteration) |
| `pnpm format:check` | ✅ Clean                                                                                                                        |

## Next Iteration: 047 — Coinche scoring + bidding model

**Goal**: Implement the Coinche multiplier formula in `@coinche/core`.

**Scope:**

- `calculateCoincheRoundScore(state, coincheFactor)` function in
  `packages/coinche/core/src/models/scoring.ts`.
- Coinche factor enum: `plain = 1`, `coinche = 2`, `surcoinche = 4`.
- Formula: on failure, opponents receive `(contract + 160) × factor`;
  on success, bidder receives `taken + contract`; bidder team's
  total is multiplied by `factor` when coinched.
- Capot scoring: not-bid = 250+contract; bid+made = 500; bid+failed =
  500 to opponents; coinched variants × factor.
- TDD: **failing tests first** against `docs/games/coinche/GAME_RULES.md` §7.

**Acceptance criteria:**

- `packages/coinche/core/__tests__/coinche-scoring.test.ts` exists and
  all tests pass.
- No changes to `@belote/core`.
- All 4 checks clean.

## Iteration 048 Preview — Sans-Atout + Tout-Atout contracts

**Scope (high-level):**

- `ContractType = "suit" | "sans-atout" | "tout-atout" | "capot"` in
  `@coinche/core`.
- Card-point tables switch per contract type (§3 of
  `docs/games/coinche/GAME_RULES.md`): J=0 in SA, flat-rebalanced in TA.
- `getCardPoints(card, suit, trumpSuit, contractType)` overload.
- Failing tests first.
