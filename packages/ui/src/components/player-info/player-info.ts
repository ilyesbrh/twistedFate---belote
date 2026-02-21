// ====================================================================
// PlayerInfo — PixiJS Container showing avatar circle, name, and card count.
// Used in all 4 zones (one per player).
// Verified visually in Storybook (no canvas in unit tests).
// ====================================================================

import { Container, Graphics, Text } from "pixi.js";
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

const AVATAR_RADIUS = 16;
const ACTIVE_RING_WIDTH = 3;
const NAME_GAP = 6;

// ---- Pure helpers (unit-testable) -----------------------------------

/** Returns team color based on seat: south/north = team 1, west/east = team 2. */
export function teamForSeat(seat: PlayerSeat): "team1" | "team2" {
  return seat === "south" || seat === "north" ? "team1" : "team2";
}

// ---- PlayerInfo -----------------------------------------------------

export class PlayerInfo extends Container {
  private readonly avatarCircle: Graphics;
  private readonly nameText: Text;
  private readonly cardCountText: Text;
  private readonly activeRing: Graphics;

  constructor(options: PlayerInfoOptions) {
    super();
    this.label = `player-info-${options.seat}`;

    // Avatar circle
    this.avatarCircle = new Graphics();
    this.avatarCircle.circle(0, 0, AVATAR_RADIUS);
    this.avatarCircle.fill(options.teamColor);
    this.avatarCircle.label = "avatar";
    this.addChild(this.avatarCircle);

    // Active ring (gold glow)
    this.activeRing = new Graphics();
    this.activeRing.circle(0, 0, AVATAR_RADIUS + ACTIVE_RING_WIDTH);
    this.activeRing.stroke({ width: ACTIVE_RING_WIDTH, color: THEME.colors.accent.gold });
    this.activeRing.label = "active-ring";
    this.activeRing.visible = options.isActive;
    this.addChild(this.activeRing);

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
    this.nameText.y = AVATAR_RADIUS + NAME_GAP;
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
    this.cardCountText.anchor.set(0.5);
    this.addChild(this.cardCountText);
  }

  setActive(active: boolean): void {
    this.activeRing.visible = active;
  }

  setCardCount(count: number): void {
    this.cardCountText.text = String(count);
  }
}
