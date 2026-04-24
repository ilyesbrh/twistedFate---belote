/**
 * Visual smoke: confirm Online (Friends) mode renders the same `<GameTable>`
 * component that AI mode does. We open 4 browser contexts, create+join a
 * room, start, and assert that all 4 see `data-testid="game-table"`.
 */
import { chromium } from "playwright";
import { mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, "..");
const OUT = join(ROOT, "docs", "screenshots", "iteration-013-gametable");
await mkdir(OUT, { recursive: true });

const URL = process.env.SMOKE_URL ?? "http://localhost:5173/twistedFate-belote/";
const log = (m) => console.log(`[gt-smoke] ${m}`);

const browser = await chromium.launch();
const ctxs = await Promise.all(
  [0, 1, 2, 3].map(() => browser.newContext({ viewport: { width: 1100, height: 740 } })),
);
const pages = await Promise.all(ctxs.map((c) => c.newPage()));
for (const [i, p] of pages.entries()) {
  p.on("pageerror", (e) => console.error(`[P${i} pageerror]`, e.message));
}

await Promise.all(pages.map((p) => p.goto(URL, { waitUntil: "networkidle" })));
await Promise.all(pages.map((p) => p.waitForSelector('[data-testid="mode-select-screen"]')));
await Promise.all(pages.map((p) => p.click('[data-testid="mode-btn-friends"]')));
await Promise.all(pages.map((p) => p.waitForSelector('[data-testid="online-lobby"]')));
await Promise.all(
  pages.map((p) =>
    p.waitForFunction(
      () => document.querySelector('[data-testid="lobby-status"]')?.textContent === "Connected",
      { timeout: 5000 },
    ),
  ),
);

await pages[0].fill('[data-testid="nickname-input"]', "Alice");
await pages[0].click('[data-testid="create-room-btn"]');
await pages[0].waitForSelector('[data-testid="room-code"]');
const code = (await pages[0].textContent('[data-testid="room-code"]')).trim();
log(`code=${code}`);

for (let i = 1; i < 4; i++) {
  await pages[i].fill('[data-testid="nickname-input"]', ["", "Bob", "Carol", "Dave"][i]);
  await pages[i].click('[data-testid="enter-join-btn"]');
  await pages[i].fill('[data-testid="join-code-input"]', code);
  await pages[i].click('[data-testid="join-room-btn"]');
  await pages[i].waitForSelector('[data-testid="room-code"]');
}

await pages[0].waitForFunction(
  () =>
    [0, 1, 2, 3].every((s) => {
      const row = document.querySelector(`[data-testid="lobby-seat-${s}"]`);
      return row && !row.textContent?.includes("Waiting");
    }),
  { timeout: 5000 },
);
await pages[0].click('[data-testid="start-game-btn"]');

// THE assertion: all 4 contexts now show the same `game-table`.
log("waiting for game-table on all 4 contexts");
await Promise.all(
  pages.map((p) => p.waitForSelector('[data-testid="game-table"]', { timeout: 8000 })),
);
log("✓ all 4 see <GameTable>");

// Take a screenshot from each player's perspective so we can confirm
// the rotation puts each as south.
for (let i = 0; i < 4; i++) {
  await pages[i].screenshot({ path: join(OUT, `player-${i}.png`) });
}
log(`screenshots in ${OUT}`);

await browser.close();
