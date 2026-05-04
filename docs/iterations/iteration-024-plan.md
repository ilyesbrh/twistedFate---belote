# Iteration 024 — Paper game board (drop the felt)

## Goal

User: "the game board is not yet up to my expectation… be bold."

The iteration-023 chrome change (cream paper panels on top of olive
felt) was a half-step. Going bold: replace the felt-green table
itself with a hand-drawn paper game board. Now the whole app — menu,
lobby, in-game — is the same cream paper, with the table acting as a
designed playing surface (compass medallion, suit ornaments, ink
border) rather than a generic green felt.

## What changes

### Modified

- `packages/ui/public/table-paper.svg` — **new asset**. SVG game
  board:
  - Cream paper radial gradient + diagonal grain pattern + paper-fiber
    speckle (feTurbulence colour-matrixed to brown-faint)
  - Outer ink-drawn ornamental rectangle + dashed inner frame, both
    softened by a `feDisplacementMap` "rough" filter so they look
    inked rather than printed
  - Hand-drawn corner flourishes (curves + dots) in each corner
  - Four corner suit watermarks (large, low-opacity)
  - Center compass medallion: cream halo + four concentric ink rings
    (some dashed, varying widths) + four ink suit pips at the
    cardinal compass points (♠ N, ♥ E terracotta, ♦ S terracotta,
    ♣ W)
  - Outer vignette so the paper doesn't read as flat
- `packages/ui/src/components/GameTable/GameTable.tsx` — change the
  `tableBg` URL from `table-bg.svg` (felt + wood) to
  `table-paper.svg` (cream paper game board).

### Not touched

- Card faces, hand display, score panel, bid panel, chat — all
  already cream/ink from iteration 023 and harmonize naturally.
- `table-bg.svg` itself — kept on disk for potential rollback.

## TDD plan

Pure asset swap. No tests change. Run the suite to confirm 715/715
holds, smoke in the browser via the screen-viewer fixture
`Playing — mid-trick`.

## Validation

- `pnpm test` — 715/715, no delta.
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check` — no delta.
- Manual: dev-tools confirm the trick area sits inside the medallion
  ring at default viewport, paper grain visible, suit pips legible,
  border ornaments readable.

## Carryforward

- The kept-but-unused `table-bg.svg` could be removed in a separate
  cleanup iteration (or left as historical record).
- Card-back patterns could pick up an ink-drawn paper aesthetic too;
  iteration 025+ if the table ends up feeling too clean.
- Pixel-diff regression suite is the natural next step now that the
  visual layer is fully unified.
