# Iteration 021 — Board-game aesthetic reset

## Context

Iterations 019 / 020 landed a "Tunisian café dark-felt" aesthetic the
user rejected ("this UI sucks hard"). User picked direction **E**:
hand-drawn / board-game, like Codenames, Wingspan, or Everdell
companion apps. Warm cream paper backgrounds, ink-illustrated icons,
hand-drawn typography, deliberately imperfect lines.

This iteration replaces the visual layer entirely. Architecture from
iterations 019/020 (MenuFelt component + paper-card pattern) stays;
only colours, typography, illustrations, and surface treatments
change.

## Visual language

- **Background:** warm cream paper (`#f3e9cf` ish) with subtle paper
  grain (CSS noise). No dark surfaces.
- **Ink colour:** deep brown-black (`#2a1f12`), never pure black.
- **Accent palette:** deep teal (`#2e6e6e`), terracotta (`#a83232`),
  mustard (`#c98e2b`), sage (`#7a8f5a`). Earthy, not saturated.
- **Typography:**
  - Display (the word "Belote", screen titles): a textured display
    serif via Google Fonts — `Yeseva One` or `Cormorant Garamond` SC.
  - Hand-drawn accent (subtitles, "Coming soon" labels, hints):
    `Caveat` or `Patrick Hand`.
  - Body / labels: `Lora` for warmth, or system serif as fallback.
- **Cards / tiles:** chunky cream cards with subtle drop shadow, hand-
  drawn ink border (slightly imperfect line), small ornamental flourish
  in the corner (a hand-drawn pip / leaf / dot).
- **Suit symbols:** replace unicode glyphs with custom inline SVG
  pip-shapes drawn with rough strokes (think hand-stamped, not
  geometric).
- **Buttons:** stamp-press feel — chunky, ink-bordered cream surfaces
  that depress on click.

## Reference points (steal from)

- **Wingspan companion** — paper background, hand-illustrated bird
  artwork, warm typography, sparingly used colour accents.
- **Codenames** — typewriter / monoline icons on cream, deliberate
  imperfection in card corners.
- **Everdell** — soft natural palette, leaf / branch ornaments,
  storybook serif headlines.

## Scope

### Modified

- `packages/ui/index.html` — add Google Fonts `<link>` for the chosen
  display + handwritten fonts.
- `packages/ui/src/styles/tokens.css` — replace dark-felt tokens with
  paper + ink palette. Keep gold-ramp for CTAs but reframe as warm
  mustard, not bright gold.
- `packages/ui/src/components/MenuFelt/MenuFelt.module.css` — cream
  paper background with grain; ink-stamp suit watermarks (vs white).
- `packages/ui/src/components/ModeSelectScreen/ModeSelectScreen.tsx`
  — new hero illustration (single hand-drawn card fan, bigger and
  more painterly than the previous geometric one); hand-drawn icons;
  rewritten title block.
- `packages/ui/src/components/ModeSelectScreen/ModeSelectScreen.module.css`
  — full restyle for the new palette + typography + tile chrome.
- `packages/ui/src/components/OnlineLobby/{tsx,module.css}` — same
  treatment; room-code paper card already paper-styled but adjust
  typography + add ornamental flourishes.
- `packages/ui/src/components/OnlineRandomScreen/{tsx,module.css}` —
  same treatment; spinner replaced with a hand-drawn shuffle motif or
  pulsing-stamp animation.

### Tests

- All existing tests should pass unchanged (we don't break
  data-testids or aria contracts). Add 1–2 small assertions for new
  hand-drawn icon testids if the icon names change.

## TDD plan

1. Token + font setup first (no test impact).
2. Implement enough of MenuFelt + ModeSelectScreen to get a _visual
   read_, screenshot it, and show the user before going further.
3. If the user approves: extend to OnlineLobby + OnlineRandomScreen,
   replace remaining icons, run four checks, commit.
4. If they redirect: pivot from the screenshot, not from a wall of
   committed code.

## Validation

- All existing tests pass; ≤2 added.
- `pnpm typecheck` clean.
- `pnpm lint` ≤ baseline.
- `pnpm format:check` clean on iteration scope.
- Manual smoke at every menu surface in dev + screen viewer.
- User signs off on the visual direction via screenshot.

## Out of scope

- In-round gameplay UI (`<GameTableView>`, `<HandDisplay>`, etc.) —
  matching them to the new aesthetic is iteration 022+ if direction
  approved.
- New asset files (we keep generation inline-SVG).
- Animation library / particle system.
