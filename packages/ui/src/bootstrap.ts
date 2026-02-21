// ====================================================================
// PixiJS Application bootstrap.
// Creates and configures the rendering application.
// Not unit-tested — requires browser canvas. Verified via dev server.
// ====================================================================

import { Application } from "pixi.js";
import { THEME } from "./theme.js";

export interface AppConfig {
  readonly resizeTo?: Window | HTMLElement;
  readonly backgroundColor?: string | number;
  readonly antialias?: boolean;
}

export async function createApp(config?: AppConfig): Promise<Application> {
  const app = new Application();

  await app.init({
    resizeTo: config?.resizeTo,
    background: config?.backgroundColor ?? THEME.colors.table.bgDark,
    antialias: config?.antialias ?? true,
    autoDensity: true,
    resolution: devicePixelRatio,
    preference: "webgl",
  });

  app.stage.label = "root";

  return app;
}
