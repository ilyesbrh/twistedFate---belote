import type { StoryFn, Meta } from "@pixi/storybook-renderer";
import { Container, Graphics } from "pixi.js";
import type { Rect } from "../../layout.js";
import { BiddingPanel } from "./bidding-panel.js";

const meta: Meta = {
  title: "Components/BiddingPanel",
};

export default meta;

// ---- Helpers --------------------------------------------------------

function buildBiddingStory(zone: Rect): { view: Container } {
  const root = new Container();
  root.label = "bidding-story-root";

  // Zone outline for reference
  const zoneBg = new Graphics();
  zoneBg.rect(zone.x, zone.y, zone.width, zone.height);
  zoneBg.stroke({ width: 1, color: 0x444444 });
  zoneBg.label = "zone-outline";
  root.addChild(zoneBg);

  // Use real BiddingPanel component
  const panel = new BiddingPanel();
  panel.update(zone);
  root.addChild(panel);

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
