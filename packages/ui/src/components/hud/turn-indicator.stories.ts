import type { StoryFn, Meta } from "@pixi/storybook-renderer";
import { Container, Text } from "pixi.js";
import { THEME } from "../../theme.js";
import type { TurnSeat } from "./turn-indicator.js";

const meta: Meta = {
  title: "Components/HUD/TurnIndicator",
};

export default meta;

// ---- Helpers --------------------------------------------------------

const ARROWS: Record<TurnSeat, string> = {
  south: "\u2193",
  north: "\u2191",
  west: "\u2190",
  east: "\u2192",
};

function buildTurnIndicator(
  seat: TurnSeat,
  playerName: string,
  offsetX: number,
  offsetY: number,
): Container {
  const group = new Container();
  group.label = `turn-${seat}`;
  group.x = offsetX;
  group.y = offsetY;

  const arrow = new Text({
    text: ARROWS[seat],
    style: {
      fontFamily: THEME.typography.fontFamily,
      fontSize: THEME.typography.heading.minSize,
      fill: THEME.colors.accent.gold,
    },
  });
  arrow.label = "turn-arrow";
  arrow.anchor.set(0.5);
  group.addChild(arrow);

  const name = new Text({
    text: playerName,
    style: {
      fontFamily: THEME.typography.fontFamily,
      fontSize: THEME.typography.label.minSize,
      fontWeight: THEME.typography.playerName.fontWeight,
      fill: THEME.colors.accent.gold,
    },
  });
  name.label = "turn-name";
  name.anchor.set(0.5, 0);
  name.y = THEME.typography.heading.minSize / 2 + THEME.spacing.xs;
  group.addChild(name);

  return group;
}

// ---- Stories --------------------------------------------------------

/** Your turn (south). */
export const YourTurn: StoryFn = (): { view: Container } => {
  const root = new Container();
  root.label = "story-root";
  root.addChild(buildTurnIndicator("south", "Your turn", 60, 40));
  return { view: root };
};

/** All directions. */
export const AllDirections: StoryFn = (): { view: Container } => {
  const root = new Container();
  root.label = "story-root";

  const seats: { seat: TurnSeat; name: string }[] = [
    { seat: "south", name: "You" },
    { seat: "north", name: "Partner" },
    { seat: "west", name: "Opponent L" },
    { seat: "east", name: "Opponent R" },
  ];

  seats.forEach((s, i) => {
    root.addChild(buildTurnIndicator(s.seat, s.name, 60 + i * 100, 40));
  });

  return { view: root };
};
