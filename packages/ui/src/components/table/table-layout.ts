// ====================================================================
// TableLayout — Root PixiJS Container that owns all game zones.
// Wires zone rects from computeLayout to child components.
// This is the top-level integration point for the game table.
// Verified visually in Storybook.
// ====================================================================

import { Container, FillGradient, Graphics } from "pixi.js";
import type { Viewport, Layout } from "../../layout.js";
import { computeLayout } from "../../layout.js";
import { THEME } from "../../theme.js";

// ---- Types ----------------------------------------------------------

export interface TableLayoutZoneContainers {
  readonly top: Container;
  readonly bottom: Container;
  readonly left: Container;
  readonly right: Container;
  readonly center: Container;
}

// ---- TableLayout ----------------------------------------------------

export class TableLayout extends Container {
  private readonly background: Graphics;
  private readonly feltOverlay: Graphics;
  private readonly centerSurface: Graphics;
  private readonly zoneContainers: TableLayoutZoneContainers;
  private currentLayout: Layout;

  constructor(viewport: Viewport) {
    super();
    this.label = "table-layout";

    // Background (radial gradient)
    this.background = new Graphics();
    this.background.label = "table-bg";
    this.addChild(this.background);

    // Felt texture overlay (subtle dot pattern)
    this.feltOverlay = new Graphics();
    this.feltOverlay.label = "felt-overlay";
    this.addChild(this.feltOverlay);

    // Center play area inset surface
    this.centerSurface = new Graphics();
    this.centerSurface.label = "center-surface";
    this.addChild(this.centerSurface);

    // Zone containers — child components are added to these
    this.zoneContainers = {
      top: this.createZoneContainer("zone-top"),
      bottom: this.createZoneContainer("zone-bottom"),
      left: this.createZoneContainer("zone-left"),
      right: this.createZoneContainer("zone-right"),
      center: this.createZoneContainer("zone-center"),
    };

    // Initial layout
    this.currentLayout = computeLayout(viewport);
    this.applyLayout();
  }

  /** Recompute layout after viewport resize. */
  resize(viewport: Viewport): void {
    this.currentLayout = computeLayout(viewport);
    this.applyLayout();
  }

  /** Get zone containers for adding child components. */
  getZones(): TableLayoutZoneContainers {
    return this.zoneContainers;
  }

  /** Get current computed layout. */
  getLayout(): Layout {
    return this.currentLayout;
  }

  private createZoneContainer(zoneLabel: string): Container {
    const container = new Container();
    container.label = zoneLabel;
    this.addChild(container);
    return container;
  }

  private applyLayout(): void {
    const { viewport, zones } = this.currentLayout;
    const { width, height } = viewport;

    // Redraw background with radial gradient
    this.background.clear();
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

    this.background.rect(0, 0, width, height);
    this.background.fill(gradient);

    // Redraw felt texture overlay (sparse dot pattern)
    this.feltOverlay.clear();
    const step = THEME.tableTexture.feltPatternScale;
    const alpha = THEME.tableTexture.feltPatternOpacity;

    for (let x = step; x < width; x += step) {
      for (let y = step; y < height; y += step) {
        this.feltOverlay.circle(x, y, 0.8);
      }
    }
    this.feltOverlay.fill({ color: 0x000000, alpha });

    // Draw center play area inset surface
    this.centerSurface.clear();
    const cz = zones.center;
    const inset = THEME.spacing.sm;
    this.centerSurface.roundRect(
      cz.x + inset,
      cz.y + inset,
      cz.width - inset * 2,
      cz.height - inset * 2,
      THEME.spacing.md,
    );
    this.centerSurface.fill({ color: 0x000000, alpha: 0.12 });
    this.centerSurface.roundRect(
      cz.x + inset,
      cz.y + inset,
      cz.width - inset * 2,
      cz.height - inset * 2,
      THEME.spacing.md,
    );
    this.centerSurface.stroke({ width: 1, color: 0xffffff, alpha: 0.06 });

    // Position zone containers at their zone origins
    this.zoneContainers.top.position.set(zones.top.x, zones.top.y);
    this.zoneContainers.bottom.position.set(zones.bottom.x, zones.bottom.y);
    this.zoneContainers.left.position.set(zones.left.x, zones.left.y);
    this.zoneContainers.right.position.set(zones.right.x, zones.right.y);
    this.zoneContainers.center.position.set(zones.center.x, zones.center.y);
  }
}
