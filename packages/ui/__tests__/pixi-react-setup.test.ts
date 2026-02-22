import { describe, it, expect } from "vitest";

describe("pixi-react-setup", () => {
  it("exports initPixiReact function", async () => {
    const mod = await import("../src/pixi-react-setup.js");
    expect(mod.initPixiReact).toBeTypeOf("function");
  });

  it("initPixiReact does not throw", async () => {
    const { initPixiReact } = await import("../src/pixi-react-setup.js");
    expect(() => {
      initPixiReact();
    }).not.toThrow();
  });

  it("is idempotent — calling twice does not throw", async () => {
    const { initPixiReact } = await import("../src/pixi-react-setup.js");
    expect(() => {
      initPixiReact();
      initPixiReact();
    }).not.toThrow();
  });
});
