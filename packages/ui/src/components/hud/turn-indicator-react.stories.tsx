import type { StoryFn, Meta } from "@storybook/react";
import { Application } from "@pixi/react";
import type { Seat } from "../../layout.js";
import { THEME } from "../../theme.js";
import { initPixiReact } from "../../pixi-react-setup.js";
import { TurnIndicatorReact } from "./turn-indicator-react.js";

initPixiReact();

const meta: Meta = {
  title: "React/HUD/TurnIndicator",
};

export default meta;

// ---- Stories --------------------------------------------------------

/** Your turn (south). */
export const YourTurn: StoryFn = () => (
  <Application width={200} height={100} background={THEME.colors.table.bgDark} antialias>
    <pixiContainer x={80} y={30}>
      <TurnIndicatorReact seat="south" playerName="Your turn" />
    </pixiContainer>
  </Application>
);

/** All 4 directions side by side. */
export const AllDirections: StoryFn = () => {
  const seats: { seat: Seat; name: string }[] = [
    { seat: "south", name: "You" },
    { seat: "north", name: "Partner" },
    { seat: "west", name: "Opponent L" },
    { seat: "east", name: "Opponent R" },
  ];

  return (
    <Application width={500} height={100} background={THEME.colors.table.bgDark} antialias>
      {seats.map((s, i) => (
        <pixiContainer key={s.seat} x={60 + i * 110} y={30}>
          <TurnIndicatorReact seat={s.seat} playerName={s.name} />
        </pixiContainer>
      ))}
    </Application>
  );
};
