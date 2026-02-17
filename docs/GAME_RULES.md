# Tunisian Belote — Game Rules Reference

Based on classic French Belote with Tunisian regional variations.
This document serves as the **Product Owner's source of truth** for feature decisions.

---

## 1. Players & Setup

- 4 players, 2 teams of 2
- Partners sit opposite each other (positions 0,2 and 1,3)
- 32-card deck: 7, 8, 9, 10, J, Q, K, A × 4 suits

---

## 2. Card Ranking

### Trump Suit (highest → lowest)

J > 9 > A > 10 > K > Q > 8 > 7

### Non-Trump Suits (highest → lowest)

A > 10 > K > Q > J > 9 > 8 > 7

---

## 3. Card Points

### Trump

| Card | Points |
| ---- | ------ |
| J    | 20     |
| 9    | 14     |
| A    | 11     |
| 10   | 10     |
| K    | 4      |
| Q    | 3      |
| 8    | 0      |
| 7    | 0      |

### Non-Trump

| Card | Points |
| ---- | ------ |
| A    | 11     |
| 10   | 10     |
| K    | 4      |
| Q    | 3      |
| J    | 2      |
| 9    | 0      |
| 8    | 0      |
| 7    | 0      |

- **Total deck points**: 152
- **Last trick bonus**: +10
- **Maximum round total**: 162

---

## 4. Dealing

- Each player receives **8 cards**
- Deal pattern: 3-2-3 or 2-3-3 (regional variation)
- Clockwise from dealer+1

---

## 5. Bidding (Tunisian Style)

### Standard Format

- Players bid a contract value: 80, 90, 100… up to 160
- Minimum bid: **80**
- Highest bidder chooses trump suit
- Bidding goes clockwise; pass or outbid

### Special Contracts (regional)

| Contract   | Description                          |
| ---------- | ------------------------------------ |
| All-trumps | Every suit counts as trump           |
| No-trumps  | No trump suit for the round          |
| Capot      | Declaring team must win ALL tricks   |
| Generale   | ONE player must win all tricks alone |

### Doubling (modern variants)

- **Coinche**: Opponent doubles the contract stakes
- **Surcoinche**: Contracting team re-doubles

---

## 6. Gameplay (Trick-Taking)

### Play Order

- Dealer+1 leads the first trick
- Winner of each trick leads the next
- 8 tricks per round (32 cards ÷ 4 players)

### Following Rules

1. **Must follow suit** if able
2. If unable to follow suit: **must trump** if possible
3. If trump is already played: **must overtrump** if possible
4. **Partner exception**: If partner is currently winning the trick, overtrumping may not be required (regional rule — **needs decision**)

### Trick Winner

- Highest card of the led suit wins
- Unless trump is played → highest trump wins

---

## 7. Scoring

### Contract Success

- Contracting team must reach **at least** their bid value in points
- If successful: they score their earned points
- If failed: opponents score **all 162 points**

### Target Score

- First team to reach the agreed target wins
- Common target: **1000 points**

---

## 8. Announcements & Bonuses

### Belote / Rebelote

- Holding King + Queen of trump suit = **+20 points**
- Must announce "Belote" when playing the first, "Rebelote" when playing the second

### Announcements (regional, optional)

| Announcement | Description                    | Points |
| ------------ | ------------------------------ | ------ |
| Tierce       | 3 consecutive cards, same suit | 20     |
| Cinquante    | 4 consecutive cards, same suit | 50     |
| Cent         | 5 consecutive cards, same suit | 100    |
| Carré        | 4 of a kind (same rank)        | varies |

---

## 9. Decisions Required for Engine

These items vary by region and **must be locked down** before implementation:

| Decision                       | Options                            | Status                                     |
| ------------------------------ | ---------------------------------- | ------------------------------------------ |
| Exact bidding system           | Value-based (80-160) vs simplified | **Decided**: Value-based, 80-160 step 10   |
| Overtrump when partner winning | Required vs optional               | **TBD**                                    |
| Announcement support           | None / Belote only / Full set      | **TBD**                                    |
| Deal pattern                   | 3-2-3 vs 2-3-3 vs 8-at-once        | **Decided**: 8-at-once (round-robin)       |
| All-trumps / No-trumps         | Supported vs not                   | **Deferred**: Not in current scope         |
| Capot / Generale               | Supported vs not                   | **Deferred**: Not in current scope         |
| Coinche / Surcoinche           | Supported vs not                   | **Decided**: Supported, immediate-end flow |
| Target score                   | 1000 vs configurable               | **TBD**                                    |

> **Note**: Tunisian Belote is not 100% standardized — rules shift by region. Each TBD must be resolved by the PO before the relevant iteration begins.
