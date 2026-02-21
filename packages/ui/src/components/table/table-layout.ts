// ====================================================================
// TableLayout — Root PixiJS Container that owns all game zones.
// Wires zone rects from computeLayout to child components.
// This is the top-level integration point for the game table.
// Verified visually in Storybook.
// ====================================================================

import { Container, Graphics } from "pixi.js";
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
  private readonly zoneContainers: TableLayoutZoneContainers;
  private currentLayout: Layout;

  constructor(viewport: Viewport) {
    super();
    this.label = "table-layout";

    // Background
    this.background = new Graphics();
    this.background.label = "table-bg";
    this.addChild(this.background);

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

    // Redraw background
    this.background.clear();
    this.background.rect(0, 0, viewport.width, viewport.height);
    this.background.fill(THEME.colors.table.bgDark);

    // Position zone containers at their zone origins
    this.zoneContainers.top.position.set(zones.top.x, zones.top.y);
    this.zoneContainers.bottom.position.set(zones.bottom.x, zones.bottom.y);
    this.zoneContainers.left.position.set(zones.left.x, zones.left.y);
    this.zoneContainers.right.position.set(zones.right.x, zones.right.y);
    this.zoneContainers.center.position.set(zones.center.x, zones.center.y);
  }
}
