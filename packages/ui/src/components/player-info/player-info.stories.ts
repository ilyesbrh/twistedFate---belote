import type { StoryFn, Meta } from "@pixi/storybook-renderer";
import { Container, Graphics, Text } from "pixi.js";
import { THEME } from "../../theme.js";
import type { PlayerSeat } from "./player-info.js";

const meta: Meta = {
  title: "Components/PlayerInfo",
};

export default meta;

// ---- Helpers --------------------------------------------------------

const AVATAR_RADIUS = 16;
const ACTIVE_RING_WIDTH = 3;
const NAME_GAP = 6;

interface StoryPlayerOptions {
  readonly name: string;
  readonly seat: PlayerSeat;
  readonly isActive: boolean;
  readonly cardCount: number;
  readonly teamColor: number;
}

function buildPlayerInfoStory(
  options: StoryPlayerOptions,
  offsetX: number,
  offsetY: number,
): Container {
  const group = new Container();
  group.label = `player-info-${options.seat}`;
  group.x = offsetX;
  group.y = offsetY;

  // Active ring (behind avatar)
  if (options.isActive) {
    const ring = new Graphics();
    ring.circle(0, 0, AVATAR_RADIUS + ACTIVE_RING_WIDTH);
    ring.stroke({ width: ACTIVE_RING_WIDTH, color: THEME.colors.accent.gold });
    ring.label = "active-ring";
    group.addChild(ring);
  }

  // Avatar circle
  const avatar = new Graphics();
  avatar.circle(0, 0, AVATAR_RADIUS);
  avatar.fill(options.teamColor);
  avatar.label = "avatar";
  group.addChild(avatar);

  // Name
  const name = new Text({
    text: options.name,
    style: {
      fontFamily: THEME.typography.fontFamily,
      fontSize: THEME.typography.playerName.minSize,
      fontWeight: THEME.typography.playerName.fontWeight,
      fill: THEME.colors.text.light,
    },
  });
  name.label = "name";
  name.anchor.set(0.5, 0);
  name.y = AVATAR_RADIUS + NAME_GAP;
  group.addChild(name);

  // Card count
  const count = new Text({
    text: String(options.cardCount),
    style: {
      fontFamily: THEME.typography.fontFamily,
      fontSize: THEME.typography.label.minSize,
      fill: THEME.colors.text.muted,
    },
  });
  count.label = "card-count";
  count.anchor.set(0.5);
  group.addChild(count);

  return group;
}

// ---- Colors from reference image ------------------------------------

const TEAM1_COLOR = 0xff8c00; // Orange
const TEAM2_COLOR = 0x2196f3; // Blue

// ---- Stories --------------------------------------------------------

/** Active player (south — human). */
export const ActiveSouth: StoryFn = (): { view: Container } => {
  const root = new Container();
  root.label = "story-root";
  root.addChild(
    buildPlayerInfoStory(
      { name: "You", seat: "south", isActive: true, cardCount: 8, teamColor: TEAM1_COLOR },
      60,
      60,
    ),
  );
  return { view: root };
};

/** Inactive partner (north). */
export const InactiveNorth: StoryFn = (): { view: Container } => {
  const root = new Container();
  root.label = "story-root";
  root.addChild(
    buildPlayerInfoStory(
      {
        name: "Partner",
        seat: "north",
        isActive: false,
        cardCount: 6,
        teamColor: TEAM1_COLOR,
      },
      60,
      60,
    ),
  );
  return { view: root };
};

/** All 4 players in a row. */
export const AllPlayers: StoryFn = (): { view: Container } => {
  const root = new Container();
  root.label = "story-root";

  const players: StoryPlayerOptions[] = [
    { name: "You", seat: "south", isActive: true, cardCount: 8, teamColor: TEAM1_COLOR },
    { name: "Partner", seat: "north", isActive: false, cardCount: 7, teamColor: TEAM1_COLOR },
    { name: "Opponent L", seat: "west", isActive: false, cardCount: 8, teamColor: TEAM2_COLOR },
    { name: "Opponent R", seat: "east", isActive: false, cardCount: 5, teamColor: TEAM2_COLOR },
  ];

  players.forEach((p, i) => {
    root.addChild(buildPlayerInfoStory(p, 60 + i * 120, 60));
  });

  return { view: root };
};
