# Iteration 025 — Smoke-test fixes

## Context

End-to-end Playwright smoke of the live `/` flow (menu → Solo Match →
StartScreen → in-game) found four real issues missed by the iteration-
017 screen-viewer fixtures (which only render components in
isolation):

1. **StartScreen** still on iteration-016 dark style — clashed badly
   against the new cream-paper continuity from iteration 021/024.
2. **InstallPrompt** overlapped the in-game ScorePanel — both
   anchored to the top-left.
3. **ScorePanel cream-on-cream contrast** — designed assuming a dark
   felt background, hard to read against the cream paper game board.
4. **Apparent auto-bid bug** — chat history showed human bids that
   weren't manually placed.

This iteration fixes 1–3 visually. #4 turned out to be an HMR cache
artifact — after `rm -rf node_modules/.vite` and a fresh dev start,
the live BidPanel works correctly with human input.

## Scope

### Modified

- `packages/ui/src/components/StartScreen/StartScreen.tsx` — drop the
  dark `belote-hero.svg` reference; replace with an inline 4-card fan
  using the same `SuitPip` shapes the menu uses. Add subtitle
  "— Coinchée —". Lowercase "Play game" button copy.
- `packages/ui/src/components/StartScreen/StartScreen.module.css` —
  full restyle: cream paper card with corner pin dots + ink border +
  drop-shadow; serif Yeseva title; handwritten Caveat subtitle;
  terracotta target value; terracotta stamp PLAY GAME button.
- `packages/ui/src/components/ScorePanel/ScorePanel.module.css` —
  panel becomes a "pinned kraft paper note": deeper kraft tone
  (#ead9b3 → #d8c393) so it floats above the cream board, full ink
  border, slight rotation (-0.6deg), corner pin dots.
- `packages/ui/src/App.tsx` — InstallPrompt now only renders when
  `screen === "menu"`. Hides it during AI / Friends / Random
  gameplay so it never overlaps the score panel.

### Tests

- `packages/ui/__tests__/StartScreen.test.tsx` — one assertion text
  updated: "renders the hero image" → "renders the title and
  subtitle" (no more `belote-hero.svg` `alt="Belote card game"`).

## Out of scope

- **Board background** redesign — user wants something different
  from the current cream-paper compass medallion. Awaiting direction
  pick (A1 layered wood + felt + paper, A2 burgundy/teal felt with
  embroidery, A3 aged parchment / map). Will land in a follow-up
  iteration.
- Any session / behaviour changes — auto-bid #4 was diagnosed as
  cache, no code change needed.

## TDD plan

CSS + small markup edits. One test assertion text update. Suite
stays green throughout.

## Validation

- `pnpm test` — 715/715, no delta.
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check` — no delta.
- Manual: dev smoke of `/` → Solo Match → StartScreen (cream paper) →
  PLAY GAME → in-game shows kraft-note score panel + cream paper
  board + working BidPanel.
