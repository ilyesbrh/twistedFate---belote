// ====================================================================
// GameRenderer — root integration class that creates all UI components,
// places them in TableLayout zones, and updates them from GameView data.
// This is the top-level bridge between game state and PixiJS rendering.
// Verified visually in Storybook.
// ====================================================================

import { Container } from "pixi.js";
import type { Suit } from "@belote/core";
import type { Viewport, Rect, Seat } from "./layout.js";
import type { CardTextureAtlas } from "./card-textures.js";
import type { InputSource } from "./game-controller.js";
import { TableLayout } from "./components/table/table-layout.js";
import { HandDisplay } from "./components/hand/hand-display.js";
import { OpponentHand } from "./components/opponent-hand/opponent-hand.js";
import { TrickDisplay } from "./components/trick/trick-display.js";
import { PlayerInfo, teamForSeat } from "./components/player-info/player-info.js";
import { ScorePanel } from "./components/hud/score-panel.js";
import { TrumpIndicator } from "./components/hud/trump-indicator.js";
import { TurnIndicator } from "./components/hud/turn-indicator.js";
import { BiddingPanel } from "./components/bidding/bidding-panel.js";
import { THEME } from "./theme.js";
import type { GameView } from "./game-view.js";

// ---- Types ----------------------------------------------------------

export interface GameRendererConfig {
  readonly viewport: Viewport;
  readonly atlas: CardTextureAtlas;
  readonly playerNames: readonly [string, string, string, string];
}

// ---- Team colors (from THEME accents) -------------------------------

const TEAM1_COLOR = 0x2e7d32; // green — south/north team
const TEAM2_COLOR = 0x1565c0; // blue — west/east team

function teamColor(seat: Seat): number {
  return teamForSeat(seat) === "team1" ? TEAM1_COLOR : TEAM2_COLOR;
}

// ---- GameRenderer ---------------------------------------------------

export class GameRenderer implements InputSource {
  private readonly tableLayout: TableLayout;
  private readonly handDisplay: HandDisplay;
  private readonly opponents: Map<Seat, OpponentHand>;
  private readonly trickDisplay: TrickDisplay;
  private readonly playerInfos: Map<Seat, PlayerInfo>;
  private readonly scorePanel: ScorePanel;
  private readonly biddingPanel: BiddingPanel;
  private trumpIndicator: TrumpIndicator | null = null;
  private turnIndicator: TurnIndicator | null = null;
  private lastView: GameView | null = null;

  constructor(config: GameRendererConfig) {
    const { viewport, atlas, playerNames } = config;

    // Root table layout
    this.tableLayout = new TableLayout(viewport);
    const zones = this.tableLayout.getZones();
    const layout = this.tableLayout.getLayout();

    // Hand display (bottom zone)
    this.handDisplay = new HandDisplay(atlas);
    zones.bottom.addChild(this.handDisplay);

    // Opponent hands
    this.opponents = new Map<Seat, OpponentHand>();
    const northOpp = new OpponentHand(atlas, "horizontal");
    zones.top.addChild(northOpp);
    this.opponents.set("north", northOpp);

    const westOpp = new OpponentHand(atlas, "vertical");
    zones.left.addChild(westOpp);
    this.opponents.set("west", westOpp);

    const eastOpp = new OpponentHand(atlas, "vertical");
    zones.right.addChild(eastOpp);
    this.opponents.set("east", eastOpp);

    // Trick display (center zone)
    this.trickDisplay = new TrickDisplay(atlas);
    zones.center.addChild(this.trickDisplay);

    // Player info (one per seat)
    this.playerInfos = new Map<Seat, PlayerInfo>();
    const seats: Seat[] = ["south", "north", "west", "east"];
    for (const [i, seat] of seats.entries()) {
      const info = new PlayerInfo({
        name: playerNames[i] ?? "",
        seat,
        isActive: false,
        cardCount: 0,
        teamColor: teamColor(seat),
      });

      // Place in appropriate zone
      const zoneContainer = this.getZoneForSeat(seat, zones);
      info.x = THEME.spacing.md;
      info.y = THEME.spacing.md;
      zoneContainer.addChild(info);
      this.playerInfos.set(seat, info);
    }

    // Score panel (top zone, right side)
    this.scorePanel = new ScorePanel({
      team1Score: 0,
      team2Score: 0,
      team1Label: "Us",
      team2Label: "Them",
    });
    this.scorePanel.x = layout.zones.top.width - 108;
    this.scorePanel.y = THEME.spacing.xs;
    zones.top.addChild(this.scorePanel);

    // Bidding panel (bottom zone, initially hidden)
    this.biddingPanel = new BiddingPanel();
    this.biddingPanel.visible = false;
    zones.bottom.addChild(this.biddingPanel);
  }

  /** Update all components from a GameView snapshot. */
  update(view: GameView): void {
    this.lastView = view;
    const layout = this.tableLayout.getLayout();

    // Hand — use local zone rect (zone container is already positioned)
    const bottomZone = layout.zones.bottom;
    const localBottom: Rect = { x: 0, y: 0, width: bottomZone.width, height: bottomZone.height };
    this.handDisplay.update(localBottom, view.hand);

    // Opponents — unified card size across all orientations
    // Use top zone height as the basis (most constrained zone)
    const opponentCardHeight = Math.round(layout.zones.top.height * 0.85);
    for (const opp of view.opponents) {
      const oppHand = this.opponents.get(opp.seat);
      if (!oppHand) continue;
      const zone = this.getZoneRectForSeat(opp.seat, layout.zones);
      const localZone: Rect = { x: 0, y: 0, width: zone.width, height: zone.height };
      oppHand.update(localZone, opp.cardCount, opponentCardHeight);
    }

    // Trick display
    const centerZone = layout.zones.center;
    const localCenter: Rect = { x: 0, y: 0, width: centerZone.width, height: centerZone.height };
    this.trickDisplay.update(localCenter, view.trick);

    // Player info
    for (const pv of view.players) {
      const info = this.playerInfos.get(pv.seat);
      if (!info) continue;
      info.setActive(pv.isActive);
      info.setCardCount(pv.cardCount);
    }

    // Score panel — reposition on every update (handles resize)
    this.scorePanel.x = layout.zones.top.width - 108;
    this.scorePanel.y = THEME.spacing.xs;
    this.scorePanel.setScores(view.scores.team1, view.scores.team2);

    // Trump indicator
    this.updateTrumpIndicator(view.trumpSuit);

    // Turn indicator
    this.updateTurnIndicator(view);

    // Bidding panel visibility
    if (view.phase === "bidding") {
      this.biddingPanel.visible = true;
      this.biddingPanel.update(localBottom);
    } else {
      this.biddingPanel.visible = false;
    }
  }

  /** Resize the renderer to a new viewport and re-render with cached view. */
  resize(viewport: Viewport): void {
    this.tableLayout.resize(viewport);
    if (this.lastView) {
      this.update(this.lastView);
    }
  }

  /** Get the root container for adding to the stage. */
  getContainer(): Container {
    return this.tableLayout;
  }

  /** Get the bidding panel for event wiring. */
  getBiddingPanel(): BiddingPanel {
    return this.biddingPanel;
  }

  /** Get hand display for event wiring. */
  getHandDisplay(): HandDisplay {
    return this.handDisplay;
  }

  // ---- InputSource implementation -------------------------------------

  onCardTap(callback: (index: number, card: { suit: Suit; rank: string }) => void): void {
    this.handDisplay.onCardTap(callback);
  }

  onSuitBid(callback: (suit: Suit) => void): void {
    this.biddingPanel.onSuitBid(callback);
  }

  onPass(callback: () => void): void {
    this.biddingPanel.onPass(callback);
  }

  // ---- Private helpers ------------------------------------------------

  private getZoneForSeat(
    seat: Seat,
    zones: {
      top: Container;
      bottom: Container;
      left: Container;
      right: Container;
      center: Container;
    },
  ): Container {
    switch (seat) {
      case "south":
        return zones.bottom;
      case "north":
        return zones.top;
      case "west":
        return zones.left;
      case "east":
        return zones.right;
    }
  }

  private getZoneRectForSeat(
    seat: Seat,
    zones: { top: Rect; bottom: Rect; left: Rect; right: Rect; center: Rect },
  ): Rect {
    switch (seat) {
      case "south":
        return zones.bottom;
      case "north":
        return zones.top;
      case "west":
        return zones.left;
      case "east":
        return zones.right;
    }
  }

  private updateTrumpIndicator(trumpSuit: Suit | null): void {
    const zones = this.tableLayout.getZones();
    const layout = this.tableLayout.getLayout();

    if (trumpSuit) {
      if (!this.trumpIndicator) {
        this.trumpIndicator = new TrumpIndicator(trumpSuit);
        zones.center.addChild(this.trumpIndicator);
      } else {
        this.trumpIndicator.setSuit(trumpSuit);
      }
      // Position: bottom-left of center zone
      this.trumpIndicator.x = THEME.spacing.md;
      this.trumpIndicator.y = layout.zones.center.height - THEME.spacing.md;
      this.trumpIndicator.visible = true;
    } else if (this.trumpIndicator) {
      this.trumpIndicator.visible = false;
    }
  }

  private updateTurnIndicator(view: GameView): void {
    const zones = this.tableLayout.getZones();
    const layout = this.tableLayout.getLayout();

    if (view.activeSeat) {
      const activePlayer = view.players.find((p) => p.seat === view.activeSeat);
      const name = activePlayer?.name ?? "";

      if (!this.turnIndicator) {
        this.turnIndicator = new TurnIndicator(view.activeSeat, name);
        zones.center.addChild(this.turnIndicator);
      } else {
        this.turnIndicator.setTurn(view.activeSeat, name);
      }
      // Position: bottom-right of center zone
      this.turnIndicator.x = layout.zones.center.width - THEME.spacing.md;
      this.turnIndicator.y = layout.zones.center.height - THEME.spacing.md;
      this.turnIndicator.visible = true;
    } else if (this.turnIndicator) {
      this.turnIndicator.visible = false;
    }
  }
}
