# Iteration 11 Report: Card Sprite & Asset Pipeline

**Date**: 2026-02-21
**Status**: Complete

## Goal

Render individual playing cards on screen. Establish a card texture generation system and the `CardSprite` display component — the foundational visual element that every subsequent UI iteration builds on.

## Scope

1. Card texture pure functions: key derivation, suit symbols, suit colors, rank display strings
2. Programmatic card texture atlas: generates all 32 card faces + 1 back at runtime via PixiJS Graphics + Text
3. `CardSprite` display object: PixiJS Container with face/back toggle and deterministic labels
4. Dev harness scene: card gallery showing all 32 faces + back in a responsive grid
5. Barrel exports for public API

## PO Decisions Locked

- **Programmatic card rendering over external SVG**: No external SVG asset set needed. PixiJS Graphics + Text produces clean, theme-aligned cards immediately. The `CardTextureAtlas` interface is designed so swapping in a real sprite sheet later requires zero changes to CardSprite or consumers.
- **Synchronous atlas creation**: `createCardTextureAtlas()` returns `CardTextureAtlas` directly (not Promise), since `generateTexture` is synchronous in PixiJS v8. Will become async when real asset loading is needed.
- **Types from @belote/core**: `Suit`, `Rank`, `ALL_SUITS`, `ALL_RANKS` reused from domain layer — single source of truth, no duplication.
- **Flat src/ structure maintained**: Only 2 new files; `components/` directory deferred until there are 3+ component files.

## Tests Written (35 test cases, written before implementation)

### card-textures.test.ts (26 tests)

- cardKey format (4 tests): hearts-ace, clubs-7, diamonds-queen, spades-10
- cardKey contains suit (1 test): all 4 suits
- cardKey contains rank (1 test): all 8 ranks
- cardKey uniqueness (1 test): all 32 combinations produce unique strings
- suitSymbol (4 tests): hearts→♥, diamonds→♦, clubs→♣, spades→♠
- suitColor (4 tests): hearts/diamonds→THEME red, clubs/spades→THEME black
- rankDisplay (5 tests): numeric ranks as-is, J/Q/K/A for face cards, all ranks non-empty
- CARD_BACK_KEY (1 test): equals "card-back"
- ALL_CARD_KEYS (4 tests): 32 entries, all unique, matches cardKey output, frozen

### card-sprite.test.ts (9 tests)

- cardLabel format (3 tests): hearts-ace, spades-7, diamonds-queen
- cardLabel prefix (1 test): starts with "card-"
- cardLabel contains suit (1 test): all 4 suits
- cardLabel contains rank (1 test): all 8 ranks
- cardLabel uniqueness (1 test): all 32 labels unique
- CARD_BACK_LABEL (2 tests): equals "card-back", no collision with any card label

## Implementation Summary

### Files Created

- `packages/ui/src/card-textures.ts` — Pure lookup functions + programmatic texture atlas
- `packages/ui/src/card-sprite.ts` — CardSprite display component (Container with face/back toggle)
- `packages/ui/src/harness/card-gallery.scene.ts` — Dev scene: 4×8 card grid + card back
- `packages/ui/__tests__/card-textures.test.ts` — 26 TDD test cases
- `packages/ui/__tests__/card-sprite.test.ts` — 9 TDD test cases

### Files Modified

- `packages/ui/src/index.ts` — Added card-textures and card-sprite barrel exports
- `packages/ui/src/harness/index.ts` — Imported card-gallery scene for registration

### Key Types

```typescript
// Card Textures
interface CardTextureAtlas {
  readonly getTexture: (suit: Suit, rank: Rank) => Texture;
  readonly getBackTexture: () => Texture;
  readonly destroy: () => void;
}

// Card Sprite
class CardSprite extends Container {
  readonly suit: Suit;
  readonly rank: Rank;
  get faceUp(): boolean;
  setFaceUp(faceUp: boolean): void;
}
```

### Key Functions

- `cardKey(suit, rank)` — Returns `"hearts-ace"` format key for texture lookup
- `suitSymbol(suit)` — Returns Unicode symbol: ♥ ♦ ♣ ♠
- `suitColor(suit)` — Returns THEME color for suit (red or black)
- `rankDisplay(rank)` — Returns display string: "7"–"10", "J", "Q", "K", "A"
- `createCardTextureAtlas(app)` — Generates all 33 textures (32 faces + back) using PixiJS Graphics
- `cardLabel(suit, rank)` — Returns `"card-hearts-ace"` format label for PixiJS display objects

### Card Visual Design

**Face (face-up):**

- Cream background (`THEME.colors.card.face`) with rounded corners
- Top-left: rank text + suit symbol in suit color
- Center: large suit symbol
- Thin gray border

**Back (face-down):**

- Dark blue background (`THEME.colors.card.back`) with rounded corners
- Gold inner border (`THEME.colors.accent.gold`)
- Gold diamond shape in center

## Technical Decisions

| Decision               | Choice                                            | Rationale                                                                                           |
| ---------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Programmatic rendering | PixiJS Graphics + Text                            | No external SVG dependencies; theme-aligned; swappable via CardTextureAtlas interface               |
| Synchronous atlas      | No async/await                                    | `generateTexture` is sync in PixiJS v8; avoids unnecessary Promise wrapper                          |
| FontWeight union type  | `FontSpec.fontWeight: FontWeight`                 | Root-cause fix: proper union type (`"normal" \| "bold" \| "500" \| …`) eliminates `as "bold"` casts |
| Card dimensions        | 100×140px at 1x                                   | Based on THEME.cardDimensions.aspectRatio (2.5/3.5); scaled by CardSprite width/height              |
| Flat file structure    | `card-textures.ts`, `card-sprite.ts` at top level | Only 2 new files; `components/` directory deferred until 3+ component files                         |
| Types from core        | `Suit`, `Rank`, `ALL_SUITS`, `ALL_RANKS`          | Reuses domain types; single source of truth                                                         |

## Review Fixes Applied (Post-Implementation)

A structured 4-role review (PO → Architect → Code Reviewer → Tester) identified 8 findings across iterations 10–11. All were resolved with root-cause fixes:

### Root-Cause Fixes

| Finding | Issue                                                              | Root Fix                                                                                                                                                                    |
| ------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1      | `deepFreeze` duplicated in theme.ts and layout.ts                  | Extracted to shared `packages/ui/src/deep-freeze.ts`; both files now import it                                                                                              |
| A2+C7   | `FontSpec.fontWeight: string` too loose; required `as "bold"` cast | Added `FontWeight` union type (`"normal" \| "bold" \| "500" \| …`); changed `FontSpec.fontWeight` to `FontWeight`                                                           |
| C3      | Hardcoded border color `"#BDBDBD"` in card-textures.ts             | Added `border: string` to `CardColors` interface + THEME value; card-textures.ts uses `THEME.colors.card.border`                                                            |
| C4      | Hardcoded font sizes 12/36 in card-textures.ts                     | Added `cardSuitSmall` and `cardCenter` to Typography interface + THEME values; card-textures.ts uses theme tokens                                                           |
| C5+C6   | Magic numbers for layout offsets                                   | Extracted named constants: `INDEX_OFFSET_X`, `RANK_OFFSET_Y`, `SUIT_SMALL_OFFSET_Y`, `BACK_BORDER_INSET`, `BACK_BORDER_RADIUS`, `DIAMOND_HALF_WIDTH`, `DIAMOND_HALF_HEIGHT` |

### Additional Files Created/Modified by Review Fixes

- `packages/ui/src/deep-freeze.ts` — New shared utility (extracted from theme.ts)
- `packages/ui/src/theme.ts` — Added `FontWeight` type, `CardColors.border`, `Typography.cardSuitSmall`, `Typography.cardCenter`
- `packages/ui/src/layout.ts` — Updated to import `deepFreeze` from shared utility
- `packages/ui/src/card-textures.ts` — Rewritten to use all theme tokens + named constants
- `packages/ui/src/index.ts` — Added `FontWeight` type export
- `packages/ui/__tests__/theme.test.ts` — Added 3 tests: `card.border`, `cardSuitSmall`, `cardCenter`; updated immutability tests

## Risks Identified

- None remaining — all review findings resolved with root-cause fixes

## Validation Results

- `pnpm test`: **582/582 passing** (544 prior + 26 card-textures + 9 card-sprite + 3 review-fix theme tests)
- `pnpm typecheck`: Clean
- `pnpm lint`: Clean
- `pnpm format:check`: Clean
- `pnpm dev`: Card Gallery scene shows all 32 cards + back in responsive grid

## Next Iteration: N+1 (Iteration 12)

**Card Interaction States (TDD)**

- Card visual states: `idle`, `hover`, `selected` (elevated), `disabled` (dimmed)
- State transition logic (pure functions mapping input to visual state)
- Touch/pointer event handling on CardSprite (tap, hover)
- Selection callback system (card tapped → notify parent)
- Dev harness scene: interactive card with all state transitions

## Iteration N+2 Preview (Iteration 13)

**Hand Layout (Card Fan)**

- Display a player's hand as a fan of overlapping cards at the bottom of the screen
- Fan layout algorithm (pure function computing card positions/rotations)
- Responsive to viewport changes
- Integration with CardSprite and interaction states
