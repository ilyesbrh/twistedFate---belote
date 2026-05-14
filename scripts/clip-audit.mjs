/**
 * Clipping audit — walks every key (route, viewport) combo and reports DOM
 * elements where:
 *   - scrollWidth > clientWidth (text truncated by overflow:hidden / ellipsis)
 *   - bounding rect extends beyond the viewport (positioned element off-screen)
 *
 * Usage: pnpm --filter ui dev   (in another terminal, then:)
 *        node scripts/clip-audit.mjs --url=http://localhost:<port>/twistedFate-belote/
 */
import { chromium } from "playwright";

const args = parseArgs(process.argv.slice(2));
const baseUrl = args["url"] ?? "http://localhost:5173/twistedFate-belote/";

const VIEWPORTS = [
  { label: "320×568 portrait", w: 320, h: 568 },
  { label: "390×844 portrait", w: 390, h: 844 },
  { label: "844×390 landscape", w: 844, h: 390 },
  { label: "915×412 landscape", w: 915, h: 412 },
  { label: "768×1024 ipad", w: 768, h: 1024 },
];

const SCENES = [
  // Live routes only — fixture-scoped audits give false positives because
  // the screen-viewer stage clips elements to a sub-viewport area instead
  // of the real fullscreen viewport.
  { label: "menu", route: "" },
  {
    label: "live/in-game-bidding",
    route: "",
    fullFlow: true, // click into Solo Match → PLAY GAME, wait for bidding
  },
  {
    label: "live/install-prompt",
    route: "",
    fireInstallEvent: true,
  },
];

const browser = await chromium.launch();
const findings = [];

try {
  for (const vp of VIEWPORTS) {
    for (const sc of SCENES) {
      const ctx = await browser.newContext({
        viewport: { width: vp.w, height: vp.h },
        deviceScaleFactor: 1,
      });
      const page = await ctx.newPage();
      try {
        await page.goto(baseUrl + sc.route, { waitUntil: "networkidle" });

        if (sc.fireInstallEvent) {
          await page.evaluate(() => {
            const ev = new Event("beforeinstallprompt");
            // @ts-expect-error — synthetic event needs prompt + userChoice
            ev.prompt = () => Promise.resolve();
            Object.defineProperty(ev, "userChoice", {
              value: Promise.resolve({ outcome: "dismissed" }),
            });
            window.dispatchEvent(ev);
          });
          await page.waitForTimeout(300);
        }

        if (sc.fullFlow) {
          // Picker → Belote tile → ModeSelectScreen → AI → StartScreen → PLAY.
          const pickBelote = page.locator('[data-testid="pick-belote"]');
          if (await pickBelote.count()) {
            await pickBelote.click();
            await page.waitForTimeout(250);
          }
          await page.locator('[data-testid="mode-btn-ai"]').click();
          await page.waitForTimeout(250);
          const play = page.locator('button:has-text("Play game")');
          if (await play.count()) {
            await play.click();
          }
          await page.waitForTimeout(4000); // let AI bid until it's south's turn
        }

        const scopeSel = "body";

        const issues = await page.evaluate((scopeSel) => {
          const out = [];
          const root = document.querySelector(scopeSel);
          if (!root) return out;
          const all = root.querySelectorAll("*");
          const vw = window.innerWidth;
          const vh = window.innerHeight;
          for (const el of all) {
            const cs = getComputedStyle(el);
            if (cs.display === "none" || cs.visibility === "hidden") continue;
            const r = el.getBoundingClientRect();
            // Skip zero-size elements
            if (r.width === 0 || r.height === 0) continue;

            // 1. Text truncated by overflow.
            const isClip = cs.overflow !== "visible" || cs.overflowX !== "visible";
            const text = (el.textContent ?? "").trim();
            if (
              isClip &&
              text.length > 0 &&
              el.scrollWidth > el.clientWidth + 1 &&
              !el.querySelector("input,textarea,*[contentEditable='true']")
            ) {
              const tag = el.tagName.toLowerCase();
              const cls = (el.className || "").toString().slice(0, 60);
              out.push({
                kind: "truncated",
                tag,
                cls,
                text: text.slice(0, 40),
                scrollW: el.scrollWidth,
                clientW: el.clientWidth,
              });
            }

            // 2. Element extends beyond viewport (clipped offscreen).
            // Allow tiny tolerance (<4px) for sub-pixel rendering.
            const overshootR = r.right - vw;
            const overshootB = r.bottom - vh;
            const overshootL = -r.left;
            const overshootT = -r.top;
            const maxOvershoot = Math.max(overshootR, overshootB, overshootL, overshootT);
            if (maxOvershoot > 4 && r.width < vw && r.height < vh) {
              // Filter known-intentional clipping:
              //
              // 1. Element is inside a parent that has overflow:hidden and
              //    fits the viewport (parent deliberately clips child).
              //    Catches MenuFelt's corner suit watermarks.
              // 2. Element is inside a closed slide-in drawer (parent has
              //    a transform that translates >=100% off-canvas).
              //    Catches the closed ChatPanel.
              let intentional = false;
              for (let p = el.parentElement; p; p = p.parentElement) {
                const ps = getComputedStyle(p);
                if (
                  ps.overflow === "hidden" ||
                  ps.overflowX === "hidden" ||
                  ps.overflowY === "hidden"
                ) {
                  const pr = p.getBoundingClientRect();
                  if (pr.right <= vw + 1 && pr.bottom <= vh + 1 && pr.left >= -1 && pr.top >= -1) {
                    intentional = true;
                    break;
                  }
                }
                if (ps.transform && ps.transform.startsWith("matrix(")) {
                  const tx = Number(ps.transform.split(",")[4]);
                  if (Number.isFinite(tx) && Math.abs(tx) >= 100) {
                    intentional = true;
                    break;
                  }
                }
              }
              if (intentional) continue;

              const tag = el.tagName.toLowerCase();
              const cls = (el.className || "").toString().slice(0, 60);
              const tid = el.getAttribute("data-testid") ?? "";
              if (text.length > 0 || tid) {
                out.push({
                  kind: "offscreen",
                  tag,
                  cls,
                  testid: tid,
                  text: text.slice(0, 40),
                  rect: {
                    l: Math.round(r.left),
                    t: Math.round(r.top),
                    r: Math.round(r.right),
                    b: Math.round(r.bottom),
                  },
                  vw,
                  vh,
                });
              }
            }
          }
          return out;
        }, scopeSel);

        if (issues.length) {
          for (const i of issues) {
            findings.push({ vp: vp.label, scene: sc.label, ...i });
          }
        }
      } finally {
        await ctx.close();
      }
    }
  }
} finally {
  await browser.close();
}

if (findings.length === 0) {
  console.log("No clipping issues detected.");
  process.exit(0);
}

// Group + dedupe
const seen = new Map();
for (const f of findings) {
  const key = `${f.scene}|${f.vp}|${f.kind}|${f.tag}|${f.cls.slice(0, 30)}|${(f.text || "").slice(0, 20)}|${f.testid ?? ""}`;
  if (!seen.has(key)) seen.set(key, f);
}

console.log(`Found ${String(seen.size)} clipping/offscreen issues:\n`);
for (const f of seen.values()) {
  if (f.kind === "truncated") {
    console.log(
      `[${f.scene} @ ${f.vp}] truncated ${f.tag}.${f.cls.slice(0, 30)} — "${f.text}" (scroll ${String(f.scrollW)} > client ${String(f.clientW)})`,
    );
  } else {
    console.log(
      `[${f.scene} @ ${f.vp}] offscreen ${f.tag}${f.testid ? `[testid=${f.testid}]` : ""} "${f.text}" rect=${JSON.stringify(f.rect)} viewport=${String(f.vw)}×${String(f.vh)}`,
    );
  }
}

function parseArgs(argv) {
  const out = {};
  for (const a of argv) if (a.startsWith("--url=")) out["url"] = a.slice(6);
  return out;
}
