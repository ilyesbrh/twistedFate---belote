# Iteration 023 Report — In-game UI chrome alignment

**Date**: 2026-05-04
**Status**: Complete
**Test delta**: 715 → 715 (CSS-only, no behaviour change)

## Goal

Walk from menu (cream paper) into a round (felt-green table) without
the chrome looking like two different apps. Felt stays as the
card-room metaphor; chrome rebuilds on top in cream paper + ink +
terracotta. Felt-green ramp tuned warmer (olive) to harmonize.

## TDD trail

CSS-only across 8 module files + 1 token tweak. Every existing test
covers data-testids / aria contracts unchanged. Full suite stayed at
715/715 after each batch of edits.

## Files

### Modified

- `packages/ui/src/styles/tokens.css` — felt-green ramp tuned to
  warmer olive: `#4a6936` (center) → `#1a2a13` (edge). Was
  `#3d9b58` → `#133d1f` (saturated bright green).
- `packages/ui/src/components/ScorePanel/ScorePanel.module.css` —
  cream paper top-left card with ink border, serif Yeseva
  numerals, handwritten teal team labels, terracotta target +
  contract values, sage/terracotta level badges.
- `packages/ui/src/components/BidPanel/BidPanel.module.css` —
  cream paper notebook; suit/value buttons are ink-bordered cream
  cards, selected = thicker terracotta border + cream gradient. Pass
  is neutral cream stamp, Bid is terracotta stamp, Coinche is
  sage/teal stamp — different tones for different actions.
- `packages/ui/src/components/ChatButton/ChatButton.module.css` —
  cream paper round button with ink border + chunky drop-shadow,
  terracotta unread badge with ink outline.
- `packages/ui/src/components/ChatPanel/ChatPanel.module.css` —
  paper-ledger sliding drawer with horizontal-rule grain (every
  35px), cream header with ink border, message-type colours
  (sage trick-win, terracotta contract / cancelled), terracotta
  send button stamp.
- `packages/ui/src/components/RoundSummary/RoundSummary.module.css`
  — paper-card modal with corner pin dots, serif Yeseva scores,
  handwritten labels, sage/terracotta result-met / -failed badges,
  terracotta "NEXT ROUND" stamp.
- `packages/ui/src/components/GameOver/GameOver.module.css` —
  paper-card modal with corner pin dots, score bars in teal-deep
  (NS) and terracotta (EW) on cream tracks, mustard "you won"
  pill, terracotta "PLAY AGAIN" stamp.
- `packages/ui/src/components/PlayerAvatar/PlayerAvatar.module.css`
  — cream pill name labels with ink border, terracotta active-pulse
  dot, all four thought-bubble variants on cream paper with type-
  specific text colours (ink-dark, sage trick-win, terracotta
  contract/cancelled).

## Validation

| Check                                 | Result                            |
| ------------------------------------- | --------------------------------- |
| `pnpm test`                           | 35 files / 715 passing (no delta) |
| `pnpm typecheck`                      | Clean                             |
| `pnpm lint`                           | 189 errors (no delta)             |
| `pnpm format:check` (iteration scope) | Clean                             |

### Manual smoke (screen viewer fixtures)

Verified in the screen viewer at `?screens` — clicked through
representative fixtures across every restyled component:

- `GameTableView "Playing — mid-trick"` — olive felt, ink-bordered
  cream avatar pills, paper-ledger ChatPanel.
- `GameTableView "Bidding — south (your) turn"` — paper-notebook
  BidPanel with ink-bordered suit + value buttons, terracotta Bid
  button.
- `RoundSummary "Takers won simple contract (110 ♠)"` — paper-card
  modal with ROUND 3 / COMPLETE badges, sage CONTRACT MET pill,
  serif scores, terracotta NEXT ROUND stamp.
- `GameOver "NS wins (you won)"` — paper-card with terracotta
  GAME OVER stamp, gold trophy, big serif NS WINS! in teal,
  teal/terracotta score bars, mustard "you won this game" pill,
  terracotta PLAY AGAIN stamp.

Screenshots:

- `docs/screenshots/iteration-023-mid-trick.png`
- `docs/screenshots/iteration-023-bidding.png`
- `docs/screenshots/iteration-023-round-summary.png`
- `docs/screenshots/iteration-023-game-over.png`

## Carryforward

- **Pixel-diff regression suite** is now extra valuable: the
  visual language is settled across menu + lobby + random + in-game
  chrome. Wiring Playwright screenshot diffs into CI would catch
  visual regressions cheaply now that the baseline is stable.
- **Radix Theme defaults** still bleed through in the level / VIP /
  dealer badges (Radix `Badge` defaults) and the avatar `Tooltip`.
  Could be Radix-theme-overridden if they ever feel jarring; not
  pressing.
- **`belote-hero.svg`** (used by `StartScreen`) is still on the
  iteration-016 visual track — its card-fan is already cream paper
  so it doesn't clash, but it could be hand-tuned to the new
  vocabulary if/when that component gets touched.
- **Card faces / backs** untouched (real card graphics from
  `public/cards/`); no need.
