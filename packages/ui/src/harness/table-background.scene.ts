// ====================================================================
// Scene: Table Background
// Renders a radial gradient green felt — the base layer for the game table.
// ====================================================================

import { Graphics, FillGradient } from "pixi.js";
import type { Application } from "pixi.js";
import { THEME } from "../theme.js";
import { registerScene } from "./scenes.js";

function createTableBackground(app: Application): void {
  const bg = new Graphics();
  bg.label = "table-background";

  const drawBackground = (): void => {
    bg.clear();
    const { width, height } = app.screen;

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

  drawBackground();
  app.stage.addChild(bg);

  app.renderer.on("resize", drawBackground);
}

registerScene({
  name: "Table Background",
  create: createTableBackground,
});
