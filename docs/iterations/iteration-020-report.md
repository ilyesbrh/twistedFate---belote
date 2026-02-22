# Iteration 20 Report: TableLayout — Root Container & Zone Wiring

**Date**: 2026-02-21
**Status**: Complete

## Goal

Create the root layout container that positions the 5 zones (top, bottom, left, right, center) using the layout system from iteration 10, providing the structural frame for all UI components.

## Scope

1. `table-layout.ts` — PixiJS Container that creates and positions 5 zone containers
2. Zone containers auto-positioned from `computeLayout()` output
3. `resize()` method for viewport changes
4. `getZones()` and `getLayout()` accessors
5. Storybook story showing zone boundaries

## Implementation Summary

### Files Created

- `packages/ui/src/components/table/table-layout.ts` — Root Container
- `packages/ui/src/components/table/table-layout.stories.ts` — Storybook story

### Key API

```typescript
class TableLayout extends Container {
  constructor(viewport: Viewport);
  resize(viewport: Viewport): void;
  getZones(): {
    top: Container;
    bottom: Container;
    left: Container;
    right: Container;
    center: Container;
  };
  getLayout(): Layout;
}
```

## Technical Decisions

| Decision        | Choice                                                     | Rationale                                                                                        |
| --------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Zone containers | 5 named Containers with labels                             | Each zone is a PixiJS Container positioned at layout coordinates; children use local coordinates |
| Resize flow     | `resize()` → recompute layout → reposition zone containers | Simple, deterministic; callers re-render children after resize                                   |

## Validation Results

- Part of commit `d8a8696` (iterations 12-20 combined)
- Visual verification via Storybook
- **684 tests total** after all iteration 12-20 work + review fixes

## Iterations 12-20 Combined Review

All 9 components were built in a single session and committed together as `d8a8696`. A structured 4-role review (PO → Architect → Code Reviewer → Tester) was applied. Key review fixes:

| Finding                      | Fix                                                                    |
| ---------------------------- | ---------------------------------------------------------------------- |
| BiddingPanel memory leak     | Destroy children before remove in `update()`                           |
| Seat type duplication        | Canonical `Seat` type in `layout.ts`, all components import from there |
| Null/undefined inconsistency | Normalized return conventions in BiddingPanel                          |
| Component tracker formatting | Fixed markdown table alignment                                         |
