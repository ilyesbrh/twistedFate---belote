// ====================================================================
// PlayerInfoReact — React functional component for player avatar + info.
// Displays avatar circle with initial, player name, and card count.
// Coexists with imperative player-info.ts during migration.
// ====================================================================

import type { Graphics } from "pixi.js";
import type { Seat } from "../../layout.js";
import { THEME } from "../../theme.js";

// ---- Props ----------------------------------------------------------

export interface PlayerInfoReactProps {
  name: string;
  seat: Seat;
  isActive: boolean;
  cardCount: number;
  teamColor: number;
}

// ---- Constants ------------------------------------------------------

const NAME_GAP = 6;

// ---- Extracted helpers (unit-tested) --------------------------------

/** Draw the avatar rounded square with team color fill. */
export function drawPlayerAvatar(g: Graphics, teamColor: number): void {
  const { size, borderRadius } = THEME.avatar;
  const half = size / 2;

  g.clear();
  g.roundRect(-half, -half, size, size, borderRadius);
  g.fill(teamColor);
  g.roundRect(-half, -half, size, size, borderRadius);
  g.stroke({ width: 2, color: 0xffffff, alpha: 0.2 });
}

/** Get the uppercased first character of a name (for avatar initial). */
export function playerInitial(name: string): string {
  return name.length > 0 ? name.charAt(0).toUpperCase() : "";
}

// ---- Component ------------------------------------------------------

export function PlayerInfoReact({
  name,
  seat,
  isActive: _isActive,
  cardCount,
  teamColor,
}: PlayerInfoReactProps): React.JSX.Element {
  const { size } = THEME.avatar;
  const half = size / 2;

  return (
    <pixiContainer label={`player-info-${seat}`}>
      <pixiGraphics
        label="avatar"
        draw={(g: Graphics) => {
          drawPlayerAvatar(g, teamColor);
        }}
      />
      <pixiText
        label="avatar-initial"
        text={playerInitial(name)}
        style={{
          fontFamily: THEME.typography.fontFamily,
          fontSize: THEME.avatar.initialsFontSize,
          fontWeight: "bold",
          fill: THEME.colors.text.light,
        }}
        anchor={0.5}
      />
      <pixiText
        label="name"
        text={name}
        style={{
          fontFamily: THEME.typography.fontFamily,
          fontSize: THEME.typography.playerName.minSize,
          fontWeight: THEME.typography.playerName.fontWeight,
          fill: THEME.colors.text.light,
        }}
        anchor={{ x: 0.5, y: 0 }}
        y={half + NAME_GAP}
      />
      <pixiText
        label="card-count"
        text={String(cardCount)}
        style={{
          fontFamily: THEME.typography.fontFamily,
          fontSize: THEME.typography.label.minSize,
          fill: THEME.colors.text.muted,
        }}
        anchor={{ x: 0.5, y: 0 }}
        y={half + NAME_GAP + THEME.typography.playerName.minSize + 2}
      />
    </pixiContainer>
  );
}
