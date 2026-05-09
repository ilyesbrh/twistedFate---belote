---
name: game-isolation
description: Enforces the isolation rules between game packages. Use whenever code is being written, reviewed, or refactored in or near a game package (@belote/*, @coinche/*, @rami/*, etc.) or a shared infrastructure package (@cards/*). Catches cross-game imports, shared base classes, variant flags, gameId switches in shared code, and generic engine contagion before they ship. Also decides duplication-vs-extraction calls.
---

# Game Isolation

This skill is the project's authority on **how games stay isolated** in
the TwistedFate codebase. It enforces the rules in
`docs/PLATFORM_MANIFESTO.md` and `docs/GAME_PACKAGE_GUIDELINE.md` —
never softens them.

## When to invoke

- Code is being added inside `packages/<game>/*` or `packages/cards/*`.
- A refactor proposes "sharing" something between games.
- Code review needs to check for coupling violations.
- The user asks "should this be shared?" or "can we extract this?"
- A new file's imports cross package boundaries.

## The five rules (binding, not advisory)

These are quoted directly from `docs/PLATFORM_MANIFESTO.md` §2.
Memorise them.

1. **Games are isolated packages.** No game package may import from
   another game package. Ever.
2. **Duplication is the right answer until 3 games confirm a pattern.**
   Two is a coincidence; three is a pattern.
3. **Shared = strictly horizontal infrastructure.** The `@cards/*`
   namespace is only for code that knows nothing about cards, hands,
   tricks, melds, bids, or trumps.
4. **The server / engine boundary is a 5-method runtime interface
   (`EngineHandle`).** No generics, no shared base class.
5. **The convention adapts; the principles do not.** Amendments to the
   manifesto require an explicit iteration with ≥3-game evidence.

## Forbidden constructions (auto-flag)

If you see any of these in code being written or reviewed, **stop and
flag it before going further**:

| Pattern                                                                                 | Why forbidden                                 | Right answer                                          |
| --------------------------------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------- |
| `class GameSession<S, A, E>` (generic base)                                             | Generic contagion                             | One concrete `<Game>Session` class per game           |
| `interface GamePlugin<S, A, E>`                                                         | Same                                          | `EngineHandle` (5 methods, all `unknown`)             |
| `function f(state, variant: GameId)`                                                    | Variant flag in shared code                   | Two functions, one per game, in their own packages    |
| `import { ... } from "@coinche/core"` inside `@belote/*`                                | Cross-game import                             | Duplicate the code                                    |
| `import { ... } from "@belote/core"` inside `@cards/*`                                  | Shared infra importing a game                 | Move the call up to the consumer                      |
| `if (gameId === "belote") { ... }` inside `@cards/*`                                    | gameId switch in shared                       | Extract the per-game branch into the per-game package |
| New package `@cards/trick-taking`, `@cards/bidding`, `@cards/scoring`, `@cards/melding` | Card-game-shaped abstractions in shared infra | Stays per-game                                        |
| `EngineHandle<TState>` (typed boundary)                                                 | Generics across the seam                      | Keep it `unknown` at the boundary                     |

## Permitted (looks like duplication, isn't a violation)

These are explicitly permitted by `PLATFORM_MANIFESTO.md` §7 and
should not be flagged:

- `@belote/ui/BidPanel` and `@coinche/ui/BidPanel` as two separate
  components, even at 90% similarity.
- `BeloteCard` and `CoincheCard` as two separate types, even when
  structurally identical.
- `BeloteRound` and `CoincheRound` as two separate types — no
  bridge type with a `variant` flag.
- Two separate `server-adapter.ts` files, one per game, both
  implementing `EngineHandle` from scratch.
- Near-identical file trees under `packages/belote/*` and
  `packages/coinche/*`.

## Audit procedure

When asked to audit isolation, run these checks in order:

### Step 1: Cross-game imports

```
Grep: pattern "from \"@(belote|coinche|rami|uno|skyjo)"
in path packages/<game>/ where <game> != the matched package
```

Each hit is a violation. Report `file:line — imports @X from package @Y`.

Verify the ESLint `no-restricted-imports` rule covers the new game
names too — if a new game was added without updating the rule,
that's an isolation gap.

### Step 2: Shared infra leaks

```
Grep: pattern "@belote|@coinche|@rami|@uno|@skyjo" in packages/cards/
Grep: pattern "gameId\s*===" in packages/cards/
Grep: pattern "<.*State.*Action.*Event>" in packages/cards/  # generic param leakage
```

Each hit means shared infra is reaching into a specific game or
parametrising over game shape. Report and require the offending code
to move to a per-game package.

### Step 3: Variant flags in shared code

```
Grep: pattern "variant:\s*[\"'](belote|coinche)" in packages/cards/ or shared subfolders
Grep: pattern "switch\s*\(.*gameId" in packages/cards/
```

Variant flags belong in a per-game adapter, not in shared code.

### Step 4: EngineHandle boundary integrity

Open every `*server-adapter.ts` file. Check:

- Implements all 5 `EngineHandle` methods.
- Method signatures use `unknown` at the boundary (no generic params,
  no typed state shapes leaking out).
- Calls `engines.set("<gameId>", factory)` exactly once per game.
- Side-effecting import is wired up in the shared server entry.

### Step 5: Report

Output format:

```
## Isolation Audit — <date>

### Summary
- N game packages scanned, M shared packages scanned
- X violations (high), Y warnings (medium), Z notes (low)

### Violations (block merge)
- `path/to/file.ts:42` — <rule violated> — <required fix>

### Warnings (review needed)
- ...

### Notes (advisory)
- ...
```

**Severity rubric:**

- **Violation**: any forbidden construction from the table above.
- **Warning**: code that _might_ be a violation depending on intent
  (e.g. a `gameId` parameter in `@cards/*` that's used for a benign
  purpose like log labelling — still smells, but might be acceptable
  with a comment).
- **Note**: a near-duplicate worth tracking for the 3-game extraction
  threshold.

## The duplication-vs-extraction call

When someone proposes extracting code from a game package into
`@cards/*`, walk through this decision tree:

1. **How many games have shipped with this exact code shape?**
   - 1 — refuse extraction. There's nothing to share yet.
   - 2 — refuse extraction. Two is a coincidence.
   - 3 — proceed to step 2.

2. **Is the proposed shared API genuinely game-agnostic?**
   - Does it have a `gameId` parameter? → refuse, redesign.
   - Does it return a generic-typed state? → refuse, keep `unknown` or
     keep per-game.
   - Does its name reference a card-game concept (bidding, trick,
     meld, trump, score)? → refuse, this code stays per-game even at
     3 games of evidence.
   - All clear → proceed to step 3.

3. **Is the duplicated code identical (or trivially-different
   whitespace) across all 3 games?**
   - Yes — extract via the process in `GAME_PACKAGE_GUIDELINE.md` §10.
   - No — refuse extraction. "Morally similar" is not enough.

If extraction is approved, the iteration plan title must be
`iteration-NNN-extract-<thing>-to-cards.md` and must list the 3
duplicate sites with diff evidence.

## When to fold a game back

If a game's package set after 5+ iterations is still a near-clone of
another game's with no meaningful specialisation, fold it back per
`GAME_PACKAGE_GUIDELINE.md` §9. This is the **only** sanctioned form
of code reuse between sibling-shaped games.

The fold-back lives **inside** the host game's package as a `variants/`
subdirectory. The variant has its own adapter that registers a
distinct `gameId`. There is still no shared engine.

## What this skill does NOT do

- Visual style review — `layout-auditor` skill.
- Iteration planning / report writing — `iteration-discipline` skill.
- TDD red-green-refactor coaching — `tdd-flow` skill.
- 4-role review — `review-protocol` skill.
- Implementing the EngineHandle adapter — `engine-adapter` skill.

If the user's request crosses into those, hand off cleanly.

## References

- `docs/PLATFORM_MANIFESTO.md` — the binding rules.
- `docs/GAME_PACKAGE_GUIDELINE.md` — package layout + extraction process.
- `docs/PLATFORM_REFACTOR_PLAN_v2.md` — the migration plan.
- `eslint.config.mjs` — the runtime enforcement of Rule 1.
