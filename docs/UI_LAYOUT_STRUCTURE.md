# UI Layout Structure

Component decomposition for the `@belote/ui` rendering layer. Each component is built in isolation (Storybook story first), then integrated into the table layout.

Reference: [layout 7.webp](examples/layout%207.webp) — landscape 4-player card table.

---

## Zone Map (844x390 baseline)

```
844px
┌──────────────────────────────────────────────────────────────────────────────┐
│                              TOP ZONE (70px)                                 │ 18%
│  [avatar] Partner    [══] [══] [══] [══] [══] [══] [══] [══]    [Score HUD]  │
├──────────────┬───────────────────────────────────────────┬───────────────────┤
│  LEFT (127)  │              CENTER (590px)               │   RIGHT (127)     │
│              │                                           │                   │ 54%
│  [avatar]    │          [partner's card]                 │   [avatar]        │ 211px
│  Opponent    │                                           │   Opponent        │
│  [║]         │     [left opp]          [right opp]       │   [║]             │
│  [║] vert    │                                           │   [║] vert        │
│  [║] stack   │          [your card]                      │   [║] stack       │
│  [║]         │       trump: ♠   turn: →You               │   [║]             │
├──────────────┴───────────────────────────────────────────┴───────────────────┤
│                            BOTTOM ZONE (109px)                               │ 28%
│       [avatar] You    [7♠][8♠][9♠][10♠][J♠][Q♠][K♠][A♠]                      │
│                        ← 8 face-up cards, wide fan →                         │
└──────────────────────────────────────────────────────────────────────────────┘
                                                                          390px
```

---

## Component Hierarchy

```
TableLayout                            ← Root container, owns all zones
│
├── TOP zone (70px height, full width)
│   ├── PlayerInfo                     ← Partner avatar + name (left side)
│   ├── OpponentHand (horizontal)      ← 8 face-down cards, horizontal row
│   └── ScorePanel                     ← Team scores (right side)
│
├── LEFT zone (127px width, 211px height)
│   ├── PlayerInfo                     ← Left opponent avatar + name
│   └── OpponentHand (vertical)        ← Face-down cards, rotated 90°
│
├── RIGHT zone (127px width, 211px height)
│   ├── PlayerInfo                     ← Right opponent avatar + name
│   └── OpponentHand (vertical)        ← Face-down cards, rotated 90°
│
├── CENTER zone (590px width, 211px height)
│   ├── TrickDisplay                   ← 0–4 played cards (N/S/E/W positions)
│   ├── TrumpIndicator                 ← Current trump suit badge
│   └── TurnIndicator                  ← Gold glow on active player
│
└── BOTTOM zone (109px height, full width)
    ├── PlayerInfo                     ← Your avatar + name (left side)
    ├── HandDisplay                    ← 8 face-up cards in fan
    │   └── CardSprite × N            ← Individual interactive cards
    └── BiddingPanel (overlay)         ← Shown during bidding phase only
```

---

## Trick Area Card Positions

Played cards are placed in the center zone at positions matching the player who played them:

```
              590 × 211px center zone
    ┌─────────────────────────────────────┐
    │           [partner's card]          │  top-center
    │                                     │
    │  [left opp]            [right opp]  │  middle-left / middle-right
    │                                     │
    │             [your card]             │  bottom-center
    └─────────────────────────────────────┘
```

---

## File Tree

```
packages/ui/src/
│
│  # Foundation (built) ──────────────────────────────────
├── theme.ts                            Design tokens
├── layout.ts                           Zone math (pure)
├── deep-freeze.ts                      Utility
├── bootstrap.ts                        App init
├── card-textures.ts                    Card face/back rendering
├── card-sprite.ts                      Single card (face/back toggle)
├── index.ts                            Barrel exports
│
│  # Components ──────────────────────────────────────────
├── components/
│   ├── hand/
│   │   ├── hand-layout.ts              Pure math: fan positions, overlap, arc
│   │   ├── hand-display.ts             Container: N CardSprites in a fan
│   │   └── hand-display.stories.ts     Stories: 3, 5, 8 cards + selection
│   │
│   ├── opponent-hand/
│   │   ├── opponent-layout.ts          Pure math: stack positions (vert/horiz)
│   │   ├── opponent-hand.ts            Container: face-down card stack
│   │   └── opponent-hand.stories.ts    Stories: horizontal (top), vertical (sides)
│   │
│   ├── trick/
│   │   ├── trick-layout.ts             Pure math: N/S/E/W card positions
│   │   ├── trick-display.ts            Container: 0–4 played cards
│   │   └── trick-display.stories.ts    Stories: empty, 1 card, 2 cards, full
│   │
│   ├── player-info/
│   │   ├── player-info.ts              Container: avatar circle + name + card count
│   │   └── player-info.stories.ts      Stories: each position, active/inactive
│   │
│   ├── hud/
│   │   ├── score-panel.ts              Team scores display
│   │   ├── score-panel.stories.ts
│   │   ├── trump-indicator.ts          Current trump suit icon
│   │   ├── trump-indicator.stories.ts
│   │   ├── turn-indicator.ts           Active player highlight (gold glow)
│   │   └── turn-indicator.stories.ts
│   │
│   ├── bidding/
│   │   ├── bidding-layout.ts           Pure math: button grid positions
│   │   ├── bidding-panel.ts            Overlay: suit buttons + pass + value
│   │   └── bidding-panel.stories.ts    Stories: open, suit selected, closed
│   │
│   └── table/
│       ├── table-layout.ts             Root container: wires zones → components
│       └── table-layout.stories.ts     Story: full table with mock data
│
│  # Tests ───────────────────────────────────────────────
├── __tests__/
│   ├── theme.test.ts                   Foundation tests (existing)
│   ├── layout.test.ts
│   ├── card-textures.test.ts
│   ├── card-sprite.test.ts
│   ├── hand-layout.test.ts             Pure math tests for hand fan
│   ├── opponent-layout.test.ts         Pure math tests for opponent stacks
│   ├── trick-layout.test.ts            Pure math tests for trick positions
│   └── bidding-layout.test.ts          Pure math tests for bidding buttons
```

---

## Separation Principle

Each visual component splits into two concerns:

| Concern         | File             | Tested with | What it does                                             |
| --------------- | ---------------- | ----------- | -------------------------------------------------------- |
| **Layout math** | `*-layout.ts`    | Vitest      | Pure functions: given zone rect + card count → positions |
| **Rendering**   | `*.ts` Container | Storybook   | PixiJS Container that places children at computed spots  |

Example for `hand/`:

- `hand-layout.ts` — "Given 8 cards in a 590px-wide zone, return `{ x, y, rotation }` per card"
- `hand-display.ts` — Creates CardSprites and sets their `.x`, `.y`, `.rotation` from layout output

The math is 100% unit-testable. The visuals are verified in Storybook. No canvas in unit tests.

---

## Implementation Order

One component per iteration, atomic before composite:

| Order | Component      | Zone    | Dependency             |
| ----- | -------------- | ------- | ---------------------- |
| 1     | HandDisplay    | Bottom  | CardSprite             |
| 2     | OpponentHand   | Top/L/R | CardSprite             |
| 3     | TrickDisplay   | Center  | CardSprite             |
| 4     | PlayerInfo     | All     | None (text + graphics) |
| 5     | ScorePanel     | Top     | None (text + graphics) |
| 6     | TrumpIndicator | Center  | None (text + graphics) |
| 7     | TurnIndicator  | Center  | PlayerInfo             |
| 8     | BiddingPanel   | Bottom  | None (buttons)         |
| 9     | TableLayout    | Root    | All of the above       |
