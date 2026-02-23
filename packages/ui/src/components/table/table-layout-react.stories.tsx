import type { StoryFn, Meta } from "@storybook/react";
import { Application } from "@pixi/react";
import { THEME } from "../../theme.js";
import { initPixiReact } from "../../pixi-react-setup.js";
import { TableLayoutReact } from "./table-layout-react.js";

initPixiReact();

const meta: Meta = {
  title: "React/TableLayout",
};

export default meta;

// ---- Stories --------------------------------------------------------

/** Design baseline — iPhone 14 landscape (844x390). 5-zone flexbox layout. */
export const LandscapeBaseline: StoryFn = () => (
  <Application width={844} height={390} background={THEME.colors.table.bgDark} antialias>
    <TableLayoutReact
      width={844}
      height={390}
      topContent={
        <pixiText
          text="TOP (18%)"
          style={{ fill: THEME.colors.text.light, fontSize: 14 }}
          x={10}
          y={10}
        />
      }
      leftContent={
        <pixiText text="L" style={{ fill: THEME.colors.text.light, fontSize: 12 }} x={4} y={4} />
      }
      centerContent={
        <pixiText
          text="CENTER"
          style={{ fill: THEME.colors.accent.gold, fontSize: 16 }}
          x={10}
          y={10}
        />
      }
      rightContent={
        <pixiText text="R" style={{ fill: THEME.colors.text.light, fontSize: 12 }} x={4} y={4} />
      }
      bottomContent={
        <pixiText
          text="BOTTOM (28%)"
          style={{ fill: THEME.colors.text.light, fontSize: 14 }}
          x={10}
          y={10}
        />
      }
    />
  </Application>
);

/** Portrait fallback — iPhone 14 portrait (390x844). */
export const PortraitFallback: StoryFn = () => (
  <Application width={390} height={844} background={THEME.colors.table.bgDark} antialias>
    <TableLayoutReact
      width={390}
      height={844}
      topContent={
        <pixiText
          text="TOP (25%)"
          style={{ fill: THEME.colors.text.light, fontSize: 14 }}
          x={10}
          y={10}
        />
      }
      centerContent={
        <pixiText
          text="CENTER"
          style={{ fill: THEME.colors.accent.gold, fontSize: 16 }}
          x={10}
          y={10}
        />
      }
      bottomContent={
        <pixiText
          text="BOTTOM (35%)"
          style={{ fill: THEME.colors.text.light, fontSize: 14 }}
          x={10}
          y={10}
        />
      }
    />
  </Application>
);

/** Empty — no zone content, just background and zone structure. */
export const EmptyZones: StoryFn = () => (
  <Application width={844} height={390} background={THEME.colors.table.bgDark} antialias>
    <TableLayoutReact width={844} height={390} />
  </Application>
);
