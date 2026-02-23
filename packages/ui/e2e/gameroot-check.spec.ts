import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = resolve(__dirname, "screenshots");
mkdirSync(SCREENSHOT_DIR, { recursive: true });

const BASE = "http://localhost:6006";
const PIXI_RENDER_WAIT_MS = 2000;

interface GameRootStory {
  id: string;
  label: string;
  expectCanvas: boolean;
}

const STORIES: GameRootStory[] = [
  { id: "react-gameroot--playing", label: "Playing phase", expectCanvas: true },
  { id: "react-gameroot--bidding", label: "Bidding phase", expectCanvas: true },
  { id: "react-gameroot--idle", label: "Idle state", expectCanvas: true },
  { id: "react-gameroot--portrait", label: "Portrait layout", expectCanvas: true },
];

test.setTimeout(120_000);

for (const story of STORIES) {
  test(`GameRoot — ${story.label}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    const url = `${BASE}/iframe.html?id=${story.id}&viewMode=story`;
    await page.goto(url, { waitUntil: "load", timeout: 15000 });

    if (story.expectCanvas) {
      const canvas = page.locator("canvas");
      await expect(canvas).toBeVisible({ timeout: 8000 });
    }

    await page.waitForTimeout(PIXI_RENDER_WAIT_MS);

    // No page errors
    expect(errors, `Console errors for ${story.id}`).toEqual([]);

    // Capture screenshot for visual review
    await page.screenshot({
      path: resolve(SCREENSHOT_DIR, `${story.id}.png`),
      clip: { x: 0, y: 0, width: 1280, height: 800 },
      timeout: 30000,
    });
  });
}
