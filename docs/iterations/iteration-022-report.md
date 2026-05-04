# Iteration 022 Report — InstallPrompt cream-paper restyle

**Date**: 2026-05-04
**Status**: Complete
**Test delta**: 715 → 715 (no behaviour change)

## Goal

The PWA install banner was the only menu surface still on the
iteration-018 dark style and clashed against the cream paper from
iteration 021. CSS-only restyle into the new vocabulary.

## TDD trail

Pure CSS swap, no markup change. Existing 5 InstallPrompt tests
covered all interactions and stayed green.

## Files

### Modified

- `packages/ui/src/components/InstallPrompt/InstallPrompt.module.css`
  — banner now a cream paper card inset 12px from page edges, with
  2px ink border, chunky drop-shadow, decorative pin-dot corners
  matching the room-code paper tag. Title in serif Yeseva, subtitle
  in handwritten Caveat, Install button is the same terracotta stamp
  the lobby uses, Dismiss is a cream chip with handwritten label.

## Validation

| Check                                 | Result                 |
| ------------------------------------- | ---------------------- |
| `pnpm test`                           | 35 files / 715 passing |
| `pnpm typecheck`                      | Clean                  |
| `pnpm lint`                           | 189 errors (no delta)  |
| `pnpm format:check` (iteration scope) | Clean                  |

### Manual smoke

Fired `beforeinstallprompt` via the DevTools console at
`http://localhost:5179/twistedFate-belote/`. Banner rendered as
cream paper card sitting on top of the menu — visually consistent
with the rest of the surface (no longer the dark-banner clash).

Screenshot: `docs/screenshots/iteration-022-install-prompt.png`.

## Carryforward

- **In-game UI chrome** still on iteration-016 visual track —
  iteration 023.
- The banner is still always-on-top; could become smaller / chip-
  shaped after first dismissal if we want to be more polite.
