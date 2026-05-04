# Iteration 025 Report — Smoke-test fixes

**Date**: 2026-05-04
**Status**: Complete
**Test delta**: 715 → 715 (one assertion text adjusted)

## Goal

End-to-end Playwright smoke of the live `/` flow caught four issues
the iteration-017 screen-viewer fixtures had missed (because they
render each component in isolation, never in real composition):

1. **StartScreen** still on the iteration-016 dark style — jarring
   mid-flow break against the cream-paper aesthetic everywhere else.
2. **InstallPrompt** overlapped the in-game `ScorePanel` (both top-
   left).
3. **ScorePanel cream-on-cream contrast** — designed for dark felt,
   nearly invisible against the cream paper board.
4. **Apparent auto-bid bug** — chat history showed human bids that
   weren't manually placed.

## What landed

### Fixes 1–3 (visual)

- **StartScreen** rewritten with the menu's vocabulary:
  - Removed the dark `belote-hero.svg` reference. Replaced with an
    inline 4-card fan using the same custom-SVG `SuitPip` shapes the
    menu uses (one card per suit, slight rotation each).
  - Cream paper card with corner pin-dot decorations, 2px ink border,
    chunky drop-shadow.
  - Title in serif Yeseva, "— Coinchée —" subtitle in handwritten
    Caveat (terracotta), "first to **501** points wins" with a serif
    terracotta number, and a terracotta stamp "PLAY GAME" button —
    the same vocabulary the lobby's Start-game CTA uses.
- **InstallPrompt** now scoped to `screen === "menu"`. It can never
  overlap the in-game score panel because it doesn't render in-game.
- **ScorePanel** redesigned as a "pinned kraft paper note":
  - Deeper kraft palette (`#ead9b3` → `#d8c393`) so the panel floats
    above the cream paper board — the contrast is finally there.
  - Full 2px ink border, rounded corners, 12px margin so it sits
    inset from the edge instead of flush.
  - `transform: rotate(-0.6deg)` for a slightly-pinned feel.
  - Corner pin dots (top-left + top-right) matching the room-code
    paper tag and the RoundSummary modal.

### Fix 4 (investigation)

The apparent auto-bid bug was traced to the recurring **Vite HMR cache
footgun** flagged in iteration 021/024 reports: the earlier dev
server was serving stale CSS _and_ stale module state, leading to a
session that had been mounted before the iteration-023 changes
applied. After `rm -rf packages/ui/node_modules/.vite` and a clean
dev restart, the live BidPanel mounts correctly when it's the
human's turn and dispatches `placeBid` only on user click. No code
change needed.

The session validation in `packages/app/src/session.ts:243` already
throws if a non-human position dispatches `placeBid`, so an AI bot
genuinely cannot place a human bid. The bug was purely a stale-state
illusion.

## Files

### Modified

- `packages/ui/src/components/StartScreen/StartScreen.tsx` — full
  rewrite: hero asset replaced by inline `<HeroFan>` + `<SuitPip>`
  components.
- `packages/ui/src/components/StartScreen/StartScreen.module.css` —
  full restyle (cream paper card, ink border, terracotta CTA).
- `packages/ui/src/components/ScorePanel/ScorePanel.module.css` —
  panel restyled as pinned kraft note.
- `packages/ui/src/App.tsx` — `<InstallPrompt />` gated behind
  `screen === "menu"`.
- `packages/ui/__tests__/StartScreen.test.tsx` — one assertion text
  updated (was: "renders the hero image" / `getByAltText("Belote
card game")`; now: "renders the title and subtitle" /
  `getByRole("heading", { name: /belote/i })`).

### Not changed

- Card faces, hand display, bid panel, chat panel, game-over modal,
  round-summary modal, player avatars — all still on their iteration-
  023 cream paper styling. Verified in the live browser smoke.
- `packages/ui/public/table-paper.svg` — board background pending
  direction pick from the user (A1 layered wood + felt + paper, A2
  burgundy/teal felt with embroidery, A3 aged parchment / map).
- `packages/app/src/session.ts` — no change. The auto-bid was cache.

## Validation

| Check                                 | Result                            |
| ------------------------------------- | --------------------------------- |
| `pnpm test`                           | 35 files / 715 passing (no delta) |
| `pnpm typecheck`                      | Clean                             |
| `pnpm lint`                           | 189 (no delta)                    |
| `pnpm format:check` (iteration scope) | Clean                             |

### Manual smoke (browser, fresh dev server on :5182)

- `/` (menu): cream paper, hero card-fan, Belote / Coinchée, four
  mode tiles, "SOON" stamp on Ranked, **InstallPrompt** banner at
  top-only, no console errors.
- Click Solo Match → **StartScreen** appears as cream paper card with
  4-card mini fan, "Belote" / "— Coinchée —", "first to 501 points
  wins" / "PLAY GAME" stamp. **No InstallPrompt clash** in
  background.
- Click PLAY GAME → in-game flow:
  - **ScorePanel** top-left as pinned kraft note ("501 NS 0 0 EW 0
    0 ♠"), readable against cream board.
  - North avatar with cream pill name label.
  - Cream paper game board with compass medallion + suit pips
    visible behind.
  - Side avatars West / East with their hand strips.
  - Wait for AI → my turn → **BidPanel appears** as cream paper
    notebook with ink-bordered suit/value buttons, terracotta Bid +
    sage Contrer stamps, neutral Pass cream stamp.
- Auto-bid bug **does not reproduce**.

Screenshots:

- `docs/screenshots/iteration-025-startscreen.png`
- `docs/screenshots/iteration-025-ingame.png`

## Carryforward

- **Board background** redesign pending user pick between A1
  (layered wood + felt + paper), A2 (rich felt with embroidery), A3
  (aged parchment).
- **CLAUDE.md note about Vite HMR cache** — bit me three times now
  (021, 024, 025). Worth codifying the recipe so future iterations
  know to nuke `node_modules/.vite` whenever changes don't reflect.
- **Pixel-diff regression suite** — would have caught all four of
  these as visual regressions or compositional clashes. The fixture-
  level tests don't see how components stack together, but a full-
  page diff would.
