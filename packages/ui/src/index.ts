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
  TeamColors,
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

// Pip Layout
export { pipPositions } from "./pip-layout.js";
export type { PipPosition } from "./pip-layout.js";

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

// HUD — Score Panel (React)
export {
  ScorePanelReact,
  drawScorePanelBg,
  drawScoreDivider,
  drawTeamMarker,
} from "./components/hud/score-panel-react.js";
export type { ScorePanelReactProps } from "./components/hud/score-panel-react.js";

// HUD — Trump Indicator
export { TrumpIndicator } from "./components/hud/trump-indicator.js";

// HUD — Trump Indicator (React)
export {
  TrumpIndicatorReact,
  drawTrumpBadge,
  trumpTextConfig,
} from "./components/hud/trump-indicator-react.js";
export type { TrumpIndicatorProps } from "./components/hud/trump-indicator-react.js";

// HUD — Turn Indicator
export { TurnIndicator } from "./components/hud/turn-indicator.js";
export type { TurnSeat } from "./components/hud/turn-indicator.js";

// HUD — Turn Indicator (React)
export {
  TurnIndicatorReact,
  arrowForSeat,
  drawTurnPill,
  turnTextConfigs,
} from "./components/hud/turn-indicator-react.js";
export type { TurnIndicatorProps } from "./components/hud/turn-indicator-react.js";

// Bidding Layout
export { computeBiddingLayout } from "./components/bidding/bidding-layout.js";
export type { ButtonRect, BiddingLayoutResult } from "./components/bidding/bidding-layout.js";

// Bidding Panel
export { BiddingPanel } from "./components/bidding/bidding-panel.js";

// Table Layout (root)
export { TableLayout } from "./components/table/table-layout.js";
export type { TableLayoutZoneContainers } from "./components/table/table-layout.js";

// Game View (pure state mapping)
export {
  positionToSeat,
  seatToPosition,
  opponentOrientation,
  mapHandToView,
  mapTrickToView,
  mapGameStateToView,
} from "./game-view.js";
export type {
  PlayerView,
  OpponentView,
  GamePhase,
  GameView,
  RoundSnapshot,
  GameStateInput,
} from "./game-view.js";

// Game Renderer (integration)
export { GameRenderer } from "./game-renderer.js";
export type { GameRendererConfig } from "./game-renderer.js";

// Game Controller (event-driven bridge)
export { GameController } from "./game-controller.js";
export type { GameSessionAccess, RenderTarget, InputSource } from "./game-controller.js";

// Bootstrap
export { createApp } from "./bootstrap.js";
export type { AppConfig } from "./bootstrap.js";

// React / PixiJS integration
export { initPixiReact } from "./pixi-react-setup.js";

// React hooks
export { useTheme } from "./hooks/use-theme.js";
