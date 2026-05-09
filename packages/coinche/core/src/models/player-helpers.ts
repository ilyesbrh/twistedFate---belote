import type { PlayerPosition } from "./player.js";

export function getNextPlayerPosition(position: PlayerPosition): PlayerPosition {
  return ((position + 1) % 4) as PlayerPosition;
}

export function isOnSameTeam(pos1: PlayerPosition, pos2: PlayerPosition): boolean {
  return pos1 === pos2 || Math.abs(pos1 - pos2) === 2;
}
