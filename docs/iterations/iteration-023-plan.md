# Iteration 023 — In-game UI chrome alignment

## Goal

Bring the in-game chrome (panels, modals, buttons, avatar pills,
thought bubbles) into the iteration-021 board-game vocabulary so
walking from the menu into a round feels continuous instead of like
two different apps. Keep the felt-green table — it's the card-room
metaphor and we shouldn't lose it — but tune the green warmer to
harmonize with the cream paper menus, and rebuild every chrome surface
on top in cream paper + ink + terracotta.

Decision logged in iteration 021 carryforward: "felt + paper chrome"
over "everything cream paper". The felt stays; the paper sits on it.

## Scope

CSS-only; no markup or behaviour changes. All existing tests cover
the data-testids and aria contracts unchanged.

### Modified

- `packages/ui/src/styles/tokens.css` — felt-green ramp tuned to
  warmer olive (`#4a6936` → `#1a2a13`) so the table harmonizes with
  the cream paper rather than fighting it.
- `packages/ui/src/components/ScorePanel/ScorePanel.module.css` —
  cream paper top-left card, serif Yeseva numerals, handwritten team
  labels, terracotta target/contract values, sage/terracotta contract
  level badges.
- `packages/ui/src/components/BidPanel/BidPanel.module.css` — cream
  paper notebook with ink-bordered suit/value buttons; selected state
  is a thicker terracotta border. Pass = neutral cream stamp, Bid =
  terracotta stamp, Coinche = sage/teal stamp.
- `packages/ui/src/components/ChatButton/ChatButton.module.css` —
  cream paper round button with ink border, terracotta unread badge.
- `packages/ui/src/components/ChatPanel/ChatPanel.module.css` —
  paper-ledger sliding drawer (with horizontal-rule grain), cream
  header with ink border, sage/terracotta message-type colours,
  terracotta send button stamp.
- `packages/ui/src/components/RoundSummary/RoundSummary.module.css` —
  paper-card modal with corner pin dots, serif Yeseva scores,
  handwritten labels, sage/terracotta result badges, terracotta
  "Next Round" stamp.
- `packages/ui/src/components/GameOver/GameOver.module.css` — same
  paper-card treatment, score bars in teal/terracotta, terracotta
  "Play Again" stamp.
- `packages/ui/src/components/PlayerAvatar/PlayerAvatar.module.css`
  — cream pill name labels with ink border, terracotta active-pulse
  dot, all four thought-bubble variants on cream paper.

## Out of scope

- Card faces (`CardFace`, `CardBack`) — they're already real card
  graphics from `public/cards/` and don't need restyling.
- Game flow / hooks / data shape — entirely untouched.
- The Radix Theme — InstallPrompt-style banners that aren't part of
  the in-game chrome.

## TDD plan

No new behaviour; every existing test asserts data-testid + aria
contracts that don't change. Run the full suite after each batch of
edits to catch any broken selectors. Visual verification via the
screen-viewer fixtures (already comprehensive: 9 GameTableView
states, 6 RoundSummary, 3 GameOver, 5 ScorePanel, 4 BidPanel, 4
ChatButton, 6 PlayerAvatar, 2 ChatPanel).

## Validation

- `pnpm test` — 715/715, no delta.
- `pnpm typecheck` — clean.
- `pnpm lint` — 189, no delta.
- `pnpm format:check` (iteration scope) — clean.
- Manual: ride through every in-game fixture in the screen viewer to
  confirm consistency.

## Carryforward

- Pixel-diff regression suite is now extra valuable: the visual
  language is settled across menu + lobby + random + in-game.
- The Radix `Tooltip` used by `PlayerAvatar`'s name pill (and
  `Badge` for level/dealer/VIP) still uses Radix-default dark
  theming. Could be theme-overridden if it ever feels jarring.
- `belote-hero.svg` (used by `StartScreen`) is still on the
  iteration-016 visual track. The card-fan inside it is already on
  cream paper so it doesn't clash; touching it is optional polish.
