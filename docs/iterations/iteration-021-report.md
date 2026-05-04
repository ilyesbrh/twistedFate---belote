# Iteration 021 Report — Board-game aesthetic reset

**Date**: 2026-05-04
**Status**: Complete
**Test delta**: 715 → 715 (no test count change; 1 assertion text adjusted for new pill copy)

## Goal

Replace the dark-felt aesthetic from iterations 019/020 (which the
user rejected: "this UI sucks hard") with a warm hand-drawn /
board-game look — direction **E** from the offered alternatives.
References: Wingspan, Codenames, Everdell companion apps.

## TDD trail

1. **Wrote the plan** with concrete visual language description and
   the option for the user to redirect mid-implementation. Plan was a
   reset, not a polish.
2. **First slice — webfont + tokens + MenuFelt + ModeSelectScreen
   only.** Implemented the cream-paper background, ink-stamp
   watermarks, Yeseva One title, Caveat handwritten subtitle, hand-
   drawn 5-card fan with custom SVG suit pips, and stamp-press tiles
   with hand-drawn icons. Updated 1 test assertion (pill copy: "soon"
   replaced "Coming soon" so it fits the small stamp).
3. **Sanity checked with the user via screenshot.** User responded
   "continue" — direction approved.
4. **Extended treatment to OnlineLobby + OnlineRandomScreen.** Same
   palette + typography; replaced the previous gold-ramp surfaces
   with cream-paper + ink-bordered stamp buttons. Room-code and
   queue-progress remain paper-cards (already paper-styled in
   iteration 020) but now with serif Yeseva numerals, terracotta
   handwritten labels, and corner pin dots.
5. **Mid-iteration bug:** Title "Play with Friends" wrapped behind
   the absolute-positioned back button. Fixed by reducing title size
   on the lobby + random screens (display font is bigger than the
   sans-serif baseline at the same px) and adding `padding-top: 60px`
   to the content column so it clears the back button.
6. **Vite HMR caching:** edits to module CSS weren't picked up by the
   running dev server until a full restart. Documented in
   carryforward — possibly worth adding a hot-CSS-debug note to
   CLAUDE.md if it recurs.

## Files

### Modified

- `packages/ui/index.html` — added Google Fonts `<link>` for
  `Yeseva One` (display), `Caveat` (handwritten), `Lora` (body).
- `packages/ui/src/styles/tokens.css` — replaced the dark-felt token
  block with the paper + ink palette. Kept the old `--menu-felt-*`
  / `--gold-ramp-*` / `--menu-tile-*` names so existing rules in
  consumers keep resolving (just to a different palette).
  Added `--paper-*`, `--ink-*`, `--accent-*` tokens, plus
  `--font-display`, `--font-hand`, `--font-body`.
- `packages/ui/src/components/MenuFelt/MenuFelt.module.css` —
  cream paper background with diagonal grain texture; ink-stamp
  suit watermarks (with terracotta accent on two corners).
- `packages/ui/src/components/ModeSelectScreen/ModeSelectScreen.tsx`
  — new HeroIllustration with custom SVG `SuitPip` shapes for each
  suit; hand-drawn `BotIcon` / `FriendsIcon` / `ShuffleIcon` /
  `TrophyIcon` replacing the previous wireframe set; mode copy
  shortened to "Solo Match", "With Friends", "Random", "Ranked";
  `CornerOrnament` flourish on each tile.
- `packages/ui/src/components/ModeSelectScreen/ModeSelectScreen.module.css`
  — full restyle for the new typography (Yeseva display, Caveat
  handwritten, Lora body), cream-card tile chrome with chunky
  drop-shadow + ink border, corner ornament + stamp pill on the
  ranked tile.
- `packages/ui/src/components/OnlineLobby/OnlineLobby.module.css` —
  same treatment: ink-bordered stamp back button, smaller display
  title, terracotta primary CTA, cream player rows with handwritten
  seat labels, room-code paper tag with corner pin dots.
- `packages/ui/src/components/OnlineRandomScreen/OnlineRandomScreen.module.css`
  — same treatment: ink-bordered stamp back button, smaller display
  title, dashed terracotta-on-ink spinner ring, paper-tag progress
  badge with serif numerals.

### Tests

- `packages/ui/__tests__/ModeSelectScreen.test.tsx` — one assertion
  updated: "Coming soon" → "soon" for the disabled-pill copy.

## Validation

| Check                                 | Result                                  |
| ------------------------------------- | --------------------------------------- |
| `pnpm test`                           | 35 files / 715 tests passing (no delta) |
| `pnpm typecheck`                      | Clean                                   |
| `pnpm lint`                           | 189 errors — identical to post-020      |
| `pnpm format:check` (iteration scope) | Clean                                   |

### Manual smoke (browser, dev on :5178)

- `/` (root menu) — cream paper + grain, ink-stamp suit watermarks,
  hand-drawn 5-card fan with custom SVG pip shapes, big Yeseva
  "Belote" + handwritten Caveat "— Coinchée —", four cream tile
  buttons with hand-drawn icons + terracotta border on hover, "soon"
  stamp on Ranked tile.
- `?screens` → `OnlineLobby host-full`: matches. Smaller display
  title fits next to the cream stamp back button. Paper tag for
  "ROOM CODE / ABCD" with corner pin dots.
- `?screens` → `OnlineRandomScreen queued 3/4`: matches. Dashed
  spinner ring with terracotta accent. Paper tag "3/4 / PLAYERS"
  badge.

Screenshots:

- `docs/screenshots/iteration-021-menu-desktop.png`
- `docs/screenshots/iteration-021-online-lobby.png`
- `docs/screenshots/iteration-021-online-random.png`

## Carryforward

- **InstallPrompt** is still rendered with the iteration-018 dark
  banner style — visible at the top of every menu screen and
  _clashes_ with the new cream paper. Highest-priority next
  iteration: bring it into the new aesthetic (cream paper card with
  ink border + handwritten copy + small terracotta "Install" stamp).
- **In-game UI** (`<GameTableView>`, `<HandDisplay>`, `<ScorePanel>`,
  bid panel, etc.) is still on the iteration-016 visual track and
  hasn't been touched. Whether to bring it into the cream-paper
  language is a design call — the felt green table fits classic
  card-room expectations, but the UI chrome (score panel, bid panel,
  player avatars) could shift to ink-on-paper without breaking the
  table illusion. Worth its own dedicated iteration once you decide.
- **Vite HMR cache:** module CSS edits sometimes weren't reflected
  in the running dev server until a full restart. Could be related
  to repeated prettier writes; doesn't affect production builds.
  Note in passing.
- **Hero illustration** could go further — currently centred suit
  pips on a card face; could become full hand-drawn faces (number,
  pip, corner figure) for a more painterly feel. Optional polish.
- **Pixel-diff regression suite** is still on the carryforward list;
  the screen viewer fixtures + the new visual baseline make this a
  natural fit.
