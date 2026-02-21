// ====================================================================
// Dev entry point — creates the PixiJS app and initializes the harness.
// This file is NOT exported from the package barrel. Dev-only.
// ====================================================================

import { createApp } from "./bootstrap.js";
import { initHarness } from "./harness/index.js";

async function main(): Promise<void> {
  const app = await createApp({ resizeTo: window });
  document.body.appendChild(app.canvas);
  initHarness(app);
}

void main();
