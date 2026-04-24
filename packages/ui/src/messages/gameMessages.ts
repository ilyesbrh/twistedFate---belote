import type {
  GameEvent,
  BidPlacedEvent,
  BiddingCompletedEvent,
  TrickCompletedEvent,
  RoundCancelledEvent,
} from "@belote/app";
import { calculateTrickPoints } from "@belote/core";
import type { Suit } from "@belote/core";

// ── Types ────────────────────────────────────────────────────────────────────

export type Position = "south" | "north" | "west" | "east";

export type MessageType = "bid" | "trick_win" | "contract" | "round_cancelled";

export interface GameMessage {
  readonly id: string;
  readonly position: Position;
  readonly playerName: string;
  readonly text: string;
  readonly type: MessageType;
  readonly timestamp: number;
}

// ── Constants ────────────────────────────────────────────────────────────────

export const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: "\u2660",
  hearts: "\u2665",
  diamonds: "\u2666",
  clubs: "\u2663",
};

const POS_TO_SEAT: Partial<Record<number, Position>> = {
  0: "south",
  1: "west",
  2: "north",
  3: "east",
};

let messageCounter = 0;

function nextId(): string {
  messageCounter += 1;
  return `msg-${String(Date.now())}-${String(messageCounter)}`;
}

function seatFor(pos: number): Position {
  return POS_TO_SEAT[pos] ?? "south";
}

// ── Profiles type ────────────────────────────────────────────────────────────

export type ProfileLookup = Partial<Record<number, { name: string }>>;

// ── Event → Message mapper ──────────────────────────────────────────────────

export function eventToMessage(event: GameEvent, profiles: ProfileLookup): GameMessage | null {
  switch (event.type) {
    case "bid_placed":
      return bidPlacedToMessage(event, profiles);
    case "trick_completed":
      return trickCompletedToMessage(event, profiles);
    case "bidding_completed":
      return biddingCompletedToMessage(event, profiles);
    case "round_cancelled":
      return roundCancelledToMessage(event);
    default:
      return null;
  }
}

// ── Internal mappers ─────────────────────────────────────────────────────────

function bidPlacedToMessage(event: BidPlacedEvent, profiles: ProfileLookup): GameMessage {
  const { bid } = event;
  const position = seatFor(bid.playerPosition);
  const playerName = profiles[bid.playerPosition]?.name ?? "Unknown";

  let text: string;
  switch (bid.type) {
    case "pass":
      text = "Pass";
      break;
    case "coinche":
      text = "Contre !";
      break;
    case "surcoinche":
      text = "Surcontre !";
      break;
    case "suit": {
      const symbol = bid.suit ? SUIT_SYMBOLS[bid.suit] : "?";
      text = `${symbol} ${String(bid.value)}`;
      break;
    }
    default:
      text = "Bid";
  }

  return { id: nextId(), position, playerName, text, type: "bid", timestamp: Date.now() };
}

function trickCompletedToMessage(event: TrickCompletedEvent, profiles: ProfileLookup): GameMessage {
  const position = seatFor(event.winnerPosition);
  const playerName = profiles[event.winnerPosition]?.name ?? "Unknown";
  const points = calculateTrickPoints(event.trick, event.trick.trumpSuit);

  return {
    id: nextId(),
    position,
    playerName,
    text: `+${String(points)} pts`,
    type: "trick_win",
    timestamp: Date.now(),
  };
}

function biddingCompletedToMessage(
  event: BiddingCompletedEvent,
  profiles: ProfileLookup,
): GameMessage {
  const { contract } = event;
  const position = seatFor(contract.bidderPosition);
  const playerName = profiles[contract.bidderPosition]?.name ?? "Unknown";
  const text = `${SUIT_SYMBOLS[contract.suit]} ${String(contract.value)}`;

  return { id: nextId(), position, playerName, text, type: "contract", timestamp: Date.now() };
}

export function createBeloteMessage(
  playerPosition: number,
  kind: "belote" | "rebelote",
  profiles: ProfileLookup,
): GameMessage {
  const position = seatFor(playerPosition);
  const playerName = profiles[playerPosition]?.name ?? "Unknown";
  return {
    id: nextId(),
    position,
    playerName,
    text: kind === "belote" ? "Belote !" : "Rebelote !",
    type: "contract",
    timestamp: Date.now(),
  };
}

function roundCancelledToMessage(event: RoundCancelledEvent): GameMessage {
  const position = seatFor(event.round.dealerPosition);

  return {
    id: nextId(),
    position,
    playerName: "",
    text: "All passed",
    type: "round_cancelled",
    timestamp: Date.now(),
  };
}
