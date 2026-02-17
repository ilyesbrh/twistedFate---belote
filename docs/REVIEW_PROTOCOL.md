# Review Session Framework (Mandatory Protocol)

Start a structured review session for the previous iterations using four clearly separated roles, in strict order:

1. Product Owner
2. Architect
3. Expert Code Reviewer
4. Tester

The review must be sequential. Each role completes its analysis before the next one begins. No overlap.

---

## Review Structure

For each iteration previously completed:

### 1. Product Owner Review

- Validate that the iteration scope matches the original goal.
- Verify acceptance criteria were clearly defined.
- Confirm the feature delivers the intended value.
- Identify scope creep or missing requirements.
- Approve or request adjustments before moving forward.

### 2. Architect Review

- Evaluate architectural alignment.
- Check separation of concerns.
- Validate domain boundaries (core engine vs UI vs animation).
- Confirm frontend-agnostic design of the core engine.
- Assess scalability, extensibility, and technical debt.
- Identify structural risks.

### 3. Expert Code Review

- Evaluate code quality and clarity.
- Check TDD discipline was followed.
- Ensure small functions and single responsibility.
- Detect hidden side effects.
- Validate naming conventions and ID strategy consistency.
- Suggest refactors if needed.

### 4. Tester Review

- Validate test coverage and reliability.
- Check determinism of tests.
- Ensure animation modules are independently testable.
- Verify unique ID accessibility for Playwright.
- Identify edge cases not covered.
- Confirm no regression risks.

---

## Output Requirements

For each iteration reviewed, produce:

- Iteration name
- Status: Approved / Needs Revision
- Key findings per role
- Critical issues (if any)
- Recommended fixes (clear and actionable)
- Risk level: Low / Medium / High
- Decision before proceeding

No generic feedback.
No vague comments.
Each role must give concrete, structured evaluation.

Proceed iteration by iteration in order.

---

## Activation Rules

This is the official **Review Session Framework** for the project.

Whenever a review is requested, this exact structured review process must be automatically applied without restating it.

The review must always:

- Use the four roles in strict order:
  1. Product Owner
  2. Architect
  3. Expert Code Reviewer
  4. Tester
- Be sequential, never parallel.
- Review iteration by iteration.
- Produce structured output including:
  - Iteration name
  - Status (Approved / Needs Revision)
  - Findings per role
  - Critical issues
  - Recommended fixes
  - Risk level
  - Final decision

Do not improvise the structure.
Do not skip roles.
Do not merge responsibilities.

This is the mandatory review protocol for the entire project lifecycle and must be reused every time a review is requested.
