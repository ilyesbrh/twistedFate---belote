/**
 * Smoke test for iteration 012 UI additions.
 * Drives the game by clicking Pass when it's the human's turn, until a round
 * reaches the playing phase, then captures screenshots and logs observations.
 */
import { chromium } from "playwright";
import { mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, "..");
const OUT = join(ROOT, "docs", "screenshots", "iteration-012");
await mkdir(OUT, { recursive: true });

const URL = process.env.SMOKE_URL ?? "http://localhost:5173/twistedFate-belote/";

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();
const log = (m) => console.log(`[smoke] ${m}`);

page.on("pageerror", (e) => console.error("[pageerror]", e.message));
page.on("console", (msg) => {
  if (msg.type() === "error") console.error("[console.error]", msg.text());
});

log(`goto ${URL}`);
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await page.screenshot({ path: join(OUT, "01-start.png") });

const playBtn = page.getByRole("button", { name: /play|start/i }).first();
if (await playBtn.count()) await playBtn.click();
await page.waitForTimeout(2000);
await page.screenshot({ path: join(OUT, "02-dealing.png") });

// Helper: read the score panel text; "" if absent.
async function scoreText() {
  const sp = page.getByTestId("score-panel");
  if (!(await sp.count())) return "";
  return (await sp.innerText()).replace(/\s+/g, " ").trim();
}

// Helper: detect contract announced (banner has CONTRE/SURCONTRE OR a second
// number that looks like a contract, e.g. "501 … 90 ♠" — we look for a 2/3
// digit number between 80 and 160 appearing after the target-score prefix).
function hasContract(txt) {
  const m = txt.match(/(\d+)\s*[♠♥♦♣]/);
  if (!m) return false;
  const v = Number(m[1]);
  return v >= 80 && v <= 160;
}

// Drive the game: keep clicking Pass whenever we see the bid panel, until
// a contract is in play OR we run out of rounds.
const pass = page.getByRole("button", { name: /^pass$/i });
let sawContrer = false;
let contractReached = false;

for (let i = 0; i < 90; i++) {
  await page.waitForTimeout(800);

  if (!sawContrer) {
    const cb = page.getByRole("button", { name: /^contrer$/i });
    if (await cb.count()) {
      sawContrer = true;
      await page.screenshot({ path: join(OUT, "03-contrer-label.png") });
      log("captured Contrer label");
    }
  }

  if (await pass.count()) {
    try {
      await pass.first().click({ timeout: 500 });
      log(`tick ${i}: clicked Pass`);
    } catch {
      /* ignore; button may have disappeared */
    }
  }

  const txt = await scoreText();
  if (hasContract(txt)) {
    contractReached = true;
    log(`tick ${i}: contract reached — score panel: ${JSON.stringify(txt)}`);
    break;
  }
}

await page.waitForTimeout(1000);
await page.screenshot({ path: join(OUT, "04-playing.png") });

// Contract-holder star.
const starLocator = page.locator('[aria-label="Contract holder"]');
const starCount = await starLocator.count();
log(`contract-holder badges: ${starCount}`);
if (starCount > 0) {
  const box = await starLocator.first().boundingBox();
  log(`star bounding box: ${JSON.stringify(box)}`);
}

// Score panel text (final).
const finalTxt = await scoreText();
log(`final score panel: ${JSON.stringify(finalTxt)}`);
log(`contract reached: ${contractReached}`);
log(`Contrer label observed during bidding: ${sawContrer}`);

// Pull hand suits/ranks from the CardFace data-testid.
const hand = await page.evaluate(() => {
  const slots = Array.from(document.querySelectorAll('[data-testid^="hand-card-"]'));
  return slots.map((el) => {
    const face = el.querySelector('[data-testid^="card-face-"]');
    const testid = face?.getAttribute("data-testid") ?? "";
    const match = /card-face-(.+)-(hearts|spades|diamonds|clubs)$/.exec(testid);
    return match ? { rank: match[1], suit: match[2] } : { rank: null, suit: null };
  });
});
log(`hand order (suit/rank):`);
for (const h of hand) log(`  ${h.rank} of ${h.suit}`);

// Check the hand is grouped by suit (same-suit cards are contiguous).
const suitRuns = hand.reduce((acc, card) => {
  if (acc.length === 0 || acc[acc.length - 1].suit !== card.suit) {
    acc.push({ suit: card.suit, count: 1 });
  } else {
    acc[acc.length - 1].count += 1;
  }
  return acc;
}, []);
const uniqueSuits = new Set(hand.map((h) => h.suit));
const grouped = suitRuns.length === uniqueSuits.size;
log(`hand is grouped by suit: ${grouped} (runs: ${JSON.stringify(suitRuns)})`);

// Play through a few tricks so live points can update. Only click when the
// south avatar is the active player (has the active name-label class).
log("playing cards to drive tricks…");
const beforeScore = await scoreText();

async function waitForSouthTurn(maxTicks = 40) {
  for (let i = 0; i < maxTicks; i++) {
    const active = await page.evaluate(() => {
      const south = document.querySelector('[data-testid="player-avatar-south"]');
      if (!south) return false;
      // Active state sets a special class on the name pill (nameLabelActive).
      return !!south.querySelector('[class*="nameLabelActive"]');
    });
    if (active) return true;
    await page.waitForTimeout(800);
  }
  return false;
}

for (let i = 0; i < 3; i++) {
  const ready = await waitForSouthTurn(30);
  if (!ready) {
    log(`  trick ${i}: south never became active — skipping`);
    break;
  }
  // Click a legal card (prefer one without 'illegal' class).
  const legalIdx = await page.evaluate(() => {
    const slots = Array.from(document.querySelectorAll('[data-testid^="hand-card-"]'));
    for (let j = 0; j < slots.length; j++) {
      const cls = slots[j].className;
      if (!/illegal/i.test(cls)) return j;
    }
    return -1;
  });
  if (legalIdx < 0) {
    log(`  trick ${i}: no legal card found`);
    break;
  }
  try {
    await page.locator(`[data-testid="hand-card-${legalIdx}"]`).click({ timeout: 2000 });
    log(`  trick ${i}: played hand-card-${legalIdx}`);
  } catch (e) {
    log(`  trick ${i}: click failed: ${e.message}`);
  }
  await page.waitForTimeout(5000); // allow 3 AIs + sweep
}
const afterScore = await scoreText();
log(`score before trick play: ${JSON.stringify(beforeScore)}`);
log(`score after 3 tricks:    ${JSON.stringify(afterScore)}`);
log(`live points updated: ${beforeScore !== afterScore}`);
await page.screenshot({ path: join(OUT, "05-after-tricks.png") });

await browser.close();
log("done");
