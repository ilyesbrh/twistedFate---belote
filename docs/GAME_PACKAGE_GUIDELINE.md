# Game Package Guideline

> **The platform IS this guideline.**
>
> A "game package" is a sibling set of packages that together
> implement one card game. Games are isolated: no cross-game imports,
> no shared base classes, no parametrised engines. Convention does the
> work that a base class would do in a less disciplined codebase.
>
> When you start a new game, copy `@belote/*`, find-replace the name,
> and specialise. The first ~80% will look identical. That's expected.
> The remaining ~20% is the actual game.

---

## 1. Package layout

Every game ships as **three packages**, each with the same internal
shape:

```
packages/<game>/
├── core/                          # Pure domain — zero deps
│   ├── package.json               # name: "@<game>/core"
│   ├── tsconfig.json
│   ├── tsconfig.build.json
│   ├── src/
│   │   ├── models/
│   │   │   ├── card.ts            # Or re-export from @cards/primitives
│   │   │   ├── player.ts
│   │   │   ├── round.ts
│   │   │   ├── trick.ts           # Or whatever this game's mid-state is
│   │   │   ├── scoring.ts
│   │   │   ├── game.ts
│   │   │   └── index.ts           # Barrel
│   │   ├── ai/
│   │   │   ├── strategy.ts
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   └── index.ts
│   │   └── index.ts               # Top-level barrel
│   └── __tests__/
│       └── <module>.test.ts
│
├── app/                           # Session orchestration + server adapter
│   ├── package.json               # name: "@<game>/app"
│   ├── src/
│   │   ├── commands.ts            # <Game>Command discriminated union
│   │   ├── events.ts              # <Game>Event discriminated union
│   │   ├── session.ts             # <Game>Session class
│   │   ├── wire/
│   │   │   ├── actions.ts         # Wire-shape action types + decoders
│   │   │   └── state.ts           # Public/private state serialisers
│   │   ├── server-adapter.ts      # Implements EngineHandle, registers gameId
│   │   └── index.ts
│   └── __tests__/
│       └── <module>.test.ts
│
└── ui/                            # React components + hooks
    ├── package.json               # name: "@<game>/ui"
    ├── src/
    │   ├── RouteTree.tsx          # ★ THE shell entry point — see §6
    │   ├── components/
    │   │   └── <X>/
    │   │       ├── <X>.tsx
    │   │       └── <X>.module.css
    │   ├── hooks/
    │   │   └── use<Game>Session.ts
    │   ├── online/
    │   │   └── use<Game>OnlineSession.ts
    │   ├── messages/
    │   │   └── <game>Messages.ts
    │   ├── screens/               # one file per route under the game's basename
    │   │   ├── HomeScreen.tsx     # at /<basename>/
    │   │   ├── SoloScreen.tsx     # at /<basename>/solo
    │   │   ├── LobbyScreen.tsx    # at /<basename>/lobby/:code?
    │   │   ├── RandomScreen.tsx   # at /<basename>/random
    │   │   └── PlayScreen.tsx     # at /<basename>/play/:sessionId
    │   └── index.ts
    └── __tests__/
        └── <Component>.test.tsx
```

**Naming rules:**

- Package names: `@<game>/core`, `@<game>/app`, `@<game>/ui`. Lowercase,
  hyphenated for multi-word games (`@simple-belote/core`).
- File names: `kebab-case.ts`.
- Type names: `PascalCase`. Prefix with the game name when the type
  could collide with another game's: `BeloteRound`, `CoincheRound`.
  Use plain `Round` only inside one package.
- Class names: `<Game>Session` (e.g. `BeloteSession`, `CoincheSession`).
  No shared base.
- Command/event types: `<Game>Command`, `<Game>Event`.

---

## 2. Layer rules (per game)

Inherits from `MANIFESTO.md` §3 and Playbook §"Layer Rules":

| Layer | Package        | Can import                                                                          | Cannot import                                                                                               |
| ----- | -------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Core  | `@<game>/core` | Nothing (or `@cards/primitives` if it exists)                                       | `@cards/server-shell`, `@cards/ui-shell`, any `@<game>/app`, any `@<game>/ui`, **any other game's package** |
| App   | `@<game>/app`  | own `@<game>/core`, `@cards/server-shell` (for `EngineHandle` + registry types)     | own `@<game>/ui`, **any other game's package**                                                              |
| UI    | `@<game>/ui`   | own `@<game>/core` (types), own `@<game>/app`, `@cards/ui-shell`, `@cards/identity` | own server adapter implementation, **any other game's package**                                             |

**The single most important rule:** _No game package may import from
another game package._ Enforced by ESLint:

```js
// eslint.config.mjs
{
  files: ["packages/<game>/**/*.{ts,tsx}"],
  rules: {
    "no-restricted-imports": ["error", {
      patterns: [{
        group: ["@belote/*", "@coinche/*", "@rami/*", "@uno/*", "@skyjo/*"],
        message: "Game packages cannot import each other. Duplicate the code or extract to @cards/* (≥3-game evidence required).",
      }],
    }],
  },
}
```

The pattern list above must exclude the _current_ game (e.g. inside
`@coinche/*`, the lint config excludes `@coinche/*` from the deny
list). Use ESLint's `overrides` to scope the rule per-package.

---

## 3. Core package — what goes where

### `models/card.ts`

Game's card type. If the deck is a standard 32 / 52 / 78 deck and the
type is identical to another game's, you **may** re-export from
`@cards/primitives` once that package is justified by 3-game evidence.
Until then: define your own.

```ts
// packages/coinche/core/src/models/card.ts
export type Suit = "hearts" | "spades" | "diamonds" | "clubs";
export type Rank = "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";
export interface CoincheCard {
  readonly id: string;
  readonly suit: Suit;
  readonly rank: Rank;
}
```

### `models/round.ts`

Game's round state. **Always** name the type with the game prefix:
`BeloteRound`, `CoincheRound`. Never plain `Round` exported from a
package barrel.

### `models/scoring.ts`

Pure functions. `calculate<Game>RoundScore(...)`. No `variant`
parameter. If the math diverges from another game's, you write fresh
math.

### `ai/strategy.ts`

`choose<Game>Bid(...)`, `choose<Game>Card(...)`. Game-specific
heuristics. May share _primitive_ helpers (probability tables, RNG)
with `@cards/primitives` only when 3-game evidence exists.

---

## 4. App package — the server adapter

This is the load-bearing file. It implements `EngineHandle` (the
runtime seam from `PLATFORM_MANIFESTO.md` §2 Rule 4) and registers the
game with the server.

```ts
// packages/coinche/app/src/server-adapter.ts
import { engines, type EngineHandle, type Seat } from "@cards/server-shell";
import { CoincheSession } from "./session.js";
import { decodeCoincheAction } from "./wire/actions.js";
import { serializeCoinchePublicState, serializeCoinchePrivateState } from "./wire/state.js";

engines.set("coinche", (config: unknown): EngineHandle => {
  const session = new CoincheSession(parseConfig(config));

  return {
    apply: (action: unknown) => {
      const command = decodeCoincheAction(action);
      const events = session.dispatch(command);
      return { events };
    },

    getPublicState: () => serializeCoinchePublicState(session),

    getPrivateState: (seat: Seat) => ({
      hand: session.getHandFor(seat),
      legalActionIds: session.getLegalActionIdsFor(seat),
    }),

    isComplete: () => session.state === "game_completed",

    getCompletionInfo: () => session.getMatchHistoryRow(),
  };
});

function parseConfig(config: unknown): CoincheSessionConfig {
  // Validate + parse the opaque config the server passed us
  // ...
}
```

**Rules for the adapter:**

1. **All five methods.** No game ships without all five. The server
   relies on every method existing.
2. **Concrete payloads inside.** `unknown` only at the boundary —
   inside the adapter, decode immediately to typed values.
3. **Errors are exceptions.** If the action is malformed, throw. The
   server catches and emits a wire-level error.
4. **Pure-ish.** The adapter holds session state but does no I/O.
   Persistence goes through `getCompletionInfo()` returning a
   serialisable row that the server writes.
5. **One factory, one game.** Each `engines.set(...)` call registers
   exactly one `gameId`. If you need a "Simple Coinche" variant,
   register it as `engines.set("simple-coinche", ...)` with its own
   adapter — no flags.

### Adapter registration

The adapter file must be **imported** at server startup so the
`engines.set(...)` side-effect runs. Pattern:

```ts
// packages/server/src/index.ts (the shared server entry)
import "@belote/app/server-adapter"; // registers "belote"
import "@coinche/app/server-adapter"; // registers "coinche"
import "@rami/app/server-adapter"; // registers "rami"
// ... server starts
```

Side-effecting imports look unusual but they are the simplest
mechanism. No factory lookup, no plugin loader. Each game self-registers.

---

## 5. UI package — what's per-game vs shared

| Component                                                                       | Lives in                                              | Why                                                                                            |
| ------------------------------------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `RouteTree` (the game's URL sub-tree)                                           | **Per-game** (see §6)                                 | Each game owns its own routes under `/<family>/<variant>/*`                                    |
| `MenuFelt`, `IdentityChip`, `ChatPanel`, `InstallPrompt`, `PlayerAvatar` chrome | `@cards/ui-shell` (eventually) — `@belote/ui` for now | Game-agnostic                                                                                  |
| Theme tokens, paper/wood textures                                               | `@cards/ui-shell`                                     | Game-agnostic                                                                                  |
| Top-level router + home screen + game-family tiles                              | `@cards/ui-shell`                                     | Mounts each game's `RouteTree` lazily; owns `/`, `/auth/*`, `/profile`, `/friends`, `/history` |
| Auth screens, friends screen, history screen, profile screen                    | `@cards/identity` (eventually)                        | Game-agnostic                                                                                  |
| `GameTable` layout (zones, seats)                                               | **Per-game**                                          | Layout assumptions vary (4-seat trick zone vs 6-seat melding tableau)                          |
| `BidPanel` / `MeldPanel` / action panels                                        | **Per-game**                                          | Game-shaped UI                                                                                 |
| `ScorePanel` (game-specific scoreline)                                          | **Per-game**                                          | Game-shaped data                                                                               |
| `RoundSummary`                                                                  | **Per-game**                                          | Game-shaped data                                                                               |
| `useGameSession` hook                                                           | **Per-game**                                          | Game-shaped state                                                                              |
| `useOnlineGameSession` hook                                                     | **Per-game**                                          | Game-shaped wire decoding                                                                      |
| Game-event-to-message mapper                                                    | **Per-game**                                          | Game-shaped events                                                                             |

If a component starts shared and gains its first `gameId`-aware
branch, **un-share it**. Move it back into the game packages,
duplicating as needed.

---

## 6. URL routing & shell integration

The platform is **URL-addressed**. Each game lives at its own URL
sub-tree, mounted by the shell. The browser address bar is the
source of truth for "what is the user playing right now"; there is
no global "current game" state hidden in React context.

### URL hierarchy

```
/                              ← shell home (game-family tiles)
/auth/login, /auth/signup      ← shell-owned auth
/profile, /friends, /history   ← shell-owned identity screens

/belote                        ← Belote-family landing (variants list)
/belote/tunisian/*             ← Tunisian Belote game
/belote/coinche/*              ← Coinche game

/rami/*                        ← Rami (single variant in family)
/uno/*                         ← Uno
/skyjo/*                       ← Skyjo
```

Family grouping (e.g. `/belote/`) is **navigational**, not
architectural. Games inside the same family share **zero** code per
`PLATFORM_MANIFESTO.md` Rule 1. The grouping is purely a UX/discovery
convenience for users who think "I want to play a Belote-style game".

### The `RouteTree` contract

Each game's UI package MUST export a single `RouteTree` component
that the shell mounts. The shell never reaches inside a game's
package for anything else.

```ts
// packages/<game>/ui/src/RouteTree.tsx
import { Router, Route, Switch } from "wouter";
import { HomeScreen } from "./screens/HomeScreen.js";
import { SoloScreen } from "./screens/SoloScreen.js";
import { LobbyScreen } from "./screens/LobbyScreen.js";
import { RandomScreen } from "./screens/RandomScreen.js";
import { PlayScreen } from "./screens/PlayScreen.js";

export function RouteTree({ basename }: { readonly basename: string }) {
  return (
    <Router base={basename}>
      <Switch>
        <Route path="/" component={HomeScreen} />
        <Route path="/solo" component={SoloScreen} />
        <Route path="/lobby/:code?" component={LobbyScreen} />
        <Route path="/random" component={RandomScreen} />
        <Route path="/play/:sessionId" component={PlayScreen} />
      </Switch>
    </Router>
  );
}
```

**Contract rules** (binding):

- Exported as named `RouteTree` from the package's `index.ts` barrel.
- Single prop: `basename: string` — the URL prefix at which it's mounted.
- Internally uses `wouter` (the platform's chosen router library).
- Owns its own route paths under the basename.
- May import from `@cards/ui-shell` (theme, chrome, identity context).
- May NOT import from another game's UI package.
- Routes that need a session are guarded inside the screen components,
  not at the route-tree level (so deep links to `/play/:sessionId`
  redirect to lobby if the session has expired).

### Mounting a game in the shell

```tsx
// @cards/ui-shell/src/PlatformRouter.tsx
import { Router, Route, Switch } from "wouter";
import { lazy, Suspense } from "react";

const TunisianRouteTree = lazy(() => import("@belote/ui").then((m) => ({ default: m.RouteTree })));
const CoincheRouteTree = lazy(() => import("@coinche/ui").then((m) => ({ default: m.RouteTree })));

export function PlatformRouter() {
  return (
    <Router>
      <Switch>
        <Route path="/" component={HomeScreen} />
        <Route path="/auth/:rest*" component={AuthScreens} />
        <Route path="/profile" component={ProfileScreen} />
        <Route path="/friends" component={FriendsScreen} />
        <Route path="/history" component={HistoryScreen} />

        {/* Belote family */}
        <Route path="/belote/tunisian/:rest*">
          <Suspense fallback={<GameLoadingSpinner />}>
            <TunisianRouteTree basename="/belote/tunisian" />
          </Suspense>
        </Route>
        <Route path="/belote/coinche/:rest*">
          <Suspense fallback={<GameLoadingSpinner />}>
            <CoincheRouteTree basename="/belote/coinche" />
          </Suspense>
        </Route>

        {/* Add more games here as they ship */}
      </Switch>
    </Router>
  );
}
```

**Mounting rules**:

- **Lazy import per game.** A user playing only Coinche never
  downloads the Tunisian Belote bundle. Bundle splitting is the main
  reason to keep this discipline.
- **Wildcard match** (`:rest*`) at the mount point so the game's
  internal router sees every sub-path.
- **`<Suspense>` fallback** while the game's bundle loads — show a
  consistent spinner so the transition feels intentional.
- **Vite `base` is automatic.** The current `vite.config.ts` has
  `base: "/twistedFate-belote/"`; `wouter` composes that with the
  router basename without any extra wiring. Production URLs end up
  as `/twistedFate-belote/belote/coinche/lobby`.

### Why this model

| Property                           | What you get                                                              |
| ---------------------------------- | ------------------------------------------------------------------------- |
| **Bookmarkable**                   | A Coinche player bookmarks `/belote/coinche` directly.                    |
| **Code-split**                     | Each game's bundle loads on demand.                                       |
| **Browser-native**                 | Back button, history, deep links work for free.                           |
| **PWA-honest**                     | Install banner installs the _platform_; users navigate to specific games. |
| **No global "current game" state** | The URL is the answer. No React context needed for "what game am I in."   |

### Why `wouter` and not `react-router-dom`

`wouter` is ~2 KB; `react-router-dom` is ~24 KB. We don't need
data routes, loaders, or route preloading hooks. Keep the platform
small. If a future requirement forces a switch (unlikely), it's a
mechanical migration — both libraries have nearly the same hook
shape.

---

## 7. Wire types

Wire types decode from the opaque `game_action: unknown` envelope on
the server and from the opaque `public_state: Record<string, unknown>`
on the client. They live in `<game>/app/src/wire/` (server) and
`<game>/ui/src/online/<game>-wire.ts` (client). The same shapes are
used both sides — copy or share between server and client _within the
same game's packages_, never across games.

```ts
// packages/coinche/app/src/wire/actions.ts
export type CoincheWireAction =
  | { readonly type: "place_bid"; readonly bid: CoincheWireBid }
  | { readonly type: "play_card"; readonly cardId: string }
  | { readonly type: "coinche" }
  | { readonly type: "surcoinche" };

export function decodeCoincheAction(raw: unknown): CoincheCommand {
  // hand-rolled validator; throw on bad shape
}
```

The wire envelope itself (`{ type: "game_action"; action: unknown }`)
is owned by `@cards/protocol`. Per-game wire shapes are owned by the
game.

---

## 8. Tests

Each game owns its own `__tests__/` directory under each package. Test
discipline per `MANIFESTO.md`:

- Tests written **before** implementation (red phase).
- One test file per source file, mirroring the path.
- Pure logic gets unit tests; UI components get fixture-based render
  tests + Storybook scenes (where applicable).
- Determinism: tests use a seeded RNG injected via the session config.

**Cross-game test suites do not exist.** There is no `packages/cards/`
test folder that runs all games' tests in a parametrised loop. Each
game's CI runs its own suite.

---

## 9. Bootstrapping a new game (the 80% copy)

When the PO greenlights a new game `@<newgame>/*`:

1. **Copy** the `@belote/core`, `@belote/app`, `@belote/ui` package
   directories to `packages/<newgame>/{core,app,ui}/`.
2. **Find-replace** `belote` → `<newgame>`, `Belote` → `<NewGame>`
   across all files in the new copy. Includes `package.json`,
   imports, type names, file paths.
3. **Add the new packages** to `pnpm-workspace.yaml`.
4. **Run `pnpm install`** to wire the new packages into the workspace.
5. **Run `pnpm test`** — every test should still pass against the
   copied (renamed) code.
6. **Scaffold the `RouteTree`** — `packages/<newgame>/ui/src/RouteTree.tsx`
   per the contract in §6. Initially the screen components can be
   placeholders that re-export shell screens; specialisation iterations
   replace them. The barrel `packages/<newgame>/ui/src/index.ts` MUST
   export the `RouteTree` named export.
7. **Mount in the shell** — invoke the `shell-router-integration`
   skill: add a `lazy(() => import("@<newgame>/ui"))` and a `<Route
path="/<family>/<variant>/:rest*">` to `@cards/ui-shell`'s
   `PlatformRouter.tsx`. (Skip this step if `@cards/ui-shell` does not
   yet exist — pre-Phase-0; mounting becomes its own iteration once the
   shell is in place.)
8. **Commit this baseline as iteration N-1** (e.g.
   `iteration-NNN-coinche-baseline.md`). The diff is renames + the
   `RouteTree` scaffold + (if applicable) the shell mount. Reviewer's
   job is to confirm find-replace was clean and the mount is correct.
9. **Now specialise**, one iteration at a time. Each iteration touches
   only the new game's packages, follows TDD, lands a focused change.

The baseline-then-specialise pattern means iteration 1 of a new game
ships _something playable_ (a renamed clone of Belote with no rule
changes). Subsequent iterations diverge it into the actual new game.
This honours the "no half-built skeleton" rule from
`PLATFORM_MANIFESTO.md` §5.

---

## 10. When a game stops earning its package

If a game's package set ends up being a near-clone of `@belote/*`
with no meaningful specialisation after 5+ iterations, **fold it back**:

1. Move its files into `packages/belote/*` under a `variants/<game>/`
   subdirectory.
2. Register the variant via the same `engines.set("variant-id", ...)`
   mechanism — this is **per-variant adapter registration**, not a
   shared engine. Each variant's adapter can construct a configured
   `BeloteSession` if that's what makes sense, or its own fresh
   variant-specific class.
3. Delete the empty `packages/<game>/*` directory set.
4. Document in an iteration report.

**This is the only sanctioned form of code reuse between
"sibling-shaped" games.** The variant lives inside another game's
package because the duplication wasn't earning its keep — not because
games share an engine.

---

## 11. When 3 games confirm a pattern (extraction)

After three games have shipped with **the exact same** code shape for
some piece of logic, that piece earns extraction to `@cards/*`. Process:

1. Open an iteration plan titled
   `iteration-NNN-extract-<thing>-to-cards.md`.
2. List the three sites where the code is duplicated. Show the diff
   between them is empty (or trivial whitespace).
3. Propose the new shared module path.
4. Lock the API: what types, what functions. **No `gameId`
   parameters.** **No generics.**
5. Run the full review (PO + Architect + Code Reviewer + Tester).
6. Implement: extract, update each game's import, delete duplicates,
   confirm tests still pass in each game.

Two games with similar code do **not** justify extraction. Wait for
the third.

---

## 12. Hot leftover questions

These are decisions deferred from `PLATFORM_REFACTOR_PLAN_v2.md`
(§8) and need PO answers before specific phases run:

- **Coinche rules — All-trumps / No-trumps / Capot / Generale?**
  `GAME_RULES.md:163-164` marks them deferred. Coinche needs at
  least a yes/no per item.
- **Match-history schema for game-specific final scores.** Sparse
  per-game columns vs JSON column keyed by `game_id`?
- **Variant-as-folded-game-back vs variant-as-own-package**
  threshold. Today: §9 gives a 5-iteration smell test. Confirm.
- **Per-game PO assignment.** One PO across all games, or one PO per
  game?

---

_Drafted 2026-05-09. Living document — updated by iteration plans
explicitly titled `iteration-NNN-guideline-update.md`._
