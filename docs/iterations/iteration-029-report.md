# Iteration 029 Report — Pixel-diff regression suite

**Date**: 2026-05-04
**Status**: Complete
**Test delta**: 715 → 715 (visual suite is separate from vitest)

## Goal

Establish a visual regression suite to catch what fixtures miss. The
915×412 BidPanel break shipped in iteration 028 escaped the fixture-
level tests because fixtures render components in isolation, never
in real composition / viewport. Pixel-diff covers that gap.

## What landed

### Runner — `scripts/visual-diff.mjs`

~150 lines. Uses `playwright` (already installed) for capture and
`pixelmatch` + `pngjs` (newly added devDeps) for diffing. No
`@playwright/test` (heavyweight test runner not needed for a
6-case smoke).

Workflow:

1. Iterate a manifest of `(label, route, viewport, setup?, target?)`
   cases.
2. Open a fresh browser context per case (deterministic state).
3. Navigate, run optional `setup(page)` (e.g. clicks), wait, capture
   PNG. If `target` is set, screenshot that locator only; else
   full viewport.
4. Compare against `e2e/baseline/<label>.png` with `pixelmatch`
   (`threshold: 0.18`). Allow ≤0.001 (0.1%) of pixels to differ for
   aliasing tolerance.
5. On mismatch: write `<label>.diff.png` + `<label>.current.png` to
   `e2e/diff/` (gitignored) and exit 1.
6. `--update` mode rewrites baselines.

### Initial baselines (6)

| Label                              | Route      | Viewport | Notes                            |
| ---------------------------------- | ---------- | -------- | -------------------------------- |
| `menu-desktop`                     | `/`        | 1280×800 | Full menu                        |
| `menu-portrait`                    | `/`        | 390×844  | Mobile-style menu                |
| `fixture-lobby-full`               | `?screens` | 1280×800 | Host-full lobby, scoped to stage |
| `fixture-mid-trick`                | `?screens` | 1280×800 | Mid-trick, scoped to stage       |
| `fixture-bidding-south`            | `?screens` | 1280×800 | Bidding panel + table            |
| `fixture-round-summary-takers-won` | `?screens` | 1280×800 | Modal                            |

### npm scripts

- `pnpm visual` — diff against baselines, exit 1 on mismatch.
- `pnpm visual:update` — rewrite baselines (manual blessing).

### Configuration

- `pixelmatch` and `pngjs` added to devDependencies.
- `.gitignore` — `e2e/diff/` ignored. `e2e/baseline/` committed.

## Files

### New

- `scripts/visual-diff.mjs` — the runner.
- `e2e/baseline/menu-desktop.png` — 1280×800 menu.
- `e2e/baseline/menu-portrait.png` — 390×844 menu.
- `e2e/baseline/fixture-lobby-full.png` — host-full lobby fixture.
- `e2e/baseline/fixture-mid-trick.png` — mid-trick fixture.
- `e2e/baseline/fixture-bidding-south.png` — bidding fixture.
- `e2e/baseline/fixture-round-summary-takers-won.png` — round-
  summary fixture.

### Modified

- `package.json` — added `visual` and `visual:update` scripts;
  `pixelmatch` and `pngjs` devDeps.
- `pnpm-lock.yaml` — corresponding lockfile entries.
- `.gitignore` — `e2e/diff/` rule added.

## Validation

| Check                                 | Result                                                             |
| ------------------------------------- | ------------------------------------------------------------------ |
| `pnpm visual:update`                  | 6 baselines written                                                |
| `pnpm visual`                         | **6 PASS** against the fresh baselines                             |
| `pnpm test`                           | 715/715 (no delta)                                                 |
| `pnpm typecheck`                      | Clean                                                              |
| `pnpm lint`                           | 189 (visual-diff.mjs is excluded by the script-file lint baseline) |
| `pnpm format:check` (iteration scope) | Clean                                                              |

## Mobile portrait smoke (separate verification — task B from

the user's request)

Verified the live game flow at 390×844 portrait:

- Menu — cream paper, 5-card fan, mode tiles stacked, "SOON" stamp.
- Solo Match → StartScreen → PLAY GAME → in-game.
- Lattice board, ScorePanel kraft note top-left, BidPanel cream
  notebook centered, monogram avatars on all four positions, hand
  at bottom.
- Two minor cosmetic notes (north avatar still close to card stack,
  side-avatar name labels can clip on long names) — not blocking.

Screenshot: `iteration-030-portrait-game.png`.

## Carryforward

- **Add baselines for landscape phone (915×412)** — would have
  caught the iteration 028 BidPanel break automatically.
- **Add baselines for mobile portrait (390×844)** — catches mobile
  layout drifts.
- **CI wiring** — once the repo has CI, run `pnpm visual` on every
  PR. Diff PNG artifacts uploaded as build artifacts.
- **Auto-update workflow** — when an intentional UI change lands,
  `pnpm visual:update` is manual.
