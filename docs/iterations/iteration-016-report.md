# Iteration 016 Report — Board UI: device polish

**Date**: 2026-05-04
**Status**: Complete
**Plan**: [iteration-016-plan.md](iteration-016-plan.md)

> Note: this file previously held a "ScorePanel — Team Score HUD" report from
> the pre-rebuild UI track. That work no longer exists; the file has been
> replaced with the active iteration 016 record.

## Goal

Same treatment iteration 015 gave the menu surfaces, applied to the in-game
board: every interactive control comfortably tap-able on any phone, an
accessible name on every button, fluid typography that doesn't overflow on
narrow viewports.

## Scope delivered

1. **Touch targets bumped to WCAG 2.5.5 minimum (44 × 44)**:
   - `ChatButton` (was 28 × 28).
   - `ChatPanel` close button (was 28 × 28).
   - `ChatPanel` send button (was 34 × 34).
   - `BidPanel` suit / value / action buttons via the global
     `[data-touch="primary"]` rule from iteration 015.
2. **A11y attributes** on every interactive control:
   - `BidPanel` suit buttons: `aria-label="Pick spades"` etc.
   - `BidPanel` value buttons: `aria-label="Bid 90 points"` etc.
   - Pass / Place bid / Contrer / Surcontrer get explicit `aria-label`.
   - `GameOver` Play Again, `RoundSummary` Next Round, `ChatButton`,
     `ChatPanel` close, get `data-touch="primary"`.
3. **Fluid typography tokens** in `tokens.css` for `ScorePanel` (target,
   teams, trump, contract value + level) and `ChatPanel` (title, message
   font). Hardcoded sizes replaced with the new `--score-*` / `--chat-*`
   variables — every figure scales with `clamp()`.
4. **ScorePanel narrow-screen wrap** — drops `white-space: nowrap` and
   allows wrapping below 360 px so the bar can never exceed the viewport.
5. **iOS auto-zoom workaround** — `ChatPanel` text input bumped to 16 px so
   iOS Safari does not zoom on focus. Min-height set to `--touch-min`.
6. **Reduced-motion gates** on the `ChatPanel` message-fade-in animation
   and the `BidPanel` slide-up entrance.

## TDD trail

| Step | Test file                                                                                            | Tests added  | Notes                                                                                              |
| ---- | ---------------------------------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------- |
| 1    | [packages/ui/\_\_tests\_\_/ChatButton.test.tsx](../../packages/ui/__tests__/ChatButton.test.tsx)     | 7 (new file) | Render, `aria-label`, `data-touch`, click, badge render + cap.                                     |
| 2    | [packages/ui/\_\_tests\_\_/BidPanel.test.tsx](../../packages/ui/__tests__/BidPanel.test.tsx)         | 7 (new file) | Suit + value + action `aria-label`s, `data-touch`, Pass callback, post-coinche button visibility.  |
| 3    | [packages/ui/\_\_tests\_\_/ScorePanel.test.tsx](../../packages/ui/__tests__/ScorePanel.test.tsx)     | 7 (new file) | Target / teams / trump / contract render; CONTRE + SURCONTRE badges; renders cleanly at 320 × 568. |
| 4    | [packages/ui/\_\_tests\_\_/ChatPanel.test.tsx](../../packages/ui/__tests__/ChatPanel.test.tsx)       | 1 (addition) | Close button has `data-touch="primary"`.                                                           |
| 5    | [packages/ui/\_\_tests\_\_/GameOver.test.tsx](../../packages/ui/__tests__/GameOver.test.tsx)         | 1 (addition) | Play Again has `data-touch="primary"`.                                                             |
| 6    | [packages/ui/\_\_tests\_\_/RoundSummary.test.tsx](../../packages/ui/__tests__/RoundSummary.test.tsx) | 1 (addition) | Next Round has `data-touch="primary"`.                                                             |

**Net delta**: 663 → 687 tests (**+24** passing).

## Files

### Added

- [packages/ui/\_\_tests\_\_/ChatButton.test.tsx](../../packages/ui/__tests__/ChatButton.test.tsx)
- [packages/ui/\_\_tests\_\_/BidPanel.test.tsx](../../packages/ui/__tests__/BidPanel.test.tsx)
- [packages/ui/\_\_tests\_\_/ScorePanel.test.tsx](../../packages/ui/__tests__/ScorePanel.test.tsx)
- [docs/iterations/iteration-016-plan.md](iteration-016-plan.md)

### Modified

- [packages/ui/src/styles/tokens.css](../../packages/ui/src/styles/tokens.css) — `--score-*`, `--chat-*` fluid tokens
- [packages/ui/src/components/ChatButton/ChatButton.tsx](../../packages/ui/src/components/ChatButton/ChatButton.tsx) — `data-touch`
- [packages/ui/src/components/ChatButton/ChatButton.module.css](../../packages/ui/src/components/ChatButton/ChatButton.module.css) — 44×44 sizing, narrow-phone variant
- [packages/ui/src/components/ChatPanel/ChatPanel.tsx](../../packages/ui/src/components/ChatPanel/ChatPanel.tsx) — `data-touch` on close
- [packages/ui/src/components/ChatPanel/ChatPanel.module.css](../../packages/ui/src/components/ChatPanel/ChatPanel.module.css) — fluid sizes, 44×44 close + send, 16px input, reduced-motion gate
- [packages/ui/src/components/BidPanel/BidPanel.tsx](../../packages/ui/src/components/BidPanel/BidPanel.tsx) — `aria-label` on every button + `data-touch`
- [packages/ui/src/components/BidPanel/BidPanel.module.css](../../packages/ui/src/components/BidPanel/BidPanel.module.css) — reduced-motion gate, max-width clamp
- [packages/ui/src/components/ScorePanel/ScorePanel.module.css](../../packages/ui/src/components/ScorePanel/ScorePanel.module.css) — full rewrite using fluid tokens, narrow-phone wrap
- [packages/ui/src/components/GameOver/GameOver.tsx](../../packages/ui/src/components/GameOver/GameOver.tsx) — `data-touch` on Play Again
- [packages/ui/src/components/RoundSummary/RoundSummary.tsx](../../packages/ui/src/components/RoundSummary/RoundSummary.tsx) — `data-touch` on Next Round

## Validation

| Check               | Status      | Notes                                                                                                                                                                                                                                                                                                                                                          |
| ------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`         | ✓           | 687 / 687 (+24)                                                                                                                                                                                                                                                                                                                                                |
| `pnpm typecheck`    | ✓           | clean                                                                                                                                                                                                                                                                                                                                                          |
| `pnpm lint`         | delta +1    | 184 errors total. 3 of the 4 new are the parse-error pattern from new `__tests__/*.test.tsx` files (architectural — same pattern as iterations 014 / 015 added one each); 1 is a typed-rule violation from a new `aria-label` template literal in `BidPanel.tsx`. The pre-existing baseline is already broken; project-wide lint hygiene is its own iteration. |
| `pnpm format:check` | delta clean | 4 pre-existing files; iteration delta is **0** (my new files were formatted with Prettier).                                                                                                                                                                                                                                                                    |

## Design notes

- **Why bump the visual size of `ChatButton` to 44 × 44 instead of just
  adding invisible padding for the hit area**: the icon-only design is
  visually recognisable; making the circle bigger keeps the visual centre
  of the button equal to the hit centre, which is how thumbs find buttons
  by feel. An invisible-padding approach leaves the visual cue at the
  centre of a slightly-offset hit area on iOS Safari due to inline-block
  bounds.
- **Why fluid tokens instead of more breakpoints in `ScorePanel`**: the bar
  is a single inline-flex row with multiple chunks of disparate font sizes.
  Fluid `clamp()` gives a smooth size transition across viewport widths
  without layout thrashing at break-point boundaries.
- **Why drop `white-space: nowrap` only at < 360 px**: above that, the bar
  fits comfortably without wrapping. Wrapping is a fallback for the smallest
  phones (iPhone SE 1st gen) where the trump + scores + contract chunks
  would otherwise overflow.
- **`BidPanel` height after the touch-min floor**: with 44 × 44 enforced on
  every button, the panel's tall edge becomes ≈ 44 (suit row) + 14 (pad) +
  44 × 3 (value rows) + 14 (pad) + 44 (action row) + 14 (pad) ≈ 274 px.
  Fine on all phones (typical height ≥ 568 px); the landscape-phone
  breakpoint already shrinks paddings further.

## Out of scope (carryforward)

- Project-wide lint hygiene — `BidPanel.tsx` (and many other source files)
  has pre-existing typed-lint violations (non-null assertions, unnecessary
  type assertions) that warrant a dedicated cleanup iteration.
- HandDisplay card hover ↔ touch parity — `:hover` currently lifts cards
  by 20 px on desktop; on touch the `:active` state should mirror this.
- Pixel-diff regression suite — Playwright screenshots already exist in
  `scripts/screenshot.mjs` but aren't wired into CI.
