import type { StoryFn, Meta } from "@pixi/storybook-renderer";
import { Container, Graphics, Text } from "pixi.js";
import { computeLayout } from "../../layout.js";
import type { Viewport } from "../../layout.js";
import { THEME } from "../../theme.js";

const meta: Meta = {
  title: "Components/TableLayout",
};

export default meta;

// ---- Helpers --------------------------------------------------------

function buildTableStory(viewport: Viewport): { view: Container } {
  const root = new Container();
  root.label = "table-story-root";

  const layout = computeLayout(viewport);

  // Background
  const bg = new Graphics();
  bg.rect(0, 0, viewport.width, viewport.height);
  bg.fill(THEME.colors.table.bgDark);
  bg.label = "table-bg";
  root.addChild(bg);

  // Draw each zone with a distinct tint and label
  const zoneStyles: {
    name: string;
    zone: { x: number; y: number; width: number; height: number };
    color: number;
  }[] = [
    { name: "TOP", zone: layout.zones.top, color: 0x1b5e20 },
    { name: "BOTTOM", zone: layout.zones.bottom, color: 0x2e7d32 },
    { name: "LEFT", zone: layout.zones.left, color: 0x388e3c },
    { name: "RIGHT", zone: layout.zones.right, color: 0x388e3c },
    { name: "CENTER", zone: layout.zones.center, color: 0x43a047 },
  ];

  for (const { name, zone, color } of zoneStyles) {
    // Zone background
    const zoneGfx = new Graphics();
    zoneGfx.rect(zone.x, zone.y, zone.width, zone.height);
    zoneGfx.fill(color);
    zoneGfx.stroke({ width: 1, color: 0x66bb6a });
    zoneGfx.label = `zone-${name.toLowerCase()}`;
    root.addChild(zoneGfx);

    // Zone label
    const label = new Text({
      text: `${name}\n${String(Math.round(zone.width))}×${String(Math.round(zone.height))}`,
      style: {
        fontFamily: THEME.typography.fontFamily,
        fontSize: THEME.typography.label.minSize,
        fill: THEME.colors.text.light,
        align: "center",
      },
    });
    label.label = `label-${name.toLowerCase()}`;
    label.anchor.set(0.5);
    label.x = zone.x + zone.width / 2;
    label.y = zone.y + zone.height / 2;
    root.addChild(label);
  }

  // Viewport info
  const info = new Text({
    text: `${String(viewport.width)}×${String(viewport.height)} ${layout.orientation} (${layout.breakpoint})`,
    style: {
      fontFamily: THEME.typography.fontFamily,
      fontSize: THEME.typography.label.minSize,
      fill: THEME.colors.accent.gold,
    },
  });
  info.label = "viewport-info";
  info.x = THEME.spacing.xs;
  info.y = THEME.spacing.xs;
  root.addChild(info);

  return { view: root };
}

// ---- Stories --------------------------------------------------------

/** Design baseline — iPhone 14 landscape (844x390). */
export const LandscapeBaseline: StoryFn = (): { view: Container } => {
  return buildTableStory({ width: 844, height: 390 });
};

/** Portrait fallback — iPhone 14 portrait (390x844). */
export const PortraitFallback: StoryFn = (): { view: Container } => {
  return buildTableStory({ width: 390, height: 844 });
};

/** Tablet landscape (1024x768). */
export const TabletLandscape: StoryFn = (): { view: Container } => {
  return buildTableStory({ width: 1024, height: 768 });
};

/** Desktop (1920x1080). */
export const Desktop: StoryFn = (): { view: Container } => {
  return buildTableStory({ width: 1920, height: 1080 });
};
