# Iteration 051 — CoinchBidPanel (SA · TA bid buttons)

## Goal

Add Sans-Atout and Tout-Atout bid buttons to the Coinche game so the
human player can actually bid these contract types.

## Out of scope

- SA/TA trick-winning order (iteration 052).
- AI bidding SA/TA (separate iteration).
- Announcements (tierce, carré…).

## Acceptance criteria

- [ ] `CoinchBidPanel` renders three contract-type tabs: Suit / SA / TA.
- [ ] Suit tab: existing suit-picker + value-picker behaviour.
- [ ] SA tab: value-picker only (no suit needed), confirms bid with
      type `"sans-atout"`.
- [ ] TA tab: value-picker only, confirms bid with type
      `"tout-atout"`.
- [ ] Pass / Contrer / Surcontrer buttons still work as before.
- [ ] `GameSessionState.placeBid` type extended to include
      `"sans-atout" | "tout-atout"`.
- [ ] `useCoinchGameSession` dispatches SA/TA commands correctly.
- [ ] `GameTableView` renders `CoinchBidPanel` when
      `coincheBidding={true}`.
- [ ] `CoinchGameTable` passes `coincheBidding={true}`.
- [ ] All 4 checks pass.

## Files to touch

### New

- `packages/ui/src/components/CoinchBidPanel/CoinchBidPanel.tsx`
- `packages/ui/src/components/CoinchBidPanel/CoinchBidPanel.module.css`

### Modified

- `packages/ui/src/hooks/useGameSession.ts` — widen `placeBid` type.
- `packages/ui/src/hooks/useCoinchGameSession.ts` — handle SA/TA in
  `placeBid`.
- `packages/ui/src/components/GameTable/GameTable.tsx` — add
  `coincheBidding?: boolean` prop, render `CoinchBidPanel`.
- `packages/ui/src/components/CoinchGameTable/CoinchGameTable.tsx` —
  pass `coincheBidding={true}`.

## Validation

- `pnpm test` — existing tests unaffected (BidPanel unchanged).
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check` — clean.
- Manual smoke: in Coinche game, bidding panel shows Suit/SA/TA tabs;
  selecting SA + 90 and clicking Bid dispatches correctly.
