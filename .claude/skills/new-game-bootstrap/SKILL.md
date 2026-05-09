---
name: new-game-bootstrap
description: Walks through scaffolding a new game package set (@<game>/core, @<game>/app, @<game>/ui) by copy-and-specialise from @belote/*. Use when the user says "let's start Coinche" or "add a Rami package" or "scaffold a new game". Produces the renamed-clone baseline as iteration N-1, scaffolds the RouteTree contract for shell mounting, then teaches the specialisation cadence. Hands off to shell-router-integration for the actual route mount. Refuses to start without PO greenlight + locked rule decisions.
---

# New Game Bootstrap

This skill is the project's authority on **how a new game gets its
first packages**. It implements the workflow from
`docs/GAME_PACKAGE_GUIDELINE.md` §8.

## When to invoke

- The user says "let's start <newgame>" / "add a <newgame> package".
- A platform-refactor phase calls for scaffolding a new game.
- A variant has been promoted from a `variants/` subfolder to its own
  package set (rare).

## Pre-flight checks (refuse to proceed if missing)

Before ANY file is created, confirm all of these:

1. **PO greenlight.** The user (acting as PO) has explicitly approved
   shipping this game. "I'm thinking about Coinche" is not approval;
   "Yes, scaffold Coinche" is.
2. **Game name locked.** Lowercase, hyphenated for multi-word
   (`coinche`, `simple-belote`, `rami`). This will appear in package
   names, file names, type prefixes — renaming later is expensive.
3. **Rules decisions locked.** For the new game's equivalent of
   `docs/GAME_RULES.md`: bidding model, scoring, win condition,
   special bids, deal pattern. Unlocked rules → refuse to start. Open
   the unlocked questions in an iteration plan first.
4. **Vision confirms it.** The new game appears on the roadmap in
   `docs/VISION.md` (or the user is amending VISION.md as part of
   this work).
5. **No half-built skeleton.** `MANIFESTO.md` and
   `PLATFORM_MANIFESTO.md` §5 forbid leaving the app broken across
   iterations. The bootstrap iteration produces a _playable_
   renamed-clone.

If any check fails: **stop**, list what's missing, ask the user to
resolve before continuing.

## The bootstrap iteration (iteration N-1)

The first iteration of any new game is mechanical: copy `@belote/*`,
find-replace, commit. No rule changes yet. The point is to get a
working baseline that the next iterations can specialise.

### Step 1 — Iteration plan

Create `docs/iterations/iteration-NNN-<newgame>-baseline.md` with:

- **Goal:** Scaffold `@<newgame>/{core,app,ui}` as a renamed clone of
  `@belote/{core,app,ui}`. No rule changes.
- **Out of scope:** Specialisation, AI tuning, UI redesign.
- **Acceptance criteria:**
  - Three new package directories under `packages/<newgame>/`.
  - `pnpm-workspace.yaml` includes the new packages.
  - `pnpm install` succeeds.
  - `pnpm test` passes — every Belote test passes against the renamed
    `@<newgame>/*` code (because it's literally the same code).
  - `pnpm typecheck`, `pnpm lint`, `pnpm format:check` clean.
  - The new game's `server-adapter.ts` registers `engines.set("<newgame>", ...)`.
  - The shared server entry imports the new adapter.
  - Lobby has a placeholder game-picker entry for `<newgame>` (can be
    flag-gated to internal only).

### Step 2 — Copy

```
cp -r packages/belote/core packages/<newgame>/core
cp -r packages/belote/app  packages/<newgame>/app
cp -r packages/belote/ui   packages/<newgame>/ui
```

(or the equivalent on Windows / via your shell of choice — the
operation is a directory copy, no transformation yet)

### Step 3 — Find-replace

In every file under `packages/<newgame>/{core,app,ui}/`:

| Find                                                                                                | Replace with               |
| --------------------------------------------------------------------------------------------------- | -------------------------- |
| `@belote/core` (in imports / package.json)                                                          | `@<newgame>/core`          |
| `@belote/app`                                                                                       | `@<newgame>/app`           |
| `@belote/ui`                                                                                        | `@<newgame>/ui`            |
| `belote` (in identifiers like `BeloteSession`, `chooseBeloteBid`, file names like `belote-wire.ts`) | `<newgame>`                |
| `Belote` (PascalCase, e.g. `BeloteSession` → `CoincheSession`)                                      | `<NewGame>` (PascalCased)  |
| `BELOTE_` (constants)                                                                               | `<NEWGAME>_` (upper-snake) |

**Be careful with substring collisions.** "Belote" inside the word
"belote-rebelote" should also be renamed (or remove the term entirely
if the new game doesn't have that bonus — but that's a Step-5
specialisation concern, not a bootstrap concern).

Use a tool that respects word boundaries (e.g. ripgrep + sed with
`\b`, or your editor's "match whole word" mode). Manual review of the
diff is mandatory.

### Step 4 — Scaffold the `RouteTree`

Each game's UI package MUST expose a single `RouteTree` component
that the shell mounts at the game's URL prefix. See
`docs/GAME_PACKAGE_GUIDELINE.md` §6 for the full contract.

Create `packages/<newgame>/ui/src/RouteTree.tsx`:

```tsx
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

The screen components (`HomeScreen`, `SoloScreen`, etc.) start as
placeholder stubs in the bootstrap iteration. They render simple
"coming soon" placeholders or re-export from the cloned belote screens.
Specialisation iterations replace them with real game-specific screens.

Update the package barrel `packages/<newgame>/ui/src/index.ts`:

```ts
export { RouteTree } from "./RouteTree.js";
```

The `RouteTree` named export is **how the shell finds this game**.
Without it, the game cannot be mounted.

**Skip this step gracefully if** the shell router doesn't yet exist
(pre-Phase-0 of `PLATFORM_REFACTOR_PLAN_v2.md`). In that case, scaffold
the `RouteTree.tsx` with a minimal stub but do not attempt to mount —
mounting becomes a separate iteration once `@cards/ui-shell` exists.

### Step 5 — Wire into the workspace

`pnpm-workspace.yaml`:

```yaml
packages:
  - "packages/*"
  - "packages/belote/*"
  - "packages/<newgame>/*"
```

(if the workspace already covers `packages/*` recursively, no change
needed)

`packages/server/src/index.ts` (or wherever the shared server entry
lives) — add the side-effecting import:

```ts
import "@<newgame>/app/server-adapter";
```

This must come **before** the server `listen()` call so the registry
is populated before the first connection.

### Step 6 — Validate

Run all four checks:

- `pnpm install` — success
- `pnpm test` — full suite passes (705+ at time of writing). Each
  test that referenced `@belote/*` should still reference `@belote/*`;
  the new tests under `@<newgame>/*` mirror them and also pass.
- `pnpm typecheck` — clean
- `pnpm lint` — delta-clean (the ESLint `no-restricted-imports` rule
  should be updated to include `@<newgame>/*` in the cross-game
  pattern — ADD THIS in the same commit)
- `pnpm format:check` — clean

If anything fails: do **not** start specialising. Fix the bootstrap
first.

### Step 7 — Iteration report

Write `docs/iterations/iteration-NNN-<newgame>-baseline-report.md`
per `PLAYBOOK.md` template. Highlight:

- "This iteration is mechanical. Reviewer's job is to confirm the
  find-replace was clean."
- Test count delta (should equal Belote test count).
- Lint baseline delta (should be zero).
- The rule decisions still pending for `<newgame>` (so iteration N+1
  knows what to specialise first).

### Step 8 — Define iteration N+1 and N+2

Per the forward-planning rule. Typical N+1 is the **first
specialisation** — e.g. for Coinche, that's "implement coinche /
surcoinche scoring", which immediately diverges scoring from Belote's.

## After bootstrap — the specialisation cadence

Subsequent iterations follow standard `PLAYBOOK.md` discipline:

- One concern per iteration (e.g. "specialise scoring", "specialise
  BidPanel", "rewrite AI heuristic").
- Tests first.
- Touch only `@<newgame>/*` files. **Never** touch `@belote/*` to
  serve the new game.
- If you find yourself wanting to import from `@belote/*` to "save
  duplication", invoke the `game-isolation` skill instead — it'll
  remind you that duplication is the right answer.

## Common bootstrap mistakes (auto-flag)

- Renaming `Belote` → `<NewGame>` but missing it in CSS class names,
  data-testids, or string literals (e.g. error messages mentioning
  "Belote"). Grep the new package directories for any remaining
  `belote` (case-insensitive) after find-replace.
- Forgetting to update the ESLint `no-restricted-imports` pattern.
  The new game must be excluded from its own deny list and added to
  every other game's deny list.
- Missing the side-effecting import in the shared server entry. The
  game won't register; rooms with `gameId = "<newgame>"` will fail.
- Updating `pnpm-workspace.yaml` but not running `pnpm install`. The
  new packages won't be linked.
- Committing the bootstrap and a specialisation in one commit. Keep
  the bootstrap commit mechanical so a reviewer can audit the rename
  in isolation.

## What this skill does NOT do

- Specialise the new game's rules — that's per-iteration work. After
  bootstrap, hand off to the user / standard iteration cadence.
- Decide what game to add — that's a PO decision documented in
  `VISION.md`.
- Write the new game's `GAME_RULES.md` — that's PO + rules-research
  work, prerequisite to bootstrap (`game-rules-research` skill).
- **Mount the game in the shell router** — `shell-router-integration`
  skill. This skill scaffolds the game's `RouteTree` (Step 4) but the
  actual lazy-import + `<Route>` registration in `@cards/ui-shell`'s
  `PlatformRouter.tsx` is a separate concern.

## References

- `docs/GAME_PACKAGE_GUIDELINE.md` §6 — URL routing & shell integration.
- `docs/GAME_PACKAGE_GUIDELINE.md` §9 — the canonical bootstrap recipe.
- `docs/PLATFORM_MANIFESTO.md` §5 — the no-half-built-skeleton rule
  this workflow honours.
- `docs/PLAYBOOK.md` — iteration template + 4 checks + report
  template.
- `docs/iterations/iteration-018-plan.md` — exemplar of an iteration
  plan at the right size.
