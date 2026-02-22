import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";

// LayoutContainer uses Ticker which needs requestAnimationFrame/cancelAnimationFrame in Node
const origRaf = globalThis.requestAnimationFrame;
const origCaf = globalThis.cancelAnimationFrame;
beforeAll(() => {
  vi.stubGlobal("requestAnimationFrame", vi.fn());
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
});
afterAll(() => {
  vi.stubGlobal("requestAnimationFrame", origRaf);
  vi.stubGlobal("cancelAnimationFrame", origCaf);
});

describe("@pixi/layout integration", () => {
  it("LayoutContainer is importable and constructible", async () => {
    const { LayoutContainer } = await import("@pixi/layout/components");
    expect(LayoutContainer).toBeTypeOf("function");
    const container = new LayoutContainer();
    expect(container).toBeDefined();
    container.destroy();
  });

  it("Layout mixin augments Container with layout property", async () => {
    // Importing @pixi/layout side-effects augments Container
    await import("@pixi/layout");
    const { Container } = await import("pixi.js");
    const c = new Container();
    // The layout property should exist (even if null by default)
    expect("layout" in c).toBe(true);
    c.destroy();
  });
});

describe("@pixi/ui integration", () => {
  it("FancyButton is importable and constructible", async () => {
    const { FancyButton } = await import("@pixi/ui");
    expect(FancyButton).toBeTypeOf("function");
    const btn = new FancyButton();
    expect(btn).toBeDefined();
    btn.destroy();
  });

  it("ButtonContainer is importable and constructible", async () => {
    const { ButtonContainer } = await import("@pixi/ui");
    expect(ButtonContainer).toBeTypeOf("function");
    const btn = new ButtonContainer();
    expect(btn).toBeDefined();
    btn.destroy();
  });
});

describe("pixi-react-setup includes layout/ui elements", () => {
  it("initPixiReact registers LayoutContainer and FancyButton without throwing", async () => {
    const { initPixiReact } = await import("../src/pixi-react-setup.js");
    expect(() => {
      initPixiReact();
    }).not.toThrow();
  });
});
