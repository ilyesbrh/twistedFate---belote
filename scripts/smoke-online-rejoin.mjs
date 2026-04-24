/**
 * Reconnection smoke: P1 closes their browser context mid-game and reopens
 * the same URL — they should land back in their original seat without
 * anyone else doing anything.
 *
 * Pre-req: belote server on :4100 + UI dev on :5173.
 */
import { chromium } from "playwright";
import { mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, "..");
const OUT = join(ROOT, "docs", "screenshots", "iteration-013-rejoin");
await mkdir(OUT, { recursive: true });

const URL = process.env.SMOKE_URL ?? "http://localhost:5173/twistedFate-belote/";
const log = (m) => console.log(`[rejoin] ${m}`);

const browser = await chromium.launch();
const NAMES = ["Alice", "Bob", "Carol", "Dave"];

// Helper: open a context, choose Friends mode.
async function newContext() {
  const ctx = await browser.newContext({ viewport: { width: 800, height: 720 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.error("[pageerror]", e.message));
  return { ctx, page };
}

async function gotoFreshFriends(page) {
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="mode-select-screen"]');
  await page.click('[data-testid="mode-btn-friends"]');
  await page.waitForSelector('[data-testid="online-lobby"]');
  await page.waitForFunction(
    () => document.querySelector('[data-testid="lobby-status"]')?.textContent === "Connected",
    { timeout: 5000 },
  );
}

const sessions = [];
for (let i = 0; i < 4; i++) sessions.push(await newContext());

await Promise.all(sessions.map(({ page }) => gotoFreshFriends(page)));
log("4 contexts loaded");

// Alice creates the room.
await sessions[0].page.fill('[data-testid="nickname-input"]', NAMES[0]);
await sessions[0].page.click('[data-testid="create-room-btn"]');
await sessions[0].page.waitForSelector('[data-testid="room-code"]');
const code = (await sessions[0].page.textContent('[data-testid="room-code"]')).trim();
log(`code=${code}`);

// Capture URL after Alice's join: should now contain ?room=&pid=
const aliceUrlAfterJoin = sessions[0].page.url();
log(`Alice URL: ${aliceUrlAfterJoin}`);
if (!/[?&]room=[A-Z]{4}/.test(aliceUrlAfterJoin)) {
  throw new Error(`URL missing room param: ${aliceUrlAfterJoin}`);
}
if (!/[?&]pid=/.test(aliceUrlAfterJoin)) {
  throw new Error(`URL missing pid param: ${aliceUrlAfterJoin}`);
}
log("✓ URL contains room+pid after create");

// 3 friends join.
for (let i = 1; i < 4; i++) {
  await sessions[i].page.fill('[data-testid="nickname-input"]', NAMES[i]);
  await sessions[i].page.click('[data-testid="enter-join-btn"]');
  await sessions[i].page.fill('[data-testid="join-code-input"]', code);
  await sessions[i].page.click('[data-testid="join-room-btn"]');
  await sessions[i].page.waitForSelector('[data-testid="room-code"]');
}
log("4 in lobby");

// Capture B's URL.
const bobUrl = sessions[1].page.url();
log(`Bob URL: ${bobUrl}`);

// Host starts the game.
await sessions[0].page.waitForFunction(
  () =>
    [0, 1, 2, 3].every((s) => {
      const row = document.querySelector(`[data-testid="lobby-seat-${s}"]`);
      return row && !row.textContent?.includes("Waiting");
    }),
  { timeout: 5000 },
);
await sessions[0].page.click('[data-testid="start-game-btn"]');
await Promise.all(
  sessions.map(({ page }) => page.waitForSelector('[data-testid="game-table"]', { timeout: 8000 })),
);
log("game started — all 4 see <GameTable>");
await sessions[0].page.screenshot({ path: join(OUT, "01-game-on.png") });

// Now: simulate Bob closing the browser and reopening with the same URL.
log("Bob closes context");
await sessions[1].ctx.close();

// Wait a beat so the server processes the disconnect.
await new Promise((r) => setTimeout(r, 600));

// Other players should see player_disconnected (we don't have a UI badge yet,
// but server-side state has changed). Sanity: spawn fresh context with Bob's URL.
const bobAgain = await newContext();
log(`Bob reopens at: ${bobUrl}`);
await bobAgain.page.goto(bobUrl, { waitUntil: "networkidle" });

// Bob should NOT see the mode-select; he should land in the game directly.
try {
  await bobAgain.page.waitForSelector('[data-testid="game-table"]', { timeout: 8000 });
  log("✓ Bob auto-rejoined and sees <GameTable>");
} catch (e) {
  // Capture state for debugging.
  const html = await bobAgain.page.content();
  console.error("Bob page snapshot (first 600 chars):", html.slice(0, 600));
  throw e;
}
await bobAgain.page.screenshot({ path: join(OUT, "02-bob-rejoined.png") });

await browser.close();
log("done");
