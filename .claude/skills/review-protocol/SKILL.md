---
name: review-protocol
description: Runs the project's mandatory 4-role review (Product Owner → Architect → Code Reviewer → Tester) on a completed iteration or branch. Use when the user says "review iteration X", "do a review", "PO review please", "audit the last commit", or asks for a structured assessment of recent work. Sequential roles, never parallel, never merged. Produces a structured verdict (Approved / Needs Revision) with risk level. The Architect role explicitly checks platform-manifesto boundary violations (cross-game imports, generic contagion, gameId switches in shared code).
---

# Review Protocol

This skill is the project's authority on **the mandatory 4-role
review** defined in `docs/REVIEW_PROTOCOL.md`. It must run sequentially,
one role at a time, with no merging of responsibilities.

## When to invoke

- The user says "review iteration NNN" / "do a review" / "review this
  branch" / "PO check please" / "audit the last commit".
- An iteration has just been reported as complete.
- A platform-affecting refactor lands and needs structured assessment.
- A reviewer-class agent (e.g. `feature-dev:code-reviewer`) returns
  findings — wrap them into the 4-role frame.

## The four roles, in strict order

Per `docs/REVIEW_PROTOCOL.md`. **No parallelism. No reordering. No
merging.**

### Role 1 — Product Owner

Concerns:

- Does the iteration scope match its stated goal?
- Were acceptance criteria clearly defined upfront and met?
- Does the feature deliver the intended user value?
- Scope creep — anything shipped that wasn't planned?
- Anything missing from the original requirements?

Output: **Approved / Needs Revision** + bullet findings.

### Role 2 — Architect

Concerns:

- Architectural alignment with `MANIFESTO.md` + `PLATFORM_MANIFESTO.md`.
- Layer separation (core / app / animation / ui per Playbook).
- Domain boundaries respected.
- Frontend-agnostic core engine maintained.
- Scalability, extensibility, technical debt introduced/avoided.
- Structural risks identified.

**Platform-affecting work additionally checks** (per
`PLATFORM_MANIFESTO.md` §4):

1. **Boundary integrity** — does the change introduce coupling that
   crosses the platform rules?
   - Cross-game imports?
   - Shared base classes / generic engine contagion?
   - `gameId` switches in `@cards/*`?
   - Generics escaping the `EngineHandle` boundary?
   - Per-game variant flags in shared code?
     Either of these is grounds for **Needs Revision** regardless of
     how clean the implementation looks.

2. **Duplication-vs-extraction call** — if the change extracts shared
   code, is the extraction supported by ≥3 games' worth of evidence?
   Two games is a coincidence; three is a pattern. Speculative
   extraction is grounds for **Needs Revision**.

If platform-affecting, hand off the boundary check to
`game-isolation` before completing this role.

Output: **Approved / Needs Revision** + bullet findings.

### Role 3 — Expert Code Reviewer

Concerns:

- Code quality, clarity, naming.
- TDD discipline followed (red phase confirmed, tests precede
  implementation).
- Functions small, single-responsibility.
- Hidden side effects detected.
- ID strategy consistent (`MANIFESTO.md` §7 — every entity has a
  unique ID).
- Refactor opportunities flagged.

Specific things to grep for in the diff:

- `as ` casts — each requires justification or removal.
- `any` types — each requires removal.
- Magic numbers — extract to named constants.
- Inline `style={{}}` for static values — move to CSS modules.
- Hard-coded colors outside `tokens.css` — replace with `var(--*)`.
- Comments that describe _what_ (well-named code already says it) vs
  _why_ (load-bearing, keep).
- Iteration commit messages without the iteration number.

Output: **Approved / Needs Revision** + bullet findings, with
file:line references where applicable.

### Role 4 — Tester

Concerns:

- Test coverage of pure logic.
- Test determinism (seeded RNG, no time-dependent flakiness).
- Animation modules independently testable.
- Unique IDs accessible for Playwright (`data-testid` everywhere).
- Edge cases covered (0 cards, 1 card, max cards, etc.).
- Regression risks — does this change break a path that wasn't
  re-tested?

Specific checks:

- Were tests written **before** the implementation? (Confirm via the
  iteration plan + git log if visible.)
- Does the test suite still produce 705+ passing tests, or whatever
  the running baseline is?
- Are there tests for the failure modes, not just the happy path?
- For UI components: does the component have a fixture in
  `packages/ui/src/dev/fixtures/` so the screen viewer at `?screens`
  can render it in isolation?

Output: **Approved / Needs Revision** + bullet findings.

## Output format

Per role, produce:

```
## Role <N>: <RoleName> Review

**Status**: Approved | Needs Revision

### Findings
- <concrete, file:line if applicable>
- <concrete, file:line if applicable>

### Critical issues (if any)
- <only if Status = Needs Revision>
```

After all four roles, produce the consolidated verdict:

```
## Iteration NNN — Review Verdict

**Overall status**: Approved | Needs Revision
**Risk level**: Low | Medium | High

### Per-role status
- PO: <status>
- Architect: <status>
- Code Reviewer: <status>
- Tester: <status>

### Critical issues (must fix before proceeding)
- <list, with which role flagged each>

### Recommended fixes (clear and actionable)
- <list>

### Decision before proceeding
- <single sentence: continue / fix-and-recheck / abandon>
```

**Risk-level rubric:**

- **Low** — all roles approved; no critical issues; minor follow-ups
  acceptable.
- **Medium** — one role flagged Needs Revision but the issue is
  isolated and fixable in one iteration.
- **High** — multiple roles flagged Needs Revision, OR the Architect
  flagged a platform-manifesto violation, OR the Tester flagged a
  regression risk in critical paths.

## Procedural rules (binding)

1. **Never run roles in parallel.** Each role completes before the
   next begins. If the user asks for a faster review, refuse — the
   protocol exists for a reason.
2. **Never merge roles.** "Combined PO + Architect view" is forbidden.
3. **Never skip roles.** A 3-role review is incomplete.
4. **Never improvise the structure.** Use the format above verbatim.
5. **Never give "generic" feedback.** Each finding must be concrete
   and actionable. "Could be cleaner" is not a finding; "the
   `_handlePlaceBid` method has 4 levels of nesting; extract the
   bid-validation block" is.
6. **Per `MANIFESTO.md`: root-cause fixes only.** If a finding is a
   symptom, trace to the root cause and report that. Don't recommend
   patching the symptom.

## What this skill does NOT do

- Apply the recommended fixes — that's the user's next iteration.
- Run iteration discipline (plan / report) — `iteration-discipline`
  skill.
- Run the boundary check on platform code — delegates to
  `game-isolation` skill.
- Visual / layout audit — `layout-auditor` skill.
- TDD coaching — `tdd-flow` skill.

## Common review failures (auto-flag)

- Reviewer asks for "the review" without specifying which iteration.
  → Ask for the iteration number or the diff scope before starting.
- Reviewer wants only the Architect role. → Refuse; the protocol is
  4 sequential roles. Offer instead: "I can run all four with
  emphasis on architectural concerns."
- An iteration is reviewed with no plan or report. → Block; ask for
  the plan/report first (hand off to `iteration-discipline`).
- Findings without file:line references where they could be given.
  → Flag back to the reviewer (yourself) and add specifics.

## References

- `docs/REVIEW_PROTOCOL.md` — the protocol verbatim.
- `docs/PLATFORM_MANIFESTO.md` §4 — Architect's extra concerns.
- `docs/MANIFESTO.md` §6 — discipline this protocol enforces.
