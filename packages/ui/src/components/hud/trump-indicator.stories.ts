import type { StoryFn, Meta } from "@pixi/storybook-renderer";
import { Container, Graphics, Text } from "pixi.js";
import type { Suit } from "@belote/core";
import { ALL_SUITS } from "@belote/core";
import { THEME } from "../../theme.js";
import { suitSymbol, suitColor } from "../../card-textures.js";

const meta: Meta = {
  title: "Components/HUD/TrumpIndicator",
};

export default meta;

// ---- Helpers --------------------------------------------------------

const BADGE_SIZE = 32;
const BADGE_RADIUS = 6;

function buildTrumpBadge(suit: Suit, offsetX: number, offsetY: number): Container {
  const group = new Container();
  group.label = `trump-${suit}`;
  group.x = offsetX;
  group.y = offsetY;

  const bg = new Graphics();
  bg.roundRect(-BADGE_SIZE / 2, -BADGE_SIZE / 2, BADGE_SIZE, BADGE_SIZE, BADGE_RADIUS);
  bg.fill(THEME.colors.ui.overlayLight);
  bg.label = "trump-bg";
  group.addChild(bg);

  const text = new Text({
    text: suitSymbol(suit),
    style: {
      fontFamily: THEME.typography.fontFamily,
      fontSize: THEME.typography.heading.minSize,
      fill: suitColor(suit),
    },
  });
  text.label = "trump-suit";
  text.anchor.set(0.5);
  group.addChild(text);

  // Suit name below
  const label = new Text({
    text: suit,
    style: {
      fontFamily: THEME.typography.fontFamily,
      fontSize: THEME.typography.label.minSize,
      fill: THEME.colors.text.muted,
    },
  });
  label.anchor.set(0.5, 0);
  label.y = BADGE_SIZE / 2 + THEME.spacing.xs;
  group.addChild(label);

  return group;
}

// ---- Stories --------------------------------------------------------

/** All 4 trump suits side by side. */
export const AllSuits: StoryFn = (): { view: Container } => {
  const root = new Container();
  root.label = "story-root";

  ALL_SUITS.forEach((suit, i) => {
    root.addChild(buildTrumpBadge(suit, 50 + i * 60, 50));
  });

  return { view: root };
};

/** Hearts trump. */
export const Hearts: StoryFn = (): { view: Container } => {
  const root = new Container();
  root.label = "story-root";
  root.addChild(buildTrumpBadge("hearts", 50, 50));
  return { view: root };
};

/** Spades trump. */
export const Spades: StoryFn = (): { view: Container } => {
  const root = new Container();
  root.label = "story-root";
  root.addChild(buildTrumpBadge("spades", 50, 50));
  return { view: root };
};
