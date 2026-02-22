import { describe, it, expect, vi } from "vitest";
import { isValidElement } from "react";
import type { Suit } from "@belote/core";
import { ALL_SUITS } from "@belote/core";
import { THEME } from "../src/theme.js";
import { suitSymbol, suitColor } from "../src/card-textures.js";
import type { Rect } from "../src/layout.js";

/**
 * BiddingPanelReact — React functional component for bidding overlay.
 * Tests the exported component, draw callbacks, and config helpers.
 */
describe("BiddingPanelReact", () => {
  const ZONE: Rect = { x: 0, y: 281, width: 844, height: 109 };

  // ---- Export checks -------------------------------------------------

  it("exports the component function", async () => {
    const mod = await import("../src/components/bidding/bidding-panel-react.js");
    expect(mod.BiddingPanelReact).toBeTypeOf("function");
  });

  it("exports drawSuitButtonBg function", async () => {
    const mod = await import("../src/components/bidding/bidding-panel-react.js");
    expect(mod.drawSuitButtonBg).toBeTypeOf("function");
  });

  it("exports drawPassButtonBg function", async () => {
    const mod = await import("../src/components/bidding/bidding-panel-react.js");
    expect(mod.drawPassButtonBg).toBeTypeOf("function");
  });

  it("exports suitButtonConfig function", async () => {
    const mod = await import("../src/components/bidding/bidding-panel-react.js");
    expect(mod.suitButtonConfig).toBeTypeOf("function");
  });

  // ---- React element validity ----------------------------------------

  it("returns a valid React element", async () => {
    const { BiddingPanelReact } = await import("../src/components/bidding/bidding-panel-react.js");
    const element = <BiddingPanelReact zone={ZONE} />;
    expect(isValidElement(element)).toBe(true);
  });

  it("accepts onSuitBid and onPass callback props", async () => {
    const { BiddingPanelReact } = await import("../src/components/bidding/bidding-panel-react.js");
    const element = <BiddingPanelReact zone={ZONE} onSuitBid={vi.fn()} onPass={vi.fn()} />;
    expect(isValidElement(element)).toBe(true);
  });

  // ---- drawSuitButtonBg ----------------------------------------------

  it("drawSuitButtonBg draws dark background with gold border", async () => {
    const { drawSuitButtonBg } = await import("../src/components/bidding/bidding-panel-react.js");
    const g = {
      clear: vi.fn(),
      roundRect: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
    };

    const width = 140;
    const height = 65;
    drawSuitButtonBg(g as Parameters<typeof drawSuitButtonBg>[0], width, height);

    expect(g.clear).toHaveBeenCalledOnce();
    expect(g.roundRect).toHaveBeenCalledWith(0, 0, width, height, 10);
    expect(g.fill).toHaveBeenCalledWith({ color: 0x000000, alpha: 0.5 });
    expect(g.stroke).toHaveBeenCalledWith({
      width: 2,
      color: THEME.colors.accent.gold,
      alpha: 0.6,
    });
  });

  // ---- drawPassButtonBg ----------------------------------------------

  it("drawPassButtonBg draws subtler background with muted border", async () => {
    const { drawPassButtonBg } = await import("../src/components/bidding/bidding-panel-react.js");
    const g = {
      clear: vi.fn(),
      roundRect: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
    };

    const width = 140;
    const height = 65;
    drawPassButtonBg(g as Parameters<typeof drawPassButtonBg>[0], width, height);

    expect(g.clear).toHaveBeenCalledOnce();
    expect(g.roundRect).toHaveBeenCalledWith(0, 0, width, height, 10);
    expect(g.fill).toHaveBeenCalledWith({ color: 0x000000, alpha: 0.3 });
    expect(g.stroke).toHaveBeenCalledWith({
      width: 1,
      color: THEME.colors.text.muted,
      alpha: 0.4,
    });
  });

  // ---- suitButtonConfig ----------------------------------------------

  it("suitButtonConfig returns symbol, color, and name for each suit", async () => {
    const { suitButtonConfig } = await import("../src/components/bidding/bidding-panel-react.js");

    for (const suit of ALL_SUITS) {
      const config = suitButtonConfig(suit);
      expect(config.symbol).toBe(suitSymbol(suit));
      expect(config.color).toBe(suitColor(suit));
      expect(config.name).toBeTypeOf("string");
      expect(config.name.length).toBeGreaterThan(0);
    }
  });

  it("suitButtonConfig returns distinct names for all 4 suits", async () => {
    const { suitButtonConfig } = await import("../src/components/bidding/bidding-panel-react.js");

    const names = ALL_SUITS.map((suit: Suit) => suitButtonConfig(suit).name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(4);
  });
});
