# Iteration 020 Report — Online sub-screens visual alignment

**Date**: 2026-05-04
**Status**: Complete
**Test delta**: 709 → 715 (+6)

## Goal

Bring `OnlineLobby` (Friends mode) and `OnlineRandomScreen` (Random
matchmaking) into the same dark-felt visual language landed by
iteration 019, so navigating from menu → online flows feels
continuous.

## TDD trail

1. **Wrote `MenuFelt.test.tsx`** (red — module didn't exist).
   Implemented `MenuFelt` (TSX + module CSS) lifting the felt
   background composition + corner suit watermarks out of
   `ModeSelectScreen`. Tests green.
2. **Refactored `ModeSelectScreen`** to use `<MenuFelt>` as the
   wrapper. Removed the local `<SuitWatermarks>` helper and the
   felt-related rules from its module CSS. All 12 existing
   ModeSelectScreen tests stayed green.
3. **Extended `OnlineLobby.test.tsx` and `OnlineRandomScreen.test.tsx`**
   with: `menu-felt` + `menu-felt-watermarks` testids must be
   present, plus `room-code-card` / `random-progress-card` testids on
   the new paper-card badges. Confirmed red (4 failures).
4. **Wrapped both screens in `<MenuFelt>`** and tagged the
   paper-card markup. Tests green.
5. **Reworked the two module CSS files** — dropped the inline radial
   backgrounds, switched titles to the gold-ramp gradient, gave the
   room-code block + queue-progress block a cream-paper card-face
   treatment with serif numerals, upgraded primary buttons to the
   menu's gold-ramp tile chrome, thickened the spinner.

## Architecture note

`<MenuFelt>` is now the single source of truth for the menu-surface
visual language. Three screens compose it:

```text
ModeSelectScreen ──┐
OnlineLobby      ──┼──► <MenuFelt> (felt bg + watermarks + container)
OnlineRandomScreen ┘
```

`MenuFelt.module.css` carries the felt-related rules; each consuming
screen's module CSS owns only its layout overrides + screen-specific
chrome (mode-tile grid, room-code paper card, progress badge, etc.).

## Files

### New (shared)

- `packages/ui/src/components/MenuFelt/MenuFelt.tsx` — wrapper
  component.
- `packages/ui/src/components/MenuFelt/MenuFelt.module.css` — felt
  background + corner watermarks.

### Modified

- `packages/ui/src/components/ModeSelectScreen/ModeSelectScreen.tsx`
  — switched to `<MenuFelt>` wrapping, removed local
  `<SuitWatermarks>` helper.
- `packages/ui/src/components/ModeSelectScreen/ModeSelectScreen.module.css`
  — dropped felt + watermark rules (lifted to MenuFelt). Kept all
  hero / title / mode-tile chrome.
- `packages/ui/src/components/OnlineLobby/OnlineLobby.tsx` — wrapped
  in `<MenuFelt>`; added `data-testid="room-code-card"`.
- `packages/ui/src/components/OnlineLobby/OnlineLobby.module.css` —
  full rewrite: gold-ramp title, paper-card room code, gold-ramp
  primary buttons, tile chrome on player rows.
- `packages/ui/src/components/OnlineRandomScreen/OnlineRandomScreen.tsx`
  — wrapped in `<MenuFelt>`; wrapped progress in a paper-card badge.
- `packages/ui/src/components/OnlineRandomScreen/OnlineRandomScreen.module.css`
  — full rewrite: gold-ramp title, paper-card progress badge with
  serif numerals, thicker gold spinner, gold-ramp primary button.

### Tests (extended)

- `packages/ui/__tests__/MenuFelt.test.tsx` — 2 new tests.
- `packages/ui/__tests__/OnlineLobby.test.tsx` — +2 tests
  (MenuFelt presence, room-code paper card).
- `packages/ui/__tests__/OnlineRandomScreen.test.tsx` — +2 tests
  (MenuFelt presence, progress paper card).

### Fixtures (unchanged)

The screen-viewer fixtures from iteration 017 picked up the new
visuals automatically via the existing OnlineLobby /
OnlineRandomScreen fixtures. No fixture file changes; the registry
sweep test verified all 57 fixtures still render.

## Validation

| Check                                 | Result                                                                |
| ------------------------------------- | --------------------------------------------------------------------- |
| `pnpm test`                           | 35 files / 715 tests passing (+6 over baseline 709)                   |
| `pnpm typecheck`                      | Clean                                                                 |
| `pnpm lint`                           | 189 errors (was 188; +1 — the new MenuFelt test file's parsing error) |
| `pnpm format:check` (iteration scope) | Clean                                                                 |

### Manual smoke (browser, dev on :5176)

- `?screens` → `OnlineLobby host-full` fixture: dark felt + corner
  watermarks visible, gold gradient "Play with Friends" title,
  paper-card "ABCD" room code with serif numerals, all four seats
  green-tinted, gold "Start game" CTA.
- `?screens` → `OnlineRandomScreen queued 3/4`: dark felt, gold
  "Random match" title, gold spinner ring, paper-card "3/4 PLAYERS"
  badge.
- `/` (root menu) — unaffected by the MenuFelt refactor; identical
  to iteration 019 output.

Screenshots in `docs/screenshots/iteration-020-online-{lobby,random}.png`.

## Carryforward

- **Iteration 021** — natural fit for the pixel-diff regression
  suite (Playwright). Menu / lobby / random / random-queued surfaces
  are now visually stable and the screen viewer gives fixture-level
  coverage.
- The InstallPrompt overlay is still visible at the top of every
  menu screen and clips into the chrome. Worth a small dedicated
  iteration to reformat it (smaller chip, dismissible, or move into
  a settings affordance).
- If `MenuFelt` accumulates more shared chrome (back button, gold
  title helper, paper-card badge), extract those into named
  sub-components under `MenuFelt/` rather than copy-pasting CSS
  across the three screens.
