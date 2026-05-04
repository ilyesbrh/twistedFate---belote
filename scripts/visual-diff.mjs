/**
 * Visual regression suite — Playwright + pixelmatch.
 *
 * Captures screenshots of representative app views and diffs them against
 * committed baselines under `e2e/baseline/`. Writes side-by-side diff PNGs
 * to `e2e/diff/` on mismatch (gitignored). Exits 1 when any case fails.
 *
 * Usage:
 *   pnpm visual              # diff against baseline (CI)
 *   pnpm visual:update       # write new baselines (manual blessing)
 *
 * Assumes the dev server is reachable at --url=<url> (default
 * http://localhost:5173/twistedFate-belote/). Run `pnpm --filter ui dev`
 * in another terminal first.
 */
import { chromium } from "playwright";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASELINE_DIR = join(ROOT, "e2e", "baseline");
const DIFF_DIR = join(ROOT, "e2e", "diff");

const args = parseArgs(process.argv.slice(2));
const updateMode = args["update"] === true;
const baseUrl = args["url"] ?? "http://localhost:5173/twistedFate-belote/";

/** Each case captures a single view and (in diff mode) compares to a baseline.
 *  - `route`    : appended to baseUrl, e.g. "" / "?screens" / "?bust=1"
 *  - `viewport` : { w, h }
 *  - `setup(page)` : optional async — clicks, waits, etc.
 *  - `target`   : optional CSS selector to clip the screenshot to
 *  - `waitMs`   : settle time after navigation (animations, etc.)
 */
const liveBiddingSetup = async (page) => {
  await page.locator('[data-testid="mode-btn-ai"]').click();
  await page.waitForTimeout(300);
  await page.locator('button:has-text("Play game")').click();
  // Let the AI bid until it's south's turn (BidPanel visible).
  await page.waitForTimeout(5000);
};

const fixtureSetup = (text) => async (page) => {
  await page.locator(`button:has-text("${text}")`).click();
  await page.waitForTimeout(300);
};

const CASES = [
  // ── Menu — every viewport we care about ────────────────────────────────
  { label: "menu-desktop", route: "", viewport: { w: 1280, h: 800 }, waitMs: 600 },
  { label: "menu-portrait", route: "", viewport: { w: 390, h: 844 }, waitMs: 600 },
  { label: "menu-portrait-320", route: "", viewport: { w: 320, h: 568 }, waitMs: 600 },
  { label: "menu-landscape-844", route: "", viewport: { w: 844, h: 390 }, waitMs: 600 },
  { label: "menu-landscape-915", route: "", viewport: { w: 915, h: 412 }, waitMs: 600 },

  // (live-bidding cases skipped — AI bidding sequence is non-deterministic
  // at fixed wait times. Fixture-based cases below are deterministic.)

  // ── Fixtures (component-isolation) at desktop ─────────────────────────
  {
    label: "fixture-lobby-full",
    route: "?screens",
    viewport: { w: 1280, h: 800 },
    setup: fixtureSetup("Host — full room (start enabled)"),
    target: '[data-testid="screen-viewer-stage"]',
  },
  {
    label: "fixture-mid-trick",
    route: "?screens",
    viewport: { w: 1280, h: 800 },
    setup: fixtureSetup("Playing — mid-trick (2 cards down)"),
    target: '[data-testid="screen-viewer-stage"]',
  },
  {
    label: "fixture-bidding-south",
    route: "?screens",
    viewport: { w: 1280, h: 800 },
    setup: fixtureSetup("Bidding — south (your) turn"),
    target: '[data-testid="screen-viewer-stage"]',
  },
  {
    label: "fixture-round-summary-takers-won",
    route: "?screens",
    viewport: { w: 1280, h: 800 },
    setup: fixtureSetup("Takers won simple contract (110 ♠)"),
    target: '[data-testid="screen-viewer-stage"]',
  },
  {
    label: "fixture-game-over-ns-wins",
    route: "?screens",
    viewport: { w: 1280, h: 800 },
    setup: fixtureSetup("NS wins (you won)"),
    target: '[data-testid="screen-viewer-stage"]',
  },

  // ── In-game fixtures at the breakage-prone viewports ───────────────────
  {
    label: "fixture-bidding-844x390",
    route: "?screens",
    viewport: { w: 844, h: 390 },
    setup: fixtureSetup("Bidding — south (your) turn"),
    target: '[data-testid="screen-viewer-stage"]',
  },
  {
    label: "fixture-bidding-915x412",
    route: "?screens",
    viewport: { w: 915, h: 412 },
    setup: fixtureSetup("Bidding — south (your) turn"),
    target: '[data-testid="screen-viewer-stage"]',
  },
  {
    label: "fixture-bidding-390x844",
    route: "?screens",
    viewport: { w: 390, h: 844 },
    setup: fixtureSetup("Bidding — south (your) turn"),
    target: '[data-testid="screen-viewer-stage"]',
  },
  {
    label: "fixture-mid-trick-844x390",
    route: "?screens",
    viewport: { w: 844, h: 390 },
    setup: fixtureSetup("Playing — mid-trick (2 cards down)"),
    target: '[data-testid="screen-viewer-stage"]',
  },
  {
    label: "fixture-mid-trick-390x844",
    route: "?screens",
    viewport: { w: 390, h: 844 },
    setup: fixtureSetup("Playing — mid-trick (2 cards down)"),
    target: '[data-testid="screen-viewer-stage"]',
  },
];

await main();

async function main() {
  await mkdir(BASELINE_DIR, { recursive: true });
  await mkdir(DIFF_DIR, { recursive: true });

  const browser = await chromium.launch();
  const results = [];

  try {
    for (const c of CASES) {
      const r = await runCase(browser, c);
      results.push(r);
      console.log(`${r.status} ${c.label}${r.note ? ` — ${r.note}` : ""}`);
    }
  } finally {
    await browser.close();
  }

  const failed = results.filter((r) => r.status === "FAIL");
  const updated = results.filter((r) => r.status === "UPDATE");
  const passed = results.filter((r) => r.status === "PASS");

  console.log(
    `\n${String(passed.length)} pass, ${String(failed.length)} fail, ${String(updated.length)} updated, ${String(CASES.length)} total`,
  );

  if (failed.length > 0) {
    console.error(
      `\nDiffs written to ${DIFF_DIR}. Inspect the *.diff.png files; if changes are intended, re-run with \`pnpm visual:update\`.`,
    );
    process.exit(1);
  }
}

async function runCase(browser, c) {
  const context = await browser.newContext({
    viewport: { width: c.viewport.w, height: c.viewport.h },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  try {
    await page.goto(baseUrl + c.route, { waitUntil: "networkidle" });
    if (c.setup) await c.setup(page);
    if (c.waitMs) await page.waitForTimeout(c.waitMs);

    const target = c.target ? await page.locator(c.target).first() : page;
    const buffer = await target.screenshot({ type: "png" });

    const baselinePath = join(BASELINE_DIR, `${c.label}.png`);
    if (updateMode) {
      await writeFile(baselinePath, buffer);
      return { label: c.label, status: "UPDATE" };
    }

    if (!(await fileExists(baselinePath))) {
      await writeFile(baselinePath, buffer);
      return {
        label: c.label,
        status: "UPDATE",
        note: "new baseline written (no prior file)",
      };
    }

    const baseline = await readFile(baselinePath);
    return await diffCase(c, baseline, buffer);
  } finally {
    await context.close();
  }
}

async function diffCase(c, baselineBuf, currentBuf) {
  const baseline = PNG.sync.read(baselineBuf);
  const current = PNG.sync.read(currentBuf);

  if (baseline.width !== current.width || baseline.height !== current.height) {
    const path = join(DIFF_DIR, `${c.label}.current.png`);
    await writeFile(path, currentBuf);
    return {
      label: c.label,
      status: "FAIL",
      note: `dimension mismatch — baseline ${String(baseline.width)}x${String(baseline.height)}, current ${String(current.width)}x${String(current.height)}; current saved to ${path}`,
    };
  }

  const { width, height } = baseline;
  const diff = new PNG({ width, height });
  const diffPx = pixelmatch(baseline.data, current.data, diff.data, width, height, {
    threshold: 0.18,
  });
  const total = width * height;
  const ratio = diffPx / total;

  // Allow tiny aliasing differences (well under 0.1%).
  const allowed = 0.001;
  if (ratio <= allowed) {
    return { label: c.label, status: "PASS" };
  }

  const diffPath = join(DIFF_DIR, `${c.label}.diff.png`);
  const currentPath = join(DIFF_DIR, `${c.label}.current.png`);
  await writeFile(diffPath, PNG.sync.write(diff));
  await writeFile(currentPath, currentBuf);
  return {
    label: c.label,
    status: "FAIL",
    note: `${String(diffPx)} px diff (${(ratio * 100).toFixed(3)}%) — see ${diffPath}`,
  };
}

async function fileExists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

function parseArgs(argv) {
  const out = {};
  for (const a of argv) {
    if (a === "--update") out["update"] = true;
    else if (a.startsWith("--url=")) out["url"] = a.slice(6);
  }
  return out;
}
