# Iteration 088 — Group Tunisian Belote under `packages/tunisian/`

## Goal

Bring the Tunisian-Belote package family into the `packages/<game>/{core,app,ui}` layout (per `GAME_PACKAGE_GUIDELINE.md` §1) by moving `packages/{app,core}` under `packages/tunisian/` and carving Tunisian-only UI out of `packages/ui` into a new `packages/tunisian/ui`.

## Out of scope

- **Package renames.** `@belote/app`, `@belote/core` keep their npm names. Renaming to `@tunisian/*` is deferred to iteration 089 (folder/name alignment).
- **`packages/ui` rename to `@cards/ui-shell`.** Deferred to the Phase-4 platform refactor.
- **Carving the gray-zone board primitives** (`CardFace`, `HandDisplay`, `TrickArea`, `ScorePanel`, `RoundSummary`, `PlayerAvatar`, `TimerRing`, `BidWinReveal`, `AvatarActionMenu`, `ChatPanel`, `GameOver`, `CardBack`, `OpponentHand`, `TrumpIndicator`) out of `packages/ui`. They are typed against `@belote/core` and consumed by both `GameTable` (Tunisian) and `CoinchGameTable` (Coinche). Their proper home is `@cards/ui-shell` once the platform extraction happens. Until then, `packages/ui` continues to transitively depend on `@belote/core`.
- **No game-rules changes**, no new tests for new behaviour. This is a structural refactor only.

## Acceptance criteria

- [ ] `packages/tunisian/app/` exists and contains the contents of the former `packages/app/`. Package name remains `@belote/app`.
- [ ] `packages/tunisian/core/` exists and contains the contents of the former `packages/core/`. Package name remains `@belote/core`.
- [ ] `packages/tunisian/ui/` exists with `@tunisian/ui` as the package name. It contains `components/BidPanel/` (component + CSS module + test), plus a barrel `src/index.ts` exporting `BidPanel`.
- [ ] `packages/ui` (the shell) still renders `BidPanel` inside `GameTable`, now imported from `@tunisian/ui`.

### Scope reduction — what is NOT moving (deferred to N+1)

Audit during execution revealed that several components originally listed as "Tunisian-only" are actually entangled with cross-cutting shared shell utilities:

- `GameTable` (container + `GameTableView`) is consumed by `CoinchGameTable`, so it is **shared, not Tunisian-only**. Stays in shell.
- `useGameSession` imports from `messages/gameMessages.ts`, which is _also_ imported by `useCoinchGameSession` (a pre-existing platform-manifesto Rule 1 / Rule 2 leak — duplication is the correct fix). Moving `useGameSession` requires either duplicating `gameMessages.ts` or fixing the leak, both of which exceed this iteration's mechanical-refactor scope. Stays in shell.
- `OnlineLobby`, `OnlineRandomScreen`, `useOnlineGameSession`, `useOnlineLobby` form one cohesive online subsystem that is currently Belote-only at runtime but plumbed through shell-level auth/friends APIs. Untangling that is its own iteration. Stays in shell.

The conservative one-component move establishes the `@tunisian/ui` package boundary so future iterations have a target.

- [ ] `pnpm-workspace.yaml` lists `packages/tunisian/*`.
- [ ] `eslint.config.mjs` blocks `@coinche/*` imports from `packages/tunisian/**/*.{ts,tsx}` (mirror of the existing rule for `packages/coinche/**`).
- [ ] `Dockerfile` `COPY` paths point to the new locations.
- [ ] Root `tsconfig.json` references the new paths.
- [ ] All 4 checks pass (`pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`).
- [ ] Test count remains 2105/2105 (no behaviour change).
- [ ] Dev smoke: `/`, `/belote/ai`, `/coinche/ai`, `/belote/online`, `/belote/random` all render.

## Files to touch

### Moved (mechanical `git mv`)

- `packages/app/` → `packages/tunisian/app/`
- `packages/core/` → `packages/tunisian/core/`
- `packages/ui/src/components/BidPanel/` → `packages/tunisian/ui/src/components/BidPanel/`
- `packages/ui/__tests__/BidPanel.test.tsx` → `packages/tunisian/ui/__tests__/BidPanel.test.tsx`

### New

- `packages/tunisian/ui/package.json` — name `@tunisian/ui`, deps `@belote/app`, `@belote/core`, `@belote/protocol`, `react`
- `packages/tunisian/ui/tsconfig.json`
- `packages/tunisian/ui/tsconfig.build.json` (optional — Coinche-ui has none)
- `packages/tunisian/ui/vitest.config.ts`
- `packages/tunisian/ui/src/index.ts` — barrel exporting moved symbols
- `packages/tunisian/ui/__tests__/setup.ts` (mirroring `packages/ui/__tests__/setup.ts` if specifics needed)

### Modified

- `pnpm-workspace.yaml` — add `packages/tunisian/*`
- `tsconfig.json` (root) — update `references` paths to `packages/tunisian/core/...` and `packages/tunisian/app/...`
- `packages/tunisian/app/tsconfig.json` — `../../tsconfig.base.json` → `../../../tsconfig.base.json`
- `packages/tunisian/app/tsconfig.build.json` — same, plus reference path `../core/...` stays correct (sibling)
- `packages/tunisian/core/tsconfig.json` — same base-path bump
- `packages/tunisian/core/tsconfig.build.json` — same
- `Dockerfile` — update `COPY packages/{app,core}/...` paths
- `eslint.config.mjs` — add `no-restricted-imports` rule for `packages/tunisian/**/*.{ts,tsx}` blocking `@coinche/*`
- `packages/ui/package.json` — add `@tunisian/ui` to dependencies
- `packages/ui/src/App.tsx` — change relative imports for the moved components to `@tunisian/ui`
- Any test file under `packages/ui/__tests__/` that imports moved components — change relative paths to `@tunisian/ui`
- `packages/ui/src/dev/fixtures/*.tsx` — fixture files for moved components may need to move with them or stay in shell with import-path updates
- `packages/ui/vitest.config.ts` — no change expected (only its own test glob)

## Reusable symbols

This is a refactor; no new symbols. The moved packages preserve their export surface.

## Test plan (refactor, not TDD)

A refactor has no red-phase. The existing 2105-test suite is the safety net. Strategy:

1. Move packages/{app,core} first — keep package names. Verify all 4 checks pass.
2. Scaffold packages/tunisian/ui empty, add it to workspace, install. Verify build still works.
3. Move components one cluster at a time (BidPanel → run tests → GameTable → run tests → online flow → run tests). After each cluster, run targeted tests to keep diff small if something breaks.
4. After all moves, run the full 4 checks.
5. Manual browser smoke against the dev server.

## Validation

- `pnpm test` — expected: 2105/2105 (no delta).
- `pnpm typecheck` — clean.
- `pnpm lint` — delta-clean over baseline (188 parsing errors). The new no-restricted-imports rule for `packages/tunisian/**` must not flag any existing imports — verify by inspection that no moved file imports `@coinche/*`.
- `pnpm format:check` — clean.
- Manual dev smoke: confirmed routes render and AI mode plays at least one trick.

## Carryforward

- **N+1 (iter 089) — Align folder name and package namespace.** Rename `@belote/app` → `@tunisian/app`, `@belote/core` → `@tunisian/core`, `@belote/protocol` and `@belote/server` decisions deferred. Updates ~25 import sites across `packages/ui`, `packages/server`, `packages/tunisian/{app,core}/__tests__`. Mirrors the `@coinche/*` precedent for naming.
- **N+2 (iter 090) — Carve `@cards/ui-shell` out of `packages/ui`.** Extract the genuinely game-agnostic board primitives (CardFace, HandDisplay, TrickArea, ScorePanel, etc.) to `packages/cards/ui-shell/`. Both `@tunisian/ui` and `@coinche/ui` import from it. Removes the lingering `packages/ui → @belote/core` transitive dependency.

## Risks

- **Vite HMR cache** (per CLAUDE.md). After the move, clear `packages/ui/node_modules/.vite` before the dev smoke or stale module graphs may serve cached old imports.
- **Lockfile churn.** `pnpm install` will regenerate `pnpm-lock.yaml` for the new workspace member. Expected and reviewable.
- **CSS module path resolution.** Some components import CSS via `./Foo.module.css` relative paths; these stay co-located with the component as they move, so no breakage expected.
- **Fixtures + screen viewer.** The barrel-sweep test (`fixtures.test.tsx`) auto-verifies fixtures still render. If a moved component had a fixture that lived in `packages/ui/src/dev/fixtures/`, the fixture must either move with the component (re-exported from `@tunisian/ui` for the screen viewer to keep working) or import the component from `@tunisian/ui`.
