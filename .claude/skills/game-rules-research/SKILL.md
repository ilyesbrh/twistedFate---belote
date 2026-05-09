---
name: game-rules-research
description: Researches the rules of a card game from authoritative online sources, resolves regional variants by locking explicit choices, and produces docs/games/<game>/GAME_RULES.md as the PO source-of-truth. Use BEFORE new-game-bootstrap whenever a new game is being added (Coinche, Rami, Uno, Skyjo, Tarot, Bridge…). Refuses to leave any decision as "depends on region" — every variant lands on a single locked value or is explicitly marked deferred. Outputs the doc in the same shape as the existing docs/GAME_RULES.md so iteration plans can reference it consistently.
---

# Game Rules Research

This skill is the project's authority on **how a new game's rules
become a binding PO source-of-truth**. It is the prerequisite to
`new-game-bootstrap`. No game's bootstrap iteration starts until its
rules doc passes this skill's discipline.

## When to invoke

- The user says "let's add <game>" / "research <game> rules" / "lock
  the rules for <game>".
- A `new-game-bootstrap` invocation is blocked because rule decisions
  aren't locked.
- The PO wants to amend an existing rules doc (treat as a re-run,
  scoped to the disputed sections).

## What this skill produces

A single file: `docs/games/<game>/GAME_RULES.md`, modelled on the
existing `docs/GAME_RULES.md` (which is the Tunisian Belote source-of-
truth). Same shape, same headings, same decision-table style.

The directory `docs/games/<game>/` may also hold supporting research
notes (`SOURCES.md`, scoring-table PDFs, etc.) — but the canonical
rules doc is `GAME_RULES.md` and is the only one the bootstrap skill
reads.

## The research pipeline (sequential, no skipping)

### Step 1 — Source survey

Pull from at least **three** authoritative sources. Cross-reference
them. If two contradict, that's a regional variant — flag it as a
decision (Step 3).

Authoritative for French card games:

- **Pagat.com** — encyclopaedic, written by John McLeod, citations
  per regional variant. Strong baseline.
- **Wikipedia FR + EN** — usually summarises the canonical version
  but lists variants in the body. Cite specific revision date.
- **Fédération Française de Belote (FFB) / Fédération Française de
  Coinche (FFC)** — official tournament rules. Most authoritative
  for Coinche specifically.
- **Académie des jeux** / classic French rule books (Marianne
  Mailliet, _Le Livre Officiel des Règles_).
- **Bridge Base / WBF** for Bridge, **UNO official rules** at
  mattelgames.com for Uno, **Skyjo official rule sheet** (Magilano)
  for Skyjo.

For non-French games, prefer the publisher's own rule sheet first,
then Pagat / BoardGameGeek's collated rules.

Use `WebSearch` to locate sources. Use `WebFetch` with a specific URL
when a source needs detailed reading. **Do not** trust forum posts,
YouTube tutorials, or AI-generated rule summaries — they drift.

### Step 2 — Build the variant matrix

For every rule that varies between sources, record:

```
| Rule                            | Source A says | Source B says | Source C says |
|---------------------------------|---------------|---------------|---------------|
| Minimum bid (Coinche)           | 80            | 80            | 110 (some clubs) |
| Capot points (succeeded)        | 250           | 250           | 252 |
| Belote/Rebelote auto-detect?    | manual call   | manual call   | manual call |
| ...                             | ...           | ...           | ...           |
```

Save this matrix to `docs/games/<game>/SOURCES.md` (with full URLs,
fetch date, and the matrix). It's evidence the PO needs to lock
decisions.

### Step 3 — Lock decisions (the PO step)

For every row in the matrix where sources differ, the PO must pick
one value. Allowed picks:

- **Decided: <value>** — the locked answer. Cite which source
  supports it.
- **Deferred** — out of scope for V1 of this game. Will be revisited
  in a later iteration. **Must include a follow-up criterion** that
  triggers the revisit (e.g. "if ≥10% of online matches request
  capot, lock it").

**Forbidden answers:**

- **"Depends on region"** — refuse. Pick one. The codebase is one
  binary; it can't fork by region at this stage.
- **"Configurable"** — refuse for V1. Configurability is per
  `PLATFORM_MANIFESTO.md` §6 a forbidden construction (variant flags
  in shared code). If two real regional preferences emerge later,
  they ship as separate game packages (e.g. `@coinche-fr/*` vs
  `@coinche-be/*`).
- **"TBD"** with no follow-up criterion — refuse. Either lock or
  defer-with-trigger.

The bootstrap skill will refuse to proceed if any row in the locked
table is "Depends on region" / "Configurable" / "TBD without
trigger".

### Step 4 — Write `GAME_RULES.md`

Use this template. Headings match the existing
`docs/GAME_RULES.md` so anyone who knows that doc can read the new
one without re-orientation.

```markdown
# <Game> — Rules Reference

Based on <primary source>, with variants resolved per the decisions
table at the end of this document.
This document serves as the **Product Owner's source of truth** for
feature decisions. Authoritative for engine + UI implementation.

---

## 1. Players & Setup

- N players, M teams of P
- Seating: ...
- Deck: ...

## 2. Card Ranking

### Trump suit / atout (high → low)

...

### Non-trump (high → low)

...

## 3. Card Points

| Card | Trump | Non-trump |
| ---- | ----- | --------- |
| ...  | ...   | ...       |

- Total deck points: ...
- Last-trick bonus: ...
- Maximum round total: ...

## 4. Dealing

...

## 5. Bidding

### Standard format

...

### Special contracts (the variants)

| Contract                | Description | Decision           |
| ----------------------- | ----------- | ------------------ |
| All-trumps / Tout-atout | ...         | Decided / Deferred |
| No-trumps / Sans-atout  | ...         | Decided / Deferred |
| Capot                   | ...         | Decided / Deferred |
| Generale                | ...         | Decided / Deferred |
| Coinche                 | ...         | Decided / Deferred |
| Surcoinche              | ...         | Decided / Deferred |

## 6. Gameplay (trick-taking / melding / shedding…)

### Play order

...

### Following rules

...

### Trick winner / round winner

...

## 7. Scoring

### Contract success

...

### Contract failure

...

### Multipliers (coinche, surcoinche, etc.)

...

### Target score

- Common target: ...
- Configurable: yes/no — Decision: ...

## 8. Announcements & Bonuses

### Belote / Rebelote (or game's equivalent)

...

### Sequence announcements (if applicable)

| Announcement       | Description                    | Points                  |
| ------------------ | ------------------------------ | ----------------------- |
| Tierce             | 3 consecutive cards, same suit | 20                      |
| Cinquante (Quarte) | 4 consecutive cards, same suit | 50                      |
| Cent (Quinte)      | 5 consecutive cards, same suit | 100                     |
| Carré              | 4 of a kind (same rank)        | varies (200/150/100/50) |
| ...                | ...                            | ...                     |

Announcement timing rules: ...
Announcement comparison rules (whose declaration wins): ...

## 9. Decisions Locked

(The full table from Step 3. Every row has Status = Decided / Deferred-with-trigger.)

| Decision | Options surveyed | Status | Rationale | Source |
| -------- | ---------------- | ------ | --------- | ------ |
| ...      | ...              | ...    | ...       | ...    |

## 10. Out of scope for V1

(Anything explicitly **not** being built in the first ship.
Reference the trigger condition that would bring it back.)

- ...

---

_Locked YYYY-MM-DD by <PO>. Amendments require an iteration plan
titled `iteration-NNN-<game>-rules-amendment.md` per
`PLATFORM_MANIFESTO.md` §8._
```

### Step 5 — PO sign-off

Surface the doc to the PO (the user). Specifically ask them to
confirm:

1. Every "Decided" row matches their intent.
2. Every "Deferred" row's trigger condition is one they actually
   accept.
3. The Out-of-scope §10 list contains nothing they want in V1.

Don't move to bootstrap until you have explicit "yes, locked"
confirmation. "Looks good" is acceptable; silence is not.

### Step 6 — Hand off

Once locked, hand off to `new-game-bootstrap`. The bootstrap skill
will read `docs/games/<game>/GAME_RULES.md` and proceed.

## Quality bar — what makes a research output good

- **Three sources minimum** in `SOURCES.md` with URLs + fetch dates.
- **Every variant resolved** — no "TBD" in the decisions table.
- **No invented rules.** If sources don't cover something, mark it
  "Out of scope for V1" with a trigger.
- **Citations on every locked decision** — which source supports it.
- **Plain language** in §1–§8. The PO should be able to read the doc
  without consulting Pagat side-by-side.
- **Implementation-friendly** — every numeric value, every threshold,
  every edge case is concrete enough that a developer can write a
  unit test from it without re-researching.

## Refusal cases

The skill refuses to produce a final doc if:

- Fewer than 3 sources surveyed.
- A locked decision has no source citation.
- A "Decided" value contradicts all surveyed sources without
  rationale.
- Any row is "Configurable" or "Depends on region".
- The PO has not signed off.

In refusal, surface the specific blocker and the next step. Don't
silently fudge the doc.

## Specific gotchas per game family

### Trick-taking with bidding (Belote, Coinche, Tarot, Bridge)

- **Atout / trump rules** — pick **one** strict rule for "must
  overtrump partner" (always required vs optional vs only when
  opponent is winning). Sources differ on this; lock it.
- **All-trumps (tout-atout)** — point values change (Jack=14, 9=9
  per FFC, but some clubs use Jack=20/9=14 like Belote regular).
  Lock the specific table.
- **No-trumps (sans-atout)** — point values use the non-trump column
  uniformly. Confirm Jack value (sometimes 2, sometimes 0).
- **Belote/Rebelote announcement** — manual call vs auto-detect.
  Tournament rules require manual; casual play often auto-detects.
- **Sequence announcements (Tierce, Cinquante, Cent)** — when are
  they declared (before first trick? during first trick?). Whose
  declaration wins when both teams have one (highest card? highest
  combination value? trump beats non-trump?). All vary; lock each.
- **Carré** — point value varies by rank. Standard French Coinche:
  carré of Jacks = 200, 9s = 150, A/10/K/Q = 100, others = 0.
  Confirm against current FFC sheet.

### Set collection / melding (Rami, Canasta)

- **Initial meld threshold** — first meld point requirement (varies:
  free, 30, 51).
- **Joker behaviour** — substitute only / wildcard / capturable.
- **Discard pile rules** — top card only / take whole pile / face-up
  vs face-down.

### Shedding (Uno, Crazy Eights)

- **Stacking +2 / +4** — allowed or not? Mattel's official rules say
  no; 90% of households play yes. Lock per V1 vision.
- **Calling Uno penalty** — must call before discarding last card or
  after?

### Tableau / scoring (Skyjo)

- **End-of-round trigger** — first to flip all cards / first to reach
  N points.
- **Doubling penalty** — when triggering player doesn't win, are
  their points doubled? Magilano's official rules: yes.

## What this skill does NOT do

- Bootstrap the new game's package set — `new-game-bootstrap` skill.
- Implement the rules in code — that's per-iteration work after
  bootstrap.
- Write the engine adapter — `engine-adapter` skill.
- Decide _which_ game to research — that's a PO/Vision decision.

## References

- `docs/GAME_RULES.md` — exemplar (Tunisian Belote, the existing
  in-tree rules doc). Use its shape verbatim.
- `docs/PLATFORM_MANIFESTO.md` §6 — why "configurable / depends on
  region" is forbidden in V1 rules.
- `docs/GAME_PACKAGE_GUIDELINE.md` §11 — lists the open Coinche
  rules questions explicitly deferred from earlier work.
- `docs/VISION.md` — confirms the game is on-roadmap before research
  starts.
