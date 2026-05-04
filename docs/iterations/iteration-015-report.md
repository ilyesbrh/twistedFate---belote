# Iteration 015 Report — Menu UI: device polish

**Date**: 2026-05-04
**Status**: Complete
**Plan**: [iteration-015-plan.md](iteration-015-plan.md)

> Note: this file previously held a "PlayerInfo — Avatar, Name & Status" report
> from the pre-rebuild UI track. That work no longer exists; the file has been
> replaced with the active iteration 015 record.

## Goal

Make every menu surface (mode select, start screen, online lobby, random
matchmaking, install prompt) look and feel right on every realistic device:
small phone portrait, small phone landscape, tablet, and desktop. No new
features, just responsive + a11y polish.

## Scope delivered

1. **Design tokens** for menu surfaces in `tokens.css`: fluid typography
   (`clamp()`), spacing scale, safe-area-inset shortcuts, radii, touch-min.
2. **Global rules** in `index.css`: every `[data-touch="primary"]` element
   gets the WCAG-recommended 44×44 minimum + a `:active` press transform; a
   `prefers-reduced-motion: reduce` block neutralises animations OS-wide.
3. **A11y attributes** on all interactive controls: `aria-label` on every
   icon/short button, `role="status"` + `aria-live="polite"` on the queued
   progress, `data-touch="primary"` markers on primary CTAs.
4. **CSS rewrites** for all 5 surfaces using the shared tokens, with
   short-landscape (height ≤ 500px) breakpoints and iOS safe-area padding so
   the back buttons clear the iPhone notch in PWA standalone mode.
5. **`prefers-reduced-motion`** wraps for all slide / fade animations.
6. **iOS auto-zoom workaround** — text inputs are now 16px-min so iOS Safari
   doesn't zoom on focus.

## TDD trail

A11y / structural attributes were TDD-able. CSS-only changes are not
behaviour-testable in jsdom (no layout engine), so they're verified by the
existing render tests continuing to pass + manual / smoke validation.

| Step | Test file                                                                                                        | Tests added   | Notes                                                                                                                   |
| ---- | ---------------------------------------------------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 1    | [packages/ui/\_\_tests\_\_/ModeSelectScreen.test.tsx](../../packages/ui/__tests__/ModeSelectScreen.test.tsx)     | 2 (additions) | `aria-label` on each mode button; `data-touch="primary"` markers.                                                       |
| 2    | [packages/ui/\_\_tests\_\_/OnlineRandomScreen.test.tsx](../../packages/ui/__tests__/OnlineRandomScreen.test.tsx) | 3 (additions) | Progress region has `role="status"` + `aria-live="polite"`; back/find/cancel/input have `aria-label`; CTA `data-touch`. |
| 3    | [packages/ui/\_\_tests\_\_/OnlineLobby.test.tsx](../../packages/ui/__tests__/OnlineLobby.test.tsx)               | 7 (new file)  | Idle / in-room / narrow viewport renders; a11y labels on back, nickname, create, join, start; touch markers.            |
| 4    | [packages/ui/\_\_tests\_\_/InstallPrompt.test.tsx](../../packages/ui/__tests__/InstallPrompt.test.tsx)           | 5 (new file)  | beforeinstallprompt event drives render; standalone-mode skip; dismiss persists; previously-dismissed skip.             |

**Net delta**: 646 → 663 tests (**+17** passing).

## Files

### Added

- [packages/ui/\_\_tests\_\_/OnlineLobby.test.tsx](../../packages/ui/__tests__/OnlineLobby.test.tsx)
- [packages/ui/\_\_tests\_\_/InstallPrompt.test.tsx](../../packages/ui/__tests__/InstallPrompt.test.tsx)
- [docs/iterations/iteration-015-plan.md](iteration-015-plan.md)

### Modified

- [packages/ui/src/styles/tokens.css](../../packages/ui/src/styles/tokens.css) — menu tokens block
- [packages/ui/src/index.css](../../packages/ui/src/index.css) — `[data-touch]` rules + reduced-motion
- [packages/ui/src/components/ModeSelectScreen/ModeSelectScreen.tsx](../../packages/ui/src/components/ModeSelectScreen/ModeSelectScreen.tsx) — `aria-label` + `data-touch`
- [packages/ui/src/components/ModeSelectScreen/ModeSelectScreen.module.css](../../packages/ui/src/components/ModeSelectScreen/ModeSelectScreen.module.css) — fluid sizing, safe-area, short-landscape grid
- [packages/ui/src/components/OnlineLobby/OnlineLobby.tsx](../../packages/ui/src/components/OnlineLobby/OnlineLobby.tsx) — `aria-label` + `data-touch` on all controls
- [packages/ui/src/components/OnlineLobby/OnlineLobby.module.css](../../packages/ui/src/components/OnlineLobby/OnlineLobby.module.css) — full responsive rewrite using tokens
- [packages/ui/src/components/OnlineRandomScreen/OnlineRandomScreen.tsx](../../packages/ui/src/components/OnlineRandomScreen/OnlineRandomScreen.tsx) — a11y attrs + `role="status"` on progress
- [packages/ui/src/components/OnlineRandomScreen/OnlineRandomScreen.module.css](../../packages/ui/src/components/OnlineRandomScreen/OnlineRandomScreen.module.css) — full responsive rewrite using tokens
- [packages/ui/src/components/StartScreen/StartScreen.module.css](../../packages/ui/src/components/StartScreen/StartScreen.module.css) — fluid sizing, safe-area, reduced-motion wrap
- [packages/ui/src/components/InstallPrompt/InstallPrompt.module.css](../../packages/ui/src/components/InstallPrompt/InstallPrompt.module.css) — safe-area top padding (clears iOS status bar), 44×44 hit areas, reduced-motion

## Validation

| Check               | Status      | Notes                                                   |
| ------------------- | ----------- | ------------------------------------------------------- |
| `pnpm test`         | ✓           | 663 / 663 (+17)                                         |
| `pnpm typecheck`    | ✓           | clean                                                   |
| `pnpm lint`         | delta clean | 177 errors, all pre-existing; iteration delta is **−1** |
| `pnpm format:check` | delta clean | 4 pre-existing files; iteration delta is **0**          |

## Design notes

- **Why CSS variables vs hardcoded `clamp()` per file**: 5 menu surfaces share
  the exact same scale. One source of truth in `tokens.css` means the next
  device-tuning iteration touches one file, not five.
- **`data-touch="primary"` over a CSS class**: an attribute survives CSS-modules'
  hash mangling and is also a stable contract testable from `__tests__/`. The
  global rule in `index.css` does the actual sizing.
- **`role="status"` + `aria-live="polite"` on the queue progress**: ensures
  screen readers announce queue position changes without interrupting other
  content (matches WAI-ARIA's "polite" semantics).
- **iOS notch / safe area**: applied `env(safe-area-inset-*)` via the
  `--safe-*` shortcut variables. This is only effective in PWA standalone
  mode (`viewport-fit=cover` is already set in `index.html`); it's a no-op in
  regular browser tabs.
- **Short-landscape grids**: when height ≤ 500 + landscape, `ModeSelectScreen`
  keeps a 2-column grid (don't collapse to 1 column on a fixed overlay where
  scrolling isn't an option), `OnlineLobby` flips its seat list horizontal.
- **Animation gating**: `prefers-reduced-motion: no-preference` wraps the
  slide/fade keyframes (instead of the inverse `reduce`-disable pattern),
  which is the more conservative approach: motion is opt-in for users who
  haven't expressed a preference, but the overall global rule in `index.css`
  still neutralises any straggler `transition`s under `reduce`.
- **`prefers-reduced-motion` test coverage**: not directly testable in jsdom,
  which doesn't honour the media query; verified manually in dev tools.

## Out of scope (carryforward)

- Visual / pixel diff regression suite — relies on Playwright screenshots; the
  existing `scripts/screenshot.mjs` could be wired into CI in a later
  iteration but is not run on every test invocation.
- In-game (board) UI polish — that's the next iteration (016).
- Light-mode theme variant — game is dark-by-design; not requested.
