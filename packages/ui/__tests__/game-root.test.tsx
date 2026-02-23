import { describe, it, expect } from "vitest";
import { isValidElement } from "react";
import type { GameView } from "../src/game-view.js";
import type { Seat } from "../src/layout.js";

/**
 * GameRoot — React functional component that composes all child React
 * components into the TableLayoutReact flexbox zones. Receives GameView
 * as props and distributes data to child components.
 */
describe("GameRoot", () => {
  // ---- Test data ------------------------------------------------------

  const IDLE_VIEW: GameView = {
    players: [
      { name: "You", seat: "south", isActive: false, cardCount: 0, teamIndex: 0 },
      { name: "West", seat: "west", isActive: false, cardCount: 0, teamIndex: 1 },
      { name: "Partner", seat: "north", isActive: false, cardCount: 0, teamIndex: 0 },
      { name: "East", seat: "east", isActive: false, cardCount: 0, teamIndex: 1 },
    ],
    hand: [],
    opponents: [
      { seat: "west", orientation: "vertical", cardCount: 0 },
      { seat: "north", orientation: "horizontal", cardCount: 0 },
      { seat: "east", orientation: "vertical", cardCount: 0 },
    ],
    trick: [],
    trumpSuit: null,
    activeSeat: null,
    scores: { team1: 0, team2: 0 },
    phase: "idle",
  };

  const PLAYING_VIEW: GameView = {
    players: [
      { name: "You", seat: "south", isActive: true, cardCount: 8, teamIndex: 0 },
      { name: "West", seat: "west", isActive: false, cardCount: 8, teamIndex: 1 },
      { name: "Partner", seat: "north", isActive: false, cardCount: 8, teamIndex: 0 },
      { name: "East", seat: "east", isActive: false, cardCount: 8, teamIndex: 1 },
    ],
    hand: [
      { suit: "hearts", rank: "ace", playable: true },
      { suit: "hearts", rank: "king", playable: true },
      { suit: "spades", rank: "10", playable: false },
    ],
    opponents: [
      { seat: "west", orientation: "vertical", cardCount: 8 },
      { seat: "north", orientation: "horizontal", cardCount: 8 },
      { seat: "east", orientation: "vertical", cardCount: 8 },
    ],
    trick: [{ position: "north", suit: "hearts", rank: "10" }],
    trumpSuit: "hearts",
    activeSeat: "south",
    scores: { team1: 40, team2: 30 },
    phase: "playing",
  };

  // ---- Export checks ---------------------------------------------------

  it("exports the GameRoot component function", async () => {
    const mod = await import("../src/game-root.js");
    expect(mod.GameRoot).toBeTypeOf("function");
  });

  it("exports the teamColor helper function", async () => {
    const mod = await import("../src/game-root.js");
    expect(mod.teamColor).toBeTypeOf("function");
  });

  it("exports the playerInfoPosition helper function", async () => {
    const mod = await import("../src/game-root.js");
    expect(mod.playerInfoPosition).toBeTypeOf("function");
  });

  // ---- React element validity ------------------------------------------

  it("returns a valid React element with idle view", async () => {
    const { GameRoot } = await import("../src/game-root.js");
    const element = <GameRoot width={844} height={390} view={IDLE_VIEW} />;
    expect(isValidElement(element)).toBe(true);
  });

  it("returns a valid React element with playing view", async () => {
    const { GameRoot } = await import("../src/game-root.js");
    const element = <GameRoot width={844} height={390} view={PLAYING_VIEW} />;
    expect(isValidElement(element)).toBe(true);
  });

  // ---- teamColor helper ------------------------------------------------

  it("teamColor returns team1 color for south", async () => {
    const { teamColor } = await import("../src/game-root.js");
    const { THEME } = await import("../src/theme.js");
    expect(teamColor("south" as Seat)).toBe(THEME.colors.team.team1);
  });

  it("teamColor returns team2 color for west", async () => {
    const { teamColor } = await import("../src/game-root.js");
    const { THEME } = await import("../src/theme.js");
    expect(teamColor("west" as Seat)).toBe(THEME.colors.team.team2);
  });

  it("teamColor returns team1 color for north", async () => {
    const { teamColor } = await import("../src/game-root.js");
    const { THEME } = await import("../src/theme.js");
    expect(teamColor("north" as Seat)).toBe(THEME.colors.team.team1);
  });

  // ---- playerInfoPosition helper ----------------------------------------

  it("playerInfoPosition returns correct position for south seat", async () => {
    const { playerInfoPosition } = await import("../src/game-root.js");
    const { THEME } = await import("../src/theme.js");
    const zone = { x: 0, y: 0, width: 844, height: 109 };
    const pos = playerInfoPosition("south" as Seat, zone);
    const avatarHalf = THEME.avatar.size / 2;
    expect(pos.x).toBe(THEME.spacing.md + avatarHalf);
    expect(pos.y).toBe(zone.height / 2 - avatarHalf);
  });

  it("playerInfoPosition returns correct position for west seat", async () => {
    const { playerInfoPosition } = await import("../src/game-root.js");
    const { THEME } = await import("../src/theme.js");
    const zone = { x: 0, y: 0, width: 127, height: 211 };
    const pos = playerInfoPosition("west" as Seat, zone);
    expect(pos.x).toBe(zone.width / 2);
    expect(pos.y).toBe(THEME.spacing.sm);
  });
});
