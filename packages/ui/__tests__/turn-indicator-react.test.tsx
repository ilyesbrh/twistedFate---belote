import { describe, it, expect, vi } from "vitest";
import { isValidElement } from "react";
import type { Seat } from "../src/layout.js";
import { THEME } from "../src/theme.js";

/**
 * TurnIndicatorReact — React functional component for turn indication.
 * Tests the exported component, arrow mapping, pill draw callback, and text configs.
 */
describe("TurnIndicatorReact", () => {
  it("exports the component function", async () => {
    const mod = await import("../src/components/hud/turn-indicator-react.js");
    expect(mod.TurnIndicatorReact).toBeTypeOf("function");
  });

  it("exports arrowForSeat function", async () => {
    const mod = await import("../src/components/hud/turn-indicator-react.js");
    expect(mod.arrowForSeat).toBeTypeOf("function");
  });

  it("exports drawTurnPill function", async () => {
    const mod = await import("../src/components/hud/turn-indicator-react.js");
    expect(mod.drawTurnPill).toBeTypeOf("function");
  });

  it("returns a valid React element for each seat", async () => {
    const { TurnIndicatorReact } = await import("../src/components/hud/turn-indicator-react.js");
    const seats: Seat[] = ["south", "north", "west", "east"];
    for (const seat of seats) {
      const element = <TurnIndicatorReact seat={seat} playerName="Alice" />;
      expect(isValidElement(element)).toBe(true);
    }
  });

  it("arrowForSeat returns correct arrow for each seat", async () => {
    const { arrowForSeat } = await import("../src/components/hud/turn-indicator-react.js");

    expect(arrowForSeat("south")).toBe("\u2193");
    expect(arrowForSeat("north")).toBe("\u2191");
    expect(arrowForSeat("west")).toBe("\u2190");
    expect(arrowForSeat("east")).toBe("\u2192");
  });

  it("drawTurnPill calls correct Graphics methods with dimensions", async () => {
    const { drawTurnPill } = await import("../src/components/hud/turn-indicator-react.js");
    const g = {
      clear: vi.fn(),
      roundRect: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
    };

    const pillWidth = 88;
    const totalHeight = 42;
    drawTurnPill(g as Parameters<typeof drawTurnPill>[0], pillWidth, totalHeight);

    expect(g.clear).toHaveBeenCalledOnce();
    // Background fill
    expect(g.roundRect).toHaveBeenCalledWith(
      -pillWidth / 2,
      -28 / 2, // PILL_HEIGHT / 2
      pillWidth,
      totalHeight,
      28 / 2, // PILL_HEIGHT / 2
    );
    expect(g.fill).toHaveBeenCalledWith({ color: 0x000000, alpha: 0.35 });
    // Border stroke
    expect(g.stroke).toHaveBeenCalledWith({
      width: 1,
      color: THEME.colors.accent.gold,
      alpha: 0.4,
    });
  });

  it("turnTextConfigs returns correct arrow and name styles from THEME", async () => {
    const { turnTextConfigs } = await import("../src/components/hud/turn-indicator-react.js");

    const configs = turnTextConfigs("south" as Seat, "Bob");

    expect(configs.arrow.text).toBe("\u2193");
    expect(configs.arrow.fontSize).toBe(THEME.typography.heading.minSize);
    expect(configs.arrow.fill).toBe(THEME.colors.accent.gold);

    expect(configs.name.text).toBe("Bob");
    expect(configs.name.fontSize).toBe(THEME.typography.label.minSize);
    expect(configs.name.fill).toBe(THEME.colors.accent.gold);
  });
});
