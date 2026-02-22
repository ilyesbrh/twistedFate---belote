# Iteration 26 Report: Playable Card Highlighting

**Date**: 2026-02-22
**Status**: Complete
**Commits**: `9794b10` (feat), `86c051f` (review fixes)

## Goal

Highlight which cards the human player can legally play during their turn, using `getValidPlays()` from `@belote/core`. Non-playable cards are visually dimmed and interaction-disabled.

## Scope

1. Add `playable: boolean` to `HandCard` interface
2. `markPlayableCards()` helper in `game-view.ts` — calls `getValidPlays()` during playing phase on human's turn
3. `applyPlayableState()` in `HandDisplay` — dims non-playable cards (alpha 0.4, eventMode "none")
4. Guard in `applyCardInteraction()` — skip non-playable cards
5. Trick state guard — skip marking when trick is completed
6. 7 new tests for playable card marking

## Tests Written (7 new → 764 total)

### game-view.test.ts (7 new tests)

- All cards playable during bidding phase
- All cards playable when not human's turn
- Marks only valid plays when human leads a trick (all valid when leading)
- Marks non-followable cards as not playable (must follow suit)
- All cards playable when no current trick (null)
- All cards playable when current trick is completed (state guard)
- All cards playable in idle view (no round)

### game-controller.test.ts (1 updated)

- Hand card assertion updated to include `playable: true`

## Implementation Summary

### Files Modified

- `packages/ui/src/game-view.ts` — Added `getValidPlays` import, `markPlayableCards()` helper
- `packages/ui/src/components/hand/hand-display.ts` — Added `playable` to `HandCard`, `applyPlayableState()`, guarded `applyCardInteraction()`
- `packages/ui/__tests__/game-view.test.ts` — 7 new tests
- `packages/ui/__tests__/game-controller.test.ts` — Updated assertion

### Key Code

```typescript
// HandCard with playable flag
interface HandCard {
  readonly suit: Suit;
  readonly rank: Rank;
  readonly playable: boolean;
}

// Pure marking function
function markPlayableCards(
  hand: HandCard[], phase: GamePhase, isHumanTurn: boolean,
  round: RoundSnapshot, humanPlayer: { readonly hand: readonly Card[] },
): HandCard[] {
  if (phase !== "playing" || !isHumanTurn || round.currentTrick?.state !== "in_progress")
    return hand;
  const validPlays = getValidPlays(round.currentTrick, 0 as PlayerPosition, humanPlayer.hand);
  const validSet = new Set(validPlays.map((c) => `${c.suit}-${c.rank}`));
  return hand.map((c) => ({ ...c, playable: validSet.has(`${c.suit}-${c.rank}`) }));
}

// Visual dimming
private applyPlayableState(cards: readonly HandCard[]): void {
  const hasNonPlayable = cards.some((c) => !c.playable);
  if (!hasNonPlayable) return;
  for (const [i, sprite] of this.cardSprites.entries()) {
    const card = cards[i];
    if (card && !card.playable) {
      sprite.alpha = 0.4;
      sprite.eventMode = "none";
    }
  }
}

// Interaction guard
private applyCardInteraction(): void {
  if (!this.cardTapCallback) return;
  for (const [i, sprite] of this.cardSprites.entries()) {
    const card = this.currentCards[i];
    if (!card?.playable) continue;  // ← skip non-playable
    sprite.eventMode = "static";
    // ...
  }
}
```

## Review Fixes Applied (commit `86c051f`)

| Finding                                                                    | Severity     | Fix                                                                                                |
| -------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------- |
| `applyCardInteraction` overwrites `eventMode="none"` on non-playable cards | **Critical** | Added `if (!card?.playable) continue` guard — non-playable cards skipped entirely                  |
| No `currentTrick.state` guard                                              | Medium       | Changed condition to `round.currentTrick?.state !== "in_progress"` — completed tricks skip marking |
| Dead `const trick` variable in test                                        | Medium       | Removed dead variable, consolidated to single trick, cleaned up comments                           |

## Technical Decisions

| Decision                   | Choice                               | Rationale                                                                                    |
| -------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------- |
| Marking in view mapper     | Not in controller or component       | Pure function, fully testable, no PixiJS dependency                                          |
| suit+rank key matching     | `Set<string>` with `${suit}-${rank}` | Fast O(1) lookup; matches domain card identity for valid-play check                          |
| Alpha 0.4 for non-playable | Visual dimming                       | Clear visual distinction without hiding cards entirely                                       |
| `eventMode = "none"`       | Disable pointer events               | Prevents accidental taps on non-playable cards                                               |
| Trick state guard          | Check `state === "in_progress"`      | `getValidPlays()` returns `[]` for completed tricks, which would mark all cards non-playable |

## Validation Results

- `pnpm test`: **764/764 passing**
- `pnpm typecheck`: Clean
- `pnpm lint`: Clean
- `pnpm format:check`: Clean
