// ====================================================================
// Design tokens — single source of truth for all visual constants.
// See docs/UI_MANIFESTO.md for rationale.
// ====================================================================

import { deepFreeze } from "./deep-freeze.js";

// ---- Types ----------------------------------------------------------

export interface RangeValue {
  readonly min: number;
  readonly max: number;
}

export interface TableColors {
  readonly bgDark: string;
  readonly bgLight: string;
  readonly surface: string;
}

export interface CardColors {
  readonly face: string;
  readonly back: string;
  readonly border: string;
}

export interface SuitColors {
  readonly red: string;
  readonly black: string;
}

export interface AccentColors {
  readonly gold: string;
  readonly danger: string;
}

export interface UiColors {
  readonly overlay: string;
  readonly overlayLight: string;
}

export interface TextColors {
  readonly light: string;
  readonly dark: string;
  readonly muted: string;
}

export interface TeamColors {
  readonly team1: number;
  readonly team2: number;
}

export interface ThemeColors {
  readonly table: TableColors;
  readonly card: CardColors;
  readonly suit: SuitColors;
  readonly accent: AccentColors;
  readonly ui: UiColors;
  readonly text: TextColors;
  readonly team: TeamColors;
}

export type FontWeight =
  | "normal"
  | "bold"
  | "bolder"
  | "lighter"
  | "100"
  | "200"
  | "300"
  | "400"
  | "500"
  | "600"
  | "700"
  | "800"
  | "900";

export interface FontSpec {
  readonly fontWeight: FontWeight;
  readonly minSize: number;
  readonly maxSize?: number;
}

export interface Typography {
  readonly fontFamily: string;
  readonly cardIndex: FontSpec;
  readonly cardSuitSmall: FontSpec;
  readonly cardCenter: FontSpec;
  readonly cardPip: FontSpec;
  readonly cardFaceLetter: FontSpec;
  readonly score: Required<FontSpec>;
  readonly playerName: Required<FontSpec>;
  readonly label: Required<FontSpec>;
  readonly heading: Required<FontSpec>;
}

export interface Spacing {
  readonly xs: number;
  readonly sm: number;
  readonly md: number;
  readonly lg: number;
  readonly xl: number;
}

export interface CardDimensions {
  readonly aspectRatio: number;
  readonly handHeightPercent: RangeValue;
  readonly trickHeightPercent: RangeValue;
  readonly opponentHeightPercent: RangeValue;
  readonly minTapWidth: number;
  readonly fanOverlap: RangeValue;
}

export interface AnimationTiming {
  readonly cardDeal: RangeValue;
  readonly cardPlay: RangeValue;
  readonly trickCollect: RangeValue;
  readonly cardSelect: RangeValue;
  readonly cardReject: number;
  readonly panelSlide: number;
  readonly scoreUpdate: number;
  readonly roundTransition: RangeValue;
  readonly aiDelay: RangeValue;
}

export interface ShadowSpec {
  readonly color: number;
  readonly alpha: number;
  readonly blur: number;
  readonly offsetX: number;
  readonly offsetY: number;
}

export interface Shadows {
  readonly card: ShadowSpec;
  readonly panel: ShadowSpec;
  readonly avatar: ShadowSpec;
}

export interface CardDesign {
  readonly borderWidth: number;
  readonly innerBorderInset: number;
  readonly innerBorderColor: string;
  readonly cornerFlourishSize: number;
  readonly backgroundPatternOpacity: number;
  readonly backCheckerSize: number;
  readonly backCheckerColor: string;
}

export interface IndicatorDesign {
  readonly badgeSize: number;
  readonly badgeRadius: number;
  readonly borderWidth: number;
  readonly borderColor: string;
  readonly suitFontSize: number;
}

export interface AvatarDesign {
  readonly size: number;
  readonly borderRadius: number;
  readonly activeGlowColor: number;
  readonly activeGlowStrength: number;
  readonly initialsFontSize: number;
}

export interface TableTexture {
  readonly feltPatternOpacity: number;
  readonly feltPatternScale: number;
}

export interface Theme {
  readonly colors: ThemeColors;
  readonly typography: Typography;
  readonly spacing: Spacing;
  readonly cardDimensions: CardDimensions;
  readonly animationTiming: AnimationTiming;
  readonly shadows: Shadows;
  readonly cardDesign: CardDesign;
  readonly indicators: IndicatorDesign;
  readonly avatar: AvatarDesign;
  readonly tableTexture: TableTexture;
}

// ---- Token values ---------------------------------------------------

export const THEME: Theme = deepFreeze({
  colors: {
    table: {
      bgDark: "#0D3B0F",
      bgLight: "#1B5E20",
      surface: "#2E7D32",
    },
    card: {
      face: "#FFFDE7",
      back: "#1A237E",
      border: "#BDBDBD",
    },
    suit: {
      red: "#C62828",
      black: "#212121",
    },
    accent: {
      gold: "#FFD54F",
      danger: "#E53935",
    },
    ui: {
      overlay: "rgba(0,0,0,0.7)",
      overlayLight: "rgba(255,255,255,0.1)",
    },
    text: {
      light: "#FAFAFA",
      dark: "#212121",
      muted: "#9E9E9E",
    },
    team: {
      team1: 0xff8c00, // warm orange — visible on green felt
      team2: 0x1565c0, // strong blue — visible on green felt
    },
  },

  typography: {
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    cardIndex: { fontWeight: "bold", minSize: 18 },
    cardSuitSmall: { fontWeight: "bold", minSize: 14 },
    cardCenter: { fontWeight: "bold", minSize: 48 },
    cardPip: { fontWeight: "normal", minSize: 16 },
    cardFaceLetter: { fontWeight: "bold", minSize: 40 },
    score: { fontWeight: "bold", minSize: 18, maxSize: 24 },
    playerName: { fontWeight: "500", minSize: 12, maxSize: 14 },
    label: { fontWeight: "normal", minSize: 11, maxSize: 13 },
    heading: { fontWeight: "bold", minSize: 16, maxSize: 20 },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },

  // Card dimension percentages are relative to viewport height.
  // Optimized for landscape-first (844x390 baseline).
  cardDimensions: {
    aspectRatio: 2.5 / 3.5,
    handHeightPercent: { min: 0.22, max: 0.28 },
    trickHeightPercent: { min: 0.18, max: 0.22 },
    opponentHeightPercent: { min: 0.12, max: 0.16 },
    minTapWidth: 44,
    fanOverlap: { min: 0.6, max: 0.7 },
  },

  animationTiming: {
    cardDeal: { min: 150, max: 200 },
    cardPlay: { min: 200, max: 300 },
    trickCollect: { min: 400, max: 500 },
    cardSelect: { min: 100, max: 150 },
    cardReject: 200,
    panelSlide: 300,
    scoreUpdate: 500,
    roundTransition: { min: 800, max: 1000 },
    aiDelay: { min: 500, max: 1000 },
  },

  shadows: {
    card: { color: 0x000000, alpha: 0.35, blur: 6, offsetX: 2, offsetY: 3 },
    panel: { color: 0x000000, alpha: 0.4, blur: 8, offsetX: 0, offsetY: 4 },
    avatar: { color: 0x000000, alpha: 0.3, blur: 4, offsetX: 1, offsetY: 2 },
  },

  cardDesign: {
    borderWidth: 2,
    innerBorderInset: 5,
    innerBorderColor: "#FFD54F",
    cornerFlourishSize: 8,
    backgroundPatternOpacity: 0.04,
    backCheckerSize: 10,
    backCheckerColor: "#C62828",
  },

  indicators: {
    badgeSize: 48,
    badgeRadius: 10,
    borderWidth: 2,
    borderColor: "#FFD54F",
    suitFontSize: 26,
  },

  avatar: {
    size: 64,
    borderRadius: 14,
    activeGlowColor: 0xffd54f,
    activeGlowStrength: 3,
    initialsFontSize: 28,
  },

  tableTexture: {
    feltPatternOpacity: 0.06,
    feltPatternScale: 12,
  },
});
