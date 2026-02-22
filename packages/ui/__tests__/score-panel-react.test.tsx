import { describe, it, expect, vi } from "vitest";
import { isValidElement } from "react";
import { THEME } from "../src/theme.js";

/**
 * ScorePanelReact — React functional component for team scores display.
 * Tests the exported component, draw callbacks, and layout constants.
 */
describe("ScorePanelReact", () => {
  it("exports the component function", async () => {
    const mod = await import("../src/components/hud/score-panel-react.js");
    expect(mod.ScorePanelReact).toBeTypeOf("function");
  });

  it("exports drawScorePanelBg function", async () => {
    const mod = await import("../src/components/hud/score-panel-react.js");
    expect(mod.drawScorePanelBg).toBeTypeOf("function");
  });

  it("exports drawScoreDivider function", async () => {
    const mod = await import("../src/components/hud/score-panel-react.js");
    expect(mod.drawScoreDivider).toBeTypeOf("function");
  });

  it("exports drawTeamMarker function", async () => {
    const mod = await import("../src/components/hud/score-panel-react.js");
    expect(mod.drawTeamMarker).toBeTypeOf("function");
  });

  it("returns a valid React element", async () => {
    const { ScorePanelReact } = await import("../src/components/hud/score-panel-react.js");
    const element = (
      <ScorePanelReact team1Score={120} team2Score={80} team1Label="Nous" team2Label="Eux" />
    );
    expect(isValidElement(element)).toBe(true);
  });

  it("drawScorePanelBg applies correct panel geometry", async () => {
    const { drawScorePanelBg } = await import("../src/components/hud/score-panel-react.js");
    const g = {
      clear: vi.fn(),
      roundRect: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
    };

    drawScorePanelBg(g as Parameters<typeof drawScorePanelBg>[0]);

    expect(g.clear).toHaveBeenCalledOnce();
    expect(g.roundRect).toHaveBeenCalledWith(0, 0, 120, 60, 10);
    expect(g.fill).toHaveBeenCalledWith({ color: 0x000000, alpha: 0.6 });
    expect(g.stroke).toHaveBeenCalledWith({
      width: 1.5,
      color: THEME.colors.accent.gold,
      alpha: 0.5,
    });
  });

  it("drawScoreDivider draws horizontal line at correct position", async () => {
    const { drawScoreDivider } = await import("../src/components/hud/score-panel-react.js");
    const g = {
      clear: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
    };

    drawScoreDivider(g as Parameters<typeof drawScoreDivider>[0]);

    const paddingX = THEME.spacing.sm;
    const paddingY = THEME.spacing.xs + 2;
    const rowHeight = 26;

    expect(g.clear).toHaveBeenCalledOnce();
    expect(g.moveTo).toHaveBeenCalledWith(paddingX, paddingY + rowHeight);
    expect(g.lineTo).toHaveBeenCalledWith(120 - paddingX, paddingY + rowHeight);
    expect(g.stroke).toHaveBeenCalledWith({
      width: 1,
      color: THEME.colors.accent.gold,
      alpha: 0.3,
    });
  });

  it("drawTeamMarker draws circle with team color", async () => {
    const { drawTeamMarker } = await import("../src/components/hud/score-panel-react.js");
    const g = {
      clear: vi.fn(),
      circle: vi.fn(),
      fill: vi.fn(),
    };

    drawTeamMarker(g as Parameters<typeof drawTeamMarker>[0], 0, THEME.colors.team.team1);

    const paddingX = THEME.spacing.sm;
    const paddingY = THEME.spacing.xs + 2;

    expect(g.clear).toHaveBeenCalledOnce();
    expect(g.circle).toHaveBeenCalledWith(paddingX + 4, paddingY + 8, 3);
    expect(g.fill).toHaveBeenCalledWith(THEME.colors.team.team1);
  });

  it("drawTeamMarker offsets y for second team row", async () => {
    const { drawTeamMarker } = await import("../src/components/hud/score-panel-react.js");
    const g = {
      clear: vi.fn(),
      circle: vi.fn(),
      fill: vi.fn(),
    };

    drawTeamMarker(g as Parameters<typeof drawTeamMarker>[0], 1, THEME.colors.team.team2);

    const paddingX = THEME.spacing.sm;
    const paddingY = THEME.spacing.xs + 2;
    const rowHeight = 26;

    expect(g.circle).toHaveBeenCalledWith(paddingX + 4, paddingY + rowHeight + 8, 3);
    expect(g.fill).toHaveBeenCalledWith(THEME.colors.team.team2);
  });
});
