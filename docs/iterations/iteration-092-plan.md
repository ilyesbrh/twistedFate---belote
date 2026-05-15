# Iteration 092 — Last trick peek (Belote AI flow)

## Goal

Give the player a one-tap affordance to view the n−1 trick (the trick that was just swept) during gameplay. This iteration delivers the feature for the Tunisian-Belote AI flow only. Coinche AI and online flows extended in iter 093 (a thin follow-up that just plumbs the derivation into the other two hooks).

## Out of scope

- `useCoinchGameSession` and `useOnlineGameSession` plumbing (iter 093).
- Server / protocol changes — `tricks[]` is already in `public_state`, no work needed there.
- Keyboard accessibility (Escape to close). Tap/click dismissal only.

## Acceptance criteria

- [ ] New `LastTrickPeek` component at `packages/ui/src/components/LastTrickPeek/`.
- [ ] Renders 4 cards in compass positions + winner name + a close button.
- [ ] Dismisses on tap of backdrop OR close button.
- [ ] `useGameSession` exposes `lastCompletedTrick: TrickCardData[] | null`, `lastTrickWinnerPosition: Position | null`, `peekingLastTrick: boolean`, `setPeekingLastTrick: (v: boolean) => void`.
- [ ] In `GameTableView`, a small "Last trick" button is visible when `state.lastCompletedTrick !== null && state.trickCards.length === 0` (between tricks, current trick area empty).
- [ ] Clicking the button sets `peekingLastTrick=true`; `LastTrickPeek` modal renders.
- [ ] All 4 checks pass.

## Files to touch

### New

- `packages/ui/src/components/LastTrickPeek/LastTrickPeek.tsx`
- `packages/ui/src/components/LastTrickPeek/LastTrickPeek.module.css`
- `packages/ui/__tests__/LastTrickPeek.test.tsx` — 6 component tests
- `packages/ui/src/dev/fixtures/lastTrickPeek.fixtures.tsx`

### Modified

- `packages/ui/src/hooks/useGameSession.ts` — add 4 fields to `GameSessionState`; derive `lastCompletedTrick`/`lastTrickWinnerPosition` from `round.tricks.at(-1)`; add `peekingLastTrick` state + setter.
- `packages/ui/src/components/GameTable/GameTable.tsx` — add the "Last trick" button slot + the `<LastTrickPeek>` overlay.
- `packages/ui/src/components/GameTable/GameTable.module.css` — `.peekBtn` and `.peekOverlay` slots.
- `packages/ui/src/dev/fixtures/index.ts` — re-export.

(8 files total — over the iteration-discipline 5-file soft ceiling, but balanced because two are tests/fixtures and one is the CSS sibling of the new component. Within reason.)

## Component API

```ts
import type { TrickCardData, Position } from "../../data/mockGame.js";

export interface LastTrickPeekProps {
  readonly cards: readonly TrickCardData[]; // exactly 4
  readonly winnerPosition: Position;
  readonly winnerName: string;
  readonly onClose: () => void;
}
```

Modal renders `position: fixed; inset: 0; z-index: 200` with a cream-paper card containing the 4 `CardFace`s in compass layout + heading "Last trick — {winnerName} won" + terracotta close button.

## Test plan (TDD red → green)

`packages/ui/__tests__/LastTrickPeek.test.tsx`:

1. Renders 4 cards.
2. Renders the winner name in the heading.
3. Clicking the close button calls `onClose`.
4. Clicking the backdrop calls `onClose`.
5. Container has `role="dialog"` + `aria-label="Last trick"` (a11y).
6. Renders without crash when given mock fixture data.

All red before component exists. Standard scaffolding pattern.

## Hook derivation

```ts
// Inside useGameSession, in the render path:
const lastTrickFromCore = round?.tricks.at(-1) ?? null;
const lastCompletedTrick: TrickCardData[] | null = lastTrickFromCore
  ? lastTrickFromCore.cards.map((pc) => {
      const seat = POS_TO_SEAT[pc.playerPosition]!;
      const offsets = TRICK_OFFSETS[seat];
      return { suit: pc.card.suit as Suit, rank: pc.card.rank, position: seat, ...offsets };
    })
  : null;
const lastTrickWinnerPosition: Position | null = lastTrickFromCore
  ? POS_TO_SEAT[lastTrickFromCore.winnerPosition]
  : null;
const [peekingLastTrick, setPeekingLastTrick] = useState(false);
```

Added to the returned `GameSessionState`.

## CSS slot in GameTable

`.peekBtn` — small pill button anchored bottom-right of the trick area zone, ghost style (cream paper background, ink-dark border), pointer-events enabled.

`.peekOverlay` — covers the whole table when active; backdrop click closes.

## Validation

- `pnpm test` — expected: 1589 + 6 new = 1595.
- `pnpm typecheck` — clean.
- `pnpm lint` — delta-clean.
- `pnpm format:check` — clean.
- `pnpm visual` — fixture-mid-trick may diff (new button visible). Re-bless.

## Risks

- **`trickCards.length === 0` heuristic.** Between tricks, the trick area sweeps out — at some point trickCards is empty. But during the sweep animation it's NOT empty (the completedTrick state holds the cards for ~800ms). The peek button will appear after the sweep finishes. Acceptable UX: peek button is for between tricks, not during them.
- **Modal z-index collision.** Set to 200 to clear `BidWinReveal` (z-index ~100) and the chat panel.

## Carryforward

- **N+1 (iter 093) — Extend LastTrickPeek to Coinche + online.** Mirror the `useGameSession` derivation in `useCoinchGameSession` and `useOnlineGameSession`. Same 4 fields. ~3 files. Thin follow-up.
- **N+2 (iter 094) — GameOver CTAs.** Mode-aware button set per the architect's blueprint.
