# Iteration 091 — Bid history log

## Goal

Render `biddingRound.bids[]` as a real-time scrolling log alongside the bid panel during the auction phase, attributed by player name. One unified component handles both Belote and Coinche bid types.

## Out of scope

- i18n / localization. The format function is a pure TS function with English literals; an i18n swap is a future iteration.
- A "trick play" log (separate from the bid log) — already covered by `ChatPanel` for trick wins.
- Animations beyond CSS opacity transitions on entry.

## Acceptance criteria

- [ ] New component at `packages/ui/src/components/BidLog/BidLog.tsx` + CSS module.
- [ ] Renders nothing when `bids` is empty.
- [ ] Renders one entry per bid in chronological order.
- [ ] Formats all 7 bid types correctly: `pass`, `suit` (suit symbol + value), `sans-atout` (SA + value), `tout-atout` (TA + value), `capot` (Capot + suit), `coinche` ("Contre !"), `surcoinche` ("Surcontre !").
- [ ] Player name resolved from a `players` prop (positions 0-3 → seat name); falls back to position label ("South"/"West"/"North"/"East").
- [ ] Container has `role="log"`, `aria-live="polite"`, `aria-atomic="false"`.
- [ ] Pass entries fade to 50% opacity; coinche/surcoinche entries get terracotta accent.
- [ ] Integrated in `GameTableView`, visible whenever `state.biddingRound !== null` (NOT gated by `state.isMyTurn` — the log narrates AI bids too).
- [ ] One new fixture file `bidLog.fixtures.tsx`, re-exported from `dev/fixtures/index.ts`, captured by the barrel-sweep render test.
- [ ] 12 new tests in `packages/ui/__tests__/BidLog.test.tsx`.
- [ ] All 4 checks pass.

## Files to touch

### New

- `packages/ui/src/components/BidLog/BidLog.tsx`
- `packages/ui/src/components/BidLog/BidLog.module.css`
- `packages/ui/__tests__/BidLog.test.tsx`
- `packages/ui/src/dev/fixtures/bidLog.fixtures.tsx`
- `docs/iterations/iteration-091-plan.md`, `docs/iterations/iteration-091-report.md`

### Modified

- `packages/ui/src/components/GameTable/GameTable.tsx` — render `<BidLog>` slot when `state.biddingRound !== null`.
- `packages/ui/src/components/GameTable/GameTable.module.css` — add `.bidLog` positioning slot above the bid panel.
- `packages/ui/src/dev/fixtures/index.ts` — re-export `bidLogFixtures`.

## Component API

```ts
// Structural superset that accepts both Belote (4 bid types) and Coinche (7 bid types) Bids.
export interface LogBid {
  readonly id: string;
  readonly type: "pass" | "suit" | "coinche" | "surcoinche" | "sans-atout" | "tout-atout" | "capot";
  readonly playerPosition: 0 | 1 | 2 | 3;
  readonly value: number | null;
  readonly suit: "spades" | "hearts" | "diamonds" | "clubs" | null;
}

export interface BidLogProfile {
  readonly name: string;
}

export interface BidLogProps {
  readonly bids: readonly LogBid[];
  /** Keyed by numeric PlayerPosition: 0=south, 1=west, 2=north, 3=east. */
  readonly profiles: Partial<Record<number, BidLogProfile>>;
}
```

Both `@belote/core` `Bid` and `@coinche/core` `Bid` are structural subtypes of `LogBid` (Coinche has more `type` literals but they're a superset). No imports from either core package — the structural typing keeps `BidLog` game-agnostic, satisfying the platform manifesto.

## Text formatting (pure function `formatBidText`)

| `type`       | Output                    |
| ------------ | ------------------------- |
| `pass`       | `"Pass"`                  |
| `suit`       | `"♠ 110"` (glyph + value) |
| `sans-atout` | `"SA 130"`                |
| `tout-atout` | `"TA 120"`                |
| `capot`      | `"Capot ♥"`               |
| `coinche`    | `"Contre !"`              |
| `surcoinche` | `"Surcontre !"`           |

Full entry: `"{Name} — {bidText}"`, e.g. `"Imed — ♠ 110"`. Name resolves from `profiles[bid.playerPosition]?.name` or falls back to `"South"`/`"West"`/`"North"`/`"East"`.

## CSS / placement

`.bidLog` slot in `GameTable.module.css`:

```css
.bidLog {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: calc(50% - 200px);
  z-index: 19;
  max-height: 9rem;
  width: min(320px, 92vw);
  overflow-y: auto;
  pointer-events: none;
}

@media (max-width: 600px) and (orientation: portrait) {
  .bidLog {
    max-height: 5.5rem;
    top: calc(50% - 140px);
  }
}

@media (max-height: 500px) and (orientation: landscape) {
  .bidLog {
    max-height: 4rem;
    top: 4px;
  }
}
```

Component-internal CSS handles row styling (`.entry`, `.passEntry`, `.coincheEntry`, etc.).

## Test plan (TDD red → green, 12 tests)

In `packages/ui/__tests__/BidLog.test.tsx`:

1. Renders nothing when `bids` is empty.
2. Renders one entry per bid (3 bids → 3 list items).
3. Pass bid: entry text contains `"Pass"`.
4. Suit bid: entry text contains `"♠"` and `"110"`.
5. Sans-atout bid: entry text contains `"SA"` and `"130"`.
6. Tout-atout bid: entry text contains `"TA"`.
7. Capot bid: entry text contains `"Capot"` and the suit glyph.
8. Coinche bid: entry text contains `"Contre"`.
9. Surcoinche bid: entry text contains `"Surcontre"`.
10. Player name resolved from `profiles[position].name` when present.
11. Player name fallback to position label when position not in profiles.
12. Container has `role="log"`, `aria-live="polite"`, `aria-atomic="false"`.

All 12 are genuinely red before implementation — no component exists yet, so even importing it fails compile/run.

Order:

1. Write all 12 tests. Run `pnpm --filter ui test BidLog` — all red (module not found).
2. Scaffold `BidLog.tsx` with bare component returning `null`. Run — test 1 passes, others fail.
3. Implement `formatBidText` + entry rendering. Tests 2-9 green.
4. Implement profile resolution + fallback. Tests 10-11 green.
5. Add `role`/`aria-live`/`aria-atomic`. Test 12 green.
6. Add CSS module. Tests stay green (no CSS assertions).

## Validation

- `pnpm test` — expected: 1577 + 12 new = 1589 (plus +1 from the barrel-sweep auto-test of the new fixture file = 1590 total).
- `pnpm typecheck` — clean.
- `pnpm lint` — delta-clean.
- `pnpm format:check` — clean.
- `pnpm visual --url=http://localhost:5174/twistedFate-belote/` — bidding fixtures will diff (log now visible above the panel). Re-bless.

## Risks

- **Slot positioning collision with `BidPanel`.** The `.bidLog` slot sits above `.bidPanel`. On very short viewports the two could overlap. The CSS uses `top: calc(50% - 200px)` and `max-height: 9rem` — verified by inspection at three breakpoints. Live audit via `pnpm audit:clip` will confirm.
- **Pass-heavy rounds bloat the log.** A 4-deal-pass round produces 4 entries — fine. If we ever support multi-round auctions, the log doesn't reset between rounds (uses `state.biddingRound.bids` which IS reset per round, so this is moot).
- **Empty profiles object.** If `state.players` somehow isn't populated, the component falls back gracefully to position labels.

## Carryforward

- **N+1 (iter 092) — Last trick peek.** Add button + modal showing the n-1 trick. Derives `lastCompletedTrick` from `round.tricks.at(-1)` in three hooks. No protocol change.
- **N+2 (iter 093) — GameOver CTAs.** Replace single Play Again with mode-aware button set per the architect's blueprint.
