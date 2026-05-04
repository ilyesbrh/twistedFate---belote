# Iteration 024 Report — Paper game board

**Date**: 2026-05-04
**Status**: Complete
**Test delta**: 715 → 715 (asset swap, no behaviour change)

## Goal

User feedback after iteration 023: "the game board is not yet up to
my expectation… be bold." The chrome had moved to cream paper but
the felt-green table itself was still a generic playing surface.
Iteration 024 drops the felt entirely and replaces it with a hand-
drawn paper game board so the whole app reads as a single board-game
companion — menu, lobby, in-game, all on the same cream paper.

## What landed

A new SVG asset, `packages/ui/public/table-paper.svg`, designed as a
paper game board:

- Cream paper radial gradient + diagonal grain + paper-fiber speckle
  (turbulence-based texture).
- Hand-drawn ornamental ink border (heavy outer rectangle + dashed
  inner frame) softened by an SVG displacement filter so the lines
  read as inked rather than printed.
- Four corner flourishes (curves + dots), echoed by four large faint
  suit watermarks just inside each corner.
- A center compass medallion: cream halo, four concentric ink rings
  (some dashed, varying widths), and four ink suit pips at the
  cardinal compass points — ♠ at north, ♥ at east (terracotta),
  ♦ at south (terracotta), ♣ at west.
- A subtle vignette so the paper doesn't read as flat.

`GameTable.tsx` swapped its `tableBg` URL from `table-bg.svg` to
`table-paper.svg`. No CSS changes were needed.

## Vite cache caveat

When testing this in the dev server, observed the same HMR caching
issue noted in iteration 021's report: the running dev instance
served stale CSS (still referencing iteration-016 tokens) until I
killed it, deleted `packages/ui/node_modules/.vite`, and restarted.
After that the new board, the iteration-023 chrome changes, and the
new tokens all loaded correctly. Worth noting in `CLAUDE.md` if the
issue recurs across other iterations.

## Files

### New

- `packages/ui/public/table-paper.svg` — the new game board.

### Modified

- `packages/ui/src/components/GameTable/GameTable.tsx` — single line
  change: `table-bg.svg` → `table-paper.svg`.

### Not touched

- All chrome styled in iteration 023 — no further changes needed,
  the paper-on-paper composition harmonizes automatically.

## Validation

| Check                                 | Result                            |
| ------------------------------------- | --------------------------------- |
| `pnpm test`                           | 35 files / 715 passing (no delta) |
| `pnpm typecheck`                      | Clean                             |
| `pnpm lint`                           | 189 (no delta)                    |
| `pnpm format:check` (iteration scope) | Clean                             |

### Manual smoke

Visited `?screens` → `Playing — mid-trick`. The trick cards (10♥
over K♥) sit centered in the compass medallion, surrounded by the
concentric ink rings and four cardinal suit pips. Cream paper grain
visible across the surface. Corner flourishes and suit watermarks
provide ornamentation without crowding the playing area. Cream
ChatPanel ledger drawer on the right and ink-bordered avatar pill at
the top harmonize seamlessly with the new board.

Screenshot: `docs/screenshots/iteration-024-paper-board.png`.

## Carryforward

- **Pixel-diff regression suite** — visual baseline is now fully
  settled. Wiring Playwright screenshot-diffs into CI is the natural
  next step.
- **`table-bg.svg`** stays on disk for historical reference / rollback
  capability. Could be deleted in a small cleanup iteration.
- **Card backs** still use the iteration-016 dark-pattern design
  (`packages/ui/src/components/CardBack/`). They harmonize OK
  against the cream board but could be redrawn with an ink-on-paper
  pattern for fuller consistency. Optional polish.
- **CLAUDE.md note about Vite cache** — if HMR caching keeps biting
  in iterations that touch tokens or CSS-Module class hashes, codify
  the "kill dev, rm `.vite`, restart" recipe in CLAUDE.md.
