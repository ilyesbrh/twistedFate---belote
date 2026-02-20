# Iteration 9 Report: App Layer / Command-Event Orchestration

**Date**: 2026-02-20
**Status**: Complete

## Goal

Implement the application layer (`@belote/app`) providing command/event orchestration between the core domain engine and future UI. This layer introduces a GameSession orchestrator that manages game lifecycle, dispatches commands, emits events, and automatically drives AI player turns.

## Scope

1. **Command types**: `StartGameCommand`, `StartRoundCommand`, `PlaceBidCommand`, `PlayCardCommand` with factory functions
2. **Event types**: 9 event types covering the full game lifecycle (`GameStarted`, `RoundStarted`, `BidPlaced`, `BiddingCompleted`, `CardPlayed`, `TrickCompleted`, `RoundCompleted`, `RoundCancelled`, `GameCompleted`)
3. **GameSession orchestrator**: Stateful session class managing game flow, AI auto-play, and event emission
4. **Package setup**: `@belote/app` with vitest configuration, test infrastructure, and barrel exports

## Tests Written (54 test cases, written before implementation)

### commands.test.ts (13 tests)

- **createStartGameCommand** (4): Type, player names, target score, frozen object
- **createStartRoundCommand** (2): Type, frozen object
- **createPlaceBidCommand** (5): Pass bid, suit bid with value/suit, coinche, surcoinche, frozen object
- **createPlayCardCommand** (2): Type and card reference, frozen object

### session.test.ts (41 tests)

- **Constructor** (2): Initial idle state, null game/round/roundNumber
- **start_game** (6): State transition, target score, player names, teams, event emission, double-start guard
- **Event system** (3): Multiple listeners, unsubscribe, no-listener safety
- **start_round** (6): State transition, dealt cards, round number increment, event emission, state guard, dealer position
- **place_bid — all human** (7): Bid forwarding, event emission, playing transition, bidding_completed event, round_cancelled on all-pass, state guard, AI position guard
- **play_card — all human** (4): Card play, event emission, trick_completed after 4 cards, state guard
- **AI auto-play** (3): All-AI bidding, all-AI card play, full game auto-completion
- **Mixed human/AI** (2): AI auto-bid waiting for human, AI auto-card waiting for human
- **Round lifecycle** (3): Round restart, dealer advancement, score updates
- **Full game completion** (2): Game completed transition, post-completion guard
- **Event sequence integrity** (3): Correct event ordering, exactly 8 trick_completed per round, exactly 32 card_played per round

## Implementation Summary

### Files Created

- `packages/app/src/commands.ts` — 4 command types + 4 factory functions
- `packages/app/src/events.ts` — 9 event types + GameEventListener type
- `packages/app/src/session.ts` — GameSession class with full orchestration logic
- `packages/app/vitest.config.ts` — Test configuration
- `packages/app/__tests__/commands.test.ts` — 13 command tests
- `packages/app/__tests__/session.test.ts` — 41 session tests
- `docs/iterations/iteration-009-report.md` — This report

### Files Modified

- `packages/app/src/index.ts` — Barrel exports for commands, events, session
- `packages/app/package.json` — Added test scripts
- `packages/app/tsconfig.json` — Added test files to include

### Architecture

```
┌─────────────────────────────────────────────┐
│                   UI Layer                   │
│          (future: @belote/ui)                │
├─────────────────────────────────────────────┤
│              Application Layer               │
│               (@belote/app)                  │
│                                             │
│  Commands ──→ GameSession ──→ Events        │
│               │                             │
│               ├── Manages Game lifecycle     │
│               ├── Orchestrates Round flow    │
│               ├── Drives AI auto-play       │
│               └── Emits events for UI       │
├─────────────────────────────────────────────┤
│              Core Domain Engine              │
│               (@belote/core)                 │
│  Card · Player · Trick · Bid · Round · Game │
│  Scoring · AI Strategy                       │
└─────────────────────────────────────────────┘
```

### Key Types & API

```typescript
// Commands
type GameCommand = StartGameCommand | StartRoundCommand | PlaceBidCommand | PlayCardCommand;

// Events
type GameEvent =
  | GameStartedEvent
  | RoundStartedEvent
  | BidPlacedEvent
  | BiddingCompletedEvent
  | CardPlayedEvent
  | TrickCompletedEvent
  | RoundCompletedEvent
  | RoundCancelledEvent
  | GameCompletedEvent;

// Session
class GameSession {
  readonly state: SessionState;
  readonly game: Game | null;
  readonly currentRound: Round | null;
  readonly roundNumber: number;
  on(listener: GameEventListener): () => void; // Returns unsubscribe fn
  dispatch(command: GameCommand): void;
}

// Configuration
type PlayerType = "human" | "ai";
interface SessionConfig {
  playerTypes: [PlayerType, PlayerType, PlayerType, PlayerType];
  rng?: () => number;
  idGenerator?: IdGenerator;
}
```

### Command Flow

| Command       | Valid States                      | Side Effects                                                                                                   |
| ------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `start_game`  | `idle`                            | Creates game, emits `game_started`                                                                             |
| `start_round` | `game_started`, `round_completed` | Creates round, deals cards, emits `round_started`, triggers AI bidding                                         |
| `place_bid`   | `round_bidding`                   | Forwards bid, emits `bid_placed`, may trigger `bidding_completed`/`round_cancelled`, triggers AI               |
| `play_card`   | `round_playing`                   | Plays card, emits `card_played`, may trigger `trick_completed`/`round_completed`/`game_completed`, triggers AI |

### AI Auto-Play Behavior

- After each human action (bid or card play), the session checks if the next player is AI
- AI players automatically chain: bid → next AI bid → ... → stop at human
- AI card play chains similarly through entire tricks when all remaining players are AI
- A full all-AI game can run to completion with just `start_game` + repeated `start_round` commands

## Technical Decisions

| Decision                             | Choice                        | Rationale                                                                                                          |
| ------------------------------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Class-based GameSession              | Mutable internal state        | Session is inherently stateful; class encapsulates mutation cleanly while exposing immutable snapshots via getters |
| Synchronous event emission           | No async/queue                | Game logic is purely computational; async adds complexity without benefit at this stage                            |
| Command pattern (not direct methods) | Typed discriminated union     | Serializable, loggable, replay-friendly; enables undo/redo in future                                               |
| Events as typed union                | Discriminated union on `type` | Type-safe listeners can narrow events; extensible without breaking changes                                         |
| AI auto-play in session              | Not in separate layer         | Session is the natural orchestrator; keeps AI integration simple and testable                                      |
| Unsubscribe via returned function    | Not `.off(listener)`          | Simpler API, no reference equality concerns                                                                        |
| `_playSingleCard` extraction         | Shared by human + AI paths    | Prevents trick_completed double-emission bug; single source of truth for card play + event logic                   |

## Risks Identified

- GameSession uses recursion for AI auto-play chains (AI bid → afterBidding → processAiBids → ...). Deep recursion unlikely with 4 players but worth noting.
- No command validation beyond state checks — invalid card/bid data will throw from core domain (by design, fail-fast).
- No command history or replay support yet (deferred to future iteration if needed).

## Validation Results

- `pnpm test`: **448/448 passing** (394 core + 13 commands + 41 session)
- `pnpm run typecheck`: Clean
- `pnpm run lint`: Clean
- `pnpm run format:check`: Clean

## Next Iteration: N+1 (Iteration 10)

**UI Layer Foundation (TDD)**

- `@belote/ui` PixiJS setup
- Card rendering and table layout
- Basic interaction (tap to play)
- Integration with app layer commands/events

## Iteration N+2 Preview (Iteration 11)

**Animation Engine Foundation (TDD)**

- `@belote/animation` isolated animation modules
- Card movement, flip, and deal animations
- Animation queue for sequential playback
- Integration with UI layer
