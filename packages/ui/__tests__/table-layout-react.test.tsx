import { describe, it, expect, vi } from "vitest";
import { isValidElement } from "react";

/**
 * TableLayoutReact — React functional component for the 5-zone game table
 * using @pixi/layout Yoga-powered flexbox.
 */
describe("TableLayoutReact", () => {
  // ---- Export checks -------------------------------------------------

  it("exports the TableLayoutReact component function", async () => {
    const mod = await import("../src/components/table/table-layout-react.js");
    expect(mod.TableLayoutReact).toBeTypeOf("function");
  });

  it("exports the zoneRatios helper function", async () => {
    const mod = await import("../src/components/table/table-layout-react.js");
    expect(mod.zoneRatios).toBeTypeOf("function");
  });

  it("exports the drawTableBackground helper function", async () => {
    const mod = await import("../src/components/table/table-layout-react.js");
    expect(mod.drawTableBackground).toBeTypeOf("function");
  });

  // ---- React element validity ----------------------------------------

  it("returns a valid React element", async () => {
    const { TableLayoutReact } = await import("../src/components/table/table-layout-react.js");
    const element = <TableLayoutReact width={844} height={390} />;
    expect(isValidElement(element)).toBe(true);
  });

  it("returns a valid React element with slot content", async () => {
    const { TableLayoutReact } = await import("../src/components/table/table-layout-react.js");
    const element = (
      <TableLayoutReact
        width={844}
        height={390}
        topContent={<pixiContainer />}
        bottomContent={<pixiContainer />}
        centerContent={<pixiContainer />}
      />
    );
    expect(isValidElement(element)).toBe(true);
  });

  // ---- zoneRatios helper ---------------------------------------------

  it("zoneRatios returns landscape ratios for landscape orientation", async () => {
    const { zoneRatios } = await import("../src/components/table/table-layout-react.js");
    const ratios = zoneRatios("landscape");
    expect(ratios.topHeight).toBe("18%");
    expect(ratios.bottomHeight).toBe("28%");
    expect(ratios.sideWidth).toBe("15%");
  });

  it("zoneRatios returns portrait ratios for portrait orientation", async () => {
    const { zoneRatios } = await import("../src/components/table/table-layout-react.js");
    const ratios = zoneRatios("portrait");
    expect(ratios.topHeight).toBe("25%");
    expect(ratios.bottomHeight).toBe("35%");
    expect(ratios.sideWidth).toBe("12%");
  });

  // ---- drawTableBackground helper ------------------------------------

  it("drawTableBackground draws gradient fill and felt pattern", async () => {
    const { drawTableBackground } = await import("../src/components/table/table-layout-react.js");
    const g = {
      clear: vi.fn().mockReturnThis(),
      rect: vi.fn().mockReturnThis(),
      fill: vi.fn().mockReturnThis(),
      circle: vi.fn().mockReturnThis(),
    };

    drawTableBackground(g as Parameters<typeof drawTableBackground>[0], 844, 390);

    // Should clear, draw background rect, and draw felt dots
    expect(g.clear).toHaveBeenCalled();
    expect(g.rect).toHaveBeenCalledWith(0, 0, 844, 390);
    // At least two fill calls: one for gradient, one for felt dots
    expect(g.fill).toHaveBeenCalledTimes(2);
    // Felt pattern draws multiple circles
    expect(g.circle.mock.calls.length).toBeGreaterThan(0);
  });
});
