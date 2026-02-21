# TwistedFate - Belote: UI Manifesto

The frontend layer for TwistedFate — Belote. This document is the **source of truth** for all UI/UX decisions, technology choices, design tokens, and development workflow.

The UI layer must match the engineering rigor of the core engine (iterations 1–9). No shortcuts. No monolithic iterations. Every component built in isolation, tested, and validated before integration.

---

# Technology Stack

## Confirmed Tools

| Layer                 | Tool                               | Version                      | Purpose                                              |
| --------------------- | ---------------------------------- | ---------------------------- | ---------------------------------------------------- |
| **Rendering**         | PixiJS                             | v8.16.0 (installed)          | Scene graph, sprites, WebGL2/WebGPU, touch events    |
| **Card Assets**       | SVG card set (open-source)         | TBD                          | French-style card faces, 32 Belote cards + card back |
| **Asset Pipeline**    | Build-time sprite sheet generation | TBD                          | SVG → PNG/WebP atlas + JSON manifest                 |
| **Animation Runtime** | GSAP + PixiPlugin                  | v3.x (free since April 2025) | Timeline-based sequences on PixiJS display objects   |
| **Animation Logic**   | `@belote/animation` (custom)       | —                            | Pure, testable animation sequence descriptions       |
| **Visual Dev**        | Storybook + @pixi/storybook-vite   | v1.0.0                       | Isolated component development and visualization     |
| **Unit Testing**      | Vitest                             | v4.0.0 (installed)           | Layout math, animation sequences, state mapping      |
| **Visual Testing**    | Playwright                         | TBD                          | Screenshot regression on canvas                      |
| **Bundler**           | Vite                               | installed                    | Dev server, HMR, production builds                   |

## Rejected Tools (with rationale)

| Tool               | Why Not                                                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| **React / Vue**    | PixiJS is the view layer. DOM frameworks add impedance mismatch with canvas rendering. No benefit for a game with no complex forms. |
| **Phaser**         | Full game engine wrapping PixiJS internally. Physics, tilemaps, cameras — 80% unused for a card game. Overkill.                     |
| **anime.js**       | GSAP covers the same ground with superior PixiJS integration (official PixiPlugin). Redundant.                                      |
| **Framer Motion**  | React-only. Not applicable.                                                                                                         |
| **CSS-only cards** | Don't integrate with PixiJS scene graph. Lack visual polish of designed SVG faces.                                                  |

---

# Architecture

```
┌──────────────────────────────────────────────────┐
│                  Storybook                        │
│      (Visual dev, isolated component testing)     │
├──────────────────────────────────────────────────┤
│                  UI Layer                         │
│               (@belote/ui)                        │
│                                                  │
│  GameRenderer ──→ subscribes to GameSession       │
│       │                                          │
│       ├── TableLayout (4-player zones)            │
│       │     ├── HandDisplay (card fan)            │
│       │     ├── PlayerInfo (avatar, name)         │
│       │     ├── TrickDisplay (center area)        │
│       │     └── OpponentHand (face-down)          │
│       │                                          │
│       ├── HUD                                    │
│       │     ├── ScorePanel (team scores)          │
│       │     ├── TrumpIndicator (suit icon)        │
│       │     ├── TurnIndicator (active player)     │
│       │     └── RoundInfo (round/trick count)     │
│       │                                          │
│       ├── BiddingPanel (bottom sheet overlay)     │
│       │                                          │
│       └── GSAP Binding (executes animations)     │
│                                                  │
├──────────────────────────────────────────────────┤
│              Animation Layer                      │
│            (@belote/animation)                    │
│                                                  │
│  Pure sequence descriptions (zero rendering deps) │
│  Deal · Play · Collect · Flip · Sort · Score      │
│                                                  │
├──────────────────────────────────────────────────┤
│              Application Layer                    │
│               (@belote/app)                       │
│                                                  │
│  Commands ──→ GameSession ──→ Events              │
│                                                  │
├──────────────────────────────────────────────────┤
│              Core Domain Engine                   │
│               (@belote/core)                      │
│  Card · Player · Trick · Bid · Round · Game       │
│  Scoring · AI Strategy                            │
└──────────────────────────────────────────────────┘
```

### Layer Rules

1. **`@belote/animation`** has **zero** PixiJS/GSAP dependencies. It produces pure data describing animations (positions, durations, easing). It is fully testable with Vitest.
2. **`@belote/ui`** owns all PixiJS display objects and GSAP execution. It consumes animation sequences from `@belote/animation` and binds them to real display objects.
3. **`@belote/ui`** communicates with `@belote/app` exclusively through **commands** (user actions) and **events** (state changes). No direct core domain manipulation.
4. **Storybook** renders UI components in isolation. Every visual component must have at least one story before integration.

---

# Design Principles

## 1. Landscape-First

- Primary layout: landscape orientation. Card games naturally fit a wide table.
- All interactive elements in the **bottom 28%** of the screen (thumb-reachable in landscape grip).
- Portrait is supported as a fallback with its own optimized zone ratios.
- Desktop is supported — landscape layout works naturally on wide screens.

## 2. Standard 4-Player Table Layout

```
┌──────────────────────────────────────────────────────────┐
│                  Player 3 (partner)                      │
│                [horizontal face-down]                    │
├──────────┬────────────────────────────────┬──────────────┤
│ Player 2 │                                │  Player 4    │
│(opponent)│         ┌──────────────┐       │ (opponent)   │
│[vertical │         │  TRICK AREA  │       │ [vertical    │
│ face-down│         │  (center)    │       │  face-down   │
│ rotated] │         └──────────────┘       │  rotated]    │
├──────────┴────────────────────────────────┴──────────────┤
│                  Player 1 (human)                        │
│                 [face-up card fan]                        │
└──────────────────────────────────────────────────────────┘
```

- Human player always at bottom.
- Partner at top, opponents at left and right.
- Center area for trick display.
- Player avatars and names adjacent to card areas.

## 3. Component Isolation

Every visual element is a standalone PixiJS `Container`:

- **CardSprite**: single card with face/back, interaction states
- **HandDisplay**: fan of N cards with selection
- **OpponentHand**: face-down compact cards
- **PlayerInfo**: avatar + name + card count
- **TrickDisplay**: center trick area with 0–4 cards
- **ScorePanel**: team scores and target
- **TrumpIndicator**: suit icon
- **TurnIndicator**: active player highlight
- **BiddingPanel**: bid selection overlay

Each component:

- Has its own Storybook story
- Is testable in isolation (layout math via Vitest, visuals via Storybook)
- Uses theme tokens exclusively (no hardcoded values)
- Has a unique ID/label for Playwright targeting

## 4. Event-Driven Rendering

The UI does **not** poll or manage game state. It reacts to events from `GameSession`:

| Event               | UI Response                                  |
| ------------------- | -------------------------------------------- |
| `game_started`      | Initialize table layout, show player names   |
| `round_started`     | Deal cards to hand, show opponent card backs |
| `bid_placed`        | Show bid indicator near player avatar        |
| `bidding_completed` | Hide bidding panel, show trump indicator     |
| `card_played`       | Move card from hand/opponent to trick area   |
| `trick_completed`   | Highlight winner, collect cards              |
| `round_completed`   | Update score panel, show round summary       |
| `round_cancelled`   | Brief message, prepare next round            |
| `game_completed`    | Show winner overlay                          |

User actions dispatch commands:

- Tap card in hand → `PlayCardCommand`
- Tap bid button → `PlaceBidCommand`

## 5. Two-Step Interaction (Tap-Select-Confirm)

- **Tap** a card to select it (elevates visually).
- **Tap again** (or tap play area) to confirm the play.
- Prevents accidental plays on small screens.
- Invalid cards appear dimmed and ignore taps.
- Only one card selected at a time.

---

# Design Tokens

All visual constants are centralized in a single **theme module**. No component may hardcode colors, fonts, spacing, or sizes. Changing the theme changes the entire app.

## Color Palette

| Token             | Value                   | Usage                                       |
| ----------------- | ----------------------- | ------------------------------------------- |
| `table.bgDark`    | `#0D3B0F`               | Table gradient dark end                     |
| `table.bgLight`   | `#1B5E20`               | Table gradient light end                    |
| `table.surface`   | `#2E7D32`               | Center play area                            |
| `card.face`       | `#FFFDE7`               | Card face background (cream)                |
| `card.back`       | `#1A237E`               | Card back primary color                     |
| `suit.red`        | `#C62828`               | Hearts, diamonds                            |
| `suit.black`      | `#212121`               | Spades, clubs                               |
| `accent.gold`     | `#FFD54F`               | Highlights, turn indicators, active buttons |
| `accent.danger`   | `#E53935`               | Invalid play feedback, errors               |
| `ui.overlay`      | `rgba(0,0,0,0.7)`       | Score panels, bidding overlay background    |
| `ui.overlayLight` | `rgba(255,255,255,0.1)` | Subtle separators, borders                  |
| `text.light`      | `#FAFAFA`               | Text on dark backgrounds                    |
| `text.dark`       | `#212121`               | Text on light backgrounds                   |
| `text.muted`      | `#9E9E9E`               | Secondary/disabled text                     |

## Typography

| Token             | Value                                                               | Usage                 |
| ----------------- | ------------------------------------------------------------------- | --------------------- |
| `font.family`     | `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` | All text              |
| `font.cardIndex`  | Bold, 14pt min                                                      | Card rank/suit labels |
| `font.score`      | Bold, 18–24pt                                                       | Score numbers         |
| `font.playerName` | Medium, 12–14pt                                                     | Player names          |
| `font.label`      | Regular, 11–13pt                                                    | Secondary labels      |
| `font.heading`    | Bold, 16–20pt                                                       | Panel headings        |

**Rule**: Maximum 2 font families across the entire UI. System sans-serif is the primary. A decorative font may be used **only** for the app title/logo.

## Spacing

| Token        | Value | Usage                                 |
| ------------ | ----- | ------------------------------------- |
| `spacing.xs` | 4px   | Tight gaps (card overlap adjustments) |
| `spacing.sm` | 8px   | Component internal padding            |
| `spacing.md` | 16px  | Section margins                       |
| `spacing.lg` | 24px  | Major section gaps                    |
| `spacing.xl` | 32px  | Screen edge margins                   |

## Card Dimensions

Percentages are relative to viewport height. Optimized for landscape-first (844x390 baseline).

| Token                 | Description                             | Usage                        |
| --------------------- | --------------------------------------- | ---------------------------- |
| `card.aspectRatio`    | `2.5:3.5` (standard playing card ratio) |                              |
| `card.handHeight`     | 22–28% of viewport height               | Human player's hand cards    |
| `card.trickHeight`    | 18–22% of viewport height               | Played cards in trick area   |
| `card.opponentHeight` | 12–16% of viewport height               | Opponent face-down cards     |
| `card.minTapWidth`    | 44px minimum                            | Apple HIG touch target       |
| `card.fanOverlap`     | 60–70% of card width                    | Overlap between cards in fan |

## Animation Timing

| Token                  | Duration           | Usage                         |
| ---------------------- | ------------------ | ----------------------------- |
| `anim.cardDeal`        | 150–200ms per card | Staggered dealing             |
| `anim.cardPlay`        | 200–300ms          | Hand to trick area            |
| `anim.trickCollect`    | 400–500ms          | Cards sweep to winner         |
| `anim.cardSelect`      | 100–150ms          | Elevation on tap              |
| `anim.cardReject`      | 200ms              | Invalid play bounce-back      |
| `anim.panelSlide`      | 300ms              | Bidding panel show/hide       |
| `anim.scoreUpdate`     | 500ms              | Number counter animation      |
| `anim.roundTransition` | 800–1000ms         | Pause between rounds          |
| `anim.aiDelay`         | 500–1000ms         | Artificial delay for AI turns |

---

# Testing Strategy

## Three-Tier Testing Pyramid

### Tier 1: Unit Tests (Vitest)

Everything that can be tested without a canvas:

- Layout calculations (fan positions, zone dimensions, responsive breakpoints)
- Animation sequence generation (step counts, timing, easing)
- State mapping (domain events → visual state changes)
- Theme token validation
- Card interaction state machines

**This is where TDD applies strictly.** Write the test, then implement.

### Tier 2: Visual Development (Storybook)

Interactive, visual verification of components:

- Every component has at least one story
- Stories cover key states (idle, hover, selected, disabled, various data)
- Viewport addon for testing responsive layouts
- Controls addon for tweaking parameters

**Storybook is the development environment**, not an afterthought. Build the component visually in Storybook, then integrate.

### Tier 3: Visual Regression (Playwright)

Lock down visual correctness with screenshot tests:

- Each card face (32 snapshots)
- Hand fan at 3, 5, 8 cards
- Full table at multiple viewport sizes (844x390, 926x428, 1024x768)
- Animation keyframes (paused at 0%, 50%, 100%)

**Deterministic rendering required**: seeded RNG, fixed resolution, tolerance thresholds.

---

# Component Development Workflow

For every UI component:

1. **Define** scope and acceptance criteria (PO step)
2. **Write unit tests** for layout math and state logic (TDD)
3. **Implement** the PixiJS component with theme tokens
4. **Create Storybook story** with all key states
5. **Visual verify** in Storybook across viewport sizes
6. **Add Playwright screenshot** test if applicable
7. **Integrate** into parent layout only after isolation validation

**Never skip Storybook.** If a component doesn't have a story, it's not ready for integration.

---

# Unique ID Strategy (PixiJS)

PixiJS v8 supports `label` on all display objects. This is the equivalent of `data-testid`:

- `CardSprite` → `label: "card-{suit}-{rank}"` (e.g., `"card-hearts-ace"`)
- `HandDisplay` → `label: "hand-{playerPosition}"` (e.g., `"hand-0"`)
- `PlayerInfo` → `label: "player-info-{position}"`
- `TrickDisplay` → `label: "trick-display"`
- `ScorePanel` → `label: "score-panel"`
- `TrumpIndicator` → `label: "trump-indicator"`
- `BiddingPanel` → `label: "bidding-panel"`

Playwright can query PixiJS elements by traversing the `Application.stage` children using these labels.

**Rule**: No display object without a label. No anonymous containers.

---

# Interaction Zones

```
┌───────────────────────────────────────────────────┐
│              READ-ONLY ZONE                        │  Top 18%
│  Partner cards · Partner avatar                    │
├────────┬──────────────────────────────┬────────────┤
│        │        VIEWING ZONE          │            │  Middle 54%
│  LEFT  │  Trick area · Turn indicator │   RIGHT    │
│  15%   │  Score HUD · Trump indicator │    15%     │
│  Opp.  │                              │    Opp.    │
├────────┴──────────────────────────────┴────────────┤
│            INTERACTION ZONE                        │  Bottom 28%
│  Player's hand (wide card fan)                     │
│  Bidding buttons · Confirmation controls           │
└───────────────────────────────────────────────────┘
```

All tappable elements must be in the bottom 28% (thumb-reachable in landscape grip). Information-only elements go to the top. The middle zone is the largest — the visual focal point for trick play.

---

# Responsive Breakpoints

Breakpoints are determined by the **shortest viewport dimension** (the constraining axis), making them orientation-agnostic. Zone ratios are orientation-dependent — landscape uses landscape-optimized ratios, portrait uses portrait-optimized ratios.

| Breakpoint   | Shortest Dimension | Layout Adjustments                               |
| ------------ | ------------------ | ------------------------------------------------ |
| **Compact**  | < 375px            | Reduced card sizes, tighter fan overlap          |
| **Standard** | 375–430px          | Default layout (design baseline: 844x390)        |
| **Expanded** | 431–600px          | Slightly larger cards, more fan spread           |
| **Medium**   | 601–900px          | Larger cards, more spacing, visible card details |
| **Large**    | > 900px            | Side-by-side info panels, wider trick area       |

**Design resolution**: 844x390 (iPhone 14 landscape). All layouts defined relative to this baseline and scaled proportionally.

---

# Storybook Configuration

If using `@pixi/storybook-vite`:

```
.storybook/
  main.ts          → framework: @pixi/storybook-vite
  preview.ts       → default background, resolution, pixi config

packages/ui/src/
  components/
    card/
      CardSprite.ts
      CardSprite.stories.ts
    hand/
      HandDisplay.ts
      HandDisplay.stories.ts
    table/
      TableLayout.ts
      TableLayout.stories.ts
    ...
```

**Fallback** (if @pixi/storybook-vite causes friction): lightweight dev harness as a separate Vite entry point with a scene selector page.

---

# What This Manifesto Does NOT Cover

- **Game rules**: See [GAME_RULES.md](GAME_RULES.md)
- **Core engine architecture**: See [MANIFESTO.md](MANIFESTO.md)
- **Review protocol**: See [REVIEW_PROTOCOL.md](REVIEW_PROTOCOL.md)
- **Iteration details**: See [iterations/](iterations/)
- **Sound/audio**: Deferred. Not in scope for the UI foundation iterations.
- **Multiplayer/network**: Deferred. Current scope is local play (1 human + 3 AI).
- **Localization**: Deferred. English-first, with structure to support i18n later.

---

# PO Enforcement Rules

1. **No component without a Storybook story.** Period.
2. **No hardcoded visual values.** All colors, fonts, spacing, and timing from the theme module.
3. **No layout magic numbers.** All positions computed from viewport dimensions and design tokens.
4. **No animation without a pure sequence description.** `@belote/animation` describes it, `@belote/ui` executes it.
5. **No integration before isolation.** Component works alone in Storybook before joining a layout.
6. **No canvas-dependent unit tests.** Layout math and state logic are pure functions tested with Vitest.
7. **One component per iteration.** No batching visual features.
