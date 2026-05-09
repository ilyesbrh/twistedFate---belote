# Coinche — Source Survey + Variant Matrix

> Produced by the `game-rules-research` skill, Step 2.
> This file is **evidence**, not the locked rules. Locked rules live
> in `GAME_RULES.md` once the PO has signed off on every divergence
> below.
>
> Fetched 2026-05-09.

---

## Sources

| ID    | Source                                                                                  | Authority                                                                                                    | URL                                      | Fetched    |
| ----- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------- | ---------- |
| **A** | Pagat — La Coinche (John McLeod)                                                        | Encyclopaedic; cross-cited globally                                                                          | https://www.pagat.com/jass/coinche.html  | 2026-05-09 |
| **B** | Wikipedia FR — Coinche                                                                  | General reference; explicitly unsourced ("aucune source FFC citée"; admits "peu de règles font l'unanimité") | https://fr.wikipedia.org/wiki/Coinche    | 2026-05-09 |
| **C** | Fédération Française de Belote — Règles Coinche (HTML mirror of the FFB tournament PDF) | **Most authoritative** — official tournament rules                                                           | https://www.ffbelote.org/regles-coinche/ | 2026-05-09 |

PDF version of source C: https://www.ffbelote.org/wp-content/uploads/2015/11/REGLES-DE-LA-BELOTE-COINCHEE.pdf (binary, not text-extractable; FFB HTML page mirrors it).

---

## Variant matrix

Rows where ≥2 sources disagree, OR the rule is novel to Coinche
relative to the existing Tunisian Belote `docs/GAME_RULES.md`. Rows
where all three agree are listed under "Consensus" further down.

### Bidding

| #   | Rule            | A (Pagat)                      | B (Wiki FR)                                  | C (FFB)                               | Conflict?                                                           |
| --- | --------------- | ------------------------------ | -------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------- |
| B1  | Minimum bid     | 82 (announced as "80")         | 80                                           | 80                                    | minor — A says the auction inflates by convention; **C is binding** |
| B2  | Bid increments  | multiple of 10, must be higher | de 10 en 10                                  | par tranche de 10 minimum             | consensus                                                           |
| B3  | Maximum bid     | not stated                     | not stated                                   | **650 or capot**                      | C only — adopt                                                      |
| B4  | Bid direction   | anticlockwise                  | not stated                                   | anticlockwise (right of dealer first) | consensus                                                           |
| B5  | Bid termination | when 3 in a row pass           | "trois joueurs d'affilée n'ont rien annoncé" | implied 3 passes                      | consensus                                                           |

### Card points & ranking

| #   | Rule                  | A (Pagat)                                          | B (Wiki FR)                         | C (FFB)                                                 | Conflict?                                                                    |
| --- | --------------------- | -------------------------------------------------- | ----------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------- |
| P1  | Trump points          | J=20, 9=14, A=11, 10=10, K=4, Q=3, 8/7=0           | (deferred to belote)                | J=20, 9=14, A=11, 10=10, K=4, Q=3, 8/7=0                | consensus                                                                    |
| P2  | Non-trump points      | A=11, 10=10, K=4, Q=3, J=2, 9/8/7=0                | (deferred to belote)                | A=11, 10=10, K=4, Q=3, J=2, 9/8/7=0                     | consensus                                                                    |
| P3  | **Sans-Atout points** | A=19, 10=10, K=4, Q=3, J=2, 9/8/7=0                | A=19, 10=10, K=4, Q=3, J=2, 9/8/7=0 | A=19, 10=10, K=4, Q=3, **J=0**, 9/8/7=0                 | ⚠️ A & B say J=2; **C says J=0**                                             |
| P4  | **Tout-Atout points** | J=14, 9=9, A=6, 10=5, K=3, Q=1, 8/7=0 (rebalanced) | J=14, 9=9, A=6, 10=5, K=3, Q=1      | **J=20, 9=14, A=11, 10=10, K=4, Q=3, 8/7=0 then ×0.63** | ⚠️ A & B use rebalanced flat values; C uses normal trump values × multiplier |
| P5  | Last-trick bonus      | 10                                                 | implicit                            | 10 ("dix de der")                                       | consensus                                                                    |
| P6  | Total per round       | 152 + 10 = 162 (or 182 with belote)                | 162                                 | 162                                                     | consensus                                                                    |

### Coinche / Surcoinche

| #   | Rule                          | A (Pagat)                                | B (Wiki FR)                                         | C (FFB)                                              | Conflict?                                                          |
| --- | ----------------------------- | ---------------------------------------- | --------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------ |
| C1  | **Coinche multiplier scope**  | "doubles the score for the bid **only**" | "Les points remportés…seront doublés" (doubles all) | **(annonce + 160) × 2** — applies to total           | ⚠️ A: bid only; B & C: whole result                                |
| C2  | Surcoinche                    | doubles again                            | quadruples (×4 net)                                 | possible by preneur's team                           | consensus on direction; C2 multiplier value follows from C1 choice |
| C3  | Who can coinche               | only the most recent bid by an opponent  | implicit                                            | preneur's opponents                                  | consensus                                                          |
| C4  | Capot annoncé can be coinched | "**ends bidding, cannot be doubled**"    | not stated                                          | C says capot contré=1000, surcontré=2000, so **yes** | ⚠️ A says no; C says yes                                           |

### Special contracts

| #   | Rule                                     | A (Pagat)                                                           | B (Wiki FR)                                | C (FFB)                | Conflict?                                |
| --- | ---------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------ | ---------------------- | ---------------------------------------- |
| S1  | Capot earned (not bid)                   | 250 + bid                                                           | 252 (with last-trick=100 in capot context) | 250 + contrat          | consensus on 250                         |
| S2  | Capot bid + made                         | 500 (+20 belote)                                                    | 500                                        | 500                    | consensus                                |
| S3  | Capot bid + failed                       | opponents 500                                                       | not stated                                 | 500 to opponents       | consensus                                |
| S4  | Capot contré / surcontré                 | not specified                                                       | not specified                              | **1000 / 2000**        | C only — adopt                           |
| S5  | Générale                                 | "score must be agreed — for example 1000"; bidder leads first trick | "valeur à déterminer en début de partie"   | not detailed in mirror | ⚠️ all sources punt; needs explicit lock |
| S6  | Tout-Atout & Sans-Atout as bid contracts | yes (named bids)                                                    | yes                                        | yes                    | consensus                                |
| S7  | Tout-Atout overtrump rule                | implicit (every suit = trump rules)                                 | implicit                                   | implicit               | consensus                                |
| S8  | Sans-Atout overtrump rule                | "**no obligation to overtake** in play"                             | not stated                                 | not stated             | ⚠️ A explicit; others silent — adopt A   |

### Play obligations

| #   | Rule                                                                      | A (Pagat)                                                            | B (Wiki FR) | C (FFB)                                                                                     | Conflict?                                             |
| --- | ------------------------------------------------------------------------- | -------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| O1  | Must follow suit if able                                                  | yes                                                                  | (deferred)  | yes                                                                                         | consensus                                             |
| O2  | If can't follow + non-trump led + opponent winning: must trump            | yes                                                                  | (deferred)  | "tenu de couper en jouant un atout si l'on en possède"                                      | consensus                                             |
| O3  | If can't follow + opponent already trumped: must overtrump if able        | yes                                                                  | (deferred)  | "obligés de mettre un atout plus fort"                                                      | consensus                                             |
| O4  | If can't follow + partner is winning: may discard (no overtrump required) | yes                                                                  | (deferred)  | yes (souple)                                                                                | consensus                                             |
| O5  | **Trump led — must overtrump partner's trump?**                           | **STRICT** ("must beat the highest trump even if played by partner") | not stated  | **SOUPLE** ("vous n'êtes pas obligé de fournir un atout supérieur" when partner is cutting) | ⚠️ A: STRICT; C: SOUPLE — direct conflict; needs lock |

> Note: O5 is the same question as the existing `docs/GAME_RULES.md` line 108 ("Must always overtrump, even if partner is currently winning — **decided**: strict rule"). The existing **Tunisian Belote** rules say STRICT. Coinche's choice is independent.

### Belote / Rebelote

| #   | Rule                                   | A (Pagat)                                 | B (Wiki FR)                                    | C (FFB)                                                         | Conflict?                                                            |
| --- | -------------------------------------- | ----------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------- |
| BR1 | Belote requires K+Q of trump           | yes                                       | yes                                            | yes                                                             | consensus                                                            |
| BR2 | Belote points                          | 20                                        | 20                                             | 20                                                              | consensus                                                            |
| BR3 | **Belote announcement timing**         | manual: "say 'belote' when playing first" | "toujours 20 points" (silent on call)          | **MANDATORY MANUAL — omission ⇒ 0 points**                      | ⚠️ A: manual but tone permissive; C: strict, missed call = no points |
| BR4 | Belote scored even on contract failure | yes                                       | yes (implicit)                                 | yes ("imprenable même en cas de chute ou de capot")             | consensus                                                            |
| BR5 | Belote in Sans-Atout                   | "no _belote_ in sans-atout"               | not stated                                     | "il n'y a pas de Belote possible"                               | consensus                                                            |
| BR6 | Belote in Tout-Atout                   | "Belote can be declared in any suit"      | not stated                                     | not explicit, but TA preserves trump-like ranking — implies yes | consensus                                                            |
| BR7 | Multiple belotes allowed (rare)        | not stated                                | "Il est possible d'annoncer plusieurs belotes" | not explicit                                                    | edge case — adopt B                                                  |

### Sequence announcements (Tierce / Cinquante / Cent)

| #    | Rule                                                     | A (Pagat)                                | B (Wiki FR)                                                                         | C (FFB)                                                                        | Conflict?                                             |
| ---- | -------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------- |
| SQ1  | 3-card seq points (Tierce)                               | 20                                       | 20                                                                                  | 20                                                                             | consensus                                             |
| SQ2  | 4-card seq points (Cinquante / Quarte)                   | 50                                       | 50                                                                                  | 50                                                                             | consensus                                             |
| SQ3  | 5+-card seq points (Cent / Quinte / etc.)                | 100                                      | 100 (5,6,7,8 cards all = 100)                                                       | 100                                                                            | consensus on 5-card; B confirms 6/7/8 = 100 too       |
| SQ4  | Sequence card order                                      | A,K,Q,J,10,9,8,7                         | not explicit                                                                        | implicit standard                                                              | consensus                                             |
| SQ5  | **Announcement timing**                                  | "just before playing to the first trick" | not stated                                                                          | **two-stage**: round 1 = announce height only; round 2 = reveal before playing | ⚠️ A: single moment; C: two-stage                     |
| SQ6  | Only the team with the highest single combination scores | yes                                      | "Une suite de 100 prédomine un carré de 100" (sequence beats carré if same value??) | "carré de 100 plus fort qu'un cent" (carré beats cent)                         | ⚠️ B & C disagree on sequence-vs-carré at equal value |
| SQ7  | Carré beats any sequence                                 | yes                                      | (B disagrees per SQ6)                                                               | yes (per "carré 100 > cent")                                                   | A + C consensus; B is the outlier                     |
| SQ8  | Higher value beats lower value (when same type)          | yes                                      | yes                                                                                 | yes                                                                            | consensus                                             |
| SQ9  | At equal value & type, higher cards win                  | yes                                      | "carte la plus élevée"                                                              | "la carte la plus élevée l'emporte"                                            | consensus                                             |
| SQ10 | At equal cards different suits, trump beats non-trump    | yes                                      | not stated                                                                          | not stated                                                                     | A only — adopt                                        |

### Carré (4-of-a-kind)

| #   | Rule              | A (Pagat)      | B (Wiki FR)              | C (FFB)                  | Conflict?                                                     |
| --- | ----------------- | -------------- | ------------------------ | ------------------------ | ------------------------------------------------------------- |
| CR1 | 4 Jacks           | 200            | 100 (sans-atout context) | 200                      | ⚠️ A & C: 200; B: 100 in sans-atout — B is wrong/inconsistent |
| CR2 | 4 Nines           | 150            | 100 (sans-atout)         | 150                      | ⚠️ A & C: 150; B: 100 — same                                  |
| CR3 | 4 Aces            | 100            | **200** (sans-atout)     | 100                      | ⚠️ B inverts: aces highest in sans-atout context              |
| CR4 | 4 Tens            | 100            | **150** (sans-atout)     | 100                      | ⚠️ B inverts                                                  |
| CR5 | 4 Kings / Queens  | 100            | 100                      | 100                      | consensus                                                     |
| CR6 | 4 Eights / Sevens | 0              | not stated               | 0                        | consensus                                                     |
| CR7 | When announced    | with sequences | with sequences           | with sequences (round 2) | consensus                                                     |

> Note: B's carré table appears to be specific to Sans-Atout play (where ace is highest = 19 pts), inverting the carré ranking. A and C give the **trump-context** carré table that applies regardless of contract type. **A + C is the standard FFB rule**; B is a special case at best, or simply wrong.

### Scoring & game length

| #   | Rule                                                                         | A (Pagat)                                           | B (Wiki FR)                      | C (FFB)                                      | Conflict?                                                                         |
| --- | ---------------------------------------------------------------------------- | --------------------------------------------------- | -------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------- |
| SC1 | Contract success: bidder scores points-taken + bid value                     | yes                                                 | yes                              | yes (e.g. 110 made + 80 bid = 190)           | consensus                                                                         |
| SC2 | Contract failure: opponents score 160 + bid; bidder scores 0 (except belote) | "160 + bid" (Pagat) — confirms; bidder keeps belote | "162, arrondis à 160" + contrat  | "0 point pour preneur, 160 + valeur contrat" | consensus                                                                         |
| SC3 | Score rounding                                                               | "to nearest 10, .5 rounds up"                       | "arrondis" (silent on direction) | **"1–4 → down; 5–9 → up"**                   | ⚠️ A: standard rounding; C: split at 5 boundary differently — actually equivalent |
| SC4 | **Target / game length**                                                     | **2000**                                            | **3000**                         | not specified ("organisateurs")              | ⚠️ A: 2000; B: 3000; C: punts                                                     |

### Generale / All-Trumps / No-Trumps as bids

| #   | Rule                                        | A (Pagat)                | B (Wiki FR)           | C (FFB)                                | Conflict?                                           |
| --- | ------------------------------------------- | ------------------------ | --------------------- | -------------------------------------- | --------------------------------------------------- |
| GE1 | Tout-Atout selectable as suit-bid           | yes                      | yes                   | yes                                    | consensus                                           |
| GE2 | Sans-Atout selectable as suit-bid           | yes                      | yes                   | yes                                    | consensus                                           |
| GE3 | Capot selectable as bid (overrides numeric) | yes — ends bidding       | yes                   | yes (max 650 or capot)                 | consensus                                           |
| GE4 | Générale selectable as bid                  | yes — bidder plays alone | "valeur à déterminer" | not in mirror — needs FFB PDF (binary) | ⚠️ scoring not standardised; needs explicit PO lock |

---

## Consensus rows (no conflict)

These are agreed across all three sources and will populate
`GAME_RULES.md` directly without PO arbitration:

- 4 players, 2 teams of 2, partners opposite (positions 0+2 vs 1+3)
- 32-card deck (7, 8, 9, 10, J, Q, K, A × 4)
- 8 cards per hand
- Anti-clockwise play
- 8 tricks per round
- Trump points table (P1)
- Non-trump points table (P2)
- Last-trick bonus = 10
- Standard play obligations O1–O4
- Belote/Rebelote in trump suit only (BR1, BR2)
- Belote = 20 pts, scored even on chute (BR4)
- No belote in Sans-Atout (BR5)
- Sequence point values (SQ1–SQ4)
- Carré point values per A + C (CR1–CR6); B is the outlier
- Contract scoring formulas SC1, SC2

---

## Decisions requiring PO arbitration

The following list collapses the ⚠️ rows above into a single PO
checklist. Each item must be **Decided: <value>** or **Deferred:
<trigger>** before `GAME_RULES.md` can be written. No "TBD",
"Configurable", or "Depends on region" answers per the
`game-rules-research` skill.

1. **P3 — Sans-Atout Jack value.** Options: J=2 (Pagat, Wiki FR) vs **J=0 (FFB official)**. Recommend FFB.
2. **P4 — Tout-Atout point representation.** Options: A — flat-rebalanced (J=14, 9=9, A=6, 10=5, K=3, Q=1, 8/7=0; total = 62, or however) vs C — standard trump values × 0.63 multiplier. Functionally similar; pick one for implementation. Recommend C (FFB) — keeps the trump points table single-source-of-truth and applies a multiplier at scoring time.
3. **C1 — Coinche multiplier scope.** Options: A — doubles bid only; **B+C — doubles whole outcome (annonce + 160) × 2**. Two-vs-one majority for whole-outcome doubling, and FFB is authoritative. Recommend FFB.
4. **C4 — Can capot annoncé be coinched?** Options: **A — no, capot ends bidding** vs **C — yes** (capot contré = 1000, surcontré = 2000). Recommend FFB (allow coinche on capot).
5. **O5 — Partner-overtrump rule (when trump is led).** Options: **A — STRICT** ("must beat partner's trump") vs **C — SOUPLE** ("not required when partner is cutting"). The existing Tunisian Belote rules locked STRICT. **You can either match (STRICT, internally consistent across games) or follow FFB (SOUPLE, official Coinche)**. PO call.
6. **BR3 — Belote announcement strictness.** Options: A — manual but no penalty for missed call; **C — MANDATORY MANUAL, omission = 0 points**. Recommend FFB (strict).
7. **SQ5 — Sequence announcement timing.** Options: A — single moment, just before first trick; **C — two-stage** (height first round, reveal second round). Recommend FFB (two-stage). Note: more complex to implement; deferred-with-trigger is also acceptable if simplicity matters for V1.
8. **SQ7 — Carré vs sequence at equal point value.** Options: **A + C — carré beats sequence** vs B — sequence beats carré. Recommend A+C consensus.
9. **CR table — Carré point values.** Options: **A + C — J=200, 9=150, A/10/K/Q=100, 8/7=0** vs B — sans-atout-specific inversion (A=200, 10=150). Recommend A+C consensus.
10. **SC4 — Target score / partie length.** Options: A — 2000; B — 3000; C — organiser-defined. The existing Tunisian Belote uses 1000 (configurable per `GAME_RULES.md` line 167). **PO call**: 1000 (match Belote), 2000 (Pagat), 3000 (Wiki FR), or other.
11. **GE4 — Générale: scoring + lead rule.** No source gives a binding number. **PO call**: pick a points value (Pagat suggests 1000, but it's a placeholder), and decide whether the bidder leads the first trick. **Or defer with trigger** (e.g. "if ≥5% of online matches request générale, lock the rule").
12. **SQ10 — Equal sequences in different suits, trump beats non-trump?** Pagat-only rule. **Recommend adopt** (no contradiction; small edge case).
13. **BR7 — Multiple belotes allowed (e.g. by both teams in tout-atout).** Wiki FR-only. Edge case. **Recommend adopt** for tout-atout context.
14. **Out-of-scope candidates for V1.** The PO should also confirm whether to defer:
    - Générale (item 11)
    - Two-stage sequence announcement (item 7) — implement as single-moment for V1, two-stage later
    - "Capot contré = 1000, surcontré = 2000" — implement basic capot first, contré-on-capot later

---

## Pre-research notes (not source-derived; PO context)

- Existing `docs/GAME_RULES.md` is **Tunisian Belote** — the _current_
  shipped game's rules, used as PO source-of-truth. Coinche is a
  separate game per `PLATFORM_MANIFESTO.md` Rule 1; its rules are
  independent and live in `docs/games/coinche/GAME_RULES.md`.
- Per the platform manifesto, Coinche ships as `@coinche/*` packages,
  not as a `variant` flag on `@belote/*`. Sources A, B, C inform the
  rules; the package isolation is a separate decision already locked.
- Wiki FR (B) is **least authoritative** — its own bandeau notes the
  page lacks sources. When it conflicts with A or C, prefer them.

---

_Step 2 of `game-rules-research` skill complete. Next:
PO arbitration on the 14 items above (Step 3), then `GAME_RULES.md`
(Step 4), then sign-off (Step 5), then handoff to
`new-game-bootstrap` (Step 6)._
