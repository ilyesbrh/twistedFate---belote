# Iteration 026 — Layered wood + felt + paper game board

## Context

User on iteration 024 paper-only board: "I didn't like the board
background, and I want option 1." Option 1 from the offered set was
**A1 — layered wood + felt + paper**: a real card-table physicality
with three distinct material layers visible at the same time.

## Scope

Single-file change: `packages/ui/public/table-paper.svg`. The SVG is
referenced from `GameTable.tsx` via the same code path as iteration
024, so no TSX/CSS changes needed.

## Visual layers (outer → inner)

1. **Walnut wood frame** — full canvas. Linear-gradient from `#5a3418`
   down to `#2a1408`, with a hand-tuned wood-grain pattern (vertical
   ink lines at varied widths and alphas, slight rotation). Inner
   bevel highlight in warm amber so the felt edge feels recessed.
2. **Forest felt surface** — large rounded rectangle inset 56px from
   the frame. Radial gradient `#3a4f2c` → `#1c2814`. Diagonal weave
   overlay for cloth texture. Top inner-highlight gradient (light from
   above). Gold-piping decorative dashed line just inside. Faint suit
   ornaments at the four corners.
3. **Cream paper playing mat** — 1180×740 rounded rectangle centred on
   the felt at the canvas centre. Cream paper radial + diagonal grain.
   Drop-shadow filter so it visibly floats above the felt. Hand-drawn
   ornamental ink border (heavy outer + dashed inner) softened by
   `feDisplacementMap`. Corner flourishes (curves + dots).
4. **Compass medallion** on the mat — concentric ink rings (some
   dashed) + four ink suit pips at the cardinal compass points
   (♠ N, ♥ E terracotta, ♦ S terracotta, ♣ W). Size tuned so the
   trick-area cards from `<TrickArea>` land inside the inner ring.

Outer felt vignette so the wood reads as the outermost frame and the
playing mat reads as the focal point.

## Out of scope

- TSX / CSS — no changes.
- Tests — no changes.

## TDD plan

Asset swap. Tests cover behaviour, not pixels, so 715/715 holds.
Manual smoke via `?screens` → `Playing — mid-trick`.

## Validation

- `pnpm test` 715/715, no delta.
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check` no delta.
- Manual: trick cards centered in medallion, paper mat visibly
  floating on felt, wood frame visible at the four edges.

## Carryforward

- Pixel-diff regression suite (Playwright screenshot diffs) — board
  surface is now the most layered surface in the app and benefits
  most from regression coverage.
- Mobile portrait verification (didn't test that viewport with the
  new layered board).
- The old `table-bg.svg` is still on disk; could clean up.
