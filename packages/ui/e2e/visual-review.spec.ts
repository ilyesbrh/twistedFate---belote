import { test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = resolve(__dirname, "screenshots");

interface StoryEntry {
  id: string;
  title: string;
  name: string;
  type: string;
}

interface StorybookIndex {
  v: number;
  entries: Record<string, StoryEntry>;
}

// Ensure screenshots directory exists
mkdirSync(SCREENSHOT_DIR, { recursive: true });

const PIXI_RENDER_WAIT_MS = 1500;
const BASE = "http://localhost:6006";

// 40 stories × ~5s each = ~200s, plus overhead
test.setTimeout(300_000);

test("capture all story screenshots", async ({ browser }) => {
  // Fetch story index from the running Storybook dev server
  const page = await browser.newPage();
  const res = await page.goto(`${BASE}/index.json`);
  if (!res) throw new Error("Failed to fetch story index");

  const index = (await res.json()) as StorybookIndex;
  const stories = Object.values(index.entries).filter((entry) => entry.type === "story");

  for (const story of stories) {
    const url = `${BASE}/iframe.html?id=${story.id}&viewMode=story`;
    await page.goto(url, { waitUntil: "networkidle" });

    // Wait for PixiJS canvas to appear
    try {
      await page.waitForSelector("canvas", { timeout: 5000 });
    } catch {
      // Screenshot whatever is there for debugging
    }

    // Extra wait for PixiJS WebGL render
    await page.waitForTimeout(PIXI_RENDER_WAIT_MS);

    await page.screenshot({
      path: resolve(SCREENSHOT_DIR, `${story.id}.png`),
      fullPage: true,
    });
  }

  await page.close();
});
