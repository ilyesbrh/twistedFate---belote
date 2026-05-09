# Iteration 055 — Capot in UI + App Layer

## Goal

Wire the capot bid type through the app layer and UI so human players can announce capot from the bid panel.

## Scope

### App layer (`packages/coinche/app`)

- `createPlaceBidCommand`: add `"capot"` to bidType union (requires `suit`, no `value`)
- `session._createBid`: add `"capot"` case → `createCapotBid(pos, suit, idGen)`

### UI (`packages/ui`)

- `CoinchBidPanel`: add a 4th "Capot" tab with suit picker (no value picker); `onBid` signature includes `"capot"`
- `useCoinchGameSession.placeBid`: add `"capot"` to type union
- `coinchEventToMessage`: handle `bid.type === "capot"` → "Capot !"
- `coinchEventToMessage`: handle `isCapot` contract → "Capot !" reveal message

## Tests (TDD)

- `commands.test.ts`: add capot command test
- `session.test.ts`: add capot bid dispatch test
- `CoinchBidPanel.test.tsx`: capot tab renders, clicking suit + capot calls onBid("capot", \_, suit)
