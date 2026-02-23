// ====================================================================
// TrickDisplayReact — React functional component for the center trick
// area. Renders 0–4 played cards at N/S/E/W positions using
// computeTrickLayout. Cards scaled to trick dimensions and wrapped in
// createMaskedCard for clean bordered rendering.
// Coexists with imperative trick-display.ts during migration.
// ====================================================================

import { useCallback } from "react";
import type { Container } from "pixi.js";
import type { Suit, Rank } from "@belote/core";
import type { Rect } from "../../layout.js";
import { createCardFaceGraphics } from "../../card-textures.js";
import { createMaskedCard } from "../../card-frame.js";
import { computeTrickLayout } from "./trick-layout.js";
import type { TrickPosition } from "./trick-layout.js";

// ---- Types ----------------------------------------------------------

export interface TrickCardReact {
  readonly position: TrickPosition;
  readonly suit: Suit;
  readonly rank: Rank;
}

export interface TrickDisplayReactProps {
  zone: Rect;
  cards: readonly TrickCardReact[];
}

// ---- Component ------------------------------------------------------

export function TrickDisplayReact({ zone, cards }: TrickDisplayReactProps): React.JSX.Element {
  const layout = computeTrickLayout(zone);

  // Mount card Graphics imperatively into each pixiContainer
  const mountCard = useCallback(
    (index: number) => (containerEl: Container | null) => {
      if (!containerEl) return;

      // Clear previous children (React re-render)
      containerEl.removeChildren();

      const card = cards[index];
      if (!card) return;

      const gfx = createCardFaceGraphics(card.suit, card.rank);
      gfx.label = `card-${card.suit}-${card.rank}`;

      // Scale card face to fit trick card dimensions
      const naturalWidth = gfx.width;
      const naturalHeight = gfx.height;
      gfx.scale.set(layout.cardWidth / naturalWidth, layout.cardHeight / naturalHeight);

      const frame = createMaskedCard({
        content: gfx,
        width: layout.cardWidth,
        height: layout.cardHeight,
      });
      frame.pivot.set(layout.cardWidth / 2, layout.cardHeight / 2);

      containerEl.addChild(frame);
    },
    [cards, layout],
  );

  return (
    <pixiContainer label="trick-display">
      {cards.map((card, i) => {
        const slot = layout.slots[card.position];

        return (
          <pixiContainer
            key={`${card.position}-${card.suit}-${card.rank}`}
            label={`trick-card-${card.position}`}
            ref={mountCard(i)}
            x={slot.x}
            y={slot.y}
            rotation={slot.rotation}
          />
        );
      })}
    </pixiContainer>
  );
}
