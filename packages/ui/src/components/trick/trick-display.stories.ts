import type { StoryFn, Meta } from "@pixi/storybook-renderer";
import { Container, Graphics, Text } from "pixi.js";
import { THEME } from "../../theme.js";
import { createCardFaceGraphics } from "../../card-textures.js";
import { computeTrickLayout } from "./trick-layout.js";
import type { TrickPosition } from "./trick-layout.js";
import type { Rect } from "../../layout.js";
import type { Suit, Rank } from "@belote/core";

const meta: Meta = {
  title: "Components/TrickDisplay",
};

export default meta;

// ---- Helpers --------------------------------------------------------

interface StoryTrickCard {
  readonly position: TrickPosition;
  readonly suit: Suit;
  readonly rank: Rank;
}

function buildTrickStory(zone: Rect, playedCards: readonly StoryTrickCard[]): { view: Container } {
  const root = new Container();
  root.label = "trick-story-root";

  // Draw zone outline
  const zoneBg = new Graphics();
  zoneBg.rect(zone.x, zone.y, zone.width, zone.height);
  zoneBg.stroke({ width: 1, color: 0x444444 });
  zoneBg.label = "zone-outline";
  root.addChild(zoneBg);

  // Zone label
  const zoneLabel = new Text({
    text: `Center Zone: ${String(zone.width)}×${String(zone.height)}`,
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
  const layout = computeTrickLayout(zone);

  // Draw slot markers (faint) for all 4 positions
  const positions: TrickPosition[] = ["south", "north", "west", "east"];
  for (const pos of positions) {
    const slot = layout.slots[pos];
    const marker = new Graphics();
    marker.circle(slot.x, slot.y, 3);
    marker.fill(0x666666);
    marker.label = `slot-marker-${pos}`;
    root.addChild(marker);
  }

  // Place played cards
  for (const card of playedCards) {
    const slot = layout.slots[card.position];
    const cardGfx = createCardFaceGraphics(card.suit, card.rank);
    cardGfx.label = `card-${card.suit}-${card.rank}`;

    const scaleX = layout.cardWidth / cardGfx.width;
    const scaleY = layout.cardHeight / cardGfx.height;
    cardGfx.scale.set(scaleX, scaleY);

    cardGfx.pivot.set(cardGfx.width / 2, cardGfx.height / 2);
    cardGfx.x = slot.x;
    cardGfx.y = slot.y;
    cardGfx.rotation = slot.rotation;

    root.addChild(cardGfx);
  }

  return { view: root };
}

// ---- Stories --------------------------------------------------------

const CENTER: Rect = { x: 127, y: 70, width: 590, height: 211 };

/** Empty trick — just slot markers visible. */
export const Empty: StoryFn = (): { view: Container } => {
  return buildTrickStory(CENTER, []);
};

/** One card played (human leads). */
export const OneCard: StoryFn = (): { view: Container } => {
  return buildTrickStory(CENTER, [{ position: "south", suit: "hearts", rank: "ace" }]);
};

/** Two cards played. */
export const TwoCards: StoryFn = (): { view: Container } => {
  return buildTrickStory(CENTER, [
    { position: "south", suit: "hearts", rank: "ace" },
    { position: "west", suit: "hearts", rank: "king" },
  ]);
};

/** Full trick — all 4 cards played. */
export const FullTrick: StoryFn = (): { view: Container } => {
  return buildTrickStory(CENTER, [
    { position: "south", suit: "hearts", rank: "ace" },
    { position: "west", suit: "hearts", rank: "king" },
    { position: "north", suit: "hearts", rank: "10" },
    { position: "east", suit: "spades", rank: "jack" },
  ]);
};
