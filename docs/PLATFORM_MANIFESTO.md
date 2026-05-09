# Platform Manifesto

> Companion to `MANIFESTO.md`. Where `MANIFESTO.md` codifies the
> engineering rules for building **a Belote game**, this document
> codifies the rules for evolving the codebase into **a host for
> multiple card games** without losing the discipline that got us
> here.
>
> This manifesto is binding. If a future plan, refactor, or feature
> contradicts a rule here, the rule wins until this document is
> amended.

---

## 1. Foundational stance

The platform is a **convention**, not a class hierarchy. The platform
is enforced by:

1. A package-layout template (`docs/GAME_PACKAGE_GUIDELINE.md`).
2. A small set of horizontal infrastructure packages
   (`@cards/*` — auth, lobby, friends, history, theme, server-shell,
   protocol envelope, db).
3. A single narrow runtime interface (`EngineHandle` — the
   server / engine boundary).
4. ESLint boundary rules.
5. Skills under `.claude/skills/` that propagate the discipline to AI
   collaborators.

It is **not** enforced by:

- A shared `GamePlugin<S, A, E>` interface.
- A shared `Game` / `Round` / `Session` base class.
- A `variant` flag parametrising shared logic.
- A `RulesEngine` with function-pointer hooks.
- Any abstraction that requires a future game to look like a past one.

---

## 2. The five rules

### Rule 1 — Games are isolated packages

Every game owns a sibling package set: `@<game>/core`, `@<game>/app`,
`@<game>/ui`, optionally `@<game>/wire`. They follow the layout in
`docs/GAME_PACKAGE_GUIDELINE.md`.

**No game package may import from another game package. Ever.**

ESLint enforces this at lint time. If you find yourself wanting to
import `@belote/core` from inside `@coinche/app`, the answer is to
duplicate the code. If the duplication later proves load-bearing
across **three** games, extract to `@cards/*`.

### Rule 2 — Duplication is the right answer until 3 games confirm a pattern

Two games sharing 80% of their bidding code is **not** evidence that
bidding code is shared infrastructure. It is evidence that two specific
games happened to bid similarly.

Three is a pattern. Two is a coincidence.

Until three games have shipped with the same code shape, the code
stays duplicated. When extraction does happen, it happens at the
seam where it is screamingly obvious — never at "morally similar"
code.

### Rule 3 — Shared = strictly horizontal infrastructure

The `@cards/*` namespace is reserved for code that is **truly
game-agnostic**:

- Identity, authentication, sessions
- Friends, profiles, match history
- Lobby chrome, matchmaking queue, room codes
- Theme tokens, paper textures, UI shell components (MenuFelt,
  IdentityChip, ChatPanel, InstallPrompt)
- The fastify server, websocket gateway, room scaffolding, db
  connection
- The protocol envelope (`game_action: unknown`, opaque
  `public_state` / `private_state`)

The `@cards/*` namespace **must not** contain:

- Anything that knows what a card, hand, trick, meld, bid, or trump is
- Anything with a `gameId` switch
- Anything parametrised over a game-specific state shape
- Anything named after a card-game concept (no `@cards/trick-taking`,
  no `@cards/bidding`, no `@cards/scoring`)

If a function in `@cards/*` ever needs a `gameId` parameter, it
belongs in a per-game package.

### Rule 4 — The server / engine boundary is a 5-method runtime interface

There is exactly one interface between the shared server and a
per-game engine: `EngineHandle`. It has five methods, all using
`unknown` payloads:

```ts
interface EngineHandle {
  apply(action: unknown): { events: readonly unknown[] };
  getPublicState(): unknown;
  getPrivateState(seat: Seat): { hand: readonly unknown[]; legalActionIds: readonly string[] };
  isComplete(): boolean;
  getCompletionInfo(): unknown;
}
```

The server treats engines as black boxes. It serialises whatever
`getPublicState()` returns and broadcasts it. It forwards whatever
`action` it received from the wire to `apply()`. It does not know
what a bid or a meld is.

**No generics propagate through the boundary.** The server
codebase contains zero `<TState, TAction, ...>` parameters. The
typing of state and actions lives inside each game package.

This is the _only_ sanctioned coupling between shared infrastructure
and game logic. Any other coupling is a violation of this manifesto.

### Rule 5 — The convention adapts; the principles do not

`docs/GAME_PACKAGE_GUIDELINE.md` is a living document. As we ship
more games we will discover better file layouts, better naming, better
test structure. The guideline updates.

The principles in this manifesto **do not update without an
explicit amendment** that is reviewed and committed as a deliberate
change. "We're refactoring anyway, let's just add a base class" is
not an amendment.

---

## 3. What this manifesto inherits from `MANIFESTO.md`

All rules in `MANIFESTO.md` continue to apply, per-game:

- **Strict TDD** — tests first, red phase confirmed, green, refactor.
- **Frontend-agnostic core engine** — each game's `@<game>/core` is
  pure logic, zero UI, zero framework, deterministic.
- **Animation engine isolation** — animations are pure descriptions,
  consumed by the rendering layer; per-game animations live with the
  game's UI.
- **Ultra-small iterations** — one model, one component, one fix per
  iteration.
- **Mandatory iteration reports** — each iteration produces a
  report with N+1 / N+2 previews.
- **Unique IDs everywhere** — testable, queryable, Playwright-ready.
- **No parallel systems** — one feature at a time, sequentially.
- **All four checks pass** — `pnpm test`, `pnpm typecheck`,
  `pnpm lint`, `pnpm format:check`, every iteration.

These rules apply _inside each game package_. They do not justify
cross-game coupling.

---

## 4. The four collaborator review (extended)

`REVIEW_PROTOCOL.md` defines the four roles: PO → Architect → Code
Reviewer → Tester. For platform-affecting work, the **Architect** has
two additional concerns:

1. **Boundary check** — does the change introduce coupling that
   crosses the rules above? Cross-game imports, shared base classes,
   `gameId` switches in `@cards/*`, generics escaping the engine
   boundary.
2. **Duplication-vs-extraction call** — if the change extracts shared
   code, is the extraction supported by ≥3 games' worth of evidence,
   or is it speculative?

Either concern is grounds for a **Needs Revision** verdict regardless
of how clean the implementation looks.

---

## 5. The "no half-built skeleton" rule

From `VISION.md` line 277, kept verbatim: _"Incremental growth — ship
Belote fully, then expand. No half-built multi-game skeleton."_

Operationally: every iteration must end with the application **playable
end-to-end** for at least one game. A refactor that leaves the app
broken across iterations is not a refactor; it is a long-running
branch and is forbidden.

The Phase 0 / Phase 1 / Phase 2 / Phase 3 / Phase 4 structure in
`PLATFORM_REFACTOR_PLAN_v2.md` is designed to honour this rule. Any
phase that breaks the rule has been mis-planned.

---

## 6. Forbidden constructions

The following constructions are forbidden by this manifesto. The list
is exhaustive — additions require an amendment.

| Construction                                                                             | Why forbidden                                          |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `class GameSession<S, A, E>` (generic base session)                                      | Generic contagion; couples future games to past games. |
| `interface GamePlugin<S, A, E>`                                                          | Same.                                                  |
| `function calculateScore(state, variant: GameId)`                                        | Variant flag in shared code.                           |
| `import { ... } from "@coinche/core"` inside `@belote/*`                                 | Cross-game import.                                     |
| `import { ... } from "@belote/core"` inside `@cards/*`                                   | Shared infra importing a game.                         |
| `if (gameId === "belote") { ... }` inside `@cards/*`                                     | gameId switch in shared.                               |
| A `@cards/trick-taking` / `@cards/bidding` / `@cards/scoring` / `@cards/melding` package | Card-game-shaped abstractions in shared infra.         |
| Extending `EngineHandle` to expose a typed state shape                                   | Generics leaking across the boundary.                  |

---

## 7. Permitted constructions

The following are explicitly permitted, even when they look like
duplication:

- Belote's `BidPanel` and Coinche's `BidPanel` as two separate
  components in two separate packages, even when they look 90%
  identical.
- Belote's `Card` type and Coinche's `Card` type as two separate
  types, even when their structural shape is identical. (They may
  re-export from a `@cards/primitives` package only if the type
  appears unchanged in ≥3 games.)
- Belote's `Round` and Coinche's `Round` as two separate types — no
  `variant` flag bridges them.
- Two server-side adapters (one per game) that both implement
  `EngineHandle` independently.
- Two near-identical file trees under `packages/belote/*` and
  `packages/coinche/*`.

---

## 8. Amendments

This document changes by explicit amendment, not by drift. To amend:

1. Open an iteration plan titled `iteration-NNN-platform-manifesto-amendment.md`.
2. Quote the rule being changed and the proposed replacement.
3. Justify with **evidence from shipped games** (≥3 games' worth, per
   Rule 2).
4. Run the full review protocol with Architect + PO sign-off.
5. Commit the amendment as the iteration's deliverable.

Speculative amendments ("we might want this later") are rejected on
sight.

---

_Drafted 2026-05-09. First binding version._
