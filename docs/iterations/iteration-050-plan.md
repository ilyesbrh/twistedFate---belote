# Iteration 050 — Coinche playable in browser (solo AI)

## Goal

Make Coinche playable in the browser as a solo match vs 3 AI bots, accessible from a new game-picker screen.

## Out of scope

- SA/TA trick-winning order (iter 051).
- Online multiplayer for Coinche.
- Coinche-specific BidPanel showing SA/TA options.
- Announcements (tierce, belote/rebelote).

## Acceptance criteria

- [ ] Browser shows a game-picker screen with "Belote" and "Coinche" tiles.
- [ ] Clicking Belote leads to existing Belote flow (unchanged).
- [ ] Clicking Coinche starts a solo Coinche game vs 3 AI bots.
- [ ] Coinche game renders using the existing GameTableView (same table UI).
- [ ] `@coinche/app` supports SA/TA bid commands.
- [ ] All 4 checks pass.

## Files to touch

### New

- `packages/ui/src/hooks/useCoinchGameSession.ts`
- `packages/ui/src/components/GamePickerScreen/GamePickerScreen.tsx`
- `packages/ui/src/components/GamePickerScreen/GamePickerScreen.module.css`
- `packages/ui/src/components/CoinchGameTable/CoinchGameTable.tsx`
- `docs/iterations/iteration-050-plan.md`

### Modified

- `packages/coinche/app/src/commands.ts` — add SA/TA to PlaceBidCommand
- `packages/coinche/app/src/session.ts` — handle SA/TA in \_createBid
- `packages/ui/src/App.tsx` — add game-picker and coinche-ai screens
