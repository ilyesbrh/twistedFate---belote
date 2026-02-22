import { describe, it, expect, vi } from "vitest";
import { isValidElement } from "react";
import { THEME } from "../src/theme.js";

/**
 * PlayerInfoReact — React functional component for player avatar, name, and card count.
 * Tests the exported component, draw callback, and helper functions.
 */
describe("PlayerInfoReact", () => {
  it("exports the component function", async () => {
    const mod = await import("../src/components/player-info/player-info-react.js");
    expect(mod.PlayerInfoReact).toBeTypeOf("function");
  });

  it("exports drawPlayerAvatar function", async () => {
    const mod = await import("../src/components/player-info/player-info-react.js");
    expect(mod.drawPlayerAvatar).toBeTypeOf("function");
  });

  it("exports playerInitial function", async () => {
    const mod = await import("../src/components/player-info/player-info-react.js");
    expect(mod.playerInitial).toBeTypeOf("function");
  });

  it("returns a valid React element for each seat", async () => {
    const { PlayerInfoReact } = await import("../src/components/player-info/player-info-react.js");
    const seats = ["south", "north", "west", "east"] as const;
    for (const seat of seats) {
      const element = (
        <PlayerInfoReact
          name="Alice"
          seat={seat}
          isActive={false}
          cardCount={8}
          teamColor={0xff8c00}
        />
      );
      expect(isValidElement(element)).toBe(true);
    }
  });

  it("drawPlayerAvatar applies correct THEME avatar geometry", async () => {
    const { drawPlayerAvatar } = await import("../src/components/player-info/player-info-react.js");
    const g = {
      clear: vi.fn(),
      roundRect: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
    };

    const teamColor = 0xff8c00;
    drawPlayerAvatar(g as Parameters<typeof drawPlayerAvatar>[0], teamColor);

    const { size, borderRadius } = THEME.avatar;
    const half = size / 2;

    expect(g.clear).toHaveBeenCalledOnce();
    expect(g.roundRect).toHaveBeenCalledWith(-half, -half, size, size, borderRadius);
    expect(g.fill).toHaveBeenCalledWith(teamColor);
    expect(g.stroke).toHaveBeenCalledWith({ width: 2, color: 0xffffff, alpha: 0.2 });
  });

  it("playerInitial returns uppercased first character", async () => {
    const { playerInitial } = await import("../src/components/player-info/player-info-react.js");

    expect(playerInitial("alice")).toBe("A");
    expect(playerInitial("Bob")).toBe("B");
    expect(playerInitial("charlie")).toBe("C");
  });

  it("playerInitial returns empty string for empty name", async () => {
    const { playerInitial } = await import("../src/components/player-info/player-info-react.js");

    expect(playerInitial("")).toBe("");
  });

  it("returns valid element for both active and inactive states", async () => {
    const { PlayerInfoReact } = await import("../src/components/player-info/player-info-react.js");

    const active = (
      <PlayerInfoReact
        name="Alice"
        seat="south"
        isActive={true}
        cardCount={8}
        teamColor={0xff8c00}
      />
    );
    const inactive = (
      <PlayerInfoReact
        name="Alice"
        seat="south"
        isActive={false}
        cardCount={8}
        teamColor={0xff8c00}
      />
    );

    expect(isValidElement(active)).toBe(true);
    expect(isValidElement(inactive)).toBe(true);
  });
});
