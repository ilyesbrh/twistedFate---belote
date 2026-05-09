# Platform refactor plan — v2

> **Status:** counter-proposal to `PLATFORM_REFACTOR_PLAN.html`.
> **Mentality:** each game is its own isolated package. Games do **not**
> share engine code, parametrized base classes, or rules-engine
> generics. They share _style guidelines_ (a markdown convention
> document) and _horizontal infrastructure_ (auth, lobby, theme,
> wire-envelope, db). Duplication of game logic is acceptable and
> expected.
> **Date drafted:** 2026-05-09.

---

## 0. Why a v2

`PLATFORM_REFACTOR_PLAN.html` is well-presented but misframes the
problem. Three concrete issues:

| #   | Issue                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Evidence                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Wrong V1 scope.** The deck designs for four trick-takers (Belote / Simple Belote / Bigger Wins / Coinche), all 32-card 2v2. The Vision's actual roadmap is Belote → Coinche → **Rami** → **Uno** → **Skyjo**. Three of those are not trick-takers, have variable decks, and have variable seat counts — exactly what the deck "explicitly skips" in V1.                                                                                                                            | `docs/VISION.md` table at line 53; deck slide 2                                                                           |
| 2   | **Coupling diagnosis is wrong in two directions.** The deck overstates the protocol leak — `public_state` and `private_state.hand` are already typed as `Record<string, unknown>` / `unknown[]`, so the wire is mostly game-agnostic already. It understates the session/UI leak — `GameSession` directly calls `createDeck` / `createRound` / `createSuitBid`, and 37 UI files contain 359 Belote-specific symbol references. The "small extract" framing on slide 6 is misleading. | `packages/protocol/src/index.ts` lines 85-94; `packages/app/src/session.ts` lines 195-225; grep across `packages/ui/src/` |
| 3   | **The "GamePlugin\<S, A, E\>" interface is premature parametrization.** It couples future games to a single engine shape, costs us generics tax forever, and gets stress-tested only on near-clones. The Vision's actual second-tier games (Rami, Uno, Skyjo) won't fit a trick-taker-shaped abstraction anyway.                                                                                                                                                                     | Deck slide 5                                                                                                              |

Plus: the project's own Vision (`docs/VISION.md`, line 277) literally
says **"ship Belote fully, then expand. No half-built multi-game
skeleton."** The deck proposes a multi-game skeleton.

---

## 1. Principle

> **Games are isolated packages. They share infrastructure, not
> engines. Style guidelines, not base classes. Duplication is the
> right answer until 3+ games make a pattern undeniable.**

Three corollaries:

1. **No parametrized engine.** No `GamePlugin<S, A, E>`, no `RuleSet`
   function-pointer table, no shared `Round` / `Game` types across
   games. Belote's `Round` is Belote's. Coinche's `Round` is Coinche's.
   They are not the same type with a `variant` flag.
2. **No `variant` flags in shared code.** A `variant: "belote" | "coinche"`
   parameter on `calculateRoundScore` _is_ coupling. We refuse it.
3. **Shared = strictly horizontal infrastructure.** Auth, identity,
   friends, match history, lobby chrome, theme tokens, server gateway,
   protocol envelope, db connection. Nothing that touches cards, hands,
   tricks, melds, scoring, or rules.

Costs we accept:

- ~80% of Coinche's bidding code will look like Belote's. We duplicate
  it. The cost of duplicate bidding code is much lower than the cost
  of a wrong shared abstraction.
- ~60% of Coinche's UI components will look like Belote's. We duplicate
  them. New `@coinche/ui` package, copies adapted from `@belote/ui`,
  then specialised.

When extraction does happen (Phase 4, after 3 games), it happens at
**genuinely shared** code — not at code that is "morally similar".

---

## 2. What we know about the codebase (ground truth)

Verified by reading source, not the deck.

### Already game-agnostic (no work needed)

- **Protocol state envelopes** — `public_state` and `private_state.hand`
  are `Record<string, unknown>` / `unknown[]`. The wire already carries
  arbitrary game state. (`packages/protocol/src/index.ts:85-94`.)
- **Auth, friends, history, profiles, identity** — independent infra,
  no Belote knowledge.
- **Lobby chrome, MenuFelt, watermarks, design tokens, PWA shell,
  install prompt, chat, avatars** — game-agnostic UI.
- **Gateway, room scaffolding, matchmaking queue** — generic plumbing
  modulo the action types they relay.

### Belote-shaped but small (rename, ~150 LOC)

- `protocol/index.ts` — `place_bid` / `play_card` client messages,
  `WireBid`, `BID_VALUES_WIRE`. Surface: ~30 lines.
- `app/commands.ts` — `PlaceBidCommand`, `PlayCardCommand`. Surface:
  ~30 lines.
- `server/room.ts` — `RoomPhase = "lobby"|"bidding"|"playing"|"round_complete"|"game_complete"`. Surface: 1 type alias + ~10 callsites.

### Belote-shaped and **deeply** coupled (the deck under-counts this)

- `app/session.ts` — directly calls `createDeck`, `shuffleDeck`,
  `createRound`, `createPassBid` / `createSuitBid` / `createCoincheBid`
  / `createSurcoincheBid`. The session _is_ a Belote orchestrator.
- `ui/hooks/useGameSession.ts` (526 lines) — Belote presentation
  logic. 70 Belote symbol references.
- `ui/online/useOnlineGameSession.ts` (662 lines) — Belote-aware
  decoder. 73 Belote symbol references.
- `ui/messages/gameMessages.ts` — switches on Belote events directly.

Plus: 37 UI files reference Belote-specific symbols (359 occurrences
total).

This calibrates two things:

1. The protocol layer needs only a small rename to become game-neutral.
2. The session and UI layers are so Belote-coupled that _renaming
   `@belote/app` to `@cards/session` would be lying about what's in it._
   We don't rename. We accept those packages stay Belote-specific
   forever, and Coinche/Rami/Uno get their own equivalents.

### The numbers that matter

- 705 / 705 tests passing. 188 lint baseline.
- 7 packages already: `core`, `app`, `animation`, `ui`, `protocol`,
  `server`, `db`.
- Iteration cadence: 1 surgical fix or 1 feature with ~25-35 tests.
  ~1 day per iteration is realistic.

---

## 3. The plan

Five phases. ~12-16 iterations total. Every phase ships value to the
user — not just to the architecture.

### Phase 0 — Make the shared/game-specific split honest (3-4 iterations)

The protocol package and the matches schema are the only places where
"shared" code currently has Belote-specific symbols leaking through.
Fix that, write the guideline doc, no other refactor.

**Iteration P0-1: protocol becomes game-neutral.**

- New `ClientMessage` branch: `{ type: "game_action"; action: unknown }`.
  The server forwards `action` opaquely to the room-owned engine.
- Move `WireBid` and `BID_VALUES_WIRE` **out** of `@belote/protocol`
  into a Belote-side wire-types module (e.g.
  `packages/app/src/wire/belote-wire.ts`). `@belote/protocol` stops
  knowing what a "bid" is.
- Keep `place_bid` / `play_card` as **legacy aliases** that decode
  server-side into the new envelope. Deprecation comment, sunset
  window of 2 deploys.
- `RoomPhase` becomes `"lobby" | "active" | "completed"`. Belote's
  bidding/playing granularity moves into the Belote-side public_state
  payload (where it already lives).

Tests: ~10 added. 705/705 stays green.

**Iteration P0-2: add `game_id` column to match-history.**

- Migration: `ALTER TABLE matches ADD COLUMN game_id TEXT NOT NULL DEFAULT 'belote'`.
- Persistence layer reads/writes the column. Match-history query gets
  a `WHERE game_id = ?` filter.

Tests: ~5 added.

**Iteration P0-3: write `docs/GAME_PACKAGE_GUIDELINE.md`.**

This is the **load-bearing artefact** of v2. The guideline replaces a
shared base class with a _shared template_. Every game package follows
the same shape — by convention, not by dependency. Devs copy-paste
between games freely.

Contents (sketched):

```
docs/GAME_PACKAGE_GUIDELINE.md

A "game package" is a sibling of @belote/* — it owns its rules engine,
its UI components, and its wire-types. It MUST follow this template:

  packages/<game>/core/
    src/
      models/
        card.ts             — game-specific card type (or re-export shared)
        round.ts            — game-specific Round
        scoring.ts          — game-specific scoring
        ai.ts               — game-specific AI
      session.ts            — game-specific session orchestrator
      commands.ts           — game-specific commands
      events.ts             — game-specific events
      wire/                 — game-specific wire types (decoded from `game_action`)
      index.ts              — barrel
    __tests__/
      <module>.test.ts

  packages/<game>/ui/
    src/
      components/<X>/<X>.tsx + <X>.module.css
      hooks/use<Game>Session.ts
      online/use<Game>OnlineSession.ts
      messages/<game>Messages.ts
      index.ts
    __tests__/

  packages/<game>/wire-types/   — only if shared with server (else under core/)

Naming, layering, TDD, barrel-export style: identical to @belote/*.
Do NOT import from another game's package. Ever.
Do NOT add yourself to a shared base class. There is no shared base class.

When you start a new game, copy the @belote/* packages, find-replace
the name, and start specialising. The first ~80% will look almost
identical. That's expected. The remaining ~20% is the actual game.
```

This document IS the platform.

**Iteration P0-4: ESLint boundary rule.**

A flat-config ESLint rule that forbids cross-game imports:

```js
{
  files: ["packages/<game>/**/*.ts*"],
  rules: {
    "no-restricted-imports": ["error", {
      patterns: [
        { group: ["@coinche/*", "@rami/*"], message: "Game packages cannot import each other." },
      ],
    }],
  },
}
```

Mirror rule for shared packages: `@cards/*` (when it exists) cannot
import `@<game>/*`. Catch the violation at lint time, not at review.

**Phase 0 exit gate:**

- `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check` clean.
- `pnpm visual` baselines unchanged.
- `@belote/protocol` no longer mentions `Bid` anywhere in its source.
- `docs/GAME_PACKAGE_GUIDELINE.md` exists and is reviewed.
- Live online Belote game still completes end-to-end.

**What we did NOT do in Phase 0:** introduce any shared engine, any
generics, any `GamePlugin` interface, any base class, any `variant`
flag. Nothing.

---

### Phase 1 — Coinche as a fully parallel game (4-5 iterations)

Following the guideline: copy `@belote/*` into `@coinche/*`, find-replace
the name, then specialise.

**Iteration P1-1: scaffold `@coinche/core`.**

- `packages/coinche/core/` created from a copy of `packages/core/`
  (Belote's). Find-replace `Belote` → `Coinche` in identifiers; rename
  package; commit as a clean baseline.
- All Belote tests for the engine become Coinche tests, still passing
  (the code is identical so far — that's the point of the snapshot).
- Specialise Coinche scoring: drop `belote/rebelote` (or keep — PO
  call), keep coinche/surcoinche multipliers, define the failure-side
  scoring per Coinche conventions.
- Diff size at end: maybe 200 lines actually changed; the rest is
  duplicated and that's accepted.

**Iteration P1-2: scaffold `@coinche/app`.**

- Same recipe for the session/orchestrator package.
- `CoincheSession` is its own class. It does not inherit from
  `BeloteSession`. There is no `GameSession` base.

**Iteration P1-3: scaffold `@coinche/ui`.**

- Copy game-specific UI components: `BidPanel`, `RoundSummary`,
  `useGameSession`, `useOnlineGameSession`, `gameMessages`.
- Specialise BidPanel for Coinche bidding model.
- Specialise messages/copy.
- The shell components (`MenuFelt`, `IdentityChip`, `ChatPanel`,
  `PlayerAvatar`, `InstallPrompt`) stay in `@belote/ui` for now — they
  are not Belote-specific despite their package name. We rename later
  in Phase 4.
- For now, `@coinche/ui` imports the shell components from `@belote/ui`.
  Yes, this is upside-down naming. We accept it for one phase. Phase 4
  fixes it.

**Iteration P1-4: server-side game registry.**

- A small registry maps `gameId` → engine constructor. Server reads
  `gameId` from room state; routes `game_action` to the right engine.
- No generics. The registry is a `Map<GameId, GameFactory>` where
  `GameFactory` is a concrete type-erased function (`(roomState: unknown) => Engine`).
- Each game registers itself at startup.

**Iteration P1-5: lobby game-picker + end-to-end.**

- Lobby gains a "pick a game" step before room creation. Belote / Coinche.
- Match history rows for Coinche carry `game_id = 'coinche'`.
- 4-agent live test for Coinche (mirror the Belote one).
- Visual regression sweep.

**Phase 1 exit gate:**

- Coinche playable, locally and online.
- 705 + ~80 = ~785 tests green (Coinche brings its own test suite).
- **No shared rules code between Belote and Coinche.** The two engines
  do not import from each other.
- `pnpm visual` shows no diff for Belote screens.
- Match-history correctly partitions by `game_id`.

**Stop conditions:**

- If during P1-1 the Coinche scoring rules turn out to be radically
  different from Belote (so different that the find-replace baseline
  doesn't help), pause and let the PO disambiguate against
  `GAME_RULES.md` TBDs before continuing.
- If `@coinche/ui` ends up being a near-complete clone of `@belote/ui`
  (no specialisation), that means we don't have enough Coinche-specific
  UX yet — fold it back into `@belote/ui` under a `coinche/` subfolder
  rather than carrying a duplicate package that doesn't earn its keep.

---

### Phase 2 — Live Coinche to users (1-2 iterations)

**Iteration P2-1: ship Coinche behind a feature flag.**

- Lobby game-picker is hidden behind a flag for the first deploy.
- Internal users (us) play it for a week. File bugs.

**Iteration P2-2: turn the flag on.**

- Public Coinche.
- Match-history UI gains a per-game filter.

**Phase 2 exit gate:** real users playing Coinche.

---

### Phase 3 — Rami as another fully parallel game (5-7 iterations)

Rami is the structurally different game. It is **not** a trick-taker.
It uses a 52+jokers deck. It supports 2-6 players. It has melds,
discard pile, stock pile, drawing.

The deck thought "Bigger Wins" was the proof game. It isn't — it's
another trick-taker. **Rami is the proof game.** If our isolation
discipline works for Rami, it works for anything.

Approach: another fresh package set, following the guideline.

**Iterations P3-1 → P3-N (sized as you go):**

1. Scaffold `@rami/core`. Domain models from scratch (Rami doesn't
   share enough with Belote for a copy-baseline to help). Card type
   may re-export `@belote/core`'s `Card` type _if it happens to be
   identical_; otherwise its own.
2. `@rami/app` — session, commands, events. Rami's commands are
   `meld`, `discard`, `draw_stock`, `draw_discard` — completely
   different from Belote's. The session class does not inherit from
   anything.
3. `@rami/ui` — its own table layout (`RamiBoard` with discard pile
   and stock pile), its own hand display (drag-to-meld interactions),
   its own AI panel. The shell components (`IdentityChip`, `ChatPanel`,
   `MenuFelt`) are imported as-is. **The shell that survives Rami is
   what was actually shareable.**
4. AI: combinatorial meld search. Its own world.
5. Lobby game-picker extends to {Belote, Coinche, Rami}.
6. Match-history rows for Rami.
7. Live N-agent test for Rami (2 players minimum, 6 max).

**Phase 3 exit gate:**

- Rami playable end-to-end.
- The shell components used by all three games (`IdentityChip`,
  `ChatPanel`, `MenuFelt`, theme tokens, auth, friends, history,
  install prompt, gateway, matchmaking queue) are clearly identifiable
  as game-agnostic.
- Whatever code did _not_ survive untouched into Rami's UI is, by
  definition, game-specific and stays in `@belote/ui` / `@coinche/ui`.

**Off-ramp:** if Rami implementation is so different from
Belote/Coinche that almost nothing of `@belote/ui`'s shell components
is reused either, we discover that the platform = "shared UI shell"
was overstated, and Rami ships with its own UI shell entirely. That's
an honest outcome and should be reported as such.

---

### §3.5 The server / engine boundary (the only interface)

The server (`@belote/server` today, eventually `@cards/server-shell`) is
**shared infrastructure** — never duplicated per game. Auth, lobby,
matchmaking, friends, history, gateway, room scaffolding, websocket
upgrade: one of each, for all games.

What gets duplicated is the **engine** — the per-game state machine,
rules, scoring, AI, session orchestration. Each game owns its own.

The interface between shared server and per-game engine is the
narrowest possible runtime seam. **Concrete types, no generics, all
opaque payloads:**

```ts
// In the shared server package — concrete, non-generic
export interface EngineHandle {
  apply(action: unknown): { events: readonly unknown[] };
  getPublicState(): unknown;
  getPrivateState(seat: Seat): {
    hand: readonly unknown[];
    legalActionIds: readonly string[];
  };
  isComplete(): boolean;
  getCompletionInfo(): unknown; // for match-history persistence
}

export type EngineFactory = (config: unknown) => EngineHandle;

// One small registry, populated at server startup
export const engines = new Map<GameId, EngineFactory>();
```

Each game's `@<game>/app` package exports an adapter that conforms to
`EngineHandle` and registers itself:

```ts
// In packages/belote/app/src/server-adapter.ts
import { engines } from "@cards/server-shell";
import { BeloteSession } from "./session.js";

engines.set("belote", (config: unknown) => {
  const session = new BeloteSession(parseConfig(config));
  return {
    apply: (action) => session.dispatch(parseBeloteAction(action)),
    getPublicState: () => serializeBeloteState(session),
    getPrivateState: (seat) => session.getHandFor(seat),
    isComplete: () => session.state === "game_completed",
    getCompletionInfo: () => session.getMatchHistoryRow(),
  };
});
```

The Room calls `engine.apply(action)` and broadcasts the resulting
`getPublicState()` blob as `public_state`. **The Room never knows what
a "bid" or a "meld" is.** The wire stays opaque (`game_action: unknown`,
`public_state: Record<string, unknown>`), and so does the
server's view of the game.

This is **not** the deck's `GamePlugin<S, A, E>`:

| Deck's GamePlugin                                                                        | This boundary                                              |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `<S, A, E>` generics propagate through Room, Session, persistence                        | All `unknown` at the boundary; types live inside each game |
| Shared base class / parametrized engine                                                  | Each game owns its concrete `<Game>Session` class          |
| 4 collaborator interfaces (RulesEngine, AiPolicy, PluginUiContributions, PluginProtocol) | One interface, 5 methods                                   |
| TS error messages span game + shell                                                      | TS error messages stay inside one game package             |

The server treats engines as black boxes that consume serialisable
actions and emit serialisable state. The price: a few `unknown`-typed
parameters at the registry boundary. The benefit: zero generic
contagion, zero shared-engine coupling, and game packages that can be
written, tested, and reasoned about in complete isolation.

---

### Phase 4 — Extract genuinely shared infra (2-3 iterations)

Only after Rami ships do we know what was actually shared. Now extract
it into properly-named packages.

**Iteration P4-1: rename and split.**

- Move shell components out of `@belote/ui` into `@cards/ui-shell`.
  Identifiable inventory: `IdentityChip`, `ChatPanel`, `MenuFelt`,
  `PlayerAvatar` (probably), `InstallPrompt`, theme tokens.
- Move auth/friends/history out of `@belote/ui` into `@cards/identity`
  (or similar — name based on what's actually in there).
- `@belote/protocol` stays as-is, but rename to `@cards/protocol` since
  Phase 0 made it game-neutral.
- `@belote/server`'s gateway scaffolding moves to `@cards/server-shell`,
  leaving `@belote/server` empty (delete it) since the Belote-specific
  server logic is in the engine, not the gateway.

**Iteration P4-2: update imports across all game packages.**

- `@belote/ui` and `@coinche/ui` and `@rami/ui` all import shell from
  `@cards/ui-shell` instead of from each other.
- The "upside-down naming" from Phase 1 is gone.

**Iteration P4-3: doc updates.**

- `VISION.md` updated to reflect what was actually built and what was
  discovered about shareability.
- `GAME_PACKAGE_GUIDELINE.md` updated with lessons from three games.

**Phase 4 exit gate:**

- Imports clean.
- Shared packages contain only code that's actually used by ≥2 games.
- ESLint boundary rule still passing.

> **Note (added 2026-05-09): URL-based architecture.** The shell-vs-game
> boundary is realised through **URL routing**, not through an
> `App.tsx`-level switch on `gameId`. Each game ships at its own URL
> sub-tree (`/belote/tunisian/*`, `/belote/coinche/*`, `/rami/*`) and
> exports a single `RouteTree` component that the shell mounts via
> `lazy()` for per-game bundle splitting. The shell owns `/`,
> `/auth/*`, `/profile`, `/friends`, `/history`. See
> `docs/GAME_PACKAGE_GUIDELINE.md` §6 for the full contract and
> `.claude/skills/shell-router-integration/SKILL.md` for the
> mount procedure. The router library is `wouter` (~2 KB, hooks-first).
>
> Phase 0 should also include introducing `wouter` and refactoring
> the existing `packages/ui` so the current Tunisian Belote game lives
> at `/belote/tunisian/*`. This is the load-bearing change that makes
> every subsequent game a simple route-mount instead of a navigation
> rewrite.

---

## 4. Decisions, locked

| #   | Decision                                                                                                       | Why                                                                                                                                                                 |
| --- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Plugin loading: build-time imports + a small per-game registration call.**                                   | No runtime federation. Each game's package self-registers in a small registry at server startup.                                                                    |
| 2   | **Naming: `@belote/*` stays until Phase 4. New games are `@<game>/*` from day one.**                           | We don't rename until we know what to rename to. Phase 0–3 tolerate the upside-down naming.                                                                         |
| 3   | **Variant boundary: there is no variant.**                                                                     | A "Simple Belote" is either its own `@simple-belote/*` package (full isolation), or — if we don't want to maintain it — it's not built. No flags on `@belote/core`. |
| 4   | **Persistence: `ALTER TABLE matches ADD COLUMN game_id TEXT NOT NULL DEFAULT 'belote'`. One-shot in Phase 0.** | Small SQLite table. Default value backfills correctly.                                                                                                              |
| 5   | **Proof games: Coinche (Phase 1, copy-and-specialise), Rami (Phase 3, structurally different).**               | Coinche proves the duplication discipline. Rami proves the shell.                                                                                                   |
| 6   | **Style is a doc, not a base class.** `GAME_PACKAGE_GUIDELINE.md` is the platform.                             | Conventions are enforced by humans + lint, not by `extends GameBase`.                                                                                               |

---

## 5. Risks (the real ones)

| #   | Risk                                                                                                            | Mitigation                                                                                                                                                                                                                                                                                                                                     |
| --- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | **Vision drifts.** By Phase 2 the next game might be Bridge, not Rami.                                          | Phase 0–2 are vision-agnostic. Only Phase 3 commits to a specific second-tier game. Maximum re-do exposure: Phase 3 alone.                                                                                                                                                                                                                     |
| R2  | **Duplication rots.** Belote and Coinche both fix the same bug independently, drift apart.                      | Two safeguards: (a) GAME*PACKAGE_GUIDELINE.md asks devs to grep across game packages when fixing a same-shape bug; (b) extract genuinely shared utilities (e.g. card-id generation, deck-shuffling primitive) into `@cards/primitives` only if the \_exact* same util appears unchanged in ≥3 games. Two is a coincidence; three is a pattern. |
| R3  | **Test rot.** TDD discipline must be maintained inside each game package independently.                         | Each game package owns its own `__tests__/` and its own coverage. Cross-game test suites do not exist (there's nothing to share).                                                                                                                                                                                                              |
| R4  | **Live users on prod hit a half-migrated wire.**                                                                | Phase 0 keeps `place_bid` / `play_card` as legacy aliases. New envelope is added but not mandatory. Sunset window: 2 deploys after envelope is the default for new clients.                                                                                                                                                                    |
| R5  | **Shell components in `@belote/ui` block Coinche development** during the upside-down-naming window of Phase 1. | Phase 1 is short (4-5 iterations). If it stalls past 6 iterations, accelerate Phase 4 (rename) and pause Coinche.                                                                                                                                                                                                                              |
| R6  | **Sunk-cost lock-in.**                                                                                          | Each phase has explicit STOP conditions. Phase 1 can fold `@coinche/ui` back into `@belote/ui` if specialisation is too thin. Phase 3 has an explicit "abandon shell" off-ramp.                                                                                                                                                                |
| R7  | **Visual regressions during Phase 4 rename.**                                                                   | `pnpm visual` baseline sweep before and after. Re-bless intentionally.                                                                                                                                                                                                                                                                         |

---

## 6. What we explicitly do not build

- **`GamePlugin<S, A, E>` interface** — ever. If a future game can't be
  expressed with the duplication-first model, we revisit. Not before.
- **A `RuleSet` / `Engine` base class or function-pointer table** —
  ever. Each game owns a concrete `<Game>Session` class.
- **`variant` flags on shared types** — ever.
- **`@cards/trick-taking`** — even if we ship 2 trick-takers, the
  shared trick rules stay duplicated until a third trick-taker
  (Tarot? Bridge? Spades?) confirms the pattern.
- **`DeckSpec` / `SeatingSpec` / `RankOrderSpec`** — these are types
  that try to parametrise something that should just be hardcoded per
  game.
- **Plugin registry, plugin loader, federated module loading** —
  not until we have a real reason (probably never).
- **Cross-game ELO / leaderboard primitives** — different scoring
  scales make this nonsensical. Per-game leaderboards work today via
  `WHERE game_id = ?`.

---

## 7. What ships, when, to whom

| Phase | What lands                                              | User-visible                              |
| ----- | ------------------------------------------------------- | ----------------------------------------- |
| 0     | Wire rename, `game_id` column, guideline doc, lint rule | Nothing.                                  |
| 1     | `@coinche/*` packages                                   | Behind a flag at end of phase.            |
| 2     | Coinche turned on                                       | **First user-visible win.** Coinche live. |
| 3     | `@rami/*` packages, Rami live                           | **Second user-visible win.** Rami live.   |
| 4     | Rename `@belote/*` shell parts to `@cards/*`            | Nothing. Engineering hygiene.             |

**Total user-visible deliverables: 2 (Coinche, Rami).** Sized at
~12-16 iterations against this project's cadence ≈ 3-4 weeks of
dedicated work. The original deck plan was 27 iterations and shipped
two near-clones (Simple Belote, Bigger Wins).

---

## 8. The "shall we?" question

This plan assumes the user/PO actually wants to ship Coinche and Rami.
Before any code:

1. **Are Coinche and Rami both still on the roadmap?** If only Coinche
   ships ever, do Phase 0 + Phase 1 + Phase 2, stop. Don't do
   Phase 3-4.
2. **Who is the PO for Coinche rules?** `GAME_RULES.md:163-164` marks
   "All-trumps / No-trumps / Capot / Generale" as **deferred**. Coinche
   forces decisions on those.
3. **Is the live-user wire-compat budget acceptable?** Phase 0
   introduces `game_action` envelope alongside `place_bid` / `play_card`.
   Sunset window is ~2 deploys (~2 weeks). OK?
4. **Match-history per-game schema.** Final-score columns specific to
   Belote (contract value, trump suit) become NULL for Rami. OK with
   sparse columns, or do we move final-score-payload to a JSON column
   keyed by `game_id`?
5. **Is the upside-down naming acceptable for one phase?** During
   Phase 1, `@coinche/ui` will import shell components from
   `@belote/ui`. Phase 4 fixes it. Until then it looks weird in
   imports. Acceptable?

---

## 9. Reading order for whoever inherits this

1. `docs/VISION.md` — what TwistedFate is supposed to be.
2. `docs/MANIFESTO.md` — the engineering rules of the road.
3. `docs/PLAYBOOK.md` — how iterations work here.
4. `docs/PLATFORM_REFACTOR_PLAN.html` — original (good
   presentation, wrong scope, premature parametrization).
5. **This document** (`PLATFORM_REFACTOR_PLAN_v2.md`).
6. `docs/GAME_PACKAGE_GUIDELINE.md` — written in Phase 0, the
   load-bearing artefact.
7. `docs/iterations/iteration-018-plan.md` — exemplar of the
   iteration cadence we're sizing against.

---

_Drafted in opposition to the original plan. The disagreement is
philosophical — anticipate vs extract, parametrize vs duplicate — and
cannot be averaged. If both this and the original survive review, pick
one and burn the other._
