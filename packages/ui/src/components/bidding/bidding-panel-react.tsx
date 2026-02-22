// ====================================================================
// BiddingPanelReact — React functional component for bidding overlay.
// Renders 4 suit buttons + 1 pass button using computeBiddingLayout.
// Coexists with imperative bidding-panel.ts during migration.
// ====================================================================

import type { Graphics } from "pixi.js";
import type { Suit } from "@belote/core";
import { ALL_SUITS } from "@belote/core";
import type { Rect } from "../../layout.js";
import { THEME } from "../../theme.js";
import { suitSymbol, suitColor } from "../../card-textures.js";
import { computeBiddingLayout } from "./bidding-layout.js";

// ---- Props ----------------------------------------------------------

export interface BiddingPanelReactProps {
  zone: Rect;
  onSuitBid?: (suit: Suit) => void;
  onPass?: () => void;
}

// ---- Constants ------------------------------------------------------

const BUTTON_RADIUS = 10;
const SUIT_SYMBOL_OFFSET_Y = -8;
const SUIT_NAME_OFFSET_Y = 14;

const SUIT_NAMES: Record<Suit, string> = {
  hearts: "Hearts",
  diamonds: "Diamonds",
  clubs: "Clubs",
  spades: "Spades",
};

// ---- Extracted helpers (unit-tested) --------------------------------

/** Draw a suit button background: dark fill + gold border. */
export function drawSuitButtonBg(g: Graphics, width: number, height: number): void {
  g.clear();
  g.roundRect(0, 0, width, height, BUTTON_RADIUS);
  g.fill({ color: 0x000000, alpha: 0.5 });
  g.roundRect(0, 0, width, height, BUTTON_RADIUS);
  g.stroke({ width: 2, color: THEME.colors.accent.gold, alpha: 0.6 });
}

/** Draw a pass button background: subtler fill + muted border. */
export function drawPassButtonBg(g: Graphics, width: number, height: number): void {
  g.clear();
  g.roundRect(0, 0, width, height, BUTTON_RADIUS);
  g.fill({ color: 0x000000, alpha: 0.3 });
  g.roundRect(0, 0, width, height, BUTTON_RADIUS);
  g.stroke({ width: 1, color: THEME.colors.text.muted, alpha: 0.4 });
}

/** Get display config for a suit button: symbol character, fill color, human-readable name. */
export function suitButtonConfig(suit: Suit): { symbol: string; color: string; name: string } {
  return {
    symbol: suitSymbol(suit),
    color: suitColor(suit),
    name: SUIT_NAMES[suit],
  };
}

// ---- Component ------------------------------------------------------

export function BiddingPanelReact({
  zone,
  onSuitBid,
  onPass,
}: BiddingPanelReactProps): React.JSX.Element {
  const layout = computeBiddingLayout(zone);

  return (
    <pixiContainer label="bidding-panel">
      {ALL_SUITS.map((suit: Suit, i: number) => {
        const btnRect = layout.suitButtons[i];
        if (!btnRect) return null;
        const config = suitButtonConfig(suit);

        return (
          <pixiContainer
            key={suit}
            label={`bid-${suit}`}
            x={btnRect.x}
            y={btnRect.y}
            eventMode="static"
            cursor="pointer"
            onPointerDown={() => onSuitBid?.(suit)}
          >
            <pixiGraphics
              label="button-bg"
              draw={(g: Graphics) => {
                drawSuitButtonBg(g, btnRect.width, btnRect.height);
              }}
            />
            <pixiText
              label="button-suit"
              text={config.symbol}
              style={{
                fontFamily: THEME.typography.fontFamily,
                fontSize: THEME.indicators.suitFontSize,
                fill: config.color,
              }}
              anchor={0.5}
              x={btnRect.width / 2}
              y={btnRect.height / 2 + SUIT_SYMBOL_OFFSET_Y}
            />
            <pixiText
              label="button-name"
              text={config.name}
              style={{
                fontFamily: THEME.typography.fontFamily,
                fontSize: THEME.typography.label.minSize,
                fill: THEME.colors.text.light,
              }}
              anchor={0.5}
              x={btnRect.width / 2}
              y={btnRect.height / 2 + SUIT_NAME_OFFSET_Y}
            />
          </pixiContainer>
        );
      })}
      <pixiContainer
        label="bid-pass"
        x={layout.passButton.x}
        y={layout.passButton.y}
        eventMode="static"
        cursor="pointer"
        onPointerDown={() => onPass?.()}
      >
        <pixiGraphics
          label="button-bg"
          draw={(g: Graphics) => {
            drawPassButtonBg(g, layout.passButton.width, layout.passButton.height);
          }}
        />
        <pixiText
          label="button-text"
          text="Pass"
          style={{
            fontFamily: THEME.typography.fontFamily,
            fontSize: THEME.typography.heading.minSize,
            fill: THEME.colors.text.light,
          }}
          anchor={0.5}
          x={layout.passButton.width / 2}
          y={layout.passButton.height / 2}
        />
      </pixiContainer>
    </pixiContainer>
  );
}
