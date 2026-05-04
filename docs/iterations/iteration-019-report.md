# Iteration 019 Report — Menu visual makeover

**Date**: 2026-05-04
**Status**: Complete
**Test delta**: 705 → 709 (+4)

## Goal

Give `ModeSelectScreen` a distinctive visual identity. The user
described the previous menu as "most basic UI ever" — iterations 015 /
016 made it responsive and a11y-clean, but visual personality was
untouched. This iteration adds the personality: dark felt background,
hero card-fan, gold gradient title, icon-led mode tiles, suit
watermarks.

## TDD trail

1. **Wrote failing tests** in `ModeSelectScreen.test.tsx`:
   - hero strip present (`data-testid="menu-hero"`),
   - each mode tile has its decorative icon
     (`data-testid="mode-icon-<mode>"`),
   - ranked tile shows a "Coming soon" pill
     (`data-testid="mode-pill-ranked"`),
   - decorative SVG icons + the hero are `aria-hidden="true"` so they
     don't bleed into the accessible name.
     Initial run: **4 failed, 8 passed** (red).

2. **Implemented the markup** (TSX): added inline `<HeroFan>`,
   `<SuitWatermarks>`, four hand-drawn SVG icons (CPU / Friends /
   Shuffle / Trophy), and a "Coming soon" pill on the ranked tile.
   All 12 tests green.

3. **Layered in the CSS direction.** New tokens in `tokens.css`
   (`--menu-felt-*`, `--gold-ramp-*`, `--menu-tile-*`,
   `--menu-icon-size`, `--menu-hero-card-w`). Module CSS reworked for:
   - layered background (radial gradient + diagonal felt overlay),
   - corner suit watermarks at 0.045 opacity,
   - title gold-ramp gradient + drop shadow,
   - tile chrome: 2-column grid (icon | label/subtitle), 1° tilt-on-hover,
   - all entrance animations gated by
     `@media (prefers-reduced-motion: no-preference)`,
   - explicit `prefers-reduced-motion: reduce` reset at the bottom.

4. **Browser smoke** caught a port-collision footgun: stale dev
   server on 5173 served pre-iteration HTML; my new server bound to 5175. Easy to mistake "no visual change" for "implementation
   missing" — fixed by navigating to the actual port.

5. **One copy refinement** mid-iteration: ranked tile said "Coming
   soon" twice (subtitle + pill). Replaced subtitle with "Climb the
   leaderboard" so the pill alone carries the status.

## Files

### Modified

- `packages/ui/src/components/ModeSelectScreen/ModeSelectScreen.tsx`
  — `ModeButton` now carries an `icon: ReactElement`; new inline
  components `HeroFan`, `SuitWatermarks`, `CpuIcon`, `FriendsIcon`,
  `ShuffleIcon`, `TrophyIcon`. Tile body switched to grid layout with
  icon column.
- `packages/ui/src/components/ModeSelectScreen/ModeSelectScreen.module.css`
  — full rewrite of background composition + new tile chrome +
  hero-fan + watermarks + entrance animations.
- `packages/ui/src/styles/tokens.css` — added the iteration-019 token
  block (felt colours, gold ramp, tile chrome, icon sizing, hero card
  width).

### Tests (extended)

- `packages/ui/__tests__/ModeSelectScreen.test.tsx` — +5 tests for
  hero, icons, pill, and aria-hidden enforcement on decorative
  elements.

### Not touched

- `StartScreen` (in-game splash). The plan suggested a typography +
  CTA tweak, but on inspection in the screen viewer the existing
  StartScreen already aligns with the new gold theme (uses
  `var(--gold)`, has its own card-fan hero from `belote-hero.svg`).
  Touching it for cosmetics-only would have been scope creep.
  Carryforward: revisit if/when the gold ramp tokens are extended
  with explicit StartScreen-specific shades.

## Validation

| Check                                 | Result                                                     |
| ------------------------------------- | ---------------------------------------------------------- |
| `pnpm test`                           | 34 files / 709 tests passing (+4 over baseline 705)        |
| `pnpm typecheck`                      | Clean                                                      |
| `pnpm lint`                           | 188 errors — **identical** to post-018 baseline (delta +0) |
| `pnpm format:check` (iteration scope) | Clean                                                      |

### Manual smoke (browser)

- `http://localhost:5175/twistedFate-belote/` (root menu) — renders
  hero card-fan, gold gradient title with subtle entrance animation,
  four icon-led tiles, ranked-tile "Coming soon" pill, suit
  watermarks visible in the four corners at very low opacity. No
  console errors.
- Same at `390 × 844` portrait — single-column tile stack, hero
  scales down cleanly, no overflow.
- `?screens` (screen viewer) still works — iteration 017 dev mode
  not regressed.

Screenshots saved to `docs/screenshots/iteration-019-menu-desktop.png`
and `docs/screenshots/iteration-019-menu-portrait.png`.

## Carryforward

- **Iteration 020** — give `OnlineLobby` and `OnlineRandomScreen` the
  same icon-led tile / dark-felt language for visual consistency. The
  CSS tokens added here are reusable; the work should be small.
- **Iteration 021** — extend the ranked-tile "Coming soon" pill
  pattern to a generic `<ComingSoonPill>` if more disabled-feature
  tiles appear.
- **Pixel-diff regression suite** — the menu makeover is now a
  natural baseline anchor. Wiring Playwright screenshot diffs into
  CI becomes attractive.
- **InstallPrompt overlay** — covers part of the menu at the top.
  Not directly an iteration 019 issue, but worth a polish pass
  (smaller chip, dismiss-once-permanently, or move to a settings
  affordance) to give the menu its visual breathing room.
