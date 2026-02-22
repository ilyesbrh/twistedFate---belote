# UI Component Tracker

Progress tracker for UI component iterations. Each component follows the manifesto workflow: TDD (pure math tests) → Implementation → Storybook story → Visual verify → Integration.

Reference: [UI_LAYOUT_STRUCTURE.md](../UI_LAYOUT_STRUCTURE.md)

---

| Iteration | Component      | Zone    | Status | Files                                                 |
| --------- | -------------- | ------- | ------ | ----------------------------------------------------- |
| 12        | HandDisplay    | Bottom  | Done   | hand-layout.ts, hand-display.ts, hand-display.stories |
| 13        | OpponentHand   | Top/L/R | Done   | opponent-layout.ts, opponent-hand.ts, stories         |
| 14        | TrickDisplay   | Center  | Done   | trick-layout.ts, trick-display.ts, stories            |
| 15        | PlayerInfo     | All     | Done   | player-info.ts, stories                               |
| 16        | ScorePanel     | Top     | Done   | score-panel.ts, stories                               |
| 17        | TrumpIndicator | Center  | Done   | trump-indicator.ts, stories                           |
| 18        | TurnIndicator  | Center  | Done   | turn-indicator.ts, stories                            |
| 19        | BiddingPanel   | Bottom  | Done   | bidding-layout.ts, bidding-panel.ts, stories          |
| 20        | TableLayout    | Root    | Done   | table-layout.ts, stories                              |
| 21        | GameRenderer   | All     | Done   | game-view.ts, game-renderer.ts, stories               |
| 22        | GameController | Bridge  | Done   | game-controller.ts, tests                             |
| 23        | Input Wiring   | Bridge  | Done   | hand-display.ts, bidding-panel.ts, game-controller.ts |
| 24        | Game Bootstrap | All     | Done   | game-renderer.ts, game-demo.scene.ts                  |
| 25        | Phase Gating   | Bridge  | Done   | game-controller.ts, game-renderer.ts                  |
| 26        | Playable Cards | Bottom  | Done   | game-view.ts, hand-display.ts                         |
