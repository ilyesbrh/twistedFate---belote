import { describe, it, expect, vi } from "vitest";
import { isValidElement } from "react";
import { ALL_SUITS } from "@belote/core";
import type { Suit } from "@belote/core";
import { THEME } from "../src/theme.js";
import { suitSymbol, suitColor } from "../src/card-textures.js";

/**
 * TrumpIndicatorReact — React functional component for the trump suit badge.
 * Tests the exported component, draw callback, and text config helper.
 */
describe("TrumpIndicatorReact", () => {
  it("exports the component function", async () => {
    const mod = await import("../src/components/hud/trump-indicator-react.js");
    expect(mod.TrumpIndicatorReact).toBeTypeOf("function");
  });

  it("exports drawTrumpBadge function", async () => {
    const mod = await import("../src/components/hud/trump-indicator-react.js");
    expect(mod.drawTrumpBadge).toBeTypeOf("function");
  });

  it("exports trumpTextConfig function", async () => {
    const mod = await import("../src/components/hud/trump-indicator-react.js");
    expect(mod.trumpTextConfig).toBeTypeOf("function");
  });

  it("returns a valid React element for each suit", async () => {
    const { TrumpIndicatorReact } = await import("../src/components/hud/trump-indicator-react.js");
    for (const suit of ALL_SUITS) {
      const element = <TrumpIndicatorReact suit={suit} />;
      expect(isValidElement(element)).toBe(true);
    }
  });

  it("drawTrumpBadge applies THEME badge geometry", async () => {
    const { drawTrumpBadge } = await import("../src/components/hud/trump-indicator-react.js");
    const g = {
      clear: vi.fn(),
      roundRect: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
    };

    drawTrumpBadge(g as Parameters<typeof drawTrumpBadge>[0]);

    const { badgeSize, badgeRadius, borderWidth, borderColor } = THEME.indicators;
    const half = badgeSize / 2;

    expect(g.clear).toHaveBeenCalledOnce();
    expect(g.roundRect).toHaveBeenCalledWith(-half, -half, badgeSize, badgeSize, badgeRadius);
    expect(g.fill).toHaveBeenCalledWith(THEME.colors.ui.overlay);
    expect(g.stroke).toHaveBeenCalledWith({
      width: borderWidth,
      color: borderColor,
    });
  });

  it("trumpTextConfig returns correct symbol and color for each suit", async () => {
    const { trumpTextConfig } = await import("../src/components/hud/trump-indicator-react.js");

    for (const suit of ALL_SUITS) {
      const config = trumpTextConfig(suit);
      expect(config.text).toBe(suitSymbol(suit));
      expect(config.fill).toBe(suitColor(suit));
    }
  });

  it("trumpTextConfig returns different values for red vs black suits", async () => {
    const { trumpTextConfig } = await import("../src/components/hud/trump-indicator-react.js");

    const hearts = trumpTextConfig("hearts" as Suit);
    const spades = trumpTextConfig("spades" as Suit);

    expect(hearts.text).not.toBe(spades.text);
    expect(hearts.fill).not.toBe(spades.fill);
  });
});
