// ====================================================================
// GameRoot — React functional component that composes all child React
// components into the TableLayoutReact flexbox zones.
// Receives GameView as props and distributes data to child components.
// This is the React equivalent of the imperative GameRenderer.
// Coexists with imperative game-renderer.ts during migration.
// ====================================================================

import type { Suit } from "@belote/core";
import type { Rect, Seat } from "./layout.js";
import { computeLayout } from "./layout.js";
import { THEME } from "./theme.js";
import { teamForSeat } from "./components/player-info/player-info.js";
import type { GameView } from "./game-view.js";
import { TableLayoutReact } from "./components/table/table-layout-react.js";
import { HandDisplayReact } from "./components/hand/hand-display-react.js";
import type { HandCardReact } from "./components/hand/hand-display-react.js";
import { OpponentHandReact } from "./components/opponent-hand/opponent-hand-react.js";
import { TrickDisplayReact } from "./components/trick/trick-display-react.js";
import type { TrickCardReact } from "./components/trick/trick-display-react.js";
import { PlayerInfoReact } from "./components/player-info/player-info-react.js";
import { ScorePanelReact } from "./components/hud/score-panel-react.js";
import { TrumpIndicatorReact } from "./components/hud/trump-indicator-react.js";
import { TurnIndicatorReact } from "./components/hud/turn-indicator-react.js";
import { BiddingPanelReact } from "./components/bidding/bidding-panel-react.js";

// ---- Types ----------------------------------------------------------

export interface GameRootProps {
  width: number;
  height: number;
  view: GameView;
  onCardTap?: (index: number, card: HandCardReact) => void;
  onSuitBid?: (suit: Suit) => void;
  onPass?: () => void;
}

// ---- Extracted helpers (unit-tested) --------------------------------

/** Return the team color for a given seat from THEME. */
export function teamColor(seat: Seat): number {
  return teamForSeat(seat) === "team1" ? THEME.colors.team.team1 : THEME.colors.team.team2;
}

/** Return the {x, y} position for a player info badge within a zone. */
export function playerInfoPosition(seat: Seat, zone: Rect): { x: number; y: number } {
  const avatarHalf = THEME.avatar.size / 2;

  switch (seat) {
    case "south":
      return { x: THEME.spacing.md + avatarHalf, y: zone.height / 2 - avatarHalf };
    case "north":
      return { x: THEME.spacing.md + avatarHalf, y: zone.height / 2 };
    case "west":
      return { x: zone.width / 2, y: THEME.spacing.sm };
    case "east":
      return { x: zone.width / 2, y: THEME.spacing.sm };
  }
}

// ---- Internal helpers -----------------------------------------------

function findPlayer(view: GameView, seat: Seat): GameView["players"][number] | undefined {
  return view.players.find((p) => p.seat === seat);
}

function findOpponent(view: GameView, seat: Seat): GameView["opponents"][number] | undefined {
  return view.opponents.find((o) => o.seat === seat);
}

const SCORE_PANEL_WIDTH = 120;

// ---- Component ------------------------------------------------------

export function GameRoot({
  width,
  height,
  view,
  onCardTap,
  onSuitBid,
  onPass,
}: GameRootProps): React.JSX.Element {
  const layout = computeLayout({ width, height });
  const { zones } = layout;

  // Local zone rects (origin at 0,0 within each zone)
  const localTop: Rect = { x: 0, y: 0, width: zones.top.width, height: zones.top.height };
  const localBottom: Rect = {
    x: 0,
    y: 0,
    width: zones.bottom.width,
    height: zones.bottom.height,
  };
  const localLeft: Rect = { x: 0, y: 0, width: zones.left.width, height: zones.left.height };
  const localRight: Rect = {
    x: 0,
    y: 0,
    width: zones.right.width,
    height: zones.right.height,
  };
  const localCenter: Rect = {
    x: 0,
    y: 0,
    width: zones.center.width,
    height: zones.center.height,
  };

  // Player data
  const southPlayer = findPlayer(view, "south");
  const northPlayer = findPlayer(view, "north");
  const westPlayer = findPlayer(view, "west");
  const eastPlayer = findPlayer(view, "east");

  const westOpp = findOpponent(view, "west");
  const northOpp = findOpponent(view, "north");
  const eastOpp = findOpponent(view, "east");

  // Trick cards mapped for React component
  const trickCards: TrickCardReact[] = view.trick.map((t) => ({
    position: t.position,
    suit: t.suit,
    rank: t.rank,
  }));

  // Player info positions
  const southPos = playerInfoPosition("south", localBottom);
  const northPos = playerInfoPosition("north", localTop);
  const westPos = playerInfoPosition("west", localLeft);
  const eastPos = playerInfoPosition("east", localRight);

  return (
    <TableLayoutReact
      width={width}
      height={height}
      topContent={
        <pixiContainer label="zone-top-content">
          {/* North opponent */}
          {northOpp && (
            <OpponentHandReact
              zone={localTop}
              cardCount={northOpp.cardCount}
              orientation="horizontal"
            />
          )}
          {/* North player info */}
          {northPlayer && (
            <pixiContainer x={northPos.x} y={northPos.y}>
              <PlayerInfoReact
                name={northPlayer.name}
                seat="north"
                isActive={northPlayer.isActive}
                cardCount={northPlayer.cardCount}
                teamColor={teamColor("north")}
              />
            </pixiContainer>
          )}
          {/* Score panel — top-right */}
          <pixiContainer
            x={zones.top.width - SCORE_PANEL_WIDTH - THEME.spacing.sm}
            y={THEME.spacing.xs}
          >
            <ScorePanelReact
              team1Score={view.scores.team1}
              team2Score={view.scores.team2}
              team1Label="Us"
              team2Label="Them"
            />
          </pixiContainer>
        </pixiContainer>
      }
      leftContent={
        <pixiContainer label="zone-left-content">
          {/* West opponent */}
          {westOpp && (
            <OpponentHandReact
              zone={localLeft}
              cardCount={westOpp.cardCount}
              orientation="vertical"
            />
          )}
          {/* West player info */}
          {westPlayer && (
            <pixiContainer x={westPos.x} y={westPos.y}>
              <PlayerInfoReact
                name={westPlayer.name}
                seat="west"
                isActive={westPlayer.isActive}
                cardCount={westPlayer.cardCount}
                teamColor={teamColor("west")}
              />
            </pixiContainer>
          )}
        </pixiContainer>
      }
      centerContent={
        <pixiContainer label="zone-center-content">
          {/* Trick display */}
          <TrickDisplayReact zone={localCenter} cards={trickCards} />
          {/* Trump indicator — bottom-left of center */}
          {view.trumpSuit && (
            <pixiContainer
              x={THEME.spacing.md + THEME.indicators.badgeSize / 2}
              y={zones.center.height - THEME.spacing.md - THEME.indicators.badgeSize / 2}
            >
              <TrumpIndicatorReact suit={view.trumpSuit} />
            </pixiContainer>
          )}
          {/* Turn indicator — bottom-right of center */}
          {view.activeSeat && (
            <pixiContainer
              x={zones.center.width - THEME.spacing.md - 40}
              y={zones.center.height - THEME.spacing.md - 20}
            >
              <TurnIndicatorReact
                seat={view.activeSeat}
                playerName={findPlayer(view, view.activeSeat)?.name ?? ""}
              />
            </pixiContainer>
          )}
        </pixiContainer>
      }
      rightContent={
        <pixiContainer label="zone-right-content">
          {/* East opponent */}
          {eastOpp && (
            <OpponentHandReact
              zone={localRight}
              cardCount={eastOpp.cardCount}
              orientation="vertical"
            />
          )}
          {/* East player info */}
          {eastPlayer && (
            <pixiContainer x={eastPos.x} y={eastPos.y}>
              <PlayerInfoReact
                name={eastPlayer.name}
                seat="east"
                isActive={eastPlayer.isActive}
                cardCount={eastPlayer.cardCount}
                teamColor={teamColor("east")}
              />
            </pixiContainer>
          )}
        </pixiContainer>
      }
      bottomContent={
        <pixiContainer label="zone-bottom-content">
          {/* Human hand — hidden during bidding (bidding panel replaces it) */}
          {view.phase !== "bidding" && (
            <HandDisplayReact zone={localBottom} cards={view.hand} onCardTap={onCardTap} />
          )}
          {/* South player info */}
          {southPlayer && (
            <pixiContainer x={southPos.x} y={southPos.y}>
              <PlayerInfoReact
                name={southPlayer.name}
                seat="south"
                isActive={southPlayer.isActive}
                cardCount={southPlayer.cardCount}
                teamColor={teamColor("south")}
              />
            </pixiContainer>
          )}
          {/* Bidding panel — replaces hand during bidding phase */}
          {view.phase === "bidding" && (
            <BiddingPanelReact zone={localBottom} onSuitBid={onSuitBid} onPass={onPass} />
          )}
        </pixiContainer>
      }
    />
  );
}
