# TwistedFate - Belote: Project Manifesto

Restart the project from zero and rebuild it as a **mobile-first web Belote game**, with strict engineering discipline and isolated systems.

Delete everything. No legacy structure. No incremental patching. Full clean restart.

---

# Foundational Principles

## 1. Mobile-First

- Design strictly for mobile screens first.
- Touch interactions are primary.
- Performance and responsiveness are mandatory.
- Desktop is secondary.

---

## 2. Strict TDD (Non-Negotiable)

Every feature follows:

1. Define scope (PO step).
2. Define acceptance criteria.
3. Write failing tests.
4. Implement minimal logic.
5. Pass tests.
6. Refactor safely.
7. Review.
8. Document iteration report.

No feature is complete without:

- Unit tests
- If relevant, integration tests
- Deterministic behavior

---

## 3. Frontend-Agnostic Core Game Engine

Design a pure domain engine that:

- Contains all Belote rules and scoring logic.
- Has zero UI dependency.
- Has zero framework dependency.
- Has no DOM access.
- Is deterministic and testable in isolation.
- Exposes a clear API:
  - Commands (e.g., playCard, shuffleDeck, bid)
  - Events (e.g., cardPlayed, roundEnded)

The engine must:

- Be state-driven.
- Use pure functions wherever possible.
- Explicitly model:
  - Card
  - Deck
  - Player
  - Team
  - Round
  - Trick
  - Score
  - Game state machine
- Separate state transitions from side effects.
- Be runnable in Node or browser without modification.

---

## 4. Animation Engine (Isolated and Testable)

Animations must be built as a **separate animation engine**, independent from:

- Core domain
- UI framework
- Rendering layer

Each animation must:

- Be implemented block by block.
- Be individually testable.
- Be isolated from other animations.
- Have its own test suite.
- Be validated before integration.

Examples of isolated animation modules:

- Card shuffle animation
- Card hover animation
- Card flip / turn animation
- Card movement to table
- Table layout positioning engine
- Score update animation

Rules:

- No animation should depend directly on game logic.
- Animation engine consumes state and produces visual transitions.
- Each animation is a module with:
  - Clear input
  - Deterministic behavior
  - Test coverage
  - Integration tests only after isolation validation

No animation batching.
No combined visual systems before independent validation.

---

## 5. Iterative Development Model (Ultra Small Iterations)

Every small piece is its own iteration.

Examples of valid iteration sizes:

- Setup project structure
- Configure testing framework
- Create Card model
- Create Player model
- Create Deck generator
- Implement shuffle logic
- Create GameState base
- Create first animation skeleton
- Implement card hover animation only
- Add unique ID system
- Add command dispatcher

Each iteration must include:

1. Scope definition
2. Acceptance criteria
3. Tests written first
4. Implementation
5. Refactor
6. Validation
7. Detailed iteration report

**Forward Planning Rule**: Every iteration report must define what will be built in iteration N+1 and iteration N+2. This ensures continuous visibility on the roadmap and prevents scope drift.

---

## 6. Mandatory Detailed Iteration Report

Every iteration must produce a structured report including:

- Iteration name
- Goal
- Scope
- Tests written
- Implementation summary
- Refactoring performed
- Technical decisions
- Risks identified
- Validation results
- Next iteration candidate (N+1): defined scope and acceptance criteria
- Iteration N+2 preview: high-level scope outline

Iterations must stay small.
Focus over speed.

---

## 7. Unique ID System (Global Requirement)

Everything must have a unique ID.

This includes:

- Game instance
- Player
- Card
- Deck
- Trick
- Round
- Team
- UI components
- Animation instances
- DOM components
- Interactive elements

Rules:

- IDs must be deterministic when needed for testing.
- All components must be queryable by ID.
- Structure must support Playwright e2e testing easily.
- No anonymous components.
- No dynamic elements without IDs.

UI must expose:

- data-testid or similar attribute strategy.
- Consistent ID naming convention.

---

## 8. No Parallel Systems

- One feature at a time.
- One iteration at a time.
- No simultaneous engine + animation + UI feature development.
- Sequence is mandatory.

---

# Required Architecture Layers

1. Core Domain Engine (Pure logic, TDD first)
2. Application Layer (Command/Event orchestration)
3. Animation Engine (Isolated and testable)
4. UI Layer (Mobile-first rendering)
5. E2E Testing Layer (Playwright-ready with deterministic IDs)

Strict separation between layers.

---

# Starting Point

Begin from zero with:

Iteration 1:

- Project setup
- Folder structure
- Test framework configuration
- Linting + formatting
- Base ID generation utility

Only after validation move forward to:

Iteration 2:

- Core domain: Card entity (TDD)

Then continue progressively.

No shortcuts.
No feature stacking.
No merging unfinished systems.

Build it like a real production-grade game system.
