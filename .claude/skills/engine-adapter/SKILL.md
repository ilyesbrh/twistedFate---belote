---
name: engine-adapter
description: Implements the EngineHandle adapter that bridges a per-game engine to the shared server. Use when scaffolding a new game's `server-adapter.ts`, when fixing/extending an existing adapter, or when verifying the server/engine boundary stays narrow. Enforces the 5-method contract, opaque payloads (`unknown` at the boundary, typed inside), and the side-effecting registration pattern. Refuses any design that lets generics or game-specific types leak through.
---

# Engine Adapter

This skill is the project's authority on **the runtime seam between
the shared server and a per-game engine**. It implements the rules in
`docs/PLATFORM_MANIFESTO.md` Rule 4 and `docs/GAME_PACKAGE_GUIDELINE.md`
§4.

The adapter is the **only** sanctioned coupling between
`@cards/server-shell` and `@<game>/app`. Any other coupling violates
the manifesto.

## When to invoke

- Scaffolding `packages/<game>/app/src/server-adapter.ts` for a new
  game.
- Fixing an existing adapter (e.g. adding a method that was missed,
  fixing a serialisation bug).
- Reviewing an adapter for boundary integrity.
- The user says "implement EngineHandle for X" / "wire the X game
  into the server".

## The contract — 5 methods, all `unknown` at the boundary

Quote it from memory; never improvise:

```ts
// Owned by @cards/server-shell — concrete, non-generic
export interface EngineHandle {
  apply(action: unknown): { events: readonly unknown[] };
  getPublicState(): unknown;
  getPrivateState(seat: Seat): {
    hand: readonly unknown[];
    legalActionIds: readonly string[];
  };
  isComplete(): boolean;
  getCompletionInfo(): unknown;
}

export type EngineFactory = (config: unknown) => EngineHandle;
export const engines = new Map<GameId, EngineFactory>();
```

**Rules of the contract:**

1. All five methods are mandatory. No game ships without all five.
2. `unknown` at the boundary means the server never sees a typed
   game-specific shape. Inside the adapter, the very first line of
   each method decodes/validates the `unknown` into a typed value.
3. No generic parameters. The interface is concrete. Do not propose
   `EngineHandle<TState>` or similar.
4. The interface lives in the shared server package. Do not
   re-declare it in game packages.

## Adapter template

```ts
// packages/<game>/app/src/server-adapter.ts
import {
  engines,
  type EngineHandle,
  type Seat,
} from "@cards/server-shell";

import { <Game>Session } from "./session.js";
import { decode<Game>Action } from "./wire/actions.js";
import {
  serialize<Game>PublicState,
  serialize<Game>Hand,
} from "./wire/state.js";
import { parseConfig } from "./wire/config.js";

engines.set("<gameId>", (rawConfig: unknown): EngineHandle => {
  const config = parseConfig(rawConfig);          // throws on bad shape
  const session = new <Game>Session(config);

  return {
    apply: (rawAction: unknown) => {
      const command = decode<Game>Action(rawAction);  // throws on bad shape
      const events = session.dispatch(command);
      return { events };
    },

    getPublicState: () => serialize<Game>PublicState(session),

    getPrivateState: (seat: Seat) => ({
      hand: serialize<Game>Hand(session, seat),
      legalActionIds: session.getLegalActionIdsFor(seat),
    }),

    isComplete: () => session.state === "game_completed",

    getCompletionInfo: () => session.getMatchHistoryRow(),
  };
});
```

## Walkthrough — implementing for a new game

### Step 1 — Locate the game's packages

Confirm:

- `packages/<game>/core/` exists with the engine logic.
- `packages/<game>/app/src/session.ts` exports a concrete
  `<Game>Session` class with a `dispatch(command)` method and a
  `state` getter.
- `packages/<game>/app/src/wire/` directory exists (or create it now).

If any are missing, hand off to `new-game-bootstrap` first.

### Step 2 — Write the wire types (if not yet present)

Three files under `packages/<game>/app/src/wire/`:

`config.ts` — what the server passes to the factory:

```ts
export interface <Game>Config {
  readonly seed?: number;
  readonly playerNames: readonly [string, string, string, string];
  readonly targetScore: number;
  // ...game-specific config
}

export function parseConfig(raw: unknown): <Game>Config {
  if (!isObject(raw)) throw new Error("invalid config");
  // hand-rolled validator
  // ...
}
```

`actions.ts` — what `apply()` receives:

```ts
export type <Game>WireAction =
  | { readonly type: "place_bid"; readonly bid: WireBid }
  | { readonly type: "play_card"; readonly cardId: string };
  // ...

export function decode<Game>Action(raw: unknown): <Game>Command {
  if (!isObject(raw)) throw new Error("invalid action");
  switch (raw["type"]) {
    case "place_bid": /* validate + map to typed Command */;
    case "play_card": /* validate + map to typed Command */;
    default: throw new Error(`unknown action type: ${String(raw["type"])}`);
  }
}
```

`state.ts` — what `getPublicState()` / `getPrivateState()` return:

```ts
export function serialize<Game>PublicState(session: <Game>Session): <Game>PublicState {
  return {
    phase: session.phase,
    scores: session.scores,
    // ...whatever the UI needs to render
  };
}

export function serialize<Game>Hand(
  session: <Game>Session,
  seat: Seat,
): readonly <Game>WireCard[] {
  return session.getHandFor(seat).map(toWireCard);
}
```

The serialised types **may** be exported as TS types so the matching
client-side decoder can use them (within the same game's UI package).
That's fine — same-game types crossing server↔client is permitted;
cross-game type sharing is forbidden.

### Step 3 — Implement the 5 methods

Use the template above. Specific things to get right:

- **`apply`** — _always_ returns `{ events }`. Even if the action
  produced zero events, return `{ events: [] }`. The server expects
  the shape unconditionally.
- **`getPublicState`** — returns a _snapshot_, not a reference. If
  the session mutates after this call, the broadcast must not see the
  mutation. Either deep-clone or build the snapshot fresh from the
  session's getters.
- **`getPrivateState(seat)`** — returns only what `seat` is allowed
  to see. `hand` must be that seat's hand only — never another seat's.
  `legalActionIds` is the IDs of the actions that seat is currently
  allowed to take (empty if not their turn).
- **`isComplete`** — boolean, no side effects. Server polls this
  after every `apply()`.
- **`getCompletionInfo`** — only called once `isComplete()` returns
  true. Returns whatever the match-history persistence layer needs
  (final scores, contract winner, MVP, etc.). Schema is per-game.

### Step 4 — Handle errors at the boundary

Decoders (`parseConfig`, `decode<Game>Action`) **throw** on bad
input. The server has a `try/catch` around `apply()` that converts
the throw into a wire-level `error` message. Do not try to recover
inside the adapter.

```ts
apply: (rawAction: unknown) => {
  // No try/catch here. Let throws propagate.
  const command = decode<Game>Action(rawAction);
  const events = session.dispatch(command);
  return { events };
},
```

If an action is _legal but the session refuses_ (e.g. wrong turn),
that throws out of `session.dispatch()` — also propagates, also gets
wrapped by the server.

### Step 5 — Register at startup

Add the side-effecting import to the shared server entry:

```ts
// packages/server/src/index.ts (or wherever)
import "@cards/server-shell"; // creates the empty registry
import "@belote/app/server-adapter"; // populates "belote"
import "@<newgame>/app/server-adapter"; // populates "<newgame>"
// ... await server.listen(...)
```

Order: registry must be imported (and thus instantiated) before the
adapters. The adapters' import order doesn't matter — they're
independent registrations.

### Step 6 — Test the adapter in isolation

Test file: `packages/<game>/app/__tests__/server-adapter.test.ts`.

Cover:

- `engines.get("<gameId>")` returns a function after import.
- The factory accepts a valid config and returns an `EngineHandle`.
- The factory throws on invalid config.
- `apply` with a valid action returns `{ events: [...] }`.
- `apply` with malformed action throws.
- `getPublicState` returns a snapshot that doesn't mutate when the
  session does.
- `getPrivateState(seat)` only includes that seat's hand.
- `isComplete` flips from false to true at the right point.
- `getCompletionInfo` returns the expected match-history row when
  complete (and is fine to call when complete; behaviour when called
  early is undefined — document and test the documented behaviour).

## Boundary integrity audit

When reviewing an existing adapter, check for these violations:

| Smell                                                                                   | Fix                                                           |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Method signature uses a typed game-specific param (e.g. `apply(action: BeloteCommand)`) | Change to `unknown`; decode inside.                           |
| Method returns a typed game-specific value at the surface                               | Return `unknown`; the typing lives inside.                    |
| `engines.set` called more than once for the same `gameId`                               | Two adapters fighting; pick one.                              |
| `engines.set` for a `gameId` that's not in the registered list                          | Register the new gameId in `@cards/protocol`'s `GameId` type. |
| `try/catch` around `decode<Game>Action` in the adapter                                  | Remove; let throws propagate.                                 |
| `getPublicState` returns a reference to mutable session internals                       | Deep-clone or rebuild snapshot.                               |
| `getPrivateState` includes data from other seats                                        | Restrict to `seat`.                                           |
| Adapter imports from another game's package                                             | Hard violation; remove.                                       |
| Adapter exports the `EngineHandle` interface itself                                     | Remove; the interface lives in `@cards/server-shell`.         |

## What this skill does NOT do

- Bootstrap a new game's package set — `new-game-bootstrap` skill.
- Enforce game-isolation rules elsewhere — `game-isolation` skill.
- Implement game-specific session logic — that's per-game work.

## References

- `docs/PLATFORM_MANIFESTO.md` §2 Rule 4 — the 5-method contract.
- `docs/GAME_PACKAGE_GUIDELINE.md` §4 — the canonical adapter
  template.
- `docs/PLATFORM_REFACTOR_PLAN_v2.md` §3.5 — why this seam exists
  and how it differs from `GamePlugin<S, A, E>`.
