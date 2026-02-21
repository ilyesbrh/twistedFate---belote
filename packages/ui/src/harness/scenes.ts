// ====================================================================
// Dev harness scene registry.
// Each scene is a self-contained visual demo (equivalent to a Storybook story).
// ====================================================================

import type { Application } from "pixi.js";

export interface Scene {
  readonly name: string;
  readonly create: (app: Application) => void;
  readonly destroy?: () => void;
}

const scenes: Scene[] = [];

export function registerScene(scene: Scene): void {
  scenes.push(scene);
}

export function getScenes(): readonly Scene[] {
  return scenes;
}
