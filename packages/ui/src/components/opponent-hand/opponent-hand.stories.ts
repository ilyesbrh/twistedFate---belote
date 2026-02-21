import type { StoryFn, Meta } from "@pixi/storybook-renderer";
import { Container, Graphics, Text } from "pixi.js";
import { THEME } from "../../theme.js";
import { createCardBackGraphics } from "../../card-textures.js";
import { computeOpponentLayout } from "./opponent-layout.js";
import type { OpponentOrientation } from "./opponent-layout.js";
import type { Rect } from "../../layout.js";

const meta: Meta = {
  title: "Components/OpponentHand",
};

export default meta;

// ---- Helpers --------------------------------------------------------

function buildOpponentStory(
  zone: Rect,
  cardCount: number,
  orientation: OpponentOrientation,
): { view: Container } {
  const root = new Container();
  root.label = "opponent-story-root";

  // Draw zone outline for visual reference
  const zoneBg = new Graphics();
  zoneBg.rect(zone.x, zone.y, zone.width, zone.height);
  zoneBg.stroke({ width: 1, color: 0x444444 });
  zoneBg.label = "zone-outline";
  root.addChild(zoneBg);

  // Zone label
  const zoneLabel = new Text({
    text: `${orientation} ${String(zone.width)}×${String(zone.height)} (${String(cardCount)} cards)`,
    style: {
      fontFamily: THEME.typography.fontFamily,
      fontSize: THEME.typography.label.minSize,
      fill: THEME.colors.text.muted,
    },
  });
  zoneLabel.label = "zone-label";
  zoneLabel.x = zone.x + THEME.spacing.xs;
  zoneLabel.y = zone.y + THEME.spacing.xs;
  root.addChild(zoneLabel);

  // Compute layout
  const layout = computeOpponentLayout(zone, cardCount, orientation);

  // Place cards
  for (const pos of layout.cards) {
    const cardGfx = createCardBackGraphics();
    cardGfx.label = "card-back";

    // Scale to match computed dimensions
    const scaleX = layout.cardWidth / cardGfx.width;
    const scaleY = layout.cardHeight / cardGfx.height;
    cardGfx.scale.set(scaleX, scaleY);

    // Anchor at center for rotation
    cardGfx.pivot.set(cardGfx.width / 2, cardGfx.height / 2);
    cardGfx.x = pos.x;
    cardGfx.y = pos.y;
    cardGfx.rotation = pos.rotation;

    root.addChild(cardGfx);
  }

  return { view: root };
}

// ---- Stories --------------------------------------------------------

/** Top opponent — 8 face-down cards in horizontal stack. */
export const HorizontalFull: StoryFn = (): { view: Container } => {
  const zone: Rect = { x: 0, y: 0, width: 844, height: 70 };
  return buildOpponentStory(zone, 8, "horizontal");
};

/** Top opponent — 4 cards remaining (mid-game). */
export const HorizontalFour: StoryFn = (): { view: Container } => {
  const zone: Rect = { x: 0, y: 0, width: 844, height: 70 };
  return buildOpponentStory(zone, 4, "horizontal");
};

/** Left opponent — 8 face-down cards in vertical stack. */
export const VerticalLeft: StoryFn = (): { view: Container } => {
  const zone: Rect = { x: 0, y: 70, width: 127, height: 211 };
  return buildOpponentStory(zone, 8, "vertical");
};

/** Right opponent — 8 face-down cards in vertical stack. */
export const VerticalRight: StoryFn = (): { view: Container } => {
  const zone: Rect = { x: 717, y: 70, width: 127, height: 211 };
  return buildOpponentStory(zone, 8, "vertical");
};

/** Side opponent — 3 cards remaining (late game). */
export const VerticalThree: StoryFn = (): { view: Container } => {
  const zone: Rect = { x: 0, y: 70, width: 127, height: 211 };
  return buildOpponentStory(zone, 3, "vertical");
};
