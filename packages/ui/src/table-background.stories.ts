import type { StoryFn, Meta } from "@pixi/storybook-renderer";
import { Graphics, FillGradient } from "pixi.js";
import { THEME } from "./theme.js";

const meta: Meta = {
  title: "Table/Background",
};

export default meta;

export const Default: StoryFn = () => {
  const bg = new Graphics();
  bg.label = "table-background";

  const draw = (width: number, height: number): void => {
    bg.clear();
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.max(width, height) * 0.8;

    const gradient = new FillGradient({
      type: "radial",
      center: { x: centerX, y: centerY },
      innerRadius: 0,
      outerCenter: { x: centerX, y: centerY },
      outerRadius: radius,
      colorStops: [
        { offset: 0, color: THEME.colors.table.bgLight },
        { offset: 1, color: THEME.colors.table.bgDark },
      ],
    });

    bg.rect(0, 0, width, height);
    bg.fill(gradient);
  };

  draw(800, 600);

  return {
    view: bg,
    resize(w: number, h: number) {
      draw(w, h);
    },
  };
};
