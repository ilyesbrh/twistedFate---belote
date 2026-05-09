---
name: iteration-discipline
description: Drives the iteration lifecycle exactly as specified in PLAYBOOK.md and MANIFESTO.md. Use when starting a new iteration, when scoping work, when writing the iteration plan or report, when verifying the 4 mandatory checks before commit, or when the user says "let's plan iteration X" / "write the report for X". Refuses to skip steps. Catches scope creep, missing forward-planning (N+1, N+2), and incomplete reports. Sizes iterations against the project's actual cadence (~1 day per iteration).
---

# Iteration Discipline

This skill is the project's authority on **how an iteration is shaped,
sized, executed, and reported**. It implements `MANIFESTO.md` §5–6 and
`PLAYBOOK.md` end-to-end.

## When to invoke

- The user says "let's start iteration NNN" / "plan iteration NNN" /
  "write the report for NNN".
- A piece of work is being scoped and needs to be turned into a
  formal iteration.
- A commit is about to land and the iteration report hasn't been
  written.
- A reviewer asks "is iteration NNN actually finished?"

## The lifecycle (5 phases, no skipping)

This is `PLAYBOOK.md` §"Iteration Lifecycle" verbatim. **Every step
must run. No reordering. No merging.**

### Phase 1 — Scope (the PO step)

1. **Goal in one sentence.** If you can't compress it to one sentence,
   the iteration is too big — split it.
2. **Acceptance criteria.** Concrete, testable bullets. "Coinche
   plays end-to-end" is not a criterion; "a 4-AI Coinche game plays 8
   tricks and persists a `match_history` row with `game_id =
'coinche'`" is.
3. **Files to create / modify.** Listed by path. If the list grows
   past ~5 files, ask whether the iteration is too big.
4. **Reusable symbols from existing packages.** What's already in
   `@belote/core` / `@cards/server-shell` / etc. that this iteration
   builds on.
5. **PO approval before any code.** No code until the plan is
   committed (or at least drafted) at `docs/iterations/iteration-NNN-plan.md`.

### Phase 2 — TDD red-green-refactor

6. **Failing tests written first.** Confirm they fail before
   implementing. The red phase is **not optional**.
7. **Minimum implementation** to pass.
8. **Refactor safely** — extract, rename, simplify. Tests stay green.

If TDD is breaking down (e.g. "the test is hard to write"), the
_design_ is the problem, not the discipline. Stop, reshape the
boundary, write a different test. Don't write production code without
a failing test.

Hand off to the `tdd-flow` skill for the red/green/refactor mechanics.

### Phase 3 — Integration

9. **Update barrel exports** (`src/index.ts`). Keep value exports and
   type exports separated:
   ```ts
   export { foo, bar } from "./module.js";
   export type { Foo, Bar } from "./module.js";
   ```
10. **Register dev fixtures** (if a UI component changed) — drop a
    file in `packages/ui/src/dev/fixtures/<name>.fixtures.tsx` and
    re-export from `dev/fixtures/index.ts`.
11. **Cross-package imports** wired up. Verify
    `pnpm-workspace.yaml` is current.

### Phase 4 — Verification (the four checks)

```bash
pnpm test            # All tests pass, zero failures
pnpm typecheck       # Clean, zero errors
pnpm lint            # Delta-clean over baseline (188 pre-existing)
pnpm format:check    # Clean, zero issues
```

**All four must pass before commit.** If lint shows new errors
beyond the 188 baseline, those are blockers — fix or document why
they're inevitable.

If a check fails, do not commit. Fix the underlying issue. Don't
`--no-verify` past a hook; investigate the hook's complaint.

### Phase 5 — Report

12. Write `docs/iterations/iteration-NNN-report.md` from the
    `PLAYBOOK.md` template (§"Iteration Report Template"). Skeleton:
    - Goal (one sentence)
    - Scope (numbered deliverables)
    - PO decisions locked
    - Tests written (count + descriptions)
    - Implementation summary (files created / modified, key types,
      key functions)
    - Technical decisions table
    - Refactoring performed (or "None")
    - Risks identified (or "None")
    - Validation results (test count, all 4 checks)
    - **Next iteration: N+1 (scope + acceptance criteria)**
    - **Iteration N+2 preview (high-level outline)**
13. The N+1 and N+2 fields are **mandatory** (Manifesto §5 "Forward
    Planning Rule"). An iteration without forward planning is not
    finished.

## Sizing — what fits in one iteration

Calibration from `docs/iterations/`:

- **Surgical fix** (e.g. iteration 018 PWA path): 1 file edited, 1
  regression test, ~3 new tests. ~half a day.
- **Component slice** (e.g. iteration 013 OpponentHand): 1 layout
  module + 1 PixiJS container + Storybook stories + ~25–32 tests.
  ~1 day.
- **Focused feature** (e.g. iteration 014 random matchmaking):
  pure-core module + protocol additions + UI screen + smoke test +
  ~25–35 new tests. ~1–2 days. **This is the upper end** — more than
  this means split.

**Smells that mean the iteration is too big:**

- More than ~5 files to create/modify.
- More than one new package.
- "And while we're in there, also fix..." — that's a separate
  iteration.
- Touches both `@belote/core` and `@belote/ui` for unrelated reasons.
- Test delta > ~50.
- Cannot be reviewed in one sitting.

**Smells that mean the iteration is too small:**

- "Add a comment to file X" — fold into the next real iteration.
- "Update the readme" — same.
- A single typo fix in production code (run as a hot-fix commit, not
  an iteration).

## Common discipline failures (auto-flag)

- **Iteration plan written after the code.** Plans must exist before
  any production code lands. Backfilling the plan defeats the
  purpose. If you find this, ask the user to confirm what was actually
  planned vs what drifted.
- **No N+1 / N+2 in the report.** Block the report as incomplete.
- **The iteration commit message lacks the iteration number.** Per
  Playbook discipline, every iteration commit's subject line carries
  the iteration number (e.g. `feat(coinche): scaffold @coinche/core
baseline (iter 047)`).
- **Multiple iterations in one commit.** Per Playbook, one feat
  commit per iteration. If the diff covers two iterations, split the
  commit.
- **The "Next iteration: N+1" lists more than one iteration's worth
  of work.** That's not an N+1, it's a roadmap. Trim to a single
  iteration.

## Working with this project's other rules

- **Iteration numbering reset.** Per `CLAUDE.md`: reports 017–045
  predate the deleted/rebuilt UI track. New iterations from 017 onward
  overwrite those files. When picking the next iteration number,
  check git log + `ls docs/iterations/` to find the highest number
  actually in use.
- **The 4-role review** (`docs/REVIEW_PROTOCOL.md`) runs _between_
  iteration completion and the next iteration starting, when invoked.
  Hand off to the `review-protocol` skill.
- **Game-package work** is bound by `PLATFORM_MANIFESTO.md` and
  `GAME_PACKAGE_GUIDELINE.md` in addition to standard iteration
  discipline. Hand off to `game-isolation` for boundary checks.

## Templates (use verbatim, edit in place)

### Iteration plan skeleton

```markdown
# Iteration NNN — <one-line title>

## Goal

<one sentence>

## Out of scope

<what we're explicitly NOT doing here>

## Acceptance criteria

- [ ] <concrete, testable>
- [ ] <concrete, testable>
- [ ] All 4 checks (test, typecheck, lint, format:check) pass.

## Files to touch

### New

- `path/to/new-file.ts` — <purpose>

### Modified

- `path/to/existing-file.ts` — <what changes>

## Reusable symbols

- `@<pkg>/foo`, `@<pkg>/bar` — <how this iteration uses them>

## TDD plan

1. <test file>: <test name> — <what it asserts>
2. ...

## Validation

- `pnpm test` — expected delta ≈ +<N> tests.
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check` — clean.
- Manual smoke: <if applicable>.

## Carryforward

<things this iteration leaves behind for N+1 / N+2>
```

### Iteration report skeleton

(Use the template in `PLAYBOOK.md` §"Iteration Report Template" —
copy it verbatim each time, fill it in.)

## What this skill does NOT do

- Run the actual TDD red/green/refactor cycle — `tdd-flow` skill.
- Run the 4-role review — `review-protocol` skill.
- Bootstrap a new game — `new-game-bootstrap` skill.
- Verify game-isolation boundaries — `game-isolation` skill.
- Write code — that's the user's job, with help from other skills.

## References

- `docs/MANIFESTO.md` §5–6 — iteration discipline + report template.
- `docs/PLAYBOOK.md` — full lifecycle with examples.
- `docs/REVIEW_PROTOCOL.md` — 4-role review.
- `docs/iterations/iteration-018-plan.md` — exemplar small iteration.
- `docs/iterations/iteration-014-plan.md` — exemplar larger
  iteration.
- `CLAUDE.md` — project notes including iteration numbering reset
  caveat.
