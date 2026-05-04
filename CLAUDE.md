# CLAUDE.md — Project notes for Claude Code

This file collects project-specific recipes and gotchas. Authoritative
docs are in `docs/` (`MANIFESTO.md`, `PLAYBOOK.md`, `REVIEW_PROTOCOL.md`,
`GAME_RULES.md`); contributor rules are in `CONTRIBUTING.md`. This is
the short list of things that have repeatedly bitten me in practice.

## Vite HMR cache footgun

**Symptom.** You edit `packages/ui/src/styles/tokens.css`, a `*.module.css`
file, or a CSS-Modules class hash, and the dev server keeps serving
the previous version even after a hard browser reload. `getComputedStyle`
shows the _old_ values; `import.meta.env.BASE_URL` evaluates as if the
old build is still active. Bit me in iterations 021, 024, 025, 026.

**Fix.**

```bash
# 1. Kill the running dev server (TaskStop the background task).
# 2. Nuke the Vite cache:
rm -rf packages/ui/node_modules/.vite
# 3. Restart:
pnpm --filter ui dev
```

**Note on port creep.** Each restart picks the next free port
(5173 → 5174 → 5175 …). After several iterations you can have a stack
of stale dev instances bound to the lower ports. Always `TaskStop` the
old background task before starting a new one, or you end up
navigating to port 5183 while serving stale code from 5173 in another
tab.

## Screen viewer

`?screens` mounts a dev-only fixture catalogue at every menu / in-game
component. Lazy-loaded; tree-shaken from prod.

```text
http://localhost:<port>/twistedFate-belote/?screens
```

Add a fixture: drop a file in `packages/ui/src/dev/fixtures/<name>.fixtures.tsx`,
re-export from `dev/fixtures/index.ts`. The barrel-sweep test
(`__tests__/fixtures.test.tsx`) auto-verifies render-without-crash.

**Caveat.** Fixtures render components in isolation. They do **not**
catch compositional bugs (e.g. iteration 025 found `<InstallPrompt>`
overlapping `<ScorePanel>`, which neither fixture would surface).
Do an end-to-end Playwright smoke before declaring an iteration done.

## Visual language (post iteration 026)

- Surface: cream paper (`--paper-cream`, ink-stamp suit watermarks,
  diagonal grain) for **menus**, **lobby**, **random matchmaking**,
  **install banner**, **start screen**.
- Game board: layered **walnut wood + forest felt + cream paper mat**
  (asset: `packages/ui/public/table-paper.svg`). Compass medallion at
  centre, suit pips at NSEW.
- Typography: **Yeseva One** (display serif), **Caveat** (handwritten),
  **Lora** (body) — loaded via `<link>` in `index.html`.
- Palette tokens in `packages/ui/src/styles/tokens.css`:
  `--ink-dark`, `--accent-teal`, `--accent-terracotta`, `--accent-mustard`,
  `--accent-sage`, gold ramp.
- Primary CTAs are **terracotta stamps** with chunky drop-shadow.

## Iteration discipline (TL;DR — full version in CONTRIBUTING.md)

1. Plan first: `docs/iterations/iteration-NNN-plan.md`.
2. TDD: failing test → minimum impl → green.
3. Four checks must pass: `pnpm test`, `pnpm typecheck`, `pnpm lint`,
   `pnpm format:check`. Lint is **delta-clean** over baseline (188
   parsing errors from existing test files don't count).
4. One feat commit per iteration; subject line carries the iteration
   number.
5. Report: `docs/iterations/iteration-NNN-report.md`.

**Numbering reset.** Reports `017–045` predate the deleted/rebuilt UI
track. New iterations from 017 onward overwrite those report files.
Don't assume sequential continuity across the reset.
