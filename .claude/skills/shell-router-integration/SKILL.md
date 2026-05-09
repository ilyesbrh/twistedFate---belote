---
name: shell-router-integration
description: Mounts a per-game RouteTree into the shared shell's URL router (`@cards/ui-shell` / `PlatformRouter.tsx`). Use when a new game has just been bootstrapped and needs to be reachable at its URL prefix, when the shell's route table is being added to or audited, when the user says "mount X in the shell" / "wire X game into the router" / "add a route for X", or when verifying a game's RouteTree contract against the shell's expectations. Refuses to mount a game that doesn't export a RouteTree named export, mounts that bypass `lazy()` (which would break per-game bundle splitting), or routes that don't follow the `/<family>/<variant>/*` URL convention.
---

# Shell Router Integration

This skill is the project's authority on **how a game's UI gets
mounted into the shared platform shell** via URL routing. It implements
the contract in `docs/GAME_PACKAGE_GUIDELINE.md` §6.

The platform is **URL-addressed**: each game lives at its own URL
sub-tree, mounted by the shell. The browser address bar is the
source of truth for "what is the user playing right now"; there is
no global "current game" React context.

## When to invoke

- A new game has just been bootstrapped (via `new-game-bootstrap`)
  and needs to become reachable.
- The user says "mount Coinche at /belote/coinche" / "wire Rami into
  the shell router" / "add a route for X".
- The shell's `PlatformRouter.tsx` is being audited for missing
  games or violations of the `RouteTree` contract.
- A game's URL prefix needs to change (rare).

## URL hierarchy (binding)

```
/                              ← shell home (game-family tiles)
/auth/login, /auth/signup      ← shell-owned auth
/profile, /friends, /history   ← shell-owned identity screens

/belote                        ← Belote-family landing
/belote/tunisian/*             ← Tunisian Belote
/belote/coinche/*              ← Coinche

/rami/*                        ← Rami (single variant in family)
/uno/*                         ← Uno
/skyjo/*                       ← Skyjo
```

**Family grouping is navigational, not architectural.** Games inside
the same family share **zero code** per `PLATFORM_MANIFESTO.md` Rule 1.
Grouping under `/belote/` simply tells users "these games feel
similar."

If the new game is the first variant of a new family, mount at
`/<game>/*`. If it's an additional variant of an existing family,
mount at `/<family>/<variant>/*`.

## Pre-flight checks (refuse to proceed if missing)

Before any code change, confirm:

1. **The game's `RouteTree` exists.** `packages/<game>/ui/src/RouteTree.tsx`
   is present. The game's bootstrap iteration should have scaffolded it.
2. **The barrel exports it.** `packages/<game>/ui/src/index.ts` includes
   `export { RouteTree } from "./RouteTree.js";`. Without this, the
   shell can't find it.
3. **It accepts a `basename` prop.** Inspect the component signature.
   The shell will pass a `basename` matching the chosen URL prefix.
4. **It uses `wouter` internally.** Other routers (react-router,
   tanstack/router) are forbidden — the platform standardises on
   `wouter`. If the game uses something else, refuse and require
   conversion first.
5. **The shell exists.** `@cards/ui-shell` (or its current equivalent)
   must have a `PlatformRouter.tsx`. Pre-Phase-0 of the refactor
   plan, the shell may still be the existing `packages/ui` —
   that's fine, but identify the correct file to modify.

If any check fails, stop and surface the blocker. Don't fudge a mount
that won't work.

## The `RouteTree` contract (verify before mounting)

Each game's UI package exports exactly this shape:

```ts
// @<game>/ui/src/RouteTree.tsx
import { Router, Route, Switch } from "wouter";

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

**Contract rules**:

- Named export `RouteTree`.
- Single prop `basename: string`.
- Uses `wouter`.
- Owns its own internal route paths (relative to basename).
- May import from `@cards/ui-shell` (theme, chrome, identity context).
- May NOT import from another game's UI package — `game-isolation`
  skill enforces this independently.

## The mount procedure

### Step 1 — Decide the URL prefix

- New game family → `/<game>/*` (e.g. `/rami/*`, `/uno/*`).
- New variant of existing family → `/<family>/<variant>/*` (e.g.
  `/belote/coinche/*`).

The prefix must be lowercase, hyphen-separated, and short. Avoid
abbreviations users won't recognise.

### Step 2 — Add the lazy import

In `@cards/ui-shell/src/PlatformRouter.tsx` (or current equivalent):

```ts
import { lazy } from "react";

// Existing imports for already-mounted games...
const TunisianRouteTree = lazy(() => import("@belote/ui").then((m) => ({ default: m.RouteTree })));

// New game — add at the bottom of the imports group
const CoincheRouteTree = lazy(() => import("@coinche/ui").then((m) => ({ default: m.RouteTree })));
```

**Lazy import is mandatory.** It's how each game's bundle stays
isolated — a Coinche-only player never downloads the Belote bundle.

A static import (`import { RouteTree } from "@coinche/ui"`) would
fold the game into the shell's bundle and break code-splitting.
Refuse this.

### Step 3 — Add the `<Route>` mount

Inside the `<Switch>`:

```tsx
<Route path="/belote/coinche/:rest*">
  <Suspense fallback={<GameLoadingSpinner />}>
    <CoincheRouteTree basename="/belote/coinche" />
  </Suspense>
</Route>
```

**Mount rules**:

- **Wildcard path** (`:rest*`) — the shell matches everything under
  the prefix, then hands off to the game's internal router.
- **`<Suspense>` fallback** — show `<GameLoadingSpinner />` while the
  game's bundle loads. The shell already exports this component;
  reuse it for visual consistency across games.
- **basename matches the path prefix exactly** — typo here means the
  game's internal router fights the shell's prefix and produces
  broken URLs. Verify the strings match.

### Step 4 — Add the family-landing route (if first variant of a family)

For families with variants (Belote: Tunisian, Coinche), there's
typically a family-landing screen at `/belote` that lists variants.
That screen lives in `@cards/ui-shell` (it's not specific to either
variant) and is registered as a regular `<Route>`.

If you're adding the first variant of a new family, also create:

- A landing screen component in the shell (`<BeloteFamilyLanding>`).
- Its route: `<Route path="/belote" component={BeloteFamilyLanding} />`.

If the new game is a single-variant family, skip this step — the
home tile links directly to `/<game>/`.

### Step 5 — Update the `<HomeScreen>` tile grid

Tile per family on the home screen. Adding a new family means a new
tile. Adding a variant to an existing family doesn't change tiles —
the variant appears on the family-landing screen instead.

### Step 6 — Verify

```bash
pnpm typecheck   # catches missing RouteTree export
pnpm test        # shell tests should still pass; game tests in their package
pnpm build       # confirms the lazy import produces a separate chunk
```

Manually verify in dev:

- Navigate to `/<prefix>/` — game's home screen appears.
- Open browser devtools → Network → confirm the game's chunk loads
  on first navigation, not before.
- Use back/forward buttons across game boundaries — should land
  cleanly on each side.
- Bookmark a game URL, restart, paste — should deep-link correctly.

## Common mistakes (auto-flag)

| Mistake                                                 | Effect                                      | Fix                                        |
| ------------------------------------------------------- | ------------------------------------------- | ------------------------------------------ |
| Static import `import { RouteTree } from "@coinche/ui"` | Coinche bundle ships to all users           | Switch to `lazy()`                         |
| `<Route path="/belote/coinche">` (no `:rest*`)          | Game's internal sub-routes 404              | Add `:rest*` wildcard                      |
| `basename="/belote/coinche/"` (trailing slash)          | Double-slash URLs in some `wouter` versions | Drop the trailing slash                    |
| Mount inside another game's package                     | Cross-game import (lint violation)          | Mount in `@cards/ui-shell` only            |
| Missing `<Suspense>`                                    | React throws on lazy-import error           | Always wrap                                |
| Hard-coded `<GameLoadingSpinner>` per game              | Inconsistent transitions                    | Reuse `@cards/ui-shell`'s spinner          |
| Re-exporting a game's `RouteTree` from the shell        | Defeats lazy-loading                        | Keep the lazy reference local to the route |

## What this skill does NOT do

- Bootstrap a new game's package set — `new-game-bootstrap` skill
  (which scaffolds the `RouteTree`).
- Implement game-specific UI inside the `RouteTree` — per-game
  iteration work.
- Define the `EngineHandle` server adapter — `engine-adapter` skill.
- Run iteration discipline (plan / report / 4 checks) —
  `iteration-discipline` skill.

## References

- `docs/GAME_PACKAGE_GUIDELINE.md` §6 — URL routing & shell integration.
- `docs/PLATFORM_MANIFESTO.md` §2 Rule 1 — game isolation.
- `wouter` docs: https://github.com/molefrog/wouter (router library).
- `vite.config.ts` — `base: "/twistedFate-belote/"` is composed
  automatically by `wouter`'s history hook; no extra wiring.
