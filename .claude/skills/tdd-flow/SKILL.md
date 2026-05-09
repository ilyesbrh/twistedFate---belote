---
name: tdd-flow
description: Drives the strict red-green-refactor cycle that MANIFESTO.md mandates as non-negotiable. Use whenever code is being written, modified, or refactored in this project. Refuses to write production code before a failing test exists. Refuses to skip the red phase ("trust me, it'll fail"). Catches the common backwards-flow ("I implemented it, now I'll add tests") and steers back to discipline. Knows the project's specific testing toolchain (vitest, @testing-library/react, jsdom, fake timers, vi.fn()) and lint gotchas (restrict-template-expressions, no-empty-function).
---

# TDD Flow

This skill is the project's authority on **how a single piece of code
gets written**. It implements `MANIFESTO.md` §2 ("Strict TDD,
Non-Negotiable") and the Playbook's red-green-refactor cycle.

## When to invoke

- Code is about to be written or modified.
- The user says "let's implement X" / "add a test for Y" / "fix the
  bug in Z".
- A test is failing and the user is about to "fix" it.
- Mid-iteration, before any new production code lands.

## The cycle (binding, no skipping)

### 1. RED — write the failing test first

- Test goes in `packages/<pkg>/__tests__/<module>.test.ts` (mirroring
  the source path).
- Test is **specific** — describes one behaviour, not "everything
  works".
- Run the test. **Confirm it fails.** A test that doesn't fail in the
  red phase is testing nothing.
- The failure mode matters: a test that fails because the function
  doesn't exist yet is fine; a test that fails because of a typo is
  not — fix the typo and re-run.

### 2. GREEN — minimum implementation

- Write **the simplest code that makes the test pass**. No
  speculation. No "while I'm here, also add X".
- Run the test. Confirm it passes.
- Run the **full suite** (`pnpm test`) — confirm no regressions.

### 3. REFACTOR — improve without changing behaviour

- Now (and only now) clean up: extract helpers, rename, simplify.
- Tests stay green throughout. If a test breaks during refactor, the
  refactor changed behaviour — revert and try a smaller step.
- Refactor is **optional** — if the green-phase code is already
  clean, skip it.

## Project-specific testing recipes

### Toolchain

- **Vitest** for unit tests.
- **@testing-library/react** + **jsdom** for component tests.
- **`vi.useFakeTimers()` / `vi.advanceTimersByTime(ms)`** for testing
  delays (e.g. session `stepDelayMs`, the 5s round-completion timer
  in `room.ts`).
- **`vi.fn()`** for callback mocks. **Never `() => {}`** — ESLint's
  `no-empty-function` rule flags it.
- **`vi.spyOn(...)`** for partial mocks of real modules.

### Common lint gotchas (per `MEMORY.md`)

- **`restrict-template-expressions`** — numbers in template literals
  must be wrapped: `` `position is ${String(i)}` ``, not `` `position
is ${i}` ``.
- **`no-empty-function`** — use `vi.fn()` instead of `() => {}` in
  tests.
- **No `as` casts** — they require a justification or removal. In
  tests, use `vi.fn() as unknown as <Type>` only when the real type
  is genuinely unreachable (rare).
- **No `any`** — `unknown` + a typed validator is the right pattern.

### TS lib config

- `tsconfig` lib is `ES2022` — there are **no DOM types** by default
  in non-UI packages. To use `setTimeout` in `@belote/app` (or any
  non-browser package), add a local declaration:
  ```ts
  declare function setTimeout(fn: () => void, ms: number): unknown;
  ```

### Test file conventions

- Each source file gets its own test file at the mirroring path.
- Group with `describe(...)`. One `describe` per public API.
- Test names are sentences: `it("places a bid when it is the
player's turn", ...)`.
- **No mocking of internal modules** unless absolutely necessary.
  Pure-logic tests should hit the real code paths; mocks creep in
  when seams are wrong.

### UI component tests

- Render with `@testing-library/react`'s `render(...)`.
- Query by `data-testid` (set on every interactive element per
  `MANIFESTO.md` §7).
- Click with `await userEvent.click(...)`. Userevent is async — your
  tests are async functions.
- For visual smoke (does the component render at all?): a fixture in
  `packages/ui/src/dev/fixtures/<name>.fixtures.tsx`. The
  barrel-sweep test at `packages/ui/__tests__/fixtures.test.tsx`
  auto-verifies render-without-crash. **This is not a substitute for
  unit tests** — it just catches "does it explode on render".

### Determinism

- Inject the RNG (`rng?: () => number` on `SessionConfig`). Tests pass
  a seeded RNG (or a stub returning fixed values).
- Inject the ID generator (`idGenerator?: IdGenerator`). Tests pass a
  deterministic generator that emits `card-1`, `card-2`, etc.
- **Never depend on `Date.now()` directly** — use fake timers or a
  passable `now: () => number`.

## Backwards-flow detection (auto-flag)

These are the patterns that mean TDD has been skipped. **Each is a
hard stop.**

| Symptom                                                                             | What it means                                                   | Fix                                                                                                                                                                                               |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User says "I implemented it, now I'll add tests"                                    | Backwards                                                       | Stop. Revert the implementation (or stash it). Write the failing test against the spec. _Then_ re-implement (you can re-stage the stash if it still passes — but verify the red phase ran first). |
| Test was added in the same commit as the implementation, with no red-phase evidence | Almost backwards                                                | Confirm with the user: did the test fail before the implementation? If they can't say, treat as backwards.                                                                                        |
| Test passes immediately on first run after being written                            | Either testing nothing, or the implementation was there already | Make the assertion stricter until it fails, _then_ implement.                                                                                                                                     |
| User says "trust me, it would have failed"                                          | No                                                              | The red phase exists for a reason. Re-run the test against `// @ts-expect-error` or against an empty function to confirm failure mode.                                                            |
| User says "I'll add tests later, just ship the fix"                                 | Iteration is invalid                                            | Block until tests exist. The 4 checks won't pass without them anyway.                                                                                                                             |

## When the test is hard to write

If you can't write a clean failing test, the **design** is the
problem, not your TDD. Common reshape moves:

- **Pure logic mixed with I/O** → split. Pure-logic gets a unit test;
  I/O is verified by integration / smoke.
- **Function with too many side effects** → break into smaller pure
  functions; test each.
- **State buried in a class with no public observation** → expose a
  getter, or refactor to pass state in/out.
- **Component renders depend on external state** → inject as props.

If reshape is too big to do in this iteration, **stop and write an
iteration plan for the reshape first**. Don't write production code
without a failing test.

## What this skill does NOT do

- Run iteration discipline (plan / report) — `iteration-discipline`
  skill.
- Run the 4-role review — `review-protocol` skill.
- Verify game-isolation boundaries — `game-isolation` skill.
- Decide what to test — that's design work, prerequisite to TDD.

## Common project-specific test shapes

### Pure model test (engine logic)

```ts
import { describe, it, expect } from "vitest";
import { calculateBeloteRoundScore } from "../src/models/scoring.js";

describe("calculateBeloteRoundScore", () => {
  it("awards opponents 162 points when contracting team fails", () => {
    const result = calculateBeloteRoundScore(/* ... */);
    expect(result.contractingTeamPoints).toBe(0);
    expect(result.opposingTeamPoints).toBe(162);
  });
});
```

### Session test with fake timers

```ts
import { describe, it, expect, vi } from "vitest";
import { GameSession } from "../src/session.js";

describe("GameSession", () => {
  it("schedules the next AI step after stepDelayMs", () => {
    vi.useFakeTimers();
    const session = new GameSession({ /* ... */, stepDelayMs: 1000 });
    session.dispatch(/* ... */);
    expect(/* AI not yet acted */).toBe(true);
    vi.advanceTimersByTime(1000);
    expect(/* AI acted */).toBe(true);
    vi.useRealTimers();
  });
});
```

### Component test

```ts
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BidPanel } from "../src/components/BidPanel/BidPanel.js";

describe("BidPanel", () => {
  it("calls onPlaceBid when a suit + value combination is selected", async () => {
    const user = userEvent.setup();
    const onPlaceBid = vi.fn();
    render(<BidPanel onPlaceBid={onPlaceBid} /* ... */ />);
    await user.click(screen.getByLabelText("Pick spades"));
    await user.click(screen.getByLabelText("Bid 80 points"));
    expect(onPlaceBid).toHaveBeenCalledWith({ suit: "spades", value: 80 });
  });
});
```

## References

- `docs/MANIFESTO.md` §2 — TDD as non-negotiable.
- `docs/PLAYBOOK.md` §"Phase 2: TDD Red-Green-Refactor".
- `CLAUDE.md` — project notes (memory).
- Memory file: `MEMORY.md` lint gotchas + setTimeout pattern.
- Existing exemplar tests:
  - `packages/ui/__tests__/OnlineRandomScreen.test.tsx`
  - `packages/ui/__tests__/OnlineLobby.test.tsx`
  - `packages/core/__tests__/scoring.test.ts` (per file tree)
