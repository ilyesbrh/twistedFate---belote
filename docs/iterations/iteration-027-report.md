# Iteration 027 Report — Simpler patterned board + avatar redesign

**Date**: 2026-05-04
**Status**: Complete
**Test delta**: 715 → 715

## Goal

Two pieces of user feedback:

1. "the game board sucks could you find a fit cool background instead
   of the current low effort one… simpler with pattern."
2. "the player avatar sections are not up to date, they look like
   they are from another app… feel free to change them as you want."

Iteration 026's ornate wood+felt+compass composition was too busy.
The avatars (pravatar photo + Radix VIP/level/dealer badges) clashed
hard with the cream-paper aesthetic. This iteration replaces both.

## What landed

### Game board → quiet diamond lattice

`packages/ui/public/table-paper.svg` rewritten from scratch (~30
lines). Three elements:

- Warm muted base — radial gradient `#e9d9b4` → `#b09a64` (between
  "aged linen" and "card-table felt").
- Single repeating diamond-lattice pattern at ~18% opacity, with a
  small intersection dot in each diamond center and at the four
  edges of each tile. Reads as a vintage card-back motif without
  competing with the cards.
- Thin double-line frame inset 40 / 56 px from the edges. Outer
  vignette so the centre stays brighter.

No wood, no felt, no compass, no ornament. Calm pattern, that's it.

### Player avatar → paper name-tag with monogram

`packages/ui/src/components/PlayerAvatar/PlayerAvatar.tsx` and its
module CSS rewritten. Drops:

- `pravatar.cc` photo `<img>` (real-person headshots that screamed
  "different app").
- Radix `Badge` for VIP / level / dealer.
- Radix `Tooltip`.
- `<TimerRing />` (was a circular timer around the photo).
- VIP indicator and level number — cruft.

Replaces with a cream paper rounded-square name-tag token:

- 2-letter monogram in serif Yeseva (e.g. ElenaP → "EL", Villy →
  "VI", DilyanaBl → "DI", Vane_Bane → "VA"). Two letters so two
  players sharing a first letter are distinguishable.
- Handwritten Caveat name label below.
- Mustard "D" stamp top-left when dealer.
- Terracotta ★ stamp top-right when contract holder.
- Terracotta pulsing ring around the token when active turn.

Behavioural test `PlayerAvatarBubble.test.tsx` was checking bubble
positions and type classes — unchanged, all 10 still pass.

`GameTable.module.css` — north avatar moved from `top: 24px` to
`top: 90px` so the new square token clears the back-of-card stack
that occluded the upper portion at the original position.

### Plus

- **Flaky test fix** — `App.dev-mode.test.tsx` `waitFor` for the
  lazy ScreenViewer was timing out in concurrent test workers.
  Bumped timeout to 5s. Now stable.
- **`.gitignore` consolidation** — replaced 47 individual
  `.playwright-mcp/page-*.yml` lines with a single `.playwright-
mcp/` rule. Added `.claude/settings.local.json` and
  `packages/ui/e2e/screenshots/` for completeness.

## Files

- `packages/ui/public/table-paper.svg` — full rewrite (~30 lines).
- `packages/ui/src/components/PlayerAvatar/PlayerAvatar.tsx` — full
  rewrite (no Radix deps).
- `packages/ui/src/components/PlayerAvatar/PlayerAvatar.module.css` —
  rewritten for the new token chrome.
- `packages/ui/src/components/GameTable/GameTable.module.css` —
  north-avatar `top` adjusted.
- `packages/ui/__tests__/App.dev-mode.test.tsx` — `waitFor` timeout
  bumped to 5s.
- `.gitignore` — consolidated.

## Validation

| Check                                 | Result                                                      |
| ------------------------------------- | ----------------------------------------------------------- |
| `pnpm test`                           | 35 files / 715 passing (no delta)                           |
| `pnpm typecheck`                      | Clean                                                       |
| `pnpm lint`                           | **188** (down from 189; Radix removal eliminated one error) |
| `pnpm format:check` (iteration scope) | Clean                                                       |

### Manual smoke (browser, dev on :5176 after `rm -rf .vite`)

- `/` (menu) — unchanged from iteration 021/025.
- Click Solo Match → StartScreen (cream paper modal, terracotta
  PLAY GAME stamp).
- PLAY GAME → in-game flow:
  - Lattice board reads as quiet, vintage card-back motif. Doesn't
    compete with the cards.
  - North avatar "DI / DilyanaBl", West "VI / Villy", East "VA /
    Vane_Bane", South "EL / ElenaP" — all distinguishable.
  - Active player has terracotta pulsing ring.
  - Cream BidPanel centred, ScorePanel pinned kraft note top-left,
    ChatPanel ledger drawer right.

Screenshots: `iteration-027-lattice-board.png`,
`iteration-028-live-game-v3.png`.

## Carryforward

- North-avatar / north-hand vertical alignment could use one more
  pass — the square token still touches the card-stack boundary in
  some viewports.
- Mobile portrait verification with the new avatars (not yet
  smoked at 390×844).
- Pixel-diff regression suite remains the natural next move now
  that the visual layer is settling.
