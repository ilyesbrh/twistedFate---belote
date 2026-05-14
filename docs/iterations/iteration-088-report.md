# Iteration 088 — Report

## Goal

Bring the Tunisian-Belote package family into the `packages/<game>/{core,app,ui}` layout (per `GAME_PACKAGE_GUIDELINE.md` §1) by moving `packages/{app,core}` under `packages/tunisian/` and carving Tunisian-only UI out of `packages/ui` into a new `packages/tunisian/ui`.

## Scope (delivered)

1. `packages/app` → `packages/tunisian/app` (`@belote/app` — name preserved).
2. `packages/core` → `packages/tunisian/core` (`@belote/core` — name preserved).
3. New `packages/tunisian/ui` package (`@tunisian/ui`) scaffolded with `package.json`, `tsconfig.json`, `vitest.config.ts`, `src/test-setup.ts`, `src/index.ts`, `src/css-modules.d.ts`.
4. `BidPanel` component (component + CSS module + test) moved from `packages/ui/src/components/BidPanel/` to `packages/tunisian/ui/src/components/BidPanel/`.
5. Workspace, tsconfig, Dockerfile, vitest projects glob, and ESLint isolation rule updated.

## PO decisions locked

| Decision                             | Choice                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------ |
| Folder name                          | `packages/tunisian/` (not `packages/belote/`, to mirror `coinche/`)      |
| Package npm names                    | Kept as `@belote/app`, `@belote/core` (rename deferred to iter 089)      |
| Shell rename                         | `packages/ui` stays as `"ui"`; `@cards/ui-shell` extraction is iter 090  |
| UI carve-out scope                   | `BidPanel` only; gray-zone primitives stay in shell                      |
| Online subsystem (Lobby/Random/etc.) | Stays in shell — entangled with auth/friends APIs                        |
| `useGameSession` hook                | Stays in shell — depends on `messages/gameMessages.ts` shared by Coinche |

## Tests written

None added. This iteration is a structural refactor — no new behaviour, no TDD red phase. The existing test suite serves as the safety net. `BidPanel.test.tsx` (7 tests) moved with its component and continues to pass under the new `@tunisian/ui` project.

## Implementation summary

### Files created

- `packages/tunisian/ui/package.json` (name `@tunisian/ui`)
- `packages/tunisian/ui/tsconfig.json`
- `packages/tunisian/ui/vitest.config.ts` (project name `tunisian-ui`)
- `packages/tunisian/ui/src/test-setup.ts` (vitest + jest-dom + cleanup)
- `packages/tunisian/ui/src/index.ts` (barrel — exports `BidPanel`)
- `packages/tunisian/ui/src/css-modules.d.ts` (ambient `*.module.css` declaration)
- `docs/iterations/iteration-088-plan.md`, `docs/iterations/iteration-088-report.md`

### Files moved (`git mv`)

- All of `packages/app/**` → `packages/tunisian/app/**` (15 files)
- All of `packages/core/**` → `packages/tunisian/core/**` (24 files)
- `packages/ui/src/components/BidPanel/{BidPanel.tsx, BidPanel.module.css}` → `packages/tunisian/ui/src/components/BidPanel/`
- `packages/ui/__tests__/BidPanel.test.tsx` → `packages/tunisian/ui/__tests__/BidPanel.test.tsx`

### Files modified

- `pnpm-workspace.yaml` — added `packages/tunisian/*`
- `vitest.config.ts` (root) — projects glob switched to explicit per-config-file pattern to avoid the spurious duplicate-discovery that was inflating test counts
- `tsconfig.json` (root) — references updated to `packages/tunisian/{app,core}/tsconfig.build.json`
- `Dockerfile` — `COPY` paths updated to new locations
- `eslint.config.mjs` — added `no-restricted-imports` rule for `packages/tunisian/**/*.{ts,tsx}` blocking `@coinche/*`; mirrored the existing `packages/coinche/**` rule which now also blocks `@tunisian/*` (forward-looking, for iter 089 rename)
- `packages/tunisian/{app,core}/tsconfig.{json,build.json}` — `extends` path bumped one level (`../../tsconfig.base.json` → `../../../tsconfig.base.json`)
- `packages/ui/package.json` — added `@tunisian/ui` workspace dep
- `packages/ui/src/components/GameTable/GameTable.tsx` — `BidPanel` import switched to `@tunisian/ui`
- `packages/ui/src/dev/fixtures/bidPanel.fixtures.tsx` — same

## Technical decisions

| Decision                                                 | Why                                                                                                                                                                                                                              |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Use explicit per-config-file globs in `vitest.config.ts` | The previous `packages/*` glob matched parent dirs (`packages/coinche`, `packages/tunisian`) as projects without configs, double-counting tests inside their subtrees and failing jsdom-required tests against the root config.  |
| CSS-module typings via local `*.d.ts`                    | Avoids `vite/client` dependency leaking into `@tunisian/ui`'s public API; mirrors the pattern other isolated game packages will need.                                                                                            |
| `BidPanel` move only                                     | Audit during execution exposed that `GameTable` is consumed by Coinche too, and that `useGameSession`/`gameMessages.ts` is shared with Coinche's session hook. Moving them is a separate iteration once those leaks are unwound. |

## Refactoring performed

This iteration _is_ refactoring. No additional cleanup was performed.

## Risks identified

- **Test count baseline changed.** The previously-reported "2174" / "2105" count was inflated by the buggy duplicate-discovery glob. Real count is 1573. Future iterations should use 1573 as the baseline.
- **Lockfile churn.** `pnpm-lock.yaml` regenerated as the workspace member list changed. Reviewable diff.
- **`packages/tunisian/ui` test-setup uses `@testing-library/jest-dom/vitest` subpath** — the same Coinche-ui's `test-setup.ts` uses the non-vitest subpath. If Coinche adds rendering tests, it'll need the same fix.
- **Folder name vs npm name mismatch is intentional but temporary.** `packages/tunisian/app` exports as `@belote/app`. Iter 089 closes this gap.

## Validation results

- `pnpm test` — **1573/1573 passed** (80 test files; new project `tunisian-ui` runs 7 BidPanel tests; `belote`/`app` and `core` project labels rebranded to `tunisian/app` and `tunisian/core` by their existing per-package `name:` in vitest config).
- `pnpm typecheck` — **clean** (exit 0).
- `pnpm lint` — **246 errors total**, all pre-existing. Delta over previous run: 0. (The CLAUDE.md baseline note of "188 parsing errors" is stale — actual current parsing errors total 12, all on `*.mjs` script files and `packages/ui/{eslint.config.js,public/sw.js}`. The remaining 234 are pre-existing typed errors in `ui`, `server`, `coinche/core`, `db` source files that were unchanged by this iteration.)
- `pnpm format:check` — **clean** (the plan file needed one Prettier pass after I wrote it, then passes).

## Next iteration: 089 — Align folder name and package npm namespace

**Goal.** Rename `@belote/app` → `@tunisian/app`, `@belote/core` → `@tunisian/core` so the folder path and package name agree.

**Acceptance criteria.**

- [ ] `packages/tunisian/app/package.json` name is `@tunisian/app`.
- [ ] `packages/tunisian/core/package.json` name is `@tunisian/core`.
- [ ] All consumer `from "@belote/(app|core)"` imports updated (~40 occurrences across `packages/ui`, `packages/server`, `packages/tunisian/{app,core}/__tests__`).
- [ ] `@belote/server` continues to depend on the renamed packages (Dockerfile entry survives — the `pnpm --filter @belote/server start` CMD targets the still-named `@belote/server`; the rename targets only `@belote/{app,core}`).
- [ ] ESLint isolation rule for `packages/coinche/**` continues to block `@tunisian/*` (already added in this iteration as forward planning).
- [ ] 4 checks pass.

**Out of scope for 089.** `@belote/protocol`, `@belote/server`, `@belote/animation`, `@belote/db` keep their names — they're shared infra/server, not Tunisian-specific game packages.

## Iteration 090 preview — `@cards/ui-shell` extraction

Carve the genuinely game-agnostic board primitives (`CardFace`, `CardBack`, `HandDisplay`, `OpponentHand`, `TrickArea`, `ScorePanel`, `RoundSummary`, `PlayerAvatar`, `TimerRing`, `BidWinReveal`, `AvatarActionMenu`, `ChatPanel`, `GameOver`, `TrumpIndicator`) into `packages/cards/ui-shell/`. Untangle `useGameSession` from `messages/gameMessages.ts` by duplicating the messages file (Rule 2 — duplication is the right answer at two games). Remove the lingering `packages/ui → @belote/core` transitive dependency. After 090, the shell is genuinely game-agnostic and ready to host a third game.
