# Iteration 029 — Pixel-diff regression suite

## Goal

Establish a visual regression suite. The 915×412 BidPanel break we shipped
in iteration 028 was caught by manual smoke, not by the fixture-level
tests — fixtures render components in isolation and miss compositional /
viewport-specific issues. A pixel-diff suite covers that gap cheaply.

## Approach

No `@playwright/test` (heavyweight). Use `playwright` (already
installed as a dep) plus `pixelmatch` + `pngjs` for direct PNG diffing.

`scripts/visual-diff.mjs`:

- Iterates a manifest of `(label, route, viewport, setup, target)` cases.
- Captures a PNG with Playwright (full-page or scoped to a `target`
  selector).
- Compares against `e2e/baseline/<label>.png` with
  `pixelmatch(threshold: 0.18)`. Allow ratio ≤ 0.001 (0.1%) for
  aliasing.
- On mismatch: write `<label>.diff.png` + `<label>.current.png` to
  `e2e/diff/` (gitignored) and exit 1.
- `--update` mode rewrites baselines.

## Initial cases (6)

- `menu-desktop` — `/` at 1280×800
- `menu-portrait` — `/` at 390×844
- `fixture-lobby-full` — `?screens` → host-full fixture, scoped to
  the screen-viewer stage at 1280×800
- `fixture-mid-trick` — same approach
- `fixture-bidding-south` — same
- `fixture-round-summary-takers-won` — same

## Scope

### New

- `scripts/visual-diff.mjs` — the runner.
- `e2e/baseline/*.png` — committed baselines (6 files).
- npm scripts: `pnpm visual` (diff), `pnpm visual:update` (refresh).
- `pixelmatch`, `pngjs` as devDependencies.

### Modified

- `.gitignore` — add `e2e/diff/`.

## Out of scope

- CI wiring (these scripts run locally; CI integration is a separate
  iteration once we have CI).
- `@playwright/test` migration.
- Auto-spawning the dev server (manifest assumes it's running).

## TDD plan

The suite IS the test. Capture baselines, re-run in diff mode, expect
all PASS.

## Validation

- `pnpm visual:update` writes 6 baseline PNGs.
- `pnpm visual` reports 6 PASS.
- `pnpm test` / `typecheck` / `lint` / `format:check` unchanged.

## Carryforward

- Mobile portrait baselines (390×844) for in-game screens.
- Landscape phone (915×412) baselines, especially BidPanel — would
  have caught the iteration 028 break.
- CI integration once the project gets CI.
- Auto-update flow on intentional UI changes (currently manual via
  `pnpm visual:update`).
