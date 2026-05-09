# Coinche (Belote Coinchée) — Rules Reference

Based on the **Fédération Française de Belote** tournament rules
(source C in `SOURCES.md`), with deviations toward Pagat / Wikipedia
FR resolved per §9 below.
This document is the **Product Owner's source of truth** for engine

- UI implementation of `@coinche/*`. It mirrors the shape of
  `docs/GAME_RULES.md` (the Tunisian Belote source-of-truth) so anyone
  who knows that doc can read this one cold.

Locked 2026-05-09 by PO. Amendments require an iteration plan
titled `iteration-NNN-coinche-rules-amendment.md` per
`PLATFORM_MANIFESTO.md` §8.

---

## 1. Players & Setup

- 4 players, 2 teams of 2
- Partners sit opposite each other (positions 0+2 vs 1+3)
- 32-card deck: 7, 8, 9, 10, J, Q, K, A × 4 suits
- Play and deal direction: **anti-clockwise**

---

## 2. Card Ranking

### Trump suit / atout (high → low)

J > 9 > A > 10 > K > Q > 8 > 7

### Non-trump suits (high → low)

A > 10 > K > Q > J > 9 > 8 > 7

### Sans-Atout (no-trumps) ranking

A > 10 > K > Q > J > 9 > 8 > 7 (every suit; no trump)

### Tout-Atout (all-trumps) ranking

J > 9 > A > 10 > K > Q > 8 > 7 (every suit ranks like trump)

---

## 3. Card Points

### Trump (atout)

| Card | Points |
| ---- | ------ |
| J    | 20     |
| 9    | 14     |
| A    | 11     |
| 10   | 10     |
| K    | 4      |
| Q    | 3      |
| 8, 7 | 0      |

### Non-trump

| Card    | Points |
| ------- | ------ |
| A       | 11     |
| 10      | 10     |
| K       | 4      |
| Q       | 3      |
| J       | 2      |
| 9, 8, 7 | 0      |

### Sans-Atout (every suit)

| Card    | Points |
| ------- | ------ |
| A       | **19** |
| 10      | 10     |
| K       | 4      |
| Q       | 3      |
| J       | **0**  |
| 9, 8, 7 | 0      |

### Tout-Atout (every suit, flat-rebalanced)

| Card | Points |
| ---- | ------ |
| J    | 14     |
| 9    | 9      |
| A    | 6      |
| 10   | 5      |
| K    | 3      |
| Q    | 1      |
| 8, 7 | 0      |

> **Implementation note.** Pagat's flat-rebalanced values (above) sum
> to 38/suit × 4 suits = **152 + 10 last-trick = 162** per round —
> the same target as a normal round. FFB's tournament document
> describes the same effect via "standard trump values × 0.63
> multiplier"; this is mathematically a paraphrase of the same idea.
> We adopt Pagat's flat values because the implementation has no
> multiplier step and hits the round total exactly.

### Round totals

- **Total card points (regular contracts)**: 152
- **Last-trick bonus ("dix de der")**: +10
- **Maximum round total without belote/announcements**: 162
- **With belote (K+Q of trump)**: 182

---

## 4. Dealing

- Each player receives **8 cards**
- Deal pattern: **3-2-3** (or **2-3-3** — both legal). 1-card or
  4-card deals are forbidden per FFB.
- Anti-clockwise from dealer+1
- Mandatory shuffle before each deal

---

## 5. Bidding

### Standard format

- Players bid a contract value: 80, 90, 100… up to 160 (and beyond
  by mutual escalation)
- **Minimum bid**: 80
- **Increments**: multiples of 10
- **Maximum**: 650, or capot
- Highest bidder names the contract type (suit / Sans-Atout /
  Tout-Atout / Capot)
- Bidding ends when 3 consecutive passes follow a bid (or when capot
  is bid — see §5.2)
- A bid, once announced, **cannot be cancelled**
- The player to the dealer's right opens

### Special contracts

| Contract          | Description                                                                     | Status                                                                                  |
| ----------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Suit (atout)      | Standard: bidder names a suit as trump                                          | Decided                                                                                 |
| Sans-Atout        | No trump suit; ace-high ranking; **Jack = 0**                                   | Decided                                                                                 |
| Tout-Atout        | Every suit ranks like trump; flat-rebalanced points                             | Decided                                                                                 |
| Capot (announced) | Bidder undertakes to win **all 8 tricks**; ends bidding but **can be coinched** | Decided                                                                                 |
| Générale          | One bidder wins all 8 tricks alone (no partner help)                            | **Deferred V1** — trigger: ≥5% of online matches reach a position where it would matter |

### Coinche / Surcoinche

- **Coinche**: opposing team doubles the contract's stakes. Either
  opponent may say "coinche" without waiting for their turn.
  Available only on the most recent bid (which must be by the
  bidding team's opponents — i.e. the bidding team).
- **Surcoinche**: bidding team re-doubles, restoring even higher
  stakes.
- **Multiplier scope**: doubles the **whole outcome**, not just the
  bid value. Specifically: the loser pays `(annonce + 160) × multiplier`.
- **Multiplier ladder**:
  - Plain: ×1
  - Coinché: ×2
  - Surcoinché: ×4
- **Capot can be coinched.** A coinched announced-capot scores 1000;
  surcoinched, 2000.

---

## 6. Gameplay (Trick-Taking)

### Play order

- Dealer+1 (anti-clockwise) leads the first trick
- Winner of each trick leads the next
- 8 tricks per round (32 cards ÷ 4 players)

### Following rules

The same rules apply across regular trump, Tout-Atout, and Sans-Atout
contracts — only the trump-ness changes:

1. **Must follow suit** if able.
2. If unable to follow suit:
   - **Trump-led trick**: must play trump (any trump).
   - **Non-trump-led trick, opponent currently winning with the led
     suit**: must play trump if possible (couper); otherwise discard
     freely.
   - **Non-trump-led trick, opponent currently winning with a
     trump**: must overtrump if possible; if you have only lower
     trump, you must still play trump (you cannot discard).
   - **Partner is currently winning the trick**: you may discard
     freely (no obligation to overtrump partner) — _except_ when
     trump is led, see below.
3. **Partner overtrump rule** (when trump is led): **STRICT** — you
   must beat the highest trump in the trick, even if it was played
   by your partner, if you can. Matches the existing Belote
   convention. Diverges from FFB's "souple" rule deliberately for
   internal consistency.
4. **Sans-Atout exception**: there is no obligation to overtake on
   the led suit (no "must beat highest" rule when playing on the
   first suit led).

### Trick winner

- Highest card of the led suit wins
- Unless trump is played → highest trump wins
- In Tout-Atout: highest of the led suit per the trump ranking wins
- In Sans-Atout: highest of the led suit per the SA ranking wins

---

## 7. Scoring

### Contract success

- Bidding team must reach **at least their bid value** in card
  points (excluding belote/announcements).
- If successful, bidding team scores: **points-taken + bid value**.
  The opposing team scores their own card points.
- Belote (if announced) adds +20 to the scoring team regardless of
  contract result.

### Contract failure (chute)

- Bidding team scores **0** (except 20 for belote if announced).
- Opposing team scores **160 + bid value** (the rounded round total
  - the bid).

### Multipliers (Coinche / Surcoinche)

- Plain success: as above (`taken + bid` for bidder; `taken` for
  opponent).
- Plain failure: opponent gets `160 + bid`.
- **Coinché**: the loser of the contract pays `(annonce + 160) × 2`
  to the other team.
- **Surcoinché**: same formula × 4.
- Belote points (+20) are unaffected by coinche/surcoinche; they
  remain "imprenables" for the team that holds belote.

### Capot scoring

- **Capot earned but not bid** (bidder wins all 8 tricks on a
  regular contract): 250 + bid.
- **Capot announced + made**: 500 (+20 if belote).
- **Capot announced + failed**: opponents score 500.
- **Capot coinché + made**: 1000.
- **Capot coinché + failed**: opponents score 1000.
- **Capot surcoinché + made**: 2000.
- **Capot surcoinché + failed**: opponents score 2000.

### Score rounding

- Round each team's score to the nearest 10 at the end of every
  round.
- 1–4 → round down; 5–9 → round up.
- Belote points (+20) are added **after** rounding.

### Target score

- **Common target: 3000 points** (locked).
- First team to reach the target wins the partie.
- If both teams cross the target in the same round, the contracting
  team wins (matches Belote convention).

---

## 8. Announcements & Bonuses

### Belote / Rebelote

- Holding **King + Queen of the trump suit** scores **+20**.
- **Strict manual announcement** (FFB rule). The player must say
  "Belote" when playing the first of the two cards and "Rebelote"
  when playing the second. **Omission ⇒ no points.** This differs
  from the existing Tunisian Belote auto-detection convention; the
  UI must surface a clear "Announce Belote" affordance.
- **Imprenable**: scored even if the contract fails.
- **Not available in Sans-Atout** (no trump suit means no K+Q-of-
  trump).
- **Available in Tout-Atout** — and may be declared in any suit
  (since every suit ranks like trump). Multiple belotes (one per
  suit) are allowed in tout-atout if both are held.

### Sequence announcements

| Announcement        | Description                    | Points |
| ------------------- | ------------------------------ | ------ |
| Tierce              | 3 consecutive cards, same suit | 20     |
| Cinquante (Quarte)  | 4 consecutive cards, same suit | 50     |
| Cent (Quinte)       | 5 consecutive cards, same suit | 100    |
| 6/7/8-card sequence | (extension of cent)            | 100    |

**Sequence card order** (for sequence-construction purposes only,
not for trick-taking): A, K, Q, J, 10, 9, 8, 7.

### Carré (4-of-a-kind)

| Carré                             | Points               |
| --------------------------------- | -------------------- |
| 4 Jacks                           | 200                  |
| 4 Nines                           | 150                  |
| 4 Aces, 4 Tens, 4 Kings, 4 Queens | 100                  |
| 4 Eights, 4 Sevens                | 0 (not announceable) |

### Announcement timing & comparison

- **Timing (V1)**: announcements are declared **just before playing
  to the first trick**, single-moment. Each player who holds any
  announcement reveals it now. The two-stage FFB tournament flow
  ("height first round, reveal second round") is **deferred**;
  trigger to revisit: tournament-mode launch.
- **Comparison rules** (only one team scores; that team scores
  _all_ of its announcements):
  1. **Carré beats any sequence** (even sequences worth 100 points).
  2. Among same type (sequence vs sequence, carré vs carré), the
     higher point value wins (cent > cinquante > tierce; carré of
     Jacks > carré of 9s > carré of A/10/K/Q).
  3. Among equal value & type, the highest card in the combination
     wins.
  4. Among equal sequences in different suits, **trump suit beats
     non-trump** (Pagat-only rule, adopted for completeness).
- The team holding the _highest single combination_ scores **all of
  its** announcements (carrés + all sequences). The other team
  scores zero announcement points.

---

## 9. Decisions Locked

| #    | Decision                          | Locked Value                                       | Source                                  | Rationale                                                                                               |
| ---- | --------------------------------- | -------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| P3   | Sans-Atout Jack value             | **0**                                              | C (FFB)                                 | Most authoritative; majority of A's preference is 2 but FFB official trumps                             |
| P4   | Tout-Atout point representation   | Pagat flat values (J=14, 9=9, A=6, 10=5, K=3, Q=1) | A (Pagat) + B (Wiki FR)                 | Implementation cleanliness — sums to 152 directly, no multiplier; functionally identical to FFB's ×0.63 |
| C1   | Coinche multiplier scope          | (annonce + 160) × multiplier                       | C (FFB) + B                             | Whole-outcome doubling matches majority + official                                                      |
| C4   | Capot annoncé can be coinched     | Yes; contré=1000, surcontré=2000                   | C (FFB)                                 | Official ladder; gives bid-side incentive to declare carefully                                          |
| O5   | Partner overtrump (trump led)     | **STRICT**                                         | Belote consistency + A                  | Internal consistency with existing Tunisian Belote rules; same muscle memory                            |
| BR3  | Belote announcement               | **MANDATORY MANUAL — omission = 0**                | C (FFB)                                 | Tournament discipline; UI must surface affordance clearly                                               |
| SQ5  | Sequence announcement timing (V1) | Single-moment, before first trick                  | A (Pagat)                               | Simpler V1; two-stage deferred to tournament-mode                                                       |
| SQ7  | Carré vs sequence at equal points | **Carré wins**                                     | A + C consensus                         | B's contradiction is a sans-atout-specific artifact                                                     |
| SQ10 | Equal sequences, different suits  | **Trump > non-trump**                              | A (Pagat)                               | No contradiction; small edge case                                                                       |
| BR7  | Multiple belotes (Tout-Atout)     | Allowed                                            | B (Wiki FR)                             | Edge case unique to Tout-Atout; no contradiction                                                        |
| CR   | Carré point values                | J=200, 9=150, A/10/K/Q=100, 8/7=0                  | A + C consensus                         | B is outlier (sans-atout-specific)                                                                      |
| SC4  | Target score                      | **3000**                                           | B (Wiki FR) — common Coinche convention | PO call (3000 vs 2000 vs 1000)                                                                          |
| GE4  | Générale                          | **Deferred**                                       | n/a                                     | Trigger: ≥5% of online matches request it                                                               |

---

## 10. Out of scope for V1

These features are **explicitly not** built in the first ship of
`@coinche/*`. Each carries a trigger condition that, if met, brings
it back as a future iteration.

| Feature                                                                    | Trigger to revisit                                                    |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **Générale** (1-bidder all-tricks contract)                                | ≥5% of online matches request it (telemetry)                          |
| **Two-stage sequence announcement** (height in round 1, reveal in round 2) | Tournament-mode launch                                                |
| **Capot contré / surcontré beyond the basic ladder**                       | Confirmed need from competitive play                                  |
| **Belote auto-detection**                                                  | If user testing shows the strict-manual call is causing high friction |
| **Configurable target score**                                              | Multi-region / tournament-mode launch                                 |
| **Different deal patterns by region** (e.g. 5+3 stéphanoise)               | Regional-specific demand                                              |

---

## 11. Open implementation questions (for iteration N+1)

These are **not** rules questions — they're implementation choices
the engine + UI iterations must answer:

- **Belote announcement UI**: how does the player surface "Belote"
  vs "Rebelote" without slowing play? (Auto-suggest button? Tap
  the trump K/Q to announce as you play?)
- **Sequence announcement UI**: at-trick-1, the bidder + opponents
  reveal sequences; UI must show comparison + which team's
  announcements scored. (Modal? Inline panel?)
- **AI heuristics for Sans-Atout / Tout-Atout bids**: existing
  Belote AI doesn't reason about no-trump or all-trump positions;
  needs new evaluation function per contract type.
- **Coinche AI**: when does the AI decide to coinche? (Heuristic:
  partner has X+ trumps + bidder bid Y above hand strength — to be
  tuned.)

These belong in the iteration plans for `@coinche/*`, not in this
rules doc.

---

_Locked 2026-05-09 by PO (user). Sources surveyed in `SOURCES.md`.
Amendments require an iteration plan titled
`iteration-NNN-coinche-rules-amendment.md` per
`PLATFORM_MANIFESTO.md` §8._
