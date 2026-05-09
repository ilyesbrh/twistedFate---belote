# Iteration 057 — Report: Wire announcements into round lifecycle + scoring

## What was done

### Model changes

**`packages/coinche/core/src/models/scoring.ts`**

- Added `announcementWinner: "ns" | "ew" | null` and `announcementPoints: number` to `RoundScore`.
- Updated `calculateRoundScore` to accept optional `announcementWinner` and `announcementPoints` params (both default to `null`/`0`, preserving full backward compatibility).
- Introduced an internal `applyAnnouncementBonus` helper that applies the announcement points to the correct team based on the NS/EW winner and whether the contracting team is NS or EW.
- The bonus is applied after the belote/rebelote bonus and is "imprenable" — it goes to the winning announcement team regardless of whether the contract succeeded or failed.

**`packages/coinche/core/src/models/round.ts`**

- Added four new fields to the `Round` interface: `nsAnnouncements`, `ewAnnouncements`, `announcementWinner`, `announcementPoints`.
- `createRound` initialises them to `[]` / `null` / `0`.
- `placeBidInRound` auto-detects announcements from each player's hand when `updatedBidding.state === "completed"` (V1: single-moment, same pattern as belote). `resolveAnnouncementWinner` maps "a"→"ns" / "b"→"ew".
- All other return paths in `placeBidInRound` and `playCardInRound` carry the fields through unchanged.
- `playCardInRound` passes `round.announcementWinner` and `round.announcementPoints` to `calculateRoundScore` when all 8 tricks are played.

### New tests

`packages/coinche/core/__tests__/models/announcement-scoring.test.ts` — 8 tests covering:

1. `nsAnnouncements`/`ewAnnouncements` are populated arrays after bidding.
2. NS tierce detected → `announcementWinner = "ns"`, `announcementPoints = 20`.
3. EW carré of jacks (all 4 jacks in one hand) vs NS tierce → `announcementWinner = "ew"`, `announcementPoints = 200`.
4. `calculateRoundScore`: NS contracts, NS wins announcements → contracting gets +20.
5. `calculateRoundScore`: NS contracts, EW wins 50 pts announcements → opponent gets +50.
6. Contract fails, EW wins announcements → EW still gets announcement points.
7. `null` winner → final scores unchanged.
8. No announcement args (backward compat) → `announcementWinner = null`, `announcementPoints = 0`.

## 4 Checks

| Check               | Result                                                                         |
| ------------------- | ------------------------------------------------------------------------------ |
| `pnpm test`         | 2059 / 2059 passed                                                             |
| `pnpm typecheck`    | Clean                                                                          |
| `pnpm lint`         | Clean (delta = 0 new errors)                                                   |
| `pnpm format:check` | Clean for modified files (4 pre-existing markdown warnings from iters 054/056) |

## Key design notes

- **V1 simplification**: Announcements are detected automatically from player hands the moment bidding completes (like belote auto-detection), deferring the FFB "declare then reveal" mechanic.
- **Backward compat**: `calculateRoundScore(tricks, contract)` still works identically — no existing tests needed changes.
- **Carré detection is per-hand**: A carré of jacks requires all 4 jacks in a single player's hand. Splitting across teammates does not count — this is correct FFB rules behaviour.
- **Announcement points are "imprenable"**: They are added to the winning team's final score even when the contracting team's contract fails.

## Forward planning

- **N+1 (iter 058)**: Surface announcement data through `@coinche/app` session events so the UI layer can read `nsAnnouncements`, `ewAnnouncements`, and `announcementWinner`.
- **N+2 (iter 059)**: Visual display in `@coinche/ui` — show announcement badges near the relevant player's hand area at the start of the playing phase.
