// ====================================================================
// PlayerInfo — PixiJS Container showing avatar circle, name, and card count.
// Used in all 4 zones (one per player).
// Verified visually in Storybook (no canvas in unit tests).
// ====================================================================

import { Container, Graphics, Text } from "pixi.js";
import { DropShadowFilter, GlowFilter } from "pixi-filters";
import type { Seat } from "../../layout.js";
import { THEME } from "../../theme.js";

// ---- Types ----------------------------------------------------------

export type PlayerSeat = Seat;

export interface PlayerInfoOptions {
  readonly name: string;
  readonly seat: PlayerSeat;
  readonly isActive: boolean;
  readonly cardCount: number;
  readonly teamColor: number;
}

// ---- Constants ------------------------------------------------------

const NAME_GAP = 6;

// ---- Pure helpers (unit-testable) -----------------------------------

/** Returns team color based on seat: south/north = team 1, west/east = team 2. */
export function teamForSeat(seat: PlayerSeat): "team1" | "team2" {
  return seat === "south" || seat === "north" ? "team1" : "team2";
}

// ---- PlayerInfo -----------------------------------------------------

export class PlayerInfo extends Container {
  private readonly avatarShape: Graphics;
  private readonly nameText: Text;
  private readonly cardCountText: Text;
  private readonly glowFilter: GlowFilter;

  constructor(options: PlayerInfoOptions) {
    super();
    this.label = `player-info-${options.seat}`;

    const { size, borderRadius } = THEME.avatar;
    const half = size / 2;

    // Avatar rounded square
    this.avatarShape = new Graphics();
    this.avatarShape.roundRect(-half, -half, size, size, borderRadius);
    this.avatarShape.fill(options.teamColor);
    this.avatarShape.roundRect(-half, -half, size, size, borderRadius);
    this.avatarShape.stroke({ width: 2, color: 0xffffff, alpha: 0.2 });
    this.avatarShape.label = "avatar";
    this.addChild(this.avatarShape);

    // Initial letter centered in avatar
    const initial = options.name.charAt(0).toUpperCase();
    const initialText = new Text({
      text: initial,
      style: {
        fontFamily: THEME.typography.fontFamily,
        fontSize: THEME.avatar.initialsFontSize,
        fontWeight: "bold",
        fill: THEME.colors.text.light,
      },
    });
    initialText.label = "avatar-initial";
    initialText.anchor.set(0.5);
    this.addChild(initialText);

    // Drop shadow on avatar
    const shadow = THEME.shadows.avatar;
    const dropShadow = new DropShadowFilter({
      color: shadow.color,
      alpha: shadow.alpha,
      blur: shadow.blur,
      offset: { x: shadow.offsetX, y: shadow.offsetY },
    });

    // Glow filter for active state
    this.glowFilter = new GlowFilter({
      color: THEME.avatar.activeGlowColor,
      outerStrength: THEME.avatar.activeGlowStrength,
      innerStrength: 0,
    });

    this.filters = options.isActive ? [dropShadow, this.glowFilter] : [dropShadow];

    // Name
    this.nameText = new Text({
      text: options.name,
      style: {
        fontFamily: THEME.typography.fontFamily,
        fontSize: THEME.typography.playerName.minSize,
        fontWeight: THEME.typography.playerName.fontWeight,
        fill: THEME.colors.text.light,
      },
    });
    this.nameText.label = "name";
    this.nameText.anchor.set(0.5, 0);
    this.nameText.y = half + NAME_GAP;
    this.addChild(this.nameText);

    // Card count
    this.cardCountText = new Text({
      text: String(options.cardCount),
      style: {
        fontFamily: THEME.typography.fontFamily,
        fontSize: THEME.typography.label.minSize,
        fill: THEME.colors.text.muted,
      },
    });
    this.cardCountText.label = "card-count";
    this.cardCountText.anchor.set(0.5, 0);
    this.cardCountText.y = half + NAME_GAP + THEME.typography.playerName.minSize + 2;
    this.addChild(this.cardCountText);
  }

  setActive(active: boolean): void {
    const shadow = THEME.shadows.avatar;
    const dropShadow = new DropShadowFilter({
      color: shadow.color,
      alpha: shadow.alpha,
      blur: shadow.blur,
      offset: { x: shadow.offsetX, y: shadow.offsetY },
    });

    this.filters = active ? [dropShadow, this.glowFilter] : [dropShadow];
  }

  setCardCount(count: number): void {
    this.cardCountText.text = String(count);
  }
}
