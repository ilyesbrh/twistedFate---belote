# Iteration 016 — Board UI: device polish

## Goal

Same treatment iteration 015 gave the menu surfaces, applied to the in-game
board. Make every interactive control comfortably tap-able on any phone, give
every button an accessible name, and let small / weird viewports render
without overflow or cropping. No new gameplay features.

## Surfaces in scope

1. `GameTable` — felt + positioning of all child elements
2. `BidPanel` — bid suit/value pickers, pass/bid/contre buttons
3. `ScorePanel` — top-left contract / score / target bar
4. `ChatButton` — small floating button anchored to south avatar
5. `ChatPanel` — slide-in chat drawer
6. `GameOver` — end-of-game modal
7. `RoundSummary` — end-of-round modal
8. `HandDisplay` (already touch-friendly via large card hover; verify)
9. `PlayerAvatar` (verify + tooltip overflow at edges)

## Pain points

- **Sub-44 × 44 hit targets**:
  - `ChatButton` is 28 × 28 (with a 1.5px border).
  - `ChatPanel` close button: 28 × 28.
  - `ChatPanel` send button: 34 × 34.
  - `BidPanel` suit + value buttons: ~30 × 30 after padding.
    These all violate WCAG 2.5.5 (recommended minimum) and are uncomfortable
    for thumb tapping on phones.
- **Hardcoded font sizes** in `ScorePanel` (9–22 px), `ChatPanel` (13–18 px),
  `BidPanel` (10–24 px), `GameOver` (11–48 px) — no fluid scaling. On a
  320 px-wide phone the `ScorePanel` `white-space: nowrap` row can overflow.
- **A11y gaps** in `BidPanel`:
  - Suit buttons render only the unicode glyph (♠ ♥ ♦ ♣) — no accessible
    name. Voice-over reads "spade suit" symbol literally if we're lucky.
  - Value buttons render the bare number (90, 100, …) — no context.
  - Pass / Bid / Contrer / Surcontrer rely on text content; OK but should
    expose explicit `aria-label`s for clarity.
- **No `data-touch="primary"` markers** on board controls — the global rule
  in `index.css` only kicks in for elements that opt in. iteration 016 ports
  the convention onto the board.
- **No render-test coverage** for `ChatButton` and `BidPanel` — we should add
  baseline tests so a11y regressions surface in CI.

## Design approach

Reuse iteration 015's tokens (`--touch-min`, `--menu-*-size`, `--safe-*`).
For the board we additionally introduce a couple of board-specific scales:

```css
/* Board surfaces (iteration 016) */
--board-panel-radius: 14px;
--board-panel-padding: clamp(7px, 1.6vw, 10px);
--board-panel-bg: rgba(8, 16, 32, 0.9);
--board-panel-border: 1px solid rgba(255, 255, 255, 0.12);

--score-target-size: clamp(11px, 1.4vw, 14px);
--score-team-size: clamp(15px, 2.2vw, 20px);
--score-trump-size: clamp(16px, 2.8vw, 22px);
--score-label-size: clamp(8px, 1vw, 9px);

--chat-msg-size: clamp(12px, 1.4vw, 13px);
--chat-title-size: clamp(13px, 1.5vw, 15px);
```

Per-component changes:

- **ChatButton**: bump from 28 to `var(--touch-min)`. Keep the visual circle
  but add internal padding so the icon stays small while the hit area grows.
  Add `data-touch="primary"`.
- **ChatPanel close**: same treatment.
- **ChatPanel send**: bump to `var(--touch-min)`.
- **BidPanel buttons**: enforce `min-height: var(--touch-min)`; add
  `aria-label` per button (`Pick spades`, `Bid 90 points`, `Pass`, `Place bid
♠ 90`, `Contrer`, `Surcontrer`); add `data-touch="primary"` on actions.
- **ScorePanel**: switch hardcoded font sizes to the new `--score-*` tokens;
  optionally drop `white-space: nowrap` on the smallest viewport so it can
  wrap rather than overflow.
- **GameOver / RoundSummary**: replace hardcoded paddings/font sizes with
  fluid `clamp()` where it still fits the existing visual language; bump
  `playAgainBtn` to use `data-touch="primary"`.
- **GameTable**: refactor `env(safe-area-inset-*)` raw calls to use the
  shared `--safe-*` shortcut tokens. Pure cosmetic but keeps the codebase
  consistent across iterations 015 and 016.

## TDD plan

1. **`ChatButton.test.tsx`** — new file. Baseline render test, accessible
   name, `data-touch="primary"`, badge rendering when `unreadCount` is set,
   click forwards `onClick`.
2. **`ChatPanel.test.tsx`** — extend with: close button has
   `data-touch="primary"`; backdrop has `aria-hidden="true"` (already does).
3. **`BidPanel.test.tsx`** — new file. Baseline render, `aria-label` on each
   suit / value / action button, `data-touch="primary"` on action buttons,
   `Pass` callback fires.
4. **`ScorePanel.test.tsx`** — new file. Baseline render with both teams,
   contract level (Contre / Surcontre) badges, target value visible, scores
   labelled.
5. **`GameOver.test.tsx`** — extend with: `playAgainBtn` has
   `data-touch="primary"`.
6. **`RoundSummary.test.tsx`** — extend with: any "Next round" / "Play
   again" CTA carries `data-touch="primary"`.

CSS-only tweaks aren't unit-testable; verified by render tests staying green
plus manual rotation in dev tools.

## Files to touch

CSS:

- `packages/ui/src/styles/tokens.css` — add board tokens
- `packages/ui/src/components/ChatButton/ChatButton.module.css`
- `packages/ui/src/components/ChatPanel/ChatPanel.module.css`
- `packages/ui/src/components/BidPanel/BidPanel.module.css`
- `packages/ui/src/components/ScorePanel/ScorePanel.module.css`
- `packages/ui/src/components/GameOver/GameOver.module.css`
- `packages/ui/src/components/RoundSummary/RoundSummary.module.css`
- `packages/ui/src/components/GameTable/GameTable.module.css` (use --safe-\*)

TSX:

- `packages/ui/src/components/ChatButton/ChatButton.tsx` — `data-touch`
- `packages/ui/src/components/ChatPanel/ChatPanel.tsx` — `data-touch` on close + send (when send exists)
- `packages/ui/src/components/BidPanel/BidPanel.tsx` — `aria-label` on each button + `data-touch`
- `packages/ui/src/components/GameOver/GameOver.tsx` — `data-touch` on Play Again
- `packages/ui/src/components/RoundSummary/RoundSummary.tsx` — `data-touch` on CTA

Tests:

- `packages/ui/__tests__/ChatButton.test.tsx` — new
- `packages/ui/__tests__/BidPanel.test.tsx` — new
- `packages/ui/__tests__/ScorePanel.test.tsx` — new
- Extensions to `ChatPanel.test.tsx`, `GameOver.test.tsx`, `RoundSummary.test.tsx`

## Validation

- `pnpm test` — green; expected delta ≈ +20–30 tests.
- `pnpm typecheck` — clean.
- `pnpm lint` / `pnpm format:check` — delta clean.
- Manual: dev tools rotate 320×568, 640×360, 768×1024, 1280×800, ultrawide.
  Confirm score bar doesn't overflow, BidPanel taps comfortably, ChatButton
  is reachable on landscape phones, no controls clip the iPhone notch.
