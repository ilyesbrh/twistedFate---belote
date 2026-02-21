// @belote/ui — PixiJS mobile-first rendering layer

// Theme
export { THEME } from "./theme.js";
export type {
  Theme,
  ThemeColors,
  TableColors,
  CardColors,
  SuitColors,
  AccentColors,
  UiColors,
  TextColors,
  Typography,
  FontWeight,
  FontSpec,
  Spacing,
  RangeValue,
  CardDimensions,
  AnimationTiming,
} from "./theme.js";

// Layout
export { computeLayout, getBreakpoint, getOrientation, computeSafeArea } from "./layout.js";
export type {
  Orientation,
  Breakpoint,
  Seat,
  Viewport,
  SafeAreaInsets,
  Rect,
  LayoutZones,
  Layout,
} from "./layout.js";

// Card Textures
export {
  cardKey,
  suitSymbol,
  suitColor,
  rankDisplay,
  CARD_BACK_KEY,
  ALL_CARD_KEYS,
  createCardTextureAtlas,
  createCardFaceGraphics,
  createCardBackGraphics,
} from "./card-textures.js";
export type { CardTextureAtlas } from "./card-textures.js";

// Card Sprite
export { CardSprite, cardLabel, CARD_BACK_LABEL } from "./card-sprite.js";

// Hand Layout
export { computeHandLayout } from "./components/hand/hand-layout.js";
export type { CardPosition, HandLayoutResult } from "./components/hand/hand-layout.js";

// Hand Display
export { HandDisplay } from "./components/hand/hand-display.js";
export type { HandCard } from "./components/hand/hand-display.js";

// Opponent Layout
export { computeOpponentLayout } from "./components/opponent-hand/opponent-layout.js";
export type {
  OpponentOrientation,
  OpponentCardPosition,
  OpponentLayoutResult,
} from "./components/opponent-hand/opponent-layout.js";

// Opponent Hand Display
export { OpponentHand } from "./components/opponent-hand/opponent-hand.js";

// Trick Layout
export { computeTrickLayout } from "./components/trick/trick-layout.js";
export type {
  TrickPosition,
  TrickSlot,
  TrickLayoutResult,
} from "./components/trick/trick-layout.js";

// Trick Display
export { TrickDisplay } from "./components/trick/trick-display.js";
export type { TrickCard } from "./components/trick/trick-display.js";

// Player Info
export { PlayerInfo, teamForSeat } from "./components/player-info/player-info.js";
export type { PlayerSeat, PlayerInfoOptions } from "./components/player-info/player-info.js";

// HUD — Score Panel
export { ScorePanel } from "./components/hud/score-panel.js";
export type { ScorePanelOptions } from "./components/hud/score-panel.js";

// HUD — Trump Indicator
export { TrumpIndicator } from "./components/hud/trump-indicator.js";

// HUD — Turn Indicator
export { TurnIndicator } from "./components/hud/turn-indicator.js";
export type { TurnSeat } from "./components/hud/turn-indicator.js";

// Bidding Layout
export { computeBiddingLayout } from "./components/bidding/bidding-layout.js";
export type { ButtonRect, BiddingLayoutResult } from "./components/bidding/bidding-layout.js";

// Bidding Panel
export { BiddingPanel } from "./components/bidding/bidding-panel.js";

// Table Layout (root)
export { TableLayout } from "./components/table/table-layout.js";
export type { TableLayoutZoneContainers } from "./components/table/table-layout.js";

// Bootstrap
export { createApp } from "./bootstrap.js";
export type { AppConfig } from "./bootstrap.js";
