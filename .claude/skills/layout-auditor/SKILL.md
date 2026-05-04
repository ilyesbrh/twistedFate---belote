---
name: layout-auditor
description: Audits component alignment, centering, spacing, and CSS structural quality across the @belote/ui package. Use when the user asks for an alignment/structural review, when something "feels off" visually, or when adding/modifying a UI component. Produces a findings table with file:line references and concrete recommended fixes.
---

# Layout Auditor

This skill is the project's authority on **how UI elements are positioned, aligned, centered, and spaced**. It is _only_ concerned with structural CSS and layout quality — not visual style, color, or typography (those have their own design language doc in `CLAUDE.md`).

## When to invoke

- User asks for a layout/alignment/structural audit ("audit the components", "things look misaligned", "the position is off")
- After authoring or modifying any component under `packages/ui/src/components/`
- Before shipping a new screen-level component
- When `pnpm audit:clip` reports a real (non-decorative) clipping issue

## Operating principles

These are the rules the skill enforces. They are deliberately opinionated — pick **one** way to do each thing so the codebase stays coherent.

### 1. Centering: pick the right tool

Pick the technique that matches the goal, and use only that one within a component:

- **Center a single child on both axes** → `display: grid; place-items: center;` (avoid the verbose flex `justify`+`align` combo).
- **Center text within its own line** → `text-align: center;` (don't reach for flex).
- **Center an absolutely-positioned box** → `top: 50%; left: 50%; translate: -50% -50%;` (use the modern `translate` property — never `transform: translate(-50%, -50%)`, which collides with animation transforms).
- **Center a row of items horizontally** → `display: flex; justify-content: center;` (don't use `margin: 0 auto` on each item).
- **Center a single block in a column** → `margin-inline: auto;` (logical property — clearer than `margin: 0 auto`).

### 2. Layout primitives — flex vs grid

- **Flex** for one-dimensional rows/columns where item count is variable (toolbar, button row, hand of cards).
- **Grid** for two-dimensional structure or when you need named rows/columns (table layout, score panel, modal frame).
- **`gap`** is the only legal way to space siblings. No `margin-right` on every-but-last-child, no `:not(:last-child)` margin hacks.
- **Always set `min-width: 0`** on flex children that contain text or other shrinkable content — otherwise `text-overflow: ellipsis` silently breaks.
- **Always set `min-height: 0`** on flex children that scroll vertically inside a fixed-height parent.

### 3. Sizing

- **Avoid fixed pixel widths on layout containers.** Use `width: 100%`, `max-width`, `min-width`, or grid/flex.
- **Fixed sizes are fine for icons, avatars, badges, single-purpose buttons.** Use a token (e.g. `--avatar-size`) when the value is referenced from more than one selector.
- **Use `aspect-ratio`** instead of computing height from width.
- **Use logical properties** (`inline-size`, `block-size`, `padding-inline`, `margin-block`) for anything that should flip in RTL. Plain `width`/`height` is fine for visual primitives that have no logical orientation (a card face, an avatar token).

### 4. Positioning

- **`position: absolute`** is the _last resort_. Prefer flow + grid/flex first.
- **`position: fixed`** only for: chrome that floats over the viewport (chat button, install banner, modal backdrop, toast).
- Every absolute/fixed element MUST have all four of `top` / `right` / `bottom` / `left` either set explicitly or anchored to a single edge with `inset` shorthand. No "implicit zero" — write it.
- Z-index uses the project scale (see `tokens.css` if present, otherwise: 1=resting, 10=floating, 100=modal, 1000=toast).

### 5. Safe areas + viewport math

- Bottom-anchored chrome on mobile must include `env(safe-area-inset-bottom, 0px)` in its padding/offset.
- `100vh` is broken on mobile — use `100dvh` (dynamic viewport height) when the container should fill the visible viewport.
- Don't combine `vh` with safe-area insets — they double-count.

### 6. Responsive breakpoints

The project uses these media queries; do not invent new ones:

- `@media (max-width: 360px)` — tiny phone
- `@media (max-width: 600px)` — phone portrait
- `@media (max-width: 900px)` — phone + small tablet
- `@media (max-height: 500px) and (orientation: landscape)` — phone landscape

Use `min-width` queries only when defining tablet/desktop overrides on top of a mobile-first base.

### 7. Centering verification

A component "centers correctly" when:

- The visible content's bounding box has equal whitespace on opposing sides (or matches an explicit asymmetric design intent documented in a comment).
- The component's _layout_ doesn't shift if its content's intrinsic width changes by ±20% (e.g. swap a name "Vi" for "Villiana" and the avatar token stays in place).

If the layout shifts, the centering is brittle — almost always due to mixing flex `justify-content: center` with a sibling that grows.

## Audit procedure

When asked to audit, follow these steps in order:

### Step 1: Discover all components

```
Glob: packages/ui/src/components/**/*.tsx
```

Pair each `.tsx` with its `.module.css`. Component without a CSS module → flag (it's either using inline styles or relying on a parent's CSS — both are footguns).

### Step 2: For each component, scan its CSS module for these smells

Read the `.module.css` and the `.tsx` together. Each item below is `Smell — Detection — Fix`.

- **Old-school centering shorthand** — grep `transform:\s*translate\(-50%` — replace with `translate: -50% -50%;` (modern independent property, no conflict with animation transforms).
- **Mixed flex + per-child margins for spacing** — a rule with `display: flex` whose children also use `margin-left|right|top|bottom` — replace per-child margin with a single `gap` on the parent.
- **Fixed pixel width on a layout container** — grep `width: \d+px` where the selector is `.root` / `.container` / `.wrapper` — switch to `max-width` + `width: 100%`.
- **Magic offset numbers** — `top: <n>px` or `left: <n>px` with `position: absolute` and no comment — document why or switch to flex/grid alignment.
- **`100vh` without a `100dvh` fallback** — grep `100vh` — change to `100dvh` (keep `100vh` as a fallback line above it for old browsers).
- **Bottom chrome without safe-area** — `position: fixed; bottom: 0` (or absolute equivalent) without `env(safe-area-inset-bottom` — add `padding-bottom: calc(env(safe-area-inset-bottom, 0px) + <gap>)`.
- **Flex child can collapse its text** — flex item containing text but no `min-width: 0` (and text uses ellipsis) — add `min-width: 0`.
- **Z-index magic number** — `z-index: \d+` where the value isn't 1, 10, 100, 1000, or a `var(--z-*)` token — replace with a token from the project scale.
- **Hard-coded color** — `#[0-9a-f]{3,8}` outside `tokens.css` and SVG asset files — replace with the matching `var(--*)` token.
- **Inline `style={{}}` for static values** — grep `style=\{\{` in `.tsx` — move to CSS module unless the value is computed at runtime (transform, custom-property override, dynamic background URL).

### Step 3: Run the live alignment probe (optional but valuable)

The repo ships `scripts/clip-audit.mjs` (`pnpm audit:clip`). Re-run it for the current dev server and treat each finding as a candidate. **Cross-reference**: if a finding is also flagged by static analysis above, it's a real bug. If only the live probe flags it, examine whether the parent intentionally clips a decoration (corner watermark, hidden drawer) — those are filtered, but new ones may slip through.

### Step 4: Produce the audit report

Output format:

```
## Layout Audit Report — <date>

### Summary
- N components scanned
- M findings (X high, Y medium, Z low)

### High priority
- `Component/File.module.css:42` — <smell> — <fix>

### Medium priority
- ...

### Low priority
- ...

### Carried forward (not auto-fixable, needs design call)
- ...
```

Severity rubric:

- **High**: visually broken on a supported viewport, or violates safe-area/dvh and will misbehave on iOS Safari
- **Medium**: works today but is brittle (mixed centering, magic numbers, missing `min-width: 0`)
- **Low**: style violation that doesn't affect rendering (hard-coded color where token exists, inline `style` for static value)

### Step 5: Offer to apply fixes

After producing the report, ask the user which severity bands to auto-fix. Apply only the **mechanical** fixes (those whose "Fix" column above is a string-replacement). Anything ambiguous (magic offset numbers, design calls) stays in the report and waits for the user.

## Creating new layout-aware components

When the user asks to _create_ a new component (vs audit existing), follow this checklist:

1. Start from a CSS module file with `.root` selector. Default the root to:
   ```css
   .root {
     display: flex; /* or grid, depending on need */
     align-items: center;
     justify-content: center;
     min-width: 0; /* if it'll ever live inside a flex parent */
   }
   ```
2. Pick **one** centering technique and stick to it for the whole component.
3. Use the project breakpoint set above; don't invent new ones.
4. After implementing, run the static checks from Step 2 against the new file before declaring done.
5. If the component will live inside a screen with safe areas (anything bottom-anchored on mobile), include the safe-area inset from day one.

## What this skill does NOT do

- Visual style review (color, font, illustration) — see project design notes in `CLAUDE.md`.
- Accessibility audit (focus rings, contrast, keyboard) — that's a separate concern.
- Performance audit (layout thrash, large repaints) — also separate.
- Functional bug review — out of scope.

If the user asks for those, point them at the relevant tool/skill instead of stretching this one.
