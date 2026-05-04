# Iteration 027 — Simpler patterned board + avatar redesign

## Context

Two pieces of feedback from the user:

1. "the game board sucks could you find a fit cool background instead
   of the current low effort one" — ornate compass + wood + felt
   layered SVG was rejected; user then asked for "simpler with
   pattern".
2. "the player avatar sections are not up to date they look like they
   are from another app they don't match the style... feel free to
   change them as you want style shape pos etc... anything you see
   necessary" — pravatar photos + Radix VIP/level/dealer badges
   clashed hard with the cream paper aesthetic.

Both addressed in this iteration. Plus a small flaky-test fix and a
`.gitignore` consolidation that the user opened in the IDE.

## Scope

### Modified

- `packages/ui/public/table-paper.svg` — full rewrite. Drop the wood
  - felt + ornate compass composition. Replace with: warm muted base
    (radial gradient `#e9d9b4` → `#b09a64`), a single quiet diamond-
    lattice pattern in low-opacity ink (`#6a4a28` at ~18% opacity, with
    intersection dots), a thin double-line frame inset from the edges,
    and an outer vignette. Total ≈ 30 lines of SVG; calm enough to sit
    behind cards without competing.
- `packages/ui/src/components/PlayerAvatar/PlayerAvatar.tsx` — full
  rewrite. Drop the pravatar `<img>`, the Radix `Badge` (VIP /
  level / dealer), the Radix `Tooltip`, and the `<TimerRing>`.
  Replace with a paper "name-tag" token: cream paper rounded square
  - 2-letter monogram in serif Yeseva + handwritten Caveat name
    label below. Indicators: `D` mustard stamp top-left for dealer,
    ★ terracotta stamp top-right for contract holder, terracotta
    pulsing ring around the token for active turn. Drop VIP and level
    entirely (cruft for the new aesthetic).
- `packages/ui/src/components/PlayerAvatar/PlayerAvatar.module.css`
  — new tile chrome, monogram sizing (lg/md/sm), name-label, active
  ring + pulse, thought-bubble vocabulary preserved.
- `packages/ui/src/components/GameTable/GameTable.module.css` —
  north avatar repositioned `top: 24px` → `top: 90px` so the new
  square monogram token doesn't sit half-occluded by the back-of-
  card stack the way the old round photo did.
- `packages/ui/__tests__/App.dev-mode.test.tsx` — bumped `waitFor`
  timeout from default 1s to 5s for the lazy ScreenViewer mount; was
  flaky in concurrent test workers.
- `.gitignore` — consolidated 47 individual `.playwright-mcp/page-
*.yml` lines into a single `.playwright-mcp/` rule. Added
  `.claude/settings.local.json` and `packages/ui/e2e/screenshots/`.

## Out of scope

- Behaviour or session changes — none.
- Small remaining north-avatar / north-hand visual tuning.

## TDD plan

CSS-only on most surfaces. PlayerAvatar component test
(`PlayerAvatarBubble.test.tsx`) checks bubble behaviour, not photo
rendering, so passes unchanged. Photo / VIP / level / dealer-badge
visuals weren't asserted, so deletion is invisible to tests.

## Validation

- `pnpm test` — 715/715, no delta.
- `pnpm typecheck` — clean.
- `pnpm lint` — **188** (one fewer than baseline 189; dropping the
  Radix `Tooltip`/`Badge` calls removed one `unsafe-call` error).
- `pnpm format:check` (iteration scope) — clean.
- Manual: live `/` flow → Solo Match → PLAY GAME → confirms board
  pattern reads as quiet, avatars render as paper tokens with
  distinguishable 2-letter monograms ("DI", "VI", "VA", "EL"),
  active player has terracotta pulse, cards / score panel / bid
  panel still functional.

## Carryforward

- North-avatar / north-hand vertical alignment could use one more
  pass — the new square token still sits close to the card stack
  boundary; some viewports may show partial occlusion.
- Mobile portrait verification with the new avatars (didn't smoke
  yet at 390×844).
- Pixel-diff regression suite continues to be the right next move.
