import { describe, it, expect, beforeEach } from "vitest";
import { createPlayer, setPlayerHand, createTeam, dealCards } from "../../src/models/player.js";
import type { Player, PlayerPosition, Team } from "../../src/models/player.js";
import { createCard, createDeck, shuffleDeck } from "../../src/models/card.js";
import type { Card } from "../../src/models/card.js";
import { createIdGenerator } from "../../src/utils/id.js";
import type { IdGenerator } from "../../src/utils/id.js";

describe("Player and Team Models", () => {
  let idGenerator: IdGenerator;

  beforeEach(() => {
    idGenerator = createIdGenerator({ seed: 42 });
  });

  // ==================================================
  // SECTION 1: PLAYER CREATION
  // ==================================================
  describe("createPlayer", () => {
    it("should create a player with the correct name and position", () => {
      const player = createPlayer("Alice", 0, idGenerator);
      expect(player.name).toBe("Alice");
      expect(player.position).toBe(0);
    });

    it("should assign a unique ID with player_ prefix", () => {
      const player = createPlayer("Bob", 1, idGenerator);
      expect(player.id).toMatch(/^player_[a-z0-9]+$/);
    });

    it("should start with an empty hand", () => {
      const player = createPlayer("Charlie", 2, idGenerator);
      expect(player.hand).toHaveLength(0);
      expect(player.hand).toEqual([]);
    });

    it("should create different IDs for different players", () => {
      const p1 = createPlayer("Alice", 0, idGenerator);
      const p2 = createPlayer("Bob", 1, idGenerator);
      expect(p1.id).not.toBe(p2.id);
    });

    it("should produce deterministic IDs with seeded generator", () => {
      const gen1 = createIdGenerator({ seed: 99 });
      const gen2 = createIdGenerator({ seed: 99 });
      const p1 = createPlayer("Alice", 0, gen1);
      const p2 = createPlayer("Alice", 0, gen2);
      expect(p1.id).toBe(p2.id);
    });

    it("should return a frozen (immutable) player", () => {
      const player = createPlayer("Alice", 0, idGenerator);
      expect(Object.isFrozen(player)).toBe(true);
    });

    it("should work with all 4 positions", () => {
      const positions: PlayerPosition[] = [0, 1, 2, 3];
      for (const pos of positions) {
        const player = createPlayer(`Player${pos}`, pos, idGenerator);
        expect(player.position).toBe(pos);
        expect(player.id).toBeTruthy();
      }
    });
  });

  // ==================================================
  // SECTION 2: SET PLAYER HAND
  // ==================================================
  describe("setPlayerHand", () => {
    it("should return a new player with the given hand", () => {
      const player = createPlayer("Alice", 0, idGenerator);
      const cards = [
        createCard("hearts", "ace", idGenerator),
        createCard("spades", "king", idGenerator),
      ];
      const updated = setPlayerHand(player, cards);
      expect(updated.hand).toHaveLength(2);
      expect(updated.hand[0]!.suit).toBe("hearts");
      expect(updated.hand[1]!.suit).toBe("spades");
    });

    it("should preserve id, name, and position", () => {
      const player = createPlayer("Bob", 2, idGenerator);
      const cards = [createCard("clubs", "7", idGenerator)];
      const updated = setPlayerHand(player, cards);
      expect(updated.id).toBe(player.id);
      expect(updated.name).toBe(player.name);
      expect(updated.position).toBe(player.position);
    });

    it("should return a frozen player", () => {
      const player = createPlayer("Charlie", 1, idGenerator);
      const cards = [createCard("diamonds", "jack", idGenerator)];
      const updated = setPlayerHand(player, cards);
      expect(Object.isFrozen(updated)).toBe(true);
    });

    it("should not mutate the original player", () => {
      const player = createPlayer("Alice", 0, idGenerator);
      const cards = [createCard("hearts", "ace", idGenerator)];
      const updated = setPlayerHand(player, cards);
      expect(player.hand).toHaveLength(0);
      expect(updated.hand).toHaveLength(1);
      expect(updated).not.toBe(player);
    });

    it("should accept an empty hand (clearing cards)", () => {
      const player = createPlayer("Alice", 0, idGenerator);
      const cards = [createCard("hearts", "ace", idGenerator)];
      const withCards = setPlayerHand(player, cards);
      const cleared = setPlayerHand(withCards, []);
      expect(cleared.hand).toHaveLength(0);
    });
  });

  // ==================================================
  // SECTION 3: TEAM CREATION
  // ==================================================
  describe("createTeam", () => {
    it("should create a team with the correct two players", () => {
      const p1 = createPlayer("Alice", 0, idGenerator);
      const p2 = createPlayer("Bob", 2, idGenerator);
      const team = createTeam(p1, p2, idGenerator);
      expect(team.players).toHaveLength(2);
      expect(team.players[0].id).toBe(p1.id);
      expect(team.players[1].id).toBe(p2.id);
    });

    it("should assign a unique ID with team_ prefix", () => {
      const p1 = createPlayer("Alice", 0, idGenerator);
      const p2 = createPlayer("Bob", 2, idGenerator);
      const team = createTeam(p1, p2, idGenerator);
      expect(team.id).toMatch(/^team_[a-z0-9]+$/);
    });

    it("should create different IDs for different teams", () => {
      const p1 = createPlayer("Alice", 0, idGenerator);
      const p2 = createPlayer("Bob", 2, idGenerator);
      const p3 = createPlayer("Charlie", 1, idGenerator);
      const p4 = createPlayer("Diana", 3, idGenerator);
      const team1 = createTeam(p1, p2, idGenerator);
      const team2 = createTeam(p3, p4, idGenerator);
      expect(team1.id).not.toBe(team2.id);
    });

    it("should return a frozen team", () => {
      const p1 = createPlayer("Alice", 0, idGenerator);
      const p2 = createPlayer("Bob", 2, idGenerator);
      const team = createTeam(p1, p2, idGenerator);
      expect(Object.isFrozen(team)).toBe(true);
    });

    it("should preserve player references", () => {
      const p1 = createPlayer("Alice", 0, idGenerator);
      const p2 = createPlayer("Bob", 2, idGenerator);
      const team = createTeam(p1, p2, idGenerator);
      expect(team.players[0]).toBe(p1);
      expect(team.players[1]).toBe(p2);
    });

    it("should produce deterministic IDs with seeded generator", () => {
      const gen1 = createIdGenerator({ seed: 77 });
      const gen2 = createIdGenerator({ seed: 77 });
      const p1a = createPlayer("Alice", 0, gen1);
      const p2a = createPlayer("Bob", 2, gen1);
      const p1b = createPlayer("Alice", 0, gen2);
      const p2b = createPlayer("Bob", 2, gen2);
      const team1 = createTeam(p1a, p2a, gen1);
      const team2 = createTeam(p1b, p2b, gen2);
      expect(team1.id).toBe(team2.id);
    });
  });

  // ==================================================
  // SECTION 4: DEAL CARDS
  // ==================================================
  describe("dealCards", () => {
    let deck: Card[];
    let players: [Player, Player, Player, Player];

    beforeEach(() => {
      const deckGen = createIdGenerator({ seed: 10 });
      deck = createDeck(deckGen);
      const playerGen = createIdGenerator({ seed: 20 });
      players = [
        createPlayer("Alice", 0, playerGen),
        createPlayer("Bob", 1, playerGen),
        createPlayer("Charlie", 2, playerGen),
        createPlayer("Diana", 3, playerGen),
      ];
    });

    it("should return 4 players each with 8 cards", () => {
      const dealt = dealCards(deck, players);
      expect(dealt).toHaveLength(4);
      for (const player of dealt) {
        expect(player.hand).toHaveLength(8);
      }
    });

    it("should distribute all 32 cards (no card lost)", () => {
      const dealt = dealCards(deck, players);
      const allDealtIds = dealt.flatMap((p) => p.hand.map((c) => c.id));
      const allDeckIds = deck.map((c) => c.id);
      expect(new Set(allDealtIds)).toEqual(new Set(allDeckIds));
    });

    it("should not duplicate any card across players", () => {
      const dealt = dealCards(deck, players);
      const allIds = dealt.flatMap((p) => p.hand.map((c) => c.id));
      expect(new Set(allIds).size).toBe(32);
    });

    it("should not mutate the original players", () => {
      const originalHands = players.map((p) => [...p.hand]);
      dealCards(deck, players);
      for (let i = 0; i < players.length; i++) {
        expect(players[i]!.hand).toEqual(originalHands[i]);
      }
    });

    it("should preserve player id, name, and position", () => {
      const dealt = dealCards(deck, players);
      for (let i = 0; i < 4; i++) {
        expect(dealt[i]!.id).toBe(players[i]!.id);
        expect(dealt[i]!.name).toBe(players[i]!.name);
        expect(dealt[i]!.position).toBe(players[i]!.position);
      }
    });

    it("should return frozen players", () => {
      const dealt = dealCards(deck, players);
      for (const player of dealt) {
        expect(Object.isFrozen(player)).toBe(true);
      }
    });

    it("should deal round-robin by position order", () => {
      const dealt = dealCards(deck, players);
      // Card 0 → player 0, card 1 → player 1, card 2 → player 2, card 3 → player 3
      // Card 4 → player 0, card 5 → player 1, ...
      for (let cardIndex = 0; cardIndex < 32; cardIndex++) {
        const playerIndex = cardIndex % 4;
        const cardInHand = Math.floor(cardIndex / 4);
        expect(dealt[playerIndex]!.hand[cardInHand]!.id).toBe(deck[cardIndex]!.id);
      }
    });

    it("should produce a deterministic deal with the same deck order", () => {
      const dealt1 = dealCards(deck, players);
      const dealt2 = dealCards(deck, players);
      for (let i = 0; i < 4; i++) {
        expect(dealt1[i]!.hand.map((c) => c.id)).toEqual(dealt2[i]!.hand.map((c) => c.id));
      }
    });

    it("should throw if deck has fewer than 32 cards", () => {
      const shortDeck = deck.slice(0, 20);
      expect(() => dealCards(shortDeck, players)).toThrow();
    });

    it("should throw if deck has more than 32 cards", () => {
      const longDeck = [...deck, createCard("hearts", "ace", idGenerator)];
      expect(() => dealCards(longDeck, players)).toThrow();
    });

    it("should throw if not exactly 4 players", () => {
      const threePlayers = [players[0]!, players[1]!, players[2]!] as unknown as [
        Player,
        Player,
        Player,
        Player,
      ];
      expect(() => dealCards(deck, threePlayers)).toThrow();
    });

    it("should deal cards that are a subset of the original deck", () => {
      const dealt = dealCards(deck, players);
      const deckIds = new Set(deck.map((c) => c.id));
      for (const player of dealt) {
        for (const card of player.hand) {
          expect(deckIds.has(card.id)).toBe(true);
        }
      }
    });
  });

  // ==================================================
  // SECTION 5: INTEGRATION
  // ==================================================
  describe("integration", () => {
    it("should support full flow: create players → teams → deck → shuffle → deal", () => {
      const gen = createIdGenerator({ seed: 1 });

      // Create players
      const p1 = createPlayer("Alice", 0, gen);
      const p2 = createPlayer("Bob", 1, gen);
      const p3 = createPlayer("Charlie", 2, gen);
      const p4 = createPlayer("Diana", 3, gen);

      // Create teams (partners across)
      const teamA = createTeam(p1, p3, gen);
      const teamB = createTeam(p2, p4, gen);

      // Create and shuffle deck
      const deck = createDeck(gen);

      const makePrng = (seed: number): (() => number) => {
        let state = seed | 0;
        return (): number => {
          state = (state + 0x6d2b79f5) | 0;
          let t = Math.imul(state ^ (state >>> 15), 1 | state);
          t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
          return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
      };

      const shuffled = shuffleDeck(deck, makePrng(42));

      // Deal
      const dealt = dealCards(shuffled, [p1, p2, p3, p4]);

      // Verify
      expect(dealt).toHaveLength(4);
      expect(teamA.players).toHaveLength(2);
      expect(teamB.players).toHaveLength(2);
      const allCards = dealt.flatMap((p) => p.hand);
      expect(allCards).toHaveLength(32);
      expect(new Set(allCards.map((c) => c.id)).size).toBe(32);
    });

    it("should ensure players on the same team have no card overlap", () => {
      const gen = createIdGenerator({ seed: 5 });
      const p1 = createPlayer("A", 0, gen);
      const p2 = createPlayer("B", 1, gen);
      const p3 = createPlayer("C", 2, gen);
      const p4 = createPlayer("D", 3, gen);

      const deck = createDeck(gen);
      const dealt = dealCards(deck, [p1, p2, p3, p4]);

      // Team A: positions 0 and 2
      const teamACards = [...dealt[0]!.hand.map((c) => c.id), ...dealt[2]!.hand.map((c) => c.id)];
      expect(new Set(teamACards).size).toBe(16);

      // Team B: positions 1 and 3
      const teamBCards = [...dealt[1]!.hand.map((c) => c.id), ...dealt[3]!.hand.map((c) => c.id)];
      expect(new Set(teamBCards).size).toBe(16);
    });

    it("should have team partners at positions (0,2) and (1,3)", () => {
      const gen = createIdGenerator({ seed: 3 });
      const p1 = createPlayer("A", 0, gen);
      const p2 = createPlayer("B", 1, gen);
      const p3 = createPlayer("C", 2, gen);
      const p4 = createPlayer("D", 3, gen);

      const teamA = createTeam(p1, p3, gen);
      const teamB = createTeam(p2, p4, gen);

      // Partners across the table
      expect(teamA.players[0].position).toBe(0);
      expect(teamA.players[1].position).toBe(2);
      expect(teamB.players[0].position).toBe(1);
      expect(teamB.players[1].position).toBe(3);
    });
  });
});
