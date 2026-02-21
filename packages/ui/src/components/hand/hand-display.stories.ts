import type { StoryFn, Meta } from "@pixi/storybook-renderer";
import { Container, Graphics, Text } from "pixi.js";
import type { Suit, Rank } from "@belote/core";
import { THEME } from "../../theme.js";
import { createCardFaceGraphics } from "../../card-textures.js";
import { computeHandLayout } from "./hand-layout.js";
import type { Rect } from "../../layout.js";

const meta: Meta = {
  title: "Components/HandDisplay",
};

export default meta;

// ---- Helpers --------------------------------------------------------

/** Standard belote hand for stories. */
const FULL_HAND: readonly { suit: Suit; rank: Rank }[] = [
  { suit: "spades", rank: "7" },
  { suit: "spades", rank: "8" },
  { suit: "spades", rank: "9" },
  { suit: "hearts", rank: "jack" },
  { suit: "hearts", rank: "queen" },
  { suit: "diamonds", rank: "ace" },
  { suit: "clubs", rank: "king" },
  { suit: "clubs", rank: "10" },
];

/** Builds a visual hand fan using layout math + drawing primitives. */
function buildHandStory(
  zone: Rect,
  cards: readonly { suit: Suit; rank: Rank }[],
): { view: Container } {
  const root = new Container();
  root.label = "hand-story-root";

  // Draw zone outline for visual reference
  const zoneBg = new Graphics();
  zoneBg.rect(zone.x, zone.y, zone.width, zone.height);
  zoneBg.stroke({ width: 1, color: 0x444444 });
  zoneBg.label = "zone-outline";
  root.addChild(zoneBg);

  // Zone label
  const zoneLabel = new Text({
    text: `Bottom Zone: ${String(zone.width)}×${String(zone.height)}`,
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

  // Compute fan layout
  const layout = computeHandLayout(zone, cards.length);

  // Place cards
  for (const [i, card] of cards.entries()) {
    const pos = layout.cards[i];
    if (!pos) continue;

    const cardGfx = createCardFaceGraphics(card.suit, card.rank);
    cardGfx.label = `card-${card.suit}-${card.rank}`;

    // Scale to match computed card dimensions
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

/** 8 cards — full belote hand at baseline (844x390 landscape). */
export const FullHand: StoryFn = (): { view: Container } => {
  const zone: Rect = { x: 0, y: 281, width: 844, height: 109 };
  return buildHandStory(zone, FULL_HAND);
};

/** 5 cards — mid-game hand. */
export const FiveCards: StoryFn = (): { view: Container } => {
  const zone: Rect = { x: 0, y: 281, width: 844, height: 109 };
  return buildHandStory(zone, FULL_HAND.slice(0, 5));
};

/** 3 cards — late game hand. */
export const ThreeCards: StoryFn = (): { view: Container } => {
  const zone: Rect = { x: 0, y: 281, width: 844, height: 109 };
  return buildHandStory(zone, FULL_HAND.slice(0, 3));
};

/** 1 card — last card. */
export const SingleCard: StoryFn = (): { view: Container } => {
  const zone: Rect = { x: 0, y: 281, width: 844, height: 109 };
  return buildHandStory(zone, FULL_HAND.slice(0, 1));
};

/** Portrait zone — narrower, taller. */
export const PortraitZone: StoryFn = (): { view: Container } => {
  const zone: Rect = { x: 0, y: 549, width: 390, height: 295 };
  return buildHandStory(zone, FULL_HAND);
};
