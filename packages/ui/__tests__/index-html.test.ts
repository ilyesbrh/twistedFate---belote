import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const HTML_PATH = resolve(HERE, "..", "index.html");
const MAIN_PATH = resolve(HERE, "..", "src", "main.tsx");
const HTML = readFileSync(HTML_PATH, "utf-8");
const MAIN = readFileSync(MAIN_PATH, "utf-8");

const VITE_BASE = "/twistedFate-belote/";

describe("PWA base-prefix safety (regression for doubled-prefix bug)", () => {
  it("index.html does not contain the doubled base prefix", () => {
    const doubled = `${VITE_BASE.slice(0, -1)}${VITE_BASE}`;
    expect(HTML.includes(doubled)).toBe(false);
  });

  it("index.html: no <link> / <script> / <img> / <meta> href|src|content starts with the base prefix", () => {
    // Vite's HTML transform prepends the configured `base` to absolute
    // paths in well-known asset attributes. If the source already
    // contains the prefix, we double-prepend at build time.
    const ATTR_RE = /<(?:link|script|img|meta)\b[^>]*?\b(?:href|src|content)="([^"]+)"/gi;
    const offenders: string[] = [];
    for (const match of HTML.matchAll(ATTR_RE)) {
      const url = match[1] ?? "";
      if (url.startsWith(VITE_BASE)) {
        offenders.push(url);
      }
    }
    expect(
      offenders,
      `attributes that already include base prefix: ${offenders.join(", ")}`,
    ).toEqual([]);
  });

  it("main.tsx serviceWorker.register uses import.meta.env.BASE_URL (not a literal prefix)", () => {
    const swMatch = /serviceWorker\.register\(([^)]+)\)/.exec(MAIN);
    expect(swMatch, "serviceWorker.register(...) call missing in main.tsx").not.toBeNull();
    const arg = swMatch?.[1] ?? "";
    expect(arg).toContain("import.meta.env.BASE_URL");
    expect(arg).not.toContain(VITE_BASE);
  });
});
