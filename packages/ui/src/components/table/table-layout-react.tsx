// ====================================================================
// TableLayoutReact — React component for the 5-zone game table using
// @pixi/layout Yoga-powered flexbox for zone positioning.
// Replaces manual computeLayout zone math with percentage-based flex.
// Background drawn via pixiGraphics draw callback.
// Coexists with imperative table-layout.ts during migration.
// ====================================================================

import { useCallback } from "react";
import { FillGradient } from "pixi.js";
import type { Graphics } from "pixi.js";
import type { Orientation } from "../../layout.js";
import { getOrientation } from "../../layout.js";
import { THEME } from "../../theme.js";

// ---- Types ----------------------------------------------------------

export interface TableLayoutReactProps {
  width: number;
  height: number;
  topContent?: React.ReactNode;
  leftContent?: React.ReactNode;
  centerContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  bottomContent?: React.ReactNode;
}

type NumberPercent = `${number}%`;

interface ZoneRatios {
  readonly topHeight: NumberPercent;
  readonly bottomHeight: NumberPercent;
  readonly sideWidth: NumberPercent;
}

// ---- Extracted helpers (unit-tested) --------------------------------

/** Return percentage strings for zone dimensions based on orientation. */
export function zoneRatios(orientation: Orientation): ZoneRatios {
  if (orientation === "landscape") {
    return { topHeight: "18%", bottomHeight: "28%", sideWidth: "15%" };
  }
  return { topHeight: "25%", bottomHeight: "35%", sideWidth: "12%" };
}

/** Draw the table background: radial gradient + felt dot pattern. */
export function drawTableBackground(g: Graphics, width: number, height: number): void {
  g.clear();

  // Radial gradient background
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.max(width, height) * 0.65;

  const gradient = new FillGradient({
    type: "radial",
    center: { x: cx, y: cy },
    innerRadius: 0,
    outerCenter: { x: cx, y: cy },
    outerRadius: radius,
    colorStops: [
      { offset: 0, color: THEME.colors.table.surface },
      { offset: 0.35, color: THEME.colors.table.bgLight },
      { offset: 1, color: THEME.colors.table.bgDark },
    ],
  });

  g.rect(0, 0, width, height);
  g.fill(gradient);

  // Felt texture overlay (sparse dot pattern)
  const step = THEME.tableTexture.feltPatternScale;
  const alpha = THEME.tableTexture.feltPatternOpacity;

  for (let x = step; x < width; x += step) {
    for (let y = step; y < height; y += step) {
      g.circle(x, y, 0.8);
    }
  }
  g.fill({ color: 0x000000, alpha });
}

// ---- Component ------------------------------------------------------

export function TableLayoutReact({
  width,
  height,
  topContent,
  leftContent,
  centerContent,
  rightContent,
  bottomContent,
}: TableLayoutReactProps): React.JSX.Element {
  const orientation = getOrientation(width, height);
  const ratios = zoneRatios(orientation);

  const drawBg = useCallback(
    (g: Graphics) => {
      drawTableBackground(g, width, height);
    },
    [width, height],
  );

  return (
    <pixiContainer label="table-layout">
      {/* Background layer (non-layout, renders at 0,0 behind zones) */}
      <pixiGraphics label="table-bg" draw={drawBg} />

      {/* Flexbox zone structure */}
      <layoutContainer layout={{ width, height, flexDirection: "column" }}>
        {/* Top zone */}
        <layoutContainer label="zone-top" layout={{ width: "100%", height: ratios.topHeight }}>
          {topContent}
        </layoutContainer>

        {/* Middle row */}
        <layoutContainer layout={{ flex: 1, width: "100%", flexDirection: "row" }}>
          {/* Left zone */}
          <layoutContainer label="zone-left" layout={{ width: ratios.sideWidth, height: "100%" }}>
            {leftContent}
          </layoutContainer>

          {/* Center zone */}
          <layoutContainer label="zone-center" layout={{ flex: 1, height: "100%" }}>
            {centerContent}
          </layoutContainer>

          {/* Right zone */}
          <layoutContainer label="zone-right" layout={{ width: ratios.sideWidth, height: "100%" }}>
            {rightContent}
          </layoutContainer>
        </layoutContainer>

        {/* Bottom zone */}
        <layoutContainer
          label="zone-bottom"
          layout={{ width: "100%", height: ratios.bottomHeight }}
        >
          {bottomContent}
        </layoutContainer>
      </layoutContainer>
    </pixiContainer>
  );
}
