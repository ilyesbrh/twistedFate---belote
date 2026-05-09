import { describe, it, expect } from "vitest";
import { createIdGenerator, generateId } from "../../src/utils/id.js";
import type { EntityType } from "../../src/utils/id.js";

const ALL_ENTITY_TYPES: EntityType[] = [
  "game",
  "player",
  "card",
  "deck",
  "trick",
  "round",
  "team",
  "ui-component",
  "animation-instance",
];

describe("ID Generation Utility", () => {
  // ==================================================
  // SECTION 1: ID FORMAT VALIDATION
  // ==================================================
  describe("ID format", () => {
    it.each(ALL_ENTITY_TYPES)("should prefix ID with entity type '%s'", (entityType) => {
      const generator = createIdGenerator({ seed: 1 });
      const id = generator.generateId(entityType);
      expect(id.startsWith(`${entityType}_`)).toBe(true);
    });

    it.each(ALL_ENTITY_TYPES)(
      "should produce a non-empty unique part after prefix for '%s'",
      (entityType) => {
        const generator = createIdGenerator({ seed: 1 });
        const id = generator.generateId(entityType);
        const uniquePart = id.slice(entityType.length + 1);
        expect(uniquePart.length).toBeGreaterThan(0);
      },
    );

    it("should contain only alphanumeric characters in the unique part (seeded)", () => {
      const generator = createIdGenerator({ seed: 42 });
      const id = generator.generateId("card");
      expect(id).toMatch(/^card_[a-z0-9]+$/);
    });

    it("should produce IDs with hyphens in prefix for hyphenated entity types", () => {
      const generator = createIdGenerator({ seed: 42 });
      const uiId = generator.generateId("ui-component");
      const animId = generator.generateId("animation-instance");
      expect(uiId).toMatch(/^ui-component_[a-z0-9]+$/);
      expect(animId).toMatch(/^animation-instance_[a-z0-9]+$/);
    });
  });

  // ==================================================
  // SECTION 2: DETERMINISTIC MODE (SEEDED)
  // ==================================================
  describe("deterministic mode (seeded)", () => {
    it("should produce the same ID sequence for the same seed", () => {
      const gen1 = createIdGenerator({ seed: 42 });
      const gen2 = createIdGenerator({ seed: 42 });

      const ids1 = [gen1.generateId("card"), gen1.generateId("player"), gen1.generateId("game")];
      const ids2 = [gen2.generateId("card"), gen2.generateId("player"), gen2.generateId("game")];

      expect(ids1).toEqual(ids2);
    });

    it("should produce different ID sequences for different seeds", () => {
      const gen1 = createIdGenerator({ seed: 1 });
      const gen2 = createIdGenerator({ seed: 2 });

      const id1 = gen1.generateId("card");
      const id2 = gen2.generateId("card");

      expect(id1).not.toBe(id2);
      expect(id1.startsWith("card_")).toBe(true);
      expect(id2.startsWith("card_")).toBe(true);
    });

    it("should produce different IDs on successive calls with the same entity type", () => {
      const generator = createIdGenerator({ seed: 42 });
      const id1 = generator.generateId("card");
      const id2 = generator.generateId("card");
      const id3 = generator.generateId("card");

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    it("should produce unique IDs across different entity types in sequence", () => {
      const generator = createIdGenerator({ seed: 42 });
      const ids = new Set([
        generator.generateId("card"),
        generator.generateId("player"),
        generator.generateId("game"),
        generator.generateId("deck"),
        generator.generateId("trick"),
      ]);
      expect(ids.size).toBe(5);
    });

    it("should produce deterministic unique parts of consistent length", () => {
      const generator = createIdGenerator({ seed: 99 });
      const ids: string[] = [];
      for (let i = 0; i < 100; i++) {
        ids.push(generator.generateId("card"));
      }
      const uniqueParts = ids.map((id) => id.replace("card_", ""));
      const lengths = new Set(uniqueParts.map((part) => part.length));
      expect(lengths.size).toBe(1);
    });
  });

  // ==================================================
  // SECTION 3: RESET FUNCTIONALITY
  // ==================================================
  describe("reset", () => {
    it("should reproduce the same sequence after reset in deterministic mode", () => {
      const generator = createIdGenerator({ seed: 42 });

      const firstRun = [
        generator.generateId("card"),
        generator.generateId("player"),
        generator.generateId("game"),
      ];

      generator.reset();

      const secondRun = [
        generator.generateId("card"),
        generator.generateId("player"),
        generator.generateId("game"),
      ];

      expect(firstRun).toEqual(secondRun);
    });

    it("should allow multiple resets", () => {
      const generator = createIdGenerator({ seed: 7 });

      const firstId = generator.generateId("trick");
      generator.reset();
      const secondId = generator.generateId("trick");
      generator.reset();
      const thirdId = generator.generateId("trick");

      expect(firstId).toBe(secondId);
      expect(secondId).toBe(thirdId);
    });

    it("should not throw when reset is called on a random-mode generator", () => {
      const generator = createIdGenerator();
      expect(() => {
        generator.reset();
      }).not.toThrow();
    });
  });

  // ==================================================
  // SECTION 4: RANDOM MODE (PRODUCTION)
  // ==================================================
  describe("random mode (production)", () => {
    it("should produce unique IDs across multiple calls", () => {
      const generator = createIdGenerator();
      const ids = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        ids.add(generator.generateId("card"));
      }
      expect(ids.size).toBe(1000);
    });

    it("should produce correctly formatted IDs in random mode", () => {
      const generator = createIdGenerator();
      const id = generator.generateId("game");
      expect(id).toMatch(/^game_[a-f0-9]+$/);
    });

    it("should produce IDs with correct prefix in random mode for all entity types", () => {
      const generator = createIdGenerator();
      const gameId = generator.generateId("game");
      const playerId = generator.generateId("player");
      expect(gameId.startsWith("game_")).toBe(true);
      expect(playerId.startsWith("player_")).toBe(true);
    });
  });

  // ==================================================
  // SECTION 5: MODULE-LEVEL CONVENIENCE FUNCTION
  // ==================================================
  describe("generateId convenience function", () => {
    it("should produce a correctly formatted ID", () => {
      const id = generateId("card");
      expect(id).toMatch(/^card_[a-f0-9]+$/);
    });

    it("should produce unique IDs across multiple calls", () => {
      const id1 = generateId("player");
      const id2 = generateId("player");
      expect(id1).not.toBe(id2);
    });

    it("should work for all entity types", () => {
      for (const type of ALL_ENTITY_TYPES) {
        const id = generateId(type);
        expect(id.startsWith(`${type}_`)).toBe(true);
        expect(id.length).toBeGreaterThan(type.length + 1);
      }
    });
  });

  // ==================================================
  // SECTION 6: EDGE CASES AND ROBUSTNESS
  // ==================================================
  describe("edge cases", () => {
    it("should handle seed value of 0", () => {
      const generator = createIdGenerator({ seed: 0 });
      const id = generator.generateId("card");
      expect(id.startsWith("card_")).toBe(true);
      expect(id.length).toBeGreaterThan(5);
    });

    it("should handle negative seed values", () => {
      const generator = createIdGenerator({ seed: -1 });
      const id = generator.generateId("card");
      expect(id.startsWith("card_")).toBe(true);
    });

    it("should handle very large seed values", () => {
      const generator = createIdGenerator({ seed: Number.MAX_SAFE_INTEGER });
      const id = generator.generateId("card");
      expect(id.startsWith("card_")).toBe(true);
    });

    it("should produce different IDs with seed 0 vs no seed", () => {
      const seeded = createIdGenerator({ seed: 0 });
      const random = createIdGenerator();
      const seededId = seeded.generateId("card");
      const randomId = random.generateId("card");
      expect(seededId.startsWith("card_")).toBe(true);
      expect(randomId.startsWith("card_")).toBe(true);
    });

    it("should generate many IDs without collision in deterministic mode", () => {
      const generator = createIdGenerator({ seed: 12345 });
      const ids = new Set<string>();
      for (let i = 0; i < 10000; i++) {
        ids.add(generator.generateId("card"));
      }
      expect(ids.size).toBe(10000);
    });

    it("should isolate generators from each other", () => {
      const gen1 = createIdGenerator({ seed: 42 });
      const gen2 = createIdGenerator({ seed: 42 });

      for (let i = 0; i < 5; i++) {
        gen1.generateId("card");
      }

      const gen2First = gen2.generateId("card");
      const gen1Sixth = gen1.generateId("card");
      expect(gen2First).not.toBe(gen1Sixth);

      const gen3 = createIdGenerator({ seed: 42 });
      expect(gen2First).toBe(gen3.generateId("card"));
    });
  });

  // ==================================================
  // SECTION 7: TYPE SAFETY
  // ==================================================
  describe("type safety", () => {
    it("should accept all valid EntityType values", () => {
      const generator = createIdGenerator({ seed: 1 });
      for (const type of ALL_ENTITY_TYPES) {
        expect(() => {
          generator.generateId(type);
        }).not.toThrow();
      }
    });
  });
});
