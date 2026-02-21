import type { StoryFn, Meta } from "@pixi/storybook-renderer";
import { Container, Graphics, Text } from "pixi.js";
import { ALL_SUITS } from "@belote/core";
import { THEME } from "../../theme.js";
import { suitSymbol, suitColor } from "../../card-textures.js";
import { computeBiddingLayout } from "./bidding-layout.js";
import type { Rect } from "../../layout.js";

const meta: Meta = {
  title: "Components/BiddingPanel",
};

export default meta;

// ---- Helpers --------------------------------------------------------

const BUTTON_RADIUS = 6;

function buildBiddingStory(zone: Rect): { view: Container } {
  const root = new Container();
  root.label = "bidding-story-root";

  // Zone outline
  const zoneBg = new Graphics();
  zoneBg.rect(zone.x, zone.y, zone.width, zone.height);
  zoneBg.stroke({ width: 1, color: 0x444444 });
  zoneBg.label = "zone-outline";
  root.addChild(zoneBg);

  // Compute layout
  const layout = computeBiddingLayout(zone);

  // Suit buttons
  for (const [i, suit] of ALL_SUITS.entries()) {
    const btnRect = layout.suitButtons[i];
    if (!btnRect) continue;

    const btn = new Container();
    btn.label = `bid-${suit}`;
    btn.x = btnRect.x;
    btn.y = btnRect.y;

    const bg = new Graphics();
    bg.roundRect(0, 0, btnRect.width, btnRect.height, BUTTON_RADIUS);
    bg.fill(THEME.colors.ui.overlayLight);
    btn.addChild(bg);

    const label = new Text({
      text: suitSymbol(suit),
      style: {
        fontFamily: THEME.typography.fontFamily,
        fontSize: THEME.typography.heading.minSize,
        fill: suitColor(suit),
      },
    });
    label.anchor.set(0.5);
    label.x = btnRect.width / 2;
    label.y = btnRect.height / 2;
    btn.addChild(label);

    root.addChild(btn);
  }

  // Pass button
  const passRect = layout.passButton;
  const passBtn = new Container();
  passBtn.label = "bid-pass";
  passBtn.x = passRect.x;
  passBtn.y = passRect.y;

  const passBg = new Graphics();
  passBg.roundRect(0, 0, passRect.width, passRect.height, BUTTON_RADIUS);
  passBg.fill(THEME.colors.ui.overlayLight);
  passBtn.addChild(passBg);

  const passLabel = new Text({
    text: "Pass",
    style: {
      fontFamily: THEME.typography.fontFamily,
      fontSize: THEME.typography.heading.minSize,
      fill: THEME.colors.text.muted,
    },
  });
  passLabel.anchor.set(0.5);
  passLabel.x = passRect.width / 2;
  passLabel.y = passRect.height / 2;
  passBtn.addChild(passLabel);
  root.addChild(passBtn);

  return { view: root };
}

// ---- Stories --------------------------------------------------------

/** Bidding panel at baseline landscape (844x390). */
export const Landscape: StoryFn = (): { view: Container } => {
  const zone: Rect = { x: 0, y: 281, width: 844, height: 109 };
  return buildBiddingStory(zone);
};

/** Bidding panel in portrait zone. */
export const Portrait: StoryFn = (): { view: Container } => {
  const zone: Rect = { x: 0, y: 549, width: 390, height: 295 };
  return buildBiddingStory(zone);
};
