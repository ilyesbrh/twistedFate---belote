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

// Bootstrap
export { createApp } from "./bootstrap.js";
export type { AppConfig } from "./bootstrap.js";
