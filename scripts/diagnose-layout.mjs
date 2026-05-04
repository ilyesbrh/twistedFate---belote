/**
 * Captures screenshots of the three layout issues and the lobby (in case the
 * user's "home menu" complaint refers to the lobby).
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const port = (process.argv.find((a) => a.startsWith("--port=")) ?? "--port=5174").slice(7);
const baseUrl = `http://localhost:${port}/twistedFate-belote/`;
const outDir = join(process.cwd(), "e2e", "diag");
await mkdir(outDir, { recursive: true });

async function startGame(page) {
  await page.locator('[data-testid="mode-btn-ai"]').click();
  await page.waitForTimeout(300);
  await page.locator('button:has-text("Play game")').click();
}

async function waitForBid(page) {
  const start = Date.now();
  while (Date.now() - start < 12_000) {
    if (await page.locator('button:has-text("Pass")').count()) return;
    await page.waitForTimeout(250);
  }
}

const cases = [
  { id: "1a-menu-1280x800", w: 1280, h: 800, mode: "menu" },
  { id: "1b-menu-915x412", w: 915, h: 412, mode: "menu" },
  { id: "1c-menu-844x390", w: 844, h: 390, mode: "menu" },
  { id: "1d-menu-390x844", w: 390, h: 844, mode: "menu" },
  { id: "1e-menu-320x568", w: 320, h: 568, mode: "menu" },
  { id: "1f-lobby-1280x800", w: 1280, h: 800, mode: "lobby" },
  { id: "2a-game-915x412", w: 915, h: 412, mode: "game" },
  { id: "2b-game-844x390", w: 844, h: 390, mode: "game" },
  { id: "3a-bid-844x390", w: 844, h: 390, mode: "bid" },
  { id: "3b-bid-915x412", w: 915, h: 412, mode: "bid" },
];

const browser = await chromium.launch();
for (const c of cases) {
  const ctx = await browser.newContext({
    viewport: { width: c.w, height: c.h },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  if (c.mode === "lobby") {
    await page.locator('[data-testid="mode-btn-friends"]').click();
    await page.waitForTimeout(800);
  } else if (c.mode === "game") {
    await startGame(page);
    await page.waitForTimeout(8000);
  } else if (c.mode === "bid") {
    await startGame(page);
    await waitForBid(page);
    await page.waitForTimeout(400);
  }
  await page.screenshot({ path: join(outDir, `${c.id}.png`), fullPage: false });
  console.log(`Wrote ${c.id}.png`);
  await ctx.close();
}
await browser.close();
