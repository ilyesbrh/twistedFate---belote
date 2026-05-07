/**
 * Live 4-agent end-to-end smoke against the deployed site.
 *
 *   pnpm dlx playwright install chromium  # one-time
 *   node scripts/live-4-agent-game.mjs    # runs against prod by default
 *   LIVE_URL=http://localhost:5173/twistedFate-belote/ node scripts/live-4-agent-game.mjs
 *   HEADLESS=1 node scripts/live-4-agent-game.mjs
 *
 * Spins up 4 isolated browser contexts (4 separate cookie jars) in one
 * Chromium browser, opens the friends-mode flow on each, has Alice host
 * a room and the other three join, starts the game, and drives it to
 * `GAME OVER`. Players bid the minimum (Alice always tries ♠ 80, the
 * others pass), and play the first legal card on every prompt.
 *
 * If everything finishes within the per-step timeouts, exits 0 and
 * writes screenshots into docs/screenshots/live-4-agent/.
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, "..");
const OUT = join(ROOT, "docs", "screenshots", "live-4-agent");
await mkdir(OUT, { recursive: true });

const URL = process.env.LIVE_URL ?? "https://belote.3btechsolutions.com/";
const HEADLESS = process.env.HEADLESS === "1";
const NAMES = ["Alice", "Bob", "Carol", "Dave"];
const STEP_TIMEOUT_MS = 15_000;
const GAME_TIMEOUT_MS = 10 * 60_000; // belote can take a while

const log = (who, msg) => console.log(`[${who}] ${msg}`);

const browser = await chromium.launch({
  headless: HEADLESS,
  slowMo: HEADLESS ? 0 : 50,
});

async function newSession(name, viewport) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.error(`[${name}] pageerror:`, e.message));
  page.on("console", (m) => {
    if (m.type() === "error") console.error(`[${name}] console.error:`, m.text());
  });
  return { name, ctx, page };
}

// 4 contexts arranged so you can see all of them without overlap.
const sessions = [];
for (let i = 0; i < 4; i++) {
  sessions.push(await newSession(NAMES[i], { width: 720, height: 760 }));
}
log("setup", `4 contexts up. URL=${URL}`);

// ─────────────────────────────────────────────────────────────────
// Step 1 — everyone lands on the menu and picks Friends mode.
// ─────────────────────────────────────────────────────────────────
async function loadAndEnterFriends({ name, page }) {
  await page.goto(URL, { waitUntil: "networkidle", timeout: STEP_TIMEOUT_MS });
  await page.waitForSelector('[data-testid="mode-select-screen"]', { timeout: STEP_TIMEOUT_MS });
  await page.click('[data-testid="mode-btn-friends"]');
  await page.waitForSelector('[data-testid="online-lobby"]', { timeout: STEP_TIMEOUT_MS });
  await page.waitForFunction(
    () => document.querySelector('[data-testid="lobby-status"]')?.textContent === "Connected",
    { timeout: STEP_TIMEOUT_MS },
  );
  log(name, "lobby connected");
}
await Promise.all(sessions.map(loadAndEnterFriends));

// ─────────────────────────────────────────────────────────────────
// Step 2 — Alice creates the room, captures the code.
// ─────────────────────────────────────────────────────────────────
const alice = sessions[0];
await alice.page.fill('[data-testid="nickname-input"]', alice.name);
await alice.page.click('[data-testid="create-room-btn"]');
await alice.page.waitForSelector('[data-testid="room-code"]', { timeout: STEP_TIMEOUT_MS });
const code = (await alice.page.textContent('[data-testid="room-code"]')).trim();
log(alice.name, `room code = ${code}`);

// ─────────────────────────────────────────────────────────────────
// Step 3 — Bob/Carol/Dave join with that code.
// ─────────────────────────────────────────────────────────────────
for (let i = 1; i < 4; i++) {
  const s = sessions[i];
  await s.page.fill('[data-testid="nickname-input"]', s.name);
  await s.page.click('[data-testid="enter-join-btn"]');
  await s.page.fill('[data-testid="join-code-input"]', code);
  await s.page.click('[data-testid="join-room-btn"]');
  await s.page.waitForSelector('[data-testid="room-code"]', { timeout: STEP_TIMEOUT_MS });
  log(s.name, `joined ${code}`);
}

// Wait until all 4 seats are occupied (no "Waiting" placeholder), then start.
await alice.page.waitForFunction(
  () =>
    [0, 1, 2, 3].every((s) => {
      const row = document.querySelector(`[data-testid="lobby-seat-${s}"]`);
      return row && !row.textContent?.includes("Waiting");
    }),
  { timeout: STEP_TIMEOUT_MS },
);
await alice.page.click('[data-testid="start-game-btn"]');
await Promise.all(
  sessions.map(({ name, page }) =>
    page
      .waitForSelector('[data-testid="game-table"]', { timeout: STEP_TIMEOUT_MS })
      .then(() => log(name, "game-table visible")),
  ),
);
await alice.page.screenshot({ path: join(OUT, "01-game-on.png") });

// ─────────────────────────────────────────────────────────────────
// Step 4 — drive the game.
//
// Each session runs its own loop: poll for either the bid panel
// (place a bid) or a legal hand card (play it), until GAME OVER
// shows up. "Alice tries low bid; others pass" guarantees a contract
// forms every round.
// ─────────────────────────────────────────────────────────────────

/** Try to place a bid; return true on success. Falls back to "Pass". */
async function bidLoop({ name, page }) {
  const isAlice = name === "Alice";
  if (!isAlice) {
    const ok = await page
      .click('button[aria-label="Pass"]', { timeout: 2_000 })
      .then(() => true)
      .catch(() => false);
    log(name, `bid: pass ${ok ? "✓" : "✗"}`);
    return;
  }
  await page.click('button[aria-label="Pick spades"]', { timeout: 2_000 }).catch(() => {});
  for (const v of [80, 90, 100, 110, 120, 130, 140, 150, 160, 250]) {
    const btn = page.locator(`button[aria-label="Bid ${String(v)} points"]`);
    if (!(await btn.isVisible().catch(() => false))) continue;
    if (await btn.isDisabled().catch(() => true)) continue;
    await btn.click().catch(() => {});
    const place = page.locator(`button[aria-label="Place bid ♠ ${String(v)}"]`);
    if (await place.isVisible().catch(() => false)) {
      const ok = await place
        .click()
        .then(() => true)
        .catch(() => false);
      log(name, `bid: ♠ ${String(v)} ${ok ? "✓" : "✗"}`);
      return;
    }
  }
  const ok = await page
    .click('button[aria-label="Pass"]', { timeout: 2_000 })
    .then(() => true)
    .catch(() => false);
  log(name, `bid: pass (fallback) ${ok ? "✓" : "✗"}`);
}

/** Click the first hand-card whose className does NOT include "illegal".
 *  Returns true if a click landed. */
async function playFirstLegalCard({ page }) {
  const idx = await page.evaluate(() => {
    const cards = document.querySelectorAll('[data-testid^="hand-card-"]');
    for (const el of cards) {
      const cls = el.className || "";
      if (!/illegal/i.test(cls)) {
        const m = /hand-card-(\d+)/.exec(el.getAttribute("data-testid") || "");
        if (m) return Number(m[1]);
      }
    }
    return -1;
  });
  if (idx < 0) return false;
  await page.click(`[data-testid="hand-card-${idx}"]`).catch(() => {});
  return true;
}

async function driveOnePlayer(s) {
  const start = Date.now();
  let lastNudge = 0;
  while (Date.now() - start < GAME_TIMEOUT_MS) {
    // GAME OVER → done.
    const isOver = await s.page
      .evaluate(() => document.body.innerText.includes("GAME OVER"))
      .catch(() => false);
    if (isOver) {
      log(s.name, "saw GAME OVER");
      return;
    }

    // Bid panel up?
    const bidUp = await s.page
      .locator('[data-testid="bid-panel"]')
      .isVisible()
      .catch(() => false);
    if (bidUp) {
      await bidLoop(s);
      await s.page.waitForTimeout(300);
      continue;
    }

    // Try to play a card.
    const played = await playFirstLegalCard(s);
    if (played) {
      await s.page.waitForTimeout(300);
      continue;
    }

    // Inter-round summary — match by aria-label (button text is uppercase).
    const next = s.page.locator('button[aria-label="Next round"]');
    if (await next.isVisible().catch(() => false)) {
      await next.click().catch(() => {});
      log(s.name, "clicked NEXT ROUND");
      await s.page.waitForTimeout(300);
      continue;
    }

    // Idle — yield.
    await s.page.waitForTimeout(400);
    if (Date.now() - lastNudge > 8_000) {
      const dump = await s.page
        .evaluate(() => {
          const txt = document.body.innerText.replace(/\s+/g, " ").slice(0, 220);
          const cardCount = document.querySelectorAll('[data-testid^="hand-card-"]').length;
          const legalCount = Array.from(
            document.querySelectorAll('[data-testid^="hand-card-"]'),
          ).filter((el) => !/illegal/i.test(el.className || "")).length;
          const bidUp = !!document.querySelector('[data-testid="bid-panel"]');
          const visibleButtons = Array.from(document.querySelectorAll("button"))
            .filter((b) => b.offsetParent !== null && !b.disabled)
            .map(
              (b) => b.getAttribute("aria-label") || b.innerText.replace(/\s+/g, " ").slice(0, 40),
            )
            .slice(0, 8);
          return { txt, cardCount, legalCount, bidUp, visibleButtons };
        })
        .catch(() => null);
      log(
        s.name,
        `...waiting | hand=${dump?.cardCount}/${dump?.legalCount} legal | bid=${dump?.bidUp} | btns=${JSON.stringify(dump?.visibleButtons)} | "${dump?.txt}"`,
      );
      lastNudge = Date.now();
    }
  }
  throw new Error(`[${s.name}] timed out — no GAME OVER within ${String(GAME_TIMEOUT_MS / 1000)}s`);
}

await Promise.all(sessions.map(driveOnePlayer));

await Promise.all(
  sessions.map((s, i) =>
    s.page.screenshot({ path: join(OUT, `02-game-over-${String(i)}-${s.name}.png`) }),
  ),
);
log("done", "all 4 saw GAME OVER ✓");

await browser.close();
