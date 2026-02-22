# Iteration 12 Report: HandDisplay — Card Fan Layout

**Date**: 2026-02-21
**Status**: Complete

## Goal

Render the human player's hand as a fan of overlapping cards at the bottom of the screen. Establish the `*-layout.ts` (pure math) + `*.ts` (PixiJS) component separation pattern used by all subsequent components.

## Scope

1. `hand-layout.ts` — Pure layout math: card positions, rotations, overlap, arc curvature
2. `hand-display.ts` — PixiJS Container consuming layout output + CardSprite rendering
3. Storybook story for visual verification
4. Component tracker documentation

## Tests Written (27 test cases)

### hand-layout.test.ts (27 tests)

- Card count determines layout geometry
- Cards positioned along arc with curvature
- Overlap increases with card count
- Card rotation follows arc tangent
- Scale factor per card
- Zone boundary constraints
- Responsive to zone dimensions
- Edge cases: 0 cards, 1 card, 8 cards (full hand)

## Implementation Summary

### Files Created

- `packages/ui/src/components/hand/hand-layout.ts` — Pure layout computation
- `packages/ui/src/components/hand/hand-display.ts` — PixiJS Container with CardSprite fan
- `packages/ui/src/components/hand/hand-display.stories.ts` — Storybook stories
- `packages/ui/__tests__/hand-layout.test.ts` — 27 TDD test cases

### Key Types

```typescript
interface HandLayoutResult {
  readonly cards: readonly CardPosition[];
  readonly cardWidth: number;
  readonly cardHeight: number;
}

interface CardPosition {
  readonly x: number;
  readonly y: number;
  readonly rotation: number;
  readonly scale: number;
}

interface HandCard {
  readonly suit: Suit;
  readonly rank: Rank;
  readonly playable: boolean;
}
```

## Validation Results

- Part of commit `d8a8696` (iterations 12-20 combined)
- 27 hand-layout tests passing
