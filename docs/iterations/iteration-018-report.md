# Iteration 18 Report: TurnIndicator — Active Player Arrow

**Date**: 2026-02-21
**Status**: Complete

## Goal

Display a directional indicator showing whose turn it is, positioned in the center zone.

## Scope

1. `turn-indicator.ts` — PixiJS Container with directional arrow + player name text
2. Storybook stories for all 4 seats
3. Dynamic turn switching via `setTurn()` method

## Implementation Summary

### Files Created

- `packages/ui/src/components/hud/turn-indicator.ts` — PixiJS Container
- `packages/ui/src/components/hud/turn-indicator.stories.ts` — Storybook stories

### Key API

```typescript
class TurnIndicator extends Container {
  constructor(seat: Seat, name: string);
  setTurn(seat: Seat, name: string): void;
}
```

## Validation Results

- Part of commit `d8a8696` (iterations 12-20 combined)
- Visual verification via Storybook
