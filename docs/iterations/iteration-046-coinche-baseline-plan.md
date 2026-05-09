# Iteration 046 — Coinche baseline packages

## Goal

Scaffold `@coinche/core`, `@coinche/app`, and `@coinche/ui` as
renamed clones of `@belote/core`, `@belote/app`, and the
game-specific subset of `packages/ui`. No rule changes — the clones
still implement Belote rules. Subsequent iterations specialise them.

## Out of scope

- Coinche-specific rule logic (sans-atout, tout-atout, coinche
  multiplier, strict belote announcement, sequence announcements).
- `server-adapter.ts` / `EngineHandle` registration — the shared
  `engines` registry doesn't exist yet; that's
  `PLATFORM_REFACTOR_PLAN_v2.md` Phase 0. A follow-up iteration
  wires the adapter once Phase 0 lands.
- Lobby game-picker UI — requires touching shared `packages/ui`
  screens (out of per-game package scope for bootstrap).
- Renaming game-concept identifiers inside source files (e.g.
  `BELOTE_BONUS`, `detectBeloteRebelote`) — valid coinche concepts,
  renamed when specialisation requires it.

## Acceptance criteria

- [ ] `packages/coinche/{core,app,ui}/` directories exist.
- [ ] `pnpm-workspace.yaml` includes `"packages/coinche/*"`.
- [ ] `pnpm install` succeeds with no errors.
- [ ] `pnpm test` — all existing tests pass plus the new coinche/core
      and coinche/app suites run (same tests as @belote equivalents).
- [ ] `pnpm typecheck` — clean.
- [ ] `pnpm lint` — delta-clean (no new errors beyond 188 baseline).
- [ ] `pnpm format:check` — clean.
- [ ] ESLint `no-restricted-imports` rule updated to block
      cross-game imports (each game excluded from its own deny list).
- [ ] Reviewer confirms find-replace was clean (no stray `@belote`
      in coinche package files).

## Files

### New directories

- `packages/coinche/core/` — copy of `packages/core`, package name
  `@coinche/core`, internal imports updated.
- `packages/coinche/app/` — copy of `packages/app`, package name
  `@coinche/app`, depends on `@coinche/core`.
- `packages/coinche/ui/` — minimal stub with game-specific component
  directories scaffolded. Depends on `@coinche/core`, `@coinche/app`,
  and `ui` (the Belote React app, temporarily) for shell components.

### Modified

- `pnpm-workspace.yaml` — add `"packages/coinche/*"`.
- `eslint.config.mjs` — add `no-restricted-imports` cross-game rule.

## TDD plan

This iteration is mechanical (rename + copy). Tests are the **existing
@belote test suite re-run against the renamed coinche packages**.
No new logic tests needed — the red/green cycle is satisfied by
confirming the existing test suite passes against the new packages.

## Validation

- `pnpm install` — success.
- `pnpm test` — expected test delta: +N (coinche/core) + M (coinche/app)
  matching the belote equivalents. Exact counts established after copy.
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check` — clean.

## Carryforward for N+1 and N+2

**N+1 (iteration 047) — Coinche scoring + bidding model:**

- Implement `COINCHE_MULTIPLIER`, `coincheSurcoinche` scoring branches
  in `@coinche/core`.
- Specialise `calculateCoinchRoundScore` for the `(annonce + 160) × N`
  formula.
- TDD: write failing tests for coinche-specific scoring first.
- Files: `packages/coinche/core/src/models/scoring.ts`,
  `packages/coinche/core/__tests__/coinche-scoring.test.ts`.

**N+2 (iteration 048) — Sans-Atout + Tout-Atout contracts:**

- Add `ContractType = "suit" | "sans-atout" | "tout-atout" | "capot"`
  to `@coinche/core`.
- Specialise card-point tables per contract type (§3 of
  `docs/games/coinche/GAME_RULES.md`).
- TDD: failing tests for SA/TA point totals first.
