/**
 * 013-D smoke: mode-select menu + online lobby flow.
 * Requires both servers running:
 *   pnpm --filter @belote/server start    (port 4100)
 *   pnpm --filter ui dev                   (port 5173)
 */
import { chromium } from "playwright";
import { mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, "..");
const OUT = join(ROOT, "docs", "screenshots", "iteration-013-D");
await mkdir(OUT, { recursive: true });

const URL = process.env.SMOKE_URL ?? "http://localhost:5173/twistedFate-belote/";

const browser = await chromium.launch();
const log = (m) => console.log(`[D-smoke] ${m}`);

// Two contexts for two browser sessions.
const ctxA = await browser.newContext({ viewport: { width: 800, height: 800 } });
const ctxB = await browser.newContext({ viewport: { width: 800, height: 800 } });
const a = await ctxA.newPage();
const b = await ctxB.newPage();

a.on("pageerror", (e) => console.error("[A pageerror]", e.message));
b.on("pageerror", (e) => console.error("[B pageerror]", e.message));

// 1) Both load the app, see the mode-select screen.
log("loading app for two contexts");
await Promise.all([
  a.goto(URL, { waitUntil: "networkidle" }),
  b.goto(URL, { waitUntil: "networkidle" }),
]);

await a.waitForSelector('[data-testid="mode-select-screen"]', { timeout: 5000 });
await b.waitForSelector('[data-testid="mode-select-screen"]', { timeout: 5000 });
await a.screenshot({ path: join(OUT, "01-menu.png") });
log("both see mode-select");

// 2) Both pick Friends.
await a.click('[data-testid="mode-btn-friends"]');
await b.click('[data-testid="mode-btn-friends"]');
await a.waitForSelector('[data-testid="online-lobby"]');
await b.waitForSelector('[data-testid="online-lobby"]');

// Wait for ws to connect.
await a.waitForFunction(
  () => document.querySelector('[data-testid="lobby-status"]')?.textContent === "Connected",
  { timeout: 5000 },
);
log("A connected");
await a.screenshot({ path: join(OUT, "02-lobby-empty.png") });

// 3) A creates a room.
await a.fill('[data-testid="nickname-input"]', "Alice");
await a.click('[data-testid="create-room-btn"]');
await a.waitForSelector('[data-testid="room-code"]', { timeout: 5000 });
const code = (await a.textContent('[data-testid="room-code"]')) ?? "";
log(`room code: ${code}`);
await a.screenshot({ path: join(OUT, "03-room-created.png") });

// 4) B joins with the code.
await b.waitForFunction(
  () => document.querySelector('[data-testid="lobby-status"]')?.textContent === "Connected",
  { timeout: 5000 },
);
await b.fill('[data-testid="nickname-input"]', "Bob");
await b.click('[data-testid="enter-join-btn"]');
await b.fill('[data-testid="join-code-input"]', code.trim());
await b.click('[data-testid="join-room-btn"]');
await b.waitForSelector('[data-testid="room-code"]', { timeout: 5000 });
await b.screenshot({ path: join(OUT, "04-bob-joined.png") });

// 5) A should now see seat 2 occupied.
await a.waitForFunction(
  () => {
    const row = document.querySelector('[data-testid="lobby-seat-1"]');
    return row && !row.textContent?.includes("Waiting");
  },
  { timeout: 4000 },
);
const seat1Text = await a.textContent('[data-testid="lobby-seat-1"]');
log(`A sees seat 2: ${seat1Text}`);
await a.screenshot({ path: join(OUT, "05-bob-visible-to-alice.png") });

// 6) Start game button should still be disabled (need 4).
const startDisabled = await a.evaluate(() => {
  const b = document.querySelector('[data-testid="start-game-btn"]');
  return b instanceof HTMLButtonElement ? b.disabled : null;
});
log(`start button disabled (only 2 in room): ${startDisabled}`);

await browser.close();
log("done");
