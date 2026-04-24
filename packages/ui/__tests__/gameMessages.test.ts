import { describe, it, expect } from "vitest";
import { eventToMessage, SUIT_SYMBOLS } from "../src/messages/gameMessages.js";
import type { GameMessage } from "../src/messages/gameMessages.js";
import type {
  BidPlacedEvent,
  BiddingCompletedEvent,
  TrickCompletedEvent,
  RoundCancelledEvent,
  CardPlayedEvent,
  GameStartedEvent,
} from "@belote/app";
import type { Bid, Contract, Trick, PlayedCard, Card, Round } from "@belote/core";

// ── Helpers ──────────────────────────────────────────────────────────────────

const PROFILES: Record<number, { name: string }> = {
  0: { name: "ElenaP" },
  1: { name: "Villy" },
  2: { name: "DilyanaBl" },
  3: { name: "Vane_Bane" },
};

function makeCard(suit: string, rank: string): Card {
  return { id: `${suit}-${rank}`, suit, rank } as Card;
}

function makePlayedCard(suit: string, rank: string, pos: number): PlayedCard {
  return { card: makeCard(suit, rank), playerPosition: pos } as PlayedCard;
}

function makeBid(
  type: string,
  pos: number,
  value: number | null = null,
  suit: string | null = null,
): Bid {
  return { id: `bid-${pos}`, type, playerPosition: pos, value, suit } as Bid;
}

function makeCompletedTrick(trumpSuit: string, cards: PlayedCard[], winner: number): Trick {
  return {
    id: "trick-1",
    leadingPlayerPosition: cards[0]!.playerPosition,
    trumpSuit,
    cards,
    state: "completed",
    winnerPosition: winner,
  } as Trick;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("eventToMessage", () => {
  describe("bid_placed events", () => {
    it("returns 'Pass' for a pass bid", () => {
      const event: BidPlacedEvent = {
        type: "bid_placed",
        bid: makeBid("pass", 1),
        playerPosition: 1,
      };
      const msg = eventToMessage(event, PROFILES);
      expect(msg).not.toBeNull();
      expect(msg!.text).toBe("Pass");
      expect(msg!.position).toBe("west");
      expect(msg!.playerName).toBe("Villy");
      expect(msg!.type).toBe("bid");
    });

    it("returns suit symbol + value for a spades bid", () => {
      const event: BidPlacedEvent = {
        type: "bid_placed",
        bid: makeBid("suit", 0, 90, "spades"),
        playerPosition: 0,
      };
      const msg = eventToMessage(event, PROFILES);
      expect(msg!.text).toBe(`${SUIT_SYMBOLS.spades} 90`);
      expect(msg!.position).toBe("south");
    });

    it("returns suit symbol + value for a hearts bid", () => {
      const event: BidPlacedEvent = {
        type: "bid_placed",
        bid: makeBid("suit", 2, 90, "hearts"),
        playerPosition: 2,
      };
      const msg = eventToMessage(event, PROFILES);
      expect(msg!.text).toBe(`${SUIT_SYMBOLS.hearts} 90`);
    });

    it("returns suit symbol + value for a diamonds bid", () => {
      const event: BidPlacedEvent = {
        type: "bid_placed",
        bid: makeBid("suit", 3, 100, "diamonds"),
        playerPosition: 3,
      };
      const msg = eventToMessage(event, PROFILES);
      expect(msg!.text).toBe(`${SUIT_SYMBOLS.diamonds} 100`);
    });

    it("returns suit symbol + value for a clubs bid", () => {
      const event: BidPlacedEvent = {
        type: "bid_placed",
        bid: makeBid("suit", 1, 110, "clubs"),
        playerPosition: 1,
      };
      const msg = eventToMessage(event, PROFILES);
      expect(msg!.text).toBe(`${SUIT_SYMBOLS.clubs} 110`);
    });

    it("returns 'Contre !' for a coinche bid", () => {
      const event: BidPlacedEvent = {
        type: "bid_placed",
        bid: makeBid("coinche", 3),
        playerPosition: 3,
      };
      const msg = eventToMessage(event, PROFILES);
      expect(msg!.text).toBe("Contre !");
      expect(msg!.type).toBe("bid");
    });

    it("returns 'Surcontre !' for a surcoinche bid", () => {
      const event: BidPlacedEvent = {
        type: "bid_placed",
        bid: makeBid("surcoinche", 0),
        playerPosition: 0,
      };
      const msg = eventToMessage(event, PROFILES);
      expect(msg!.text).toBe("Surcontre !");
    });
  });

  describe("trick_completed events", () => {
    it("returns '+N pts' with winner position and name", () => {
      // 4 cards: ace of spades (trump) = 11, 7 of spades (trump) = 0, 8 of hearts = 0, king of hearts = 4
      const cards: PlayedCard[] = [
        makePlayedCard("spades", "ace", 0),
        makePlayedCard("spades", "7", 1),
        makePlayedCard("hearts", "8", 2),
        makePlayedCard("hearts", "king", 3),
      ];
      const trick = makeCompletedTrick("spades", cards, 0);
      const event: TrickCompletedEvent = {
        type: "trick_completed",
        trick,
        winnerPosition: 0,
        trickNumber: 1,
      };
      const msg = eventToMessage(event, PROFILES);
      expect(msg).not.toBeNull();
      expect(msg!.type).toBe("trick_win");
      expect(msg!.position).toBe("south");
      expect(msg!.playerName).toBe("ElenaP");
      // ace of spades (trump) = 11, 7 of spades (trump) = 0, 8 of hearts = 0, king of hearts = 4
      expect(msg!.text).toBe("+15 pts");
    });

    it("handles zero-point tricks", () => {
      const cards: PlayedCard[] = [
        makePlayedCard("hearts", "7", 0),
        makePlayedCard("hearts", "8", 1),
        makePlayedCard("clubs", "7", 2),
        makePlayedCard("clubs", "8", 3),
      ];
      const trick = makeCompletedTrick("spades", cards, 0);
      const event: TrickCompletedEvent = {
        type: "trick_completed",
        trick,
        winnerPosition: 0,
        trickNumber: 2,
      };
      const msg = eventToMessage(event, PROFILES);
      expect(msg!.text).toBe("+0 pts");
    });
  });

  describe("bidding_completed events", () => {
    it("returns contract announcement with suit and value", () => {
      const contract: Contract = {
        suit: "hearts",
        value: 90,
        bidderPosition: 2,
        coincheLevel: 1,
      } as Contract;
      const event: BiddingCompletedEvent = {
        type: "bidding_completed",
        contract,
      };
      const msg = eventToMessage(event, PROFILES);
      expect(msg).not.toBeNull();
      expect(msg!.type).toBe("contract");
      expect(msg!.text).toBe(`${SUIT_SYMBOLS.hearts} 90`);
      expect(msg!.position).toBe("north");
      expect(msg!.playerName).toBe("DilyanaBl");
    });
  });

  describe("round_cancelled events", () => {
    it("returns 'All passed' message", () => {
      const event: RoundCancelledEvent = {
        type: "round_cancelled",
        round: { dealerPosition: 1 } as Round,
      };
      const msg = eventToMessage(event, PROFILES);
      expect(msg).not.toBeNull();
      expect(msg!.type).toBe("round_cancelled");
      expect(msg!.text).toBe("All passed");
    });
  });

  describe("unmapped events", () => {
    it("returns null for card_played events", () => {
      const event: CardPlayedEvent = {
        type: "card_played",
        card: makeCard("hearts", "ace"),
        playerPosition: 0,
      };
      const msg = eventToMessage(event, PROFILES);
      expect(msg).toBeNull();
    });

    it("returns null for game_started events", () => {
      const event = { type: "game_started" } as GameStartedEvent;
      const msg = eventToMessage(event, PROFILES);
      expect(msg).toBeNull();
    });
  });

  describe("message structure", () => {
    it("includes a unique id", () => {
      const event: BidPlacedEvent = {
        type: "bid_placed",
        bid: makeBid("pass", 0),
        playerPosition: 0,
      };
      const msg1 = eventToMessage(event, PROFILES);
      const msg2 = eventToMessage(event, PROFILES);
      expect(msg1!.id).toBeTruthy();
      expect(msg2!.id).toBeTruthy();
      expect(msg1!.id).not.toBe(msg2!.id);
    });

    it("includes a timestamp", () => {
      const event: BidPlacedEvent = {
        type: "bid_placed",
        bid: makeBid("pass", 0),
        playerPosition: 0,
      };
      const before = Date.now();
      const msg = eventToMessage(event, PROFILES);
      const after = Date.now();
      expect(msg!.timestamp).toBeGreaterThanOrEqual(before);
      expect(msg!.timestamp).toBeLessThanOrEqual(after);
    });
  });
});
