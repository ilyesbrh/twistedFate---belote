import type { StoryFn, Meta } from "@storybook/react";
import { Application } from "@pixi/react";
import type { Seat } from "../../layout.js";
import { THEME } from "../../theme.js";
import { initPixiReact } from "../../pixi-react-setup.js";
import { PlayerInfoReact } from "./player-info-react.js";

initPixiReact();

const meta: Meta = {
  title: "React/PlayerInfo",
};

export default meta;

// ---- Helpers --------------------------------------------------------

interface StoryPlayerOptions {
  readonly name: string;
  readonly seat: Seat;
  readonly isActive: boolean;
  readonly cardCount: number;
  readonly teamColor: number;
}

// ---- Stories --------------------------------------------------------

/** Active player (south — human). */
export const ActiveSouth: StoryFn = () => (
  <Application width={200} height={160} background={THEME.colors.table.bgDark} antialias>
    <pixiContainer x={80} y={40}>
      <PlayerInfoReact
        name="You"
        seat="south"
        isActive={true}
        cardCount={8}
        teamColor={THEME.colors.team.team1}
      />
    </pixiContainer>
  </Application>
);

/** Inactive partner (north). */
export const InactiveNorth: StoryFn = () => (
  <Application width={200} height={160} background={THEME.colors.table.bgDark} antialias>
    <pixiContainer x={80} y={40}>
      <PlayerInfoReact
        name="Partner"
        seat="north"
        isActive={false}
        cardCount={6}
        teamColor={THEME.colors.team.team1}
      />
    </pixiContainer>
  </Application>
);

/** All 4 players in a row. */
export const AllPlayers: StoryFn = () => {
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

  return (
    <Application width={700} height={160} background={THEME.colors.table.bgDark} antialias>
      {players.map((p, i) => (
        <pixiContainer key={p.seat} x={80 + i * 140} y={40}>
          <PlayerInfoReact
            name={p.name}
            seat={p.seat}
            isActive={p.isActive}
            cardCount={p.cardCount}
            teamColor={p.teamColor}
          />
        </pixiContainer>
      ))}
    </Application>
  );
};
