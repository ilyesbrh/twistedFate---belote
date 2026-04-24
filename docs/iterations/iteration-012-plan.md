# Iteration 012 — Rules corrections & contract UX

## User feedback (source of truth)

The user played the game and is happy with progress. Before deeper AI work, the following must land so the game feels real.

### UI additions required

1. Show the **auction winner** (star on their avatar, or similar indicator).
2. Display the **current bid value and trump suit** during play.
3. Display **live round points per team** during play.
4. **Group cards by suit** in the player's hand (hearts, spades, diamonds, clubs).
5. Rename "Coinche" → "**Contrer**" (label only, not internal code).

### Rule corrections required

1. **You cannot contrer your own partner.** — _already enforced in `bid.ts:169`; add an explicit test._
2. **Bidding starts at 90** (currently 80).
3. **Round points are rounded to the nearest 10** (`.5` rounds up). Examples:
   - A:56 / B:106 → 60 / 110
   - A:55 / B:107 → 60 / 110
   - A:54 / B:108 → 50 / 110
4. **Failed contract:** opposing team gets **160**, contracting team gets **0**.
5. **Contré (doubled):** 320 points to winning side.
6. **Surcontré (redoubled):** 640 points to winning side.
7. **Belote (Q+K of trump on same team) = +20**, counted **inside** the contract check.
   - Example: team bid 130 ♠. Raw points 57 / 105 + Belote → rounded 60 / 110 + 20 = **130** → contract met.

---

## Findings (before planning)

- Monorepo: `@belote/core` (domain), `@belote/app` (session/commands), `@belote/ui` (React+Vite), `@belote/animation` (stub).
- Partner-contrer check already present at `packages/core/src/models/bid.ts:169`.
- Current minimum bid = 80 at `packages/core/src/models/bid.ts:11`.
- No rounding logic today. Scoring at `packages/core/src/models/scoring.ts:132-173`.
- Failed contract currently awards opponent `162 × coincheLevel`; must become `160 × coincheLevel`.
- Belote bonus is currently added **after** the contract check; must be moved **into** the check.
- Hand displayed unsorted in `packages/ui/src/components/HandDisplay/HandDisplay.tsx`.
- No on-screen contract holder / running points during play — only in `RoundSummary`.
- "Coinche" label appears in `BidPanel.tsx:85`, `gameMessages.ts:87,90`, `RoundSummary.tsx:122`.

---

## Design decisions (confirmed with user context)

- **Contré success:** winning side gets `160 × coincheLevel` flat (i.e. 320 / 640). Losing side: 0. Belote bonus (20) still applies to the team holding Q+K of trump on top of that.
- **Contré failure** is symmetric: if contracting team fails under contre → opponents get `160 × coincheLevel`.
- **Belote on failed contract:** the team holding Q+K still keeps its 20.
- **Suit display order:** ♥ ♠ ♦ ♣ (alternating red/black). Trump suit moved to the front when known.
- **Rounding rule:** nearest multiple of 10, `.5` rounds up → `Math.floor(points / 10 + 0.5) * 10`.
- **Round order for scoring:** 1) sum card points, 2) round each team to nearest 10, 3) add belote, 4) check contract, 5) apply win/lose/contre multipliers.
- **Internal identifiers stay** `coinche` / `surcoinche` in core; only UI labels change to "Contrer" / "Surcontrer".

---

## Work plan

### Iteration A — Scoring & bidding rules (core, pure logic)

**A1. Minimum bid = 90**

- `packages/core/src/models/bid.ts:11` → `BID_VALUES = [90, 100, ..., 160]`.
- Update bidding tests and AI strategy tests that relied on 80.

**A2. Round-to-nearest-10 helper**

- New pure function `roundToNearestTen(points)` in `scoring.ts`.
- Formula: `Math.floor(points / 10 + 0.5) * 10`.
- Dedicated test table covering 0, 4, 5, 14, 54, 55, 56, 105, 106, 107, 108, 152, 162.

**A3. Rework `calculateRoundScore`**
Order:

1. Sum raw card points per team (includes 10 de der on last trick).
2. Round each team's total to nearest 10.
3. Add belote bonus (20) to the team that holds Q+K of trump.
4. Determine `contractMet = (contractingTeamRoundedWithBelote) >= contract.value`.
5. Awards:
   - **Contract met, level 1:** each team keeps its rounded-with-belote total.
   - **Contract met, level ≥2 (contre/surcontre):** winning side gets `160 × coincheLevel`, losing side 0. Belote holder still gets +20.
   - **Contract failed, level 1:** opponent gets 160, contractor 0. Belote holder still gets +20.
   - **Contract failed, level ≥2:** opponent gets `160 × coincheLevel`, contractor 0. Belote holder still gets +20.

**A4. Explicit partner-contrer test**

- Add focused test in `bid.test.ts` that placing `coinche` on partner's bid returns invalid.

### Iteration B — UI: live contract & scores

**B1. Contract holder star on avatar**

- Extend `PlayerAvatar` with `isContractHolder` prop. CSS star badge.
- Wire from `GameTable` using `state.contract?.bidderPosition`.

**B2. Current bid + trump banner**

- Extend `ScorePanel` (already shows trump) to include contract value and coinche level: e.g. `130 ♠ ×2 CONTRE`.

**B3. Live round points per team**

- Pure helper `calculateRunningPoints(round)` in core returning `{ contractingTeamPoints, opponentTeamPoints }` from completed tricks.
- New section in `ScorePanel` — "This round".

### Iteration C — UI: hand sorting & relabel

**C1. Sort hand by suit, then rank**

- Pure `sortHandForDisplay(hand, trumpSuit?)` in core.
- Suit order: trump first (if known) then ♥ ♠ ♦ ♣ among the rest.
- Rank order = belote order (trump vs non-trump).
- `HandDisplay` uses the sorted array.

**C2. Relabel "Coinche" → "Contrer"**

- `BidPanel.tsx:85` button → "Contrer" / "Surcontrer".
- `gameMessages.ts:87,90` → "Contre !" / "Surcontre !".
- `RoundSummary.tsx:122` → "×2 CONTRE" / "×4 SURCONTRE".
- Internal types remain `coinche`/`surcoinche`.

### Iteration D — AI (deferred, not in this iteration)

Scoped out: bidding memory, partner signaling, card counting, smarter play. Separate iteration once A-C are merged.

---

## Acceptance

- 4 checks green: `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`.
- New tests cover: rounding table, belote-inside-contract examples from user, contre/surcontre awards (success & failure), partner contrer rejected, min bid 90.
- Manual UI pass: star visible on bidder, banner shows `{value} {trump} ×level`, live points update each trick, hand grouped by suit, "Contrer" label everywhere.
