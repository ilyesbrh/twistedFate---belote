import type { StoryFn, Meta } from "@pixi/storybook-renderer";
import { Container } from "pixi.js";
import { THEME } from "../../theme.js";
import { PlayerInfo } from "./player-info.js";
import type { PlayerSeat } from "./player-info.js";

const meta: Meta = {
  title: "Components/PlayerInfo",
};

export default meta;

// ---- Helpers --------------------------------------------------------

interface StoryPlayerOptions {
  readonly name: string;
  readonly seat: PlayerSeat;
  readonly isActive: boolean;
  readonly cardCount: number;
  readonly teamColor: number;
}

function placePlayerInfo(
  options: StoryPlayerOptions,
  offsetX: number,
  offsetY: number,
): PlayerInfo {
  const info = new PlayerInfo(options);
  info.x = offsetX;
  info.y = offsetY;
  return info;
}

// ---- Stories --------------------------------------------------------

/** Active player (south — human). */
export const ActiveSouth: StoryFn = (): { view: Container } => {
  const root = new Container();
  root.label = "story-root";
  root.addChild(
    placePlayerInfo(
      {
        name: "You",
        seat: "south",
        isActive: true,
        cardCount: 8,
        teamColor: THEME.colors.team.team1,
      },
      80,
      80,
    ),
  );
  return { view: root };
};

/** Inactive partner (north). */
export const InactiveNorth: StoryFn = (): { view: Container } => {
  const root = new Container();
  root.label = "story-root";
  root.addChild(
    placePlayerInfo(
      {
        name: "Partner",
        seat: "north",
        isActive: false,
        cardCount: 6,
        teamColor: THEME.colors.team.team1,
      },
      80,
      80,
    ),
  );
  return { view: root };
};

/** All 4 players in a row. */
export const AllPlayers: StoryFn = (): { view: Container } => {
  const root = new Container();
  root.label = "story-root";

  const players: StoryPlayerOptions[] = [
    {
      name: "You",
      seat: "south",
      isActive: true,
      cardCount: 8,
      teamColor: THEME.colors.team.team1,
    },
    {
      name: "Partner",
      seat: "north",
      isActive: false,
      cardCount: 7,
      teamColor: THEME.colors.team.team1,
    },
    {
      name: "Opponent L",
      seat: "west",
      isActive: false,
      cardCount: 8,
      teamColor: THEME.colors.team.team2,
    },
    {
      name: "Opponent R",
      seat: "east",
      isActive: false,
      cardCount: 5,
      teamColor: THEME.colors.team.team2,
    },
  ];

  players.forEach((p, i) => {
    root.addChild(placePlayerInfo(p, 80 + i * 140, 80));
  });

  return { view: root };
};
