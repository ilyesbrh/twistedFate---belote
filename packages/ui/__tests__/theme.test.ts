import { describe, it, expect } from "vitest";
import { THEME } from "../src/theme.js";

describe("THEME", () => {
  // ====================================================================
  // Immutability
  // ====================================================================

  describe("immutability", () => {
    it("THEME is frozen", () => {
      expect(Object.isFrozen(THEME)).toBe(true);
    });

    it("colors is deeply frozen", () => {
      expect(Object.isFrozen(THEME.colors)).toBe(true);
      expect(Object.isFrozen(THEME.colors.table)).toBe(true);
      expect(Object.isFrozen(THEME.colors.card)).toBe(true);
      expect(Object.isFrozen(THEME.colors.suit)).toBe(true);
      expect(Object.isFrozen(THEME.colors.accent)).toBe(true);
      expect(Object.isFrozen(THEME.colors.ui)).toBe(true);
      expect(Object.isFrozen(THEME.colors.text)).toBe(true);
      expect(Object.isFrozen(THEME.colors.team)).toBe(true);
    });

    it("typography is deeply frozen", () => {
      expect(Object.isFrozen(THEME.typography)).toBe(true);
      expect(Object.isFrozen(THEME.typography.cardIndex)).toBe(true);
      expect(Object.isFrozen(THEME.typography.cardSuitSmall)).toBe(true);
      expect(Object.isFrozen(THEME.typography.cardCenter)).toBe(true);
      expect(Object.isFrozen(THEME.typography.cardPip)).toBe(true);
      expect(Object.isFrozen(THEME.typography.cardFaceLetter)).toBe(true);
      expect(Object.isFrozen(THEME.typography.score)).toBe(true);
      expect(Object.isFrozen(THEME.typography.playerName)).toBe(true);
      expect(Object.isFrozen(THEME.typography.label)).toBe(true);
      expect(Object.isFrozen(THEME.typography.heading)).toBe(true);
    });

    it("spacing is frozen", () => {
      expect(Object.isFrozen(THEME.spacing)).toBe(true);
    });

    it("cardDimensions is deeply frozen", () => {
      expect(Object.isFrozen(THEME.cardDimensions)).toBe(true);
      expect(Object.isFrozen(THEME.cardDimensions.handHeightPercent)).toBe(true);
      expect(Object.isFrozen(THEME.cardDimensions.trickHeightPercent)).toBe(true);
      expect(Object.isFrozen(THEME.cardDimensions.opponentHeightPercent)).toBe(true);
      expect(Object.isFrozen(THEME.cardDimensions.fanOverlap)).toBe(true);
    });

    it("animationTiming is deeply frozen", () => {
      expect(Object.isFrozen(THEME.animationTiming)).toBe(true);
      expect(Object.isFrozen(THEME.animationTiming.cardDeal)).toBe(true);
      expect(Object.isFrozen(THEME.animationTiming.cardPlay)).toBe(true);
      expect(Object.isFrozen(THEME.animationTiming.trickCollect)).toBe(true);
      expect(Object.isFrozen(THEME.animationTiming.cardSelect)).toBe(true);
      expect(Object.isFrozen(THEME.animationTiming.roundTransition)).toBe(true);
      expect(Object.isFrozen(THEME.animationTiming.aiDelay)).toBe(true);
    });
  });

  // ====================================================================
  // Top-level structure
  // ====================================================================

  describe("structure", () => {
    it("has exactly the expected top-level keys", () => {
      const keys = Object.keys(THEME).sort();
      expect(keys).toEqual(
        [
          "animationTiming",
          "avatar",
          "cardDesign",
          "cardDimensions",
          "colors",
          "indicators",
          "shadows",
          "spacing",
          "tableTexture",
          "typography",
        ].sort(),
      );
    });
  });

  // ====================================================================
  // Color tokens
  // ====================================================================

  describe("colors.table", () => {
    it("bgDark is #0D3B0F", () => {
      expect(THEME.colors.table.bgDark).toBe("#0D3B0F");
    });

    it("bgLight is #1B5E20", () => {
      expect(THEME.colors.table.bgLight).toBe("#1B5E20");
    });

    it("surface is #2E7D32", () => {
      expect(THEME.colors.table.surface).toBe("#2E7D32");
    });
  });

  describe("colors.card", () => {
    it("face is #FFFDE7", () => {
      expect(THEME.colors.card.face).toBe("#FFFDE7");
    });

    it("back is #1A237E", () => {
      expect(THEME.colors.card.back).toBe("#1A237E");
    });

    it("border is #BDBDBD", () => {
      expect(THEME.colors.card.border).toBe("#BDBDBD");
    });
  });

  describe("colors.suit", () => {
    it("red is #C62828", () => {
      expect(THEME.colors.suit.red).toBe("#C62828");
    });

    it("black is #212121", () => {
      expect(THEME.colors.suit.black).toBe("#212121");
    });
  });

  describe("colors.accent", () => {
    it("gold is #FFD54F", () => {
      expect(THEME.colors.accent.gold).toBe("#FFD54F");
    });

    it("danger is #E53935", () => {
      expect(THEME.colors.accent.danger).toBe("#E53935");
    });
  });

  describe("colors.ui", () => {
    it("overlay is rgba(0,0,0,0.7)", () => {
      expect(THEME.colors.ui.overlay).toBe("rgba(0,0,0,0.7)");
    });

    it("overlayLight is rgba(255,255,255,0.1)", () => {
      expect(THEME.colors.ui.overlayLight).toBe("rgba(255,255,255,0.1)");
    });
  });

  describe("colors.text", () => {
    it("light is #FAFAFA", () => {
      expect(THEME.colors.text.light).toBe("#FAFAFA");
    });

    it("dark is #212121", () => {
      expect(THEME.colors.text.dark).toBe("#212121");
    });

    it("muted is #9E9E9E", () => {
      expect(THEME.colors.text.muted).toBe("#9E9E9E");
    });
  });

  describe("colors.team", () => {
    it("team1 is 0xFF8C00 (warm orange)", () => {
      expect(THEME.colors.team.team1).toBe(0xff8c00);
    });

    it("team2 is 0x1565C0 (strong blue)", () => {
      expect(THEME.colors.team.team2).toBe(0x1565c0);
    });
  });

  // ====================================================================
  // Typography tokens
  // ====================================================================

  describe("typography", () => {
    it("fontFamily is a non-empty string", () => {
      expect(typeof THEME.typography.fontFamily).toBe("string");
      expect(THEME.typography.fontFamily.length).toBeGreaterThan(0);
    });

    it("cardIndex is bold, min 18", () => {
      expect(THEME.typography.cardIndex.fontWeight).toBe("bold");
      expect(THEME.typography.cardIndex.minSize).toBe(18);
    });

    it("cardSuitSmall is bold, min 14", () => {
      expect(THEME.typography.cardSuitSmall.fontWeight).toBe("bold");
      expect(THEME.typography.cardSuitSmall.minSize).toBe(14);
    });

    it("cardCenter is bold, min 48", () => {
      expect(THEME.typography.cardCenter.fontWeight).toBe("bold");
      expect(THEME.typography.cardCenter.minSize).toBe(48);
    });

    it("cardPip is normal, min 16", () => {
      expect(THEME.typography.cardPip.fontWeight).toBe("normal");
      expect(THEME.typography.cardPip.minSize).toBe(16);
    });

    it("cardFaceLetter is bold, min 40", () => {
      expect(THEME.typography.cardFaceLetter.fontWeight).toBe("bold");
      expect(THEME.typography.cardFaceLetter.minSize).toBe(40);
    });

    it("score is bold, 18-24", () => {
      expect(THEME.typography.score.fontWeight).toBe("bold");
      expect(THEME.typography.score.minSize).toBe(18);
      expect(THEME.typography.score.maxSize).toBe(24);
    });

    it("playerName is medium, 12-14", () => {
      expect(THEME.typography.playerName.fontWeight).toBe("500");
      expect(THEME.typography.playerName.minSize).toBe(12);
      expect(THEME.typography.playerName.maxSize).toBe(14);
    });

    it("label is normal, 11-13", () => {
      expect(THEME.typography.label.fontWeight).toBe("normal");
      expect(THEME.typography.label.minSize).toBe(11);
      expect(THEME.typography.label.maxSize).toBe(13);
    });

    it("heading is bold, 16-20", () => {
      expect(THEME.typography.heading.fontWeight).toBe("bold");
      expect(THEME.typography.heading.minSize).toBe(16);
      expect(THEME.typography.heading.maxSize).toBe(20);
    });
  });

  // ====================================================================
  // Spacing tokens
  // ====================================================================

  describe("spacing", () => {
    it("xs is 4", () => {
      expect(THEME.spacing.xs).toBe(4);
    });

    it("sm is 8", () => {
      expect(THEME.spacing.sm).toBe(8);
    });

    it("md is 16", () => {
      expect(THEME.spacing.md).toBe(16);
    });

    it("lg is 24", () => {
      expect(THEME.spacing.lg).toBe(24);
    });

    it("xl is 32", () => {
      expect(THEME.spacing.xl).toBe(32);
    });
  });

  // ====================================================================
  // Card dimension tokens
  // ====================================================================

  describe("cardDimensions", () => {
    it("aspectRatio is 2.5 / 3.5", () => {
      expect(THEME.cardDimensions.aspectRatio).toBeCloseTo(2.5 / 3.5);
    });

    it("handHeightPercent is 0.22-0.28 (landscape-first)", () => {
      expect(THEME.cardDimensions.handHeightPercent.min).toBe(0.22);
      expect(THEME.cardDimensions.handHeightPercent.max).toBe(0.28);
    });

    it("trickHeightPercent is 0.18-0.22 (landscape-first)", () => {
      expect(THEME.cardDimensions.trickHeightPercent.min).toBe(0.18);
      expect(THEME.cardDimensions.trickHeightPercent.max).toBe(0.22);
    });

    it("opponentHeightPercent is 0.12-0.16 (landscape-first)", () => {
      expect(THEME.cardDimensions.opponentHeightPercent.min).toBe(0.12);
      expect(THEME.cardDimensions.opponentHeightPercent.max).toBe(0.16);
    });

    it("minTapWidth is 44", () => {
      expect(THEME.cardDimensions.minTapWidth).toBe(44);
    });

    it("fanOverlap is 0.60-0.70", () => {
      expect(THEME.cardDimensions.fanOverlap.min).toBe(0.6);
      expect(THEME.cardDimensions.fanOverlap.max).toBe(0.7);
    });
  });

  // ====================================================================
  // Animation timing tokens
  // ====================================================================

  describe("animationTiming", () => {
    it("cardDeal is 150-200ms", () => {
      expect(THEME.animationTiming.cardDeal.min).toBe(150);
      expect(THEME.animationTiming.cardDeal.max).toBe(200);
    });

    it("cardPlay is 200-300ms", () => {
      expect(THEME.animationTiming.cardPlay.min).toBe(200);
      expect(THEME.animationTiming.cardPlay.max).toBe(300);
    });

    it("trickCollect is 400-500ms", () => {
      expect(THEME.animationTiming.trickCollect.min).toBe(400);
      expect(THEME.animationTiming.trickCollect.max).toBe(500);
    });

    it("cardSelect is 100-150ms", () => {
      expect(THEME.animationTiming.cardSelect.min).toBe(100);
      expect(THEME.animationTiming.cardSelect.max).toBe(150);
    });

    it("cardReject is 200ms", () => {
      expect(THEME.animationTiming.cardReject).toBe(200);
    });

    it("panelSlide is 300ms", () => {
      expect(THEME.animationTiming.panelSlide).toBe(300);
    });

    it("scoreUpdate is 500ms", () => {
      expect(THEME.animationTiming.scoreUpdate).toBe(500);
    });

    it("roundTransition is 800-1000ms", () => {
      expect(THEME.animationTiming.roundTransition.min).toBe(800);
      expect(THEME.animationTiming.roundTransition.max).toBe(1000);
    });

    it("aiDelay is 500-1000ms", () => {
      expect(THEME.animationTiming.aiDelay.min).toBe(500);
      expect(THEME.animationTiming.aiDelay.max).toBe(1000);
    });
  });
});
