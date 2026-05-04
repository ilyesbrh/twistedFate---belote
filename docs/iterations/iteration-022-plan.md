# Iteration 022 — InstallPrompt cream-paper restyle

## Goal

The PWA install banner — the only menu surface still on the
iteration-018 dark style — clashes badly against the cream paper
landed by iteration 021. Bring it into the same visual vocabulary:
cream paper card, ink border, serif title, handwritten subtitle,
terracotta stamp button.

## Scope

CSS-only. No markup changes; behaviour and tests unchanged.

### Modified

- `packages/ui/src/components/InstallPrompt/InstallPrompt.module.css`
  — full restyle.

## Visual changes

- Banner becomes a cream paper card with 2px ink border and chunky
  drop-shadow, inset 12px from the page edges (was edge-to-edge dark).
- Decorative corner pin dots match the room-code paper tag.
- Title in display serif (Yeseva One), ink colour.
- Subtitle in handwritten Caveat, muted ink.
- Install button → terracotta stamp matching the lobby's primary CTA.
- Dismiss button → cream chip with handwritten label, ink-faint
  border.

## TDD plan

No new behaviour — existing 5 InstallPrompt tests cover all
interactions. Verify they still pass after the CSS swap.

## Validation

- `pnpm test` — 715/715, no delta.
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check` — no delta.
- Manual: fire `beforeinstallprompt` via DevTools console, confirm
  banner appears in the new style.

## Out of scope

- In-game UI chrome alignment (iteration 023).
- New install flow / settings affordance for re-prompting.
