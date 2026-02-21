// ====================================================================
// Dev harness controller.
// Creates a simple DOM-based scene selector overlaid on the PixiJS canvas.
// ====================================================================

import type { Application } from "pixi.js";
import { getScenes } from "./scenes.js";

// Import scenes to trigger registration
import "./table-background.scene.js";
import "./card-gallery.scene.js";

let currentDestroy: (() => void) | undefined;

function loadScene(app: Application, index: number): void {
  const scenes = getScenes();
  const scene = scenes[index];
  if (!scene) return;

  if (currentDestroy) {
    currentDestroy();
    currentDestroy = undefined;
  }

  app.stage.removeChildren();
  scene.create(app);
  currentDestroy = scene.destroy;
}

export function initHarness(app: Application): void {
  const scenes = getScenes();

  const selector = document.createElement("div");
  selector.id = "harness-selector";
  selector.style.cssText = [
    "position:fixed",
    "top:8px",
    "left:8px",
    "z-index:1000",
    "display:flex",
    "gap:4px",
  ].join(";");

  scenes.forEach((scene, i) => {
    const btn = document.createElement("button");
    btn.textContent = scene.name;
    btn.style.cssText = [
      "padding:4px 12px",
      "background:#FFD54F",
      "border:none",
      "border-radius:4px",
      "cursor:pointer",
      "font-size:12px",
      "font-family:sans-serif",
    ].join(";");
    btn.addEventListener("click", () => {
      loadScene(app, i);
    });
    selector.appendChild(btn);
  });

  document.body.appendChild(selector);

  // Auto-load first scene
  if (scenes.length > 0) {
    loadScene(app, 0);
  }
}
