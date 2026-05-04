# Iteration 026 Report — Layered wood + felt + paper game board

**Date**: 2026-05-04
**Status**: Complete
**Test delta**: 715 → 715 (asset-only change)

## Goal

User feedback on iteration 024's cream-paper-only board: "I didn't
like the board background, and I want option 1." Option 1 from the
offered alternatives was **A1 — layered wood + felt + paper**: real
card-table physicality with three distinct material layers visible
simultaneously.

## What landed

Single-file rewrite of `packages/ui/public/table-paper.svg` with
three composed layers, outer to inner:

1. **Walnut wood frame** spanning the full canvas: linear gradient
   `#5a3418` → `#2a1408`, hand-tuned vertical wood-grain lines,
   inner amber-bevel highlight at the felt edge.
2. **Forest-felt surface**: rounded rectangle inset 56px from the
   frame, radial gradient `#3a4f2c` → `#1c2814`, diagonal weave
   overlay for cloth texture, top-inner highlight gradient, gold-
   piping dashed border just inside, faint suit ornaments in the
   four corners.
3. **Cream paper playing mat** (1180×740, centred): cream radial +
   diagonal grain, SVG drop-shadow filter so it visibly _floats_
   above the felt, hand-drawn ornamental ink border (heavy outer +
   dashed inner) softened by `feDisplacementMap`, corner flourishes.
4. **Compass medallion** centred on the mat (concentric ink rings,
   four cardinal suit pips ♠ N / ♥ E terracotta / ♦ S terracotta /
   ♣ W) — sized so the trick cards land inside the inner ring.

Outer felt vignette so the wood reads as the outermost frame and the
mat as the focal point.

`GameTable.tsx` references the same SVG path — no JSX or CSS change
needed.

## Files

### Modified

- `packages/ui/public/table-paper.svg` — full rewrite from the
  iteration 024 paper-only design to the layered wood + felt + paper
  composition.

## Validation

| Check                                 | Result                            |
| ------------------------------------- | --------------------------------- |
| `pnpm test`                           | 35 files / 715 passing (no delta) |
| `pnpm typecheck`                      | Clean                             |
| `pnpm lint`                           | 189 (no delta)                    |
| `pnpm format:check` (iteration scope) | Clean                             |

### Manual smoke (browser, dev on :5183)

After `rm -rf packages/ui/node_modules/.vite` to bust HMR cache (the
recurring footgun documented in iterations 021/024/025):

- `?screens` → `Playing — mid-trick`: wood frame visible at all four
  edges; forest-green felt cloth in between; cream paper mat
  centered with corner pin flourishes and the compass medallion;
  trick cards (10♥ + K♥) land cleanly inside the inner medallion
  ring; ChatPanel ledger drawer on the right; cream avatar pill at
  the top — all harmonize against the layered board.

Screenshot: `docs/screenshots/iteration-026-layered-board.png`.

## Carryforward

- **Pixel-diff regression suite** — the board is the most visually
  layered surface in the app now and would benefit most from
  Playwright screenshot-diff coverage.
- **Mobile portrait verification** — didn't test the new layered
  board at 390×844 yet. Worth a smoke pass.
- **`table-bg.svg`** — old asset still on disk. Could be removed in
  a small cleanup iteration.
- **CLAUDE.md note about Vite HMR cache** — the issue has now bit me
  four times (021/024/025/026). Codify the recipe.
