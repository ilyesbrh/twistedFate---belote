import { describe, it, expect } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { Theme } from "@radix-ui/themes";
import { fixtures } from "../src/dev/fixtures/index.js";

describe("fixture registry", () => {
  it("registers at least one fixture", () => {
    expect(fixtures.length).toBeGreaterThan(0);
  });

  it("every fixture has a non-empty id, title, and group", () => {
    for (const f of fixtures) {
      expect(f.id, `fixture has empty id`).toBeTruthy();
      expect(f.title, `fixture ${f.id} has empty title`).toBeTruthy();
      expect(f.group, `fixture ${f.id} has empty group`).toBeTruthy();
    }
  });

  it("every fixture has a unique id", () => {
    const ids = fixtures.map((f) => f.id);
    const unique = new Set(ids);
    expect(unique.size, `duplicate fixture ids: ${ids.join(", ")}`).toBe(ids.length);
  });

  it("every fixture id is kebab-case (lowercase + digits + hyphens only)", () => {
    const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    for (const f of fixtures) {
      expect(KEBAB.test(f.id), `fixture id "${f.id}" is not kebab-case`).toBe(true);
    }
  });

  it("every fixture renders without throwing", () => {
    for (const f of fixtures) {
      expect(() => {
        const { unmount } = render(<Theme>{f.render()}</Theme>);
        unmount();
      }, `fixture "${f.id}" threw on render`).not.toThrow();
      cleanup();
    }
  });
});
