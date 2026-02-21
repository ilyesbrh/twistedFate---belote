import type { StoryFn, Meta } from "@pixi/storybook-renderer";
import { Container, Graphics, Text } from "pixi.js";
import type { Suit, Rank } from "@belote/core";
import { ALL_SUITS } from "@belote/core";
import { computeLayout } from "./layout.js";
import type { Viewport, Rect } from "./layout.js";
import { THEME } from "./theme.js";
import {
  createCardFaceGraphics,
  createCardBackGraphics,
  suitSymbol,
  suitColor,
} from "./card-textures.js";
import { computeHandLayout } from "./components/hand/hand-layout.js";
import { computeOpponentLayout } from "./components/opponent-hand/opponent-layout.js";
import { computeTrickLayout } from "./components/trick/trick-layout.js";
import { computeBiddingLayout } from "./components/bidding/bidding-layout.js";

const meta: Meta = {
  title: "Integration/GameRenderer",
};

export default meta;

// ---- Mock data ------------------------------------------------------

const HAND_CARDS: readonly { suit: Suit; rank: Rank }[] = [
  { suit: "spades", rank: "7" },
  { suit: "spades", rank: "8" },
  { suit: "spades", rank: "9" },
  { suit: "hearts", rank: "jack" },
  { suit: "hearts", rank: "queen" },
  { suit: "diamonds", rank: "ace" },
  { suit: "clubs", rank: "king" },
  { suit: "clubs", rank: "10" },
];

const TRICK_CARDS: readonly {
  position: "south" | "north" | "west" | "east";
  suit: Suit;
  rank: Rank;
}[] = [
  { position: "south", suit: "hearts", rank: "ace" },
  { position: "west", suit: "hearts", rank: "king" },
  { position: "north", suit: "hearts", rank: "10" },
  { position: "east", suit: "spades", rank: "jack" },
];

// ---- Builders -------------------------------------------------------

function drawBackground(root: Container, vp: Viewport): void {
  const bg = new Graphics();
  bg.rect(0, 0, vp.width, vp.height);
  bg.fill(THEME.colors.table.bgDark);
  bg.label = "table-bg";
  root.addChild(bg);
}

function drawZoneOutlines(root: Container, layout: ReturnType<typeof computeLayout>): void {
  const zoneColors: { name: string; zone: Rect; color: number }[] = [
    { name: "TOP", zone: layout.zones.top, color: 0x1b5e20 },
    { name: "BOTTOM", zone: layout.zones.bottom, color: 0x2e7d32 },
    { name: "LEFT", zone: layout.zones.left, color: 0x388e3c },
    { name: "RIGHT", zone: layout.zones.right, color: 0x388e3c },
    { name: "CENTER", zone: layout.zones.center, color: 0x43a047 },
  ];
  for (const { zone, color } of zoneColors) {
    const g = new Graphics();
    g.rect(zone.x, zone.y, zone.width, zone.height);
    g.fill(color);
    g.label = "zone-fill";
    root.addChild(g);
  }
}

function drawHand(root: Container, zone: Rect): void {
  const layout = computeHandLayout(zone, HAND_CARDS.length);
  for (const [i, card] of HAND_CARDS.entries()) {
    const pos = layout.cards[i];
    if (!pos) continue;
    const gfx = createCardFaceGraphics(card.suit, card.rank);
    gfx.scale.set(layout.cardWidth / gfx.width, layout.cardHeight / gfx.height);
    gfx.pivot.set(gfx.width / 2, gfx.height / 2);
    gfx.x = pos.x;
    gfx.y = pos.y;
    gfx.rotation = pos.rotation;
    gfx.label = `card-${card.suit}-${card.rank}`;
    root.addChild(gfx);
  }
}

function drawOpponent(
  root: Container,
  zone: Rect,
  orientation: "horizontal" | "vertical",
  count: number,
): void {
  const layout = computeOpponentLayout(zone, count, orientation);
  for (const pos of layout.cards) {
    const gfx = createCardBackGraphics();
    gfx.scale.set(layout.cardWidth / gfx.width, layout.cardHeight / gfx.height);
    gfx.pivot.set(gfx.width / 2, gfx.height / 2);
    gfx.x = pos.x;
    gfx.y = pos.y;
    gfx.rotation = pos.rotation;
    gfx.label = "opp-card";
    root.addChild(gfx);
  }
}

function drawTrick(root: Container, zone: Rect): void {
  const layout = computeTrickLayout(zone);
  for (const tc of TRICK_CARDS) {
    const slot = layout.slots[tc.position];
    const gfx = createCardFaceGraphics(tc.suit, tc.rank);
    gfx.scale.set(layout.cardWidth / gfx.width, layout.cardHeight / gfx.height);
    gfx.pivot.set(gfx.width / 2, gfx.height / 2);
    gfx.x = slot.x;
    gfx.y = slot.y;
    gfx.rotation = slot.rotation;
    gfx.label = `trick-${tc.position}`;
    root.addChild(gfx);
  }
}

function drawPlayerInfo(
  root: Container,
  x: number,
  y: number,
  name: string,
  isActive: boolean,
  color: number,
): void {
  const circle = new Graphics();
  circle.circle(x, y, 16);
  circle.fill(color);
  circle.label = "avatar";
  root.addChild(circle);

  if (isActive) {
    const ring = new Graphics();
    ring.circle(x, y, 19);
    ring.stroke({ width: 3, color: THEME.colors.accent.gold });
    ring.label = "active-ring";
    root.addChild(ring);
  }

  const label = new Text({
    text: name,
    style: {
      fontFamily: THEME.typography.fontFamily,
      fontSize: THEME.typography.playerName.minSize,
      fontWeight: THEME.typography.playerName.fontWeight,
      fill: THEME.colors.text.light,
    },
  });
  label.anchor.set(0.5, 0);
  label.x = x;
  label.y = y + 22;
  label.label = "player-name";
  root.addChild(label);
}

function drawScorePanel(
  root: Container,
  x: number,
  y: number,
  score1: number,
  score2: number,
): void {
  const bg = new Graphics();
  bg.roundRect(x, y, 100, 50, 6);
  bg.fill(THEME.colors.ui.overlay);
  bg.label = "score-bg";
  root.addChild(bg);

  const s1 = new Text({
    text: `Us: ${String(score1)}`,
    style: {
      fontFamily: THEME.typography.fontFamily,
      fontSize: THEME.typography.label.minSize,
      fill: THEME.colors.text.light,
    },
  });
  s1.x = x + THEME.spacing.xs;
  s1.y = y + THEME.spacing.xs;
  s1.label = "score-us";
  root.addChild(s1);

  const s2 = new Text({
    text: `Them: ${String(score2)}`,
    style: {
      fontFamily: THEME.typography.fontFamily,
      fontSize: THEME.typography.label.minSize,
      fill: THEME.colors.text.muted,
    },
  });
  s2.x = x + THEME.spacing.xs;
  s2.y = y + THEME.spacing.xs + 20;
  s2.label = "score-them";
  root.addChild(s2);
}

function drawTrumpBadge(root: Container, x: number, y: number, suit: Suit): void {
  const bg = new Graphics();
  bg.roundRect(x - 16, y - 16, 32, 32, 6);
  bg.fill(THEME.colors.ui.overlayLight);
  bg.label = "trump-bg";
  root.addChild(bg);

  const sym = new Text({
    text: suitSymbol(suit),
    style: {
      fontFamily: THEME.typography.fontFamily,
      fontSize: THEME.typography.heading.minSize,
      fill: suitColor(suit),
    },
  });
  sym.anchor.set(0.5);
  sym.x = x;
  sym.y = y;
  sym.label = "trump-suit";
  root.addChild(sym);
}

function drawTurnArrow(root: Container, x: number, y: number, name: string): void {
  const arrow = new Text({
    text: `\u2192 ${name}`,
    style: {
      fontFamily: THEME.typography.fontFamily,
      fontSize: THEME.typography.label.minSize,
      fill: THEME.colors.accent.gold,
    },
  });
  arrow.anchor.set(0.5);
  arrow.x = x;
  arrow.y = y;
  arrow.label = "turn-indicator";
  root.addChild(arrow);
}

// ---- Full table builder ---------------------------------------------

function buildFullTable(viewport: Viewport): { view: Container } {
  const root = new Container();
  root.label = "game-renderer-story";

  const layout = computeLayout(viewport);
  const z = layout.zones;

  drawBackground(root, viewport);
  drawZoneOutlines(root, layout);

  // Bottom: hand fan (8 cards)
  drawHand(root, z.bottom);

  // Top: partner face-down (8 cards, horizontal)
  drawOpponent(root, z.top, "horizontal", 8);

  // Left: opponent face-down (8 cards, vertical)
  drawOpponent(root, z.left, "vertical", 8);

  // Right: opponent face-down (8 cards, vertical)
  drawOpponent(root, z.right, "vertical", 8);

  // Center: trick (all 4 played)
  drawTrick(root, z.center);

  // Player info: 4 avatars
  drawPlayerInfo(
    root,
    z.bottom.x + THEME.spacing.lg,
    z.bottom.y + THEME.spacing.lg,
    "You",
    true,
    0x2e7d32,
  );
  drawPlayerInfo(
    root,
    z.top.x + THEME.spacing.lg,
    z.top.y + THEME.spacing.lg,
    "Partner",
    false,
    0x2e7d32,
  );
  drawPlayerInfo(
    root,
    z.left.x + z.left.width / 2,
    z.left.y + THEME.spacing.lg,
    "Ali",
    false,
    0x1565c0,
  );
  drawPlayerInfo(
    root,
    z.right.x + z.right.width / 2,
    z.right.y + THEME.spacing.lg,
    "Omar",
    false,
    0x1565c0,
  );

  // Score panel (top right)
  drawScorePanel(root, z.top.x + z.top.width - 108, z.top.y + THEME.spacing.xs, 120, 80);

  // Trump badge (center zone, bottom-left)
  drawTrumpBadge(
    root,
    z.center.x + THEME.spacing.md + 16,
    z.center.y + z.center.height - THEME.spacing.md,
    "spades",
  );

  // Turn indicator (center zone, bottom-right)
  drawTurnArrow(
    root,
    z.center.x + z.center.width - THEME.spacing.xl,
    z.center.y + z.center.height - THEME.spacing.md,
    "You",
  );

  // Viewport info
  const info = new Text({
    text: `${String(viewport.width)}x${String(viewport.height)} ${layout.orientation} (${layout.breakpoint})`,
    style: {
      fontFamily: THEME.typography.fontFamily,
      fontSize: THEME.typography.label.minSize,
      fill: THEME.colors.accent.gold,
    },
  });
  info.x = THEME.spacing.xs;
  info.y = THEME.spacing.xs;
  info.label = "viewport-info";
  root.addChild(info);

  return { view: root };
}

// ---- Stories --------------------------------------------------------

/** Full table — 844x390 baseline (playing phase, all components visible). */
export const PlayingPhase: StoryFn = (): { view: Container } => {
  return buildFullTable({ width: 844, height: 390 });
};

/** Full table — portrait fallback. */
export const PortraitFallback: StoryFn = (): { view: Container } => {
  return buildFullTable({ width: 390, height: 844 });
};

/** Full table — tablet landscape. */
export const TabletLandscape: StoryFn = (): { view: Container } => {
  return buildFullTable({ width: 1024, height: 768 });
};

/** Bidding phase — suit buttons visible in bottom zone. */
export const BiddingPhase: StoryFn = (): { view: Container } => {
  const viewport: Viewport = { width: 844, height: 390 };
  const root = new Container();
  root.label = "bidding-story";

  const layout = computeLayout(viewport);
  const z = layout.zones;

  drawBackground(root, viewport);
  drawZoneOutlines(root, layout);

  // Opponents (but no hand — bidding phase)
  drawOpponent(root, z.top, "horizontal", 8);
  drawOpponent(root, z.left, "vertical", 8);
  drawOpponent(root, z.right, "vertical", 8);

  // Player info
  drawPlayerInfo(
    root,
    z.bottom.x + THEME.spacing.lg,
    z.bottom.y + THEME.spacing.lg,
    "You",
    true,
    0x2e7d32,
  );
  drawPlayerInfo(
    root,
    z.top.x + THEME.spacing.lg,
    z.top.y + THEME.spacing.lg,
    "Partner",
    false,
    0x2e7d32,
  );
  drawPlayerInfo(
    root,
    z.left.x + z.left.width / 2,
    z.left.y + THEME.spacing.lg,
    "Ali",
    false,
    0x1565c0,
  );
  drawPlayerInfo(
    root,
    z.right.x + z.right.width / 2,
    z.right.y + THEME.spacing.lg,
    "Omar",
    false,
    0x1565c0,
  );

  // Bidding buttons in bottom zone
  const biddingLayout = computeBiddingLayout(z.bottom);
  for (const [i, suit] of ALL_SUITS.entries()) {
    const btnRect = biddingLayout.suitButtons[i];
    if (!btnRect) continue;
    const btn = new Graphics();
    btn.roundRect(btnRect.x, btnRect.y, btnRect.width, btnRect.height, 6);
    btn.fill(THEME.colors.ui.overlayLight);
    btn.label = `bid-${suit}`;
    root.addChild(btn);

    const sym = new Text({
      text: suitSymbol(suit),
      style: {
        fontFamily: THEME.typography.fontFamily,
        fontSize: THEME.typography.heading.minSize,
        fill: suitColor(suit),
      },
    });
    sym.anchor.set(0.5);
    sym.x = btnRect.x + btnRect.width / 2;
    sym.y = btnRect.y + btnRect.height / 2;
    root.addChild(sym);
  }

  const passRect = biddingLayout.passButton;
  const passBg = new Graphics();
  passBg.roundRect(passRect.x, passRect.y, passRect.width, passRect.height, 6);
  passBg.fill(THEME.colors.ui.overlayLight);
  passBg.label = "bid-pass";
  root.addChild(passBg);

  const passLabel = new Text({
    text: "Pass",
    style: {
      fontFamily: THEME.typography.fontFamily,
      fontSize: THEME.typography.heading.minSize,
      fill: THEME.colors.text.muted,
    },
  });
  passLabel.anchor.set(0.5);
  passLabel.x = passRect.x + passRect.width / 2;
  passLabel.y = passRect.y + passRect.height / 2;
  root.addChild(passLabel);

  // Score panel
  drawScorePanel(root, z.top.x + z.top.width - 108, z.top.y + THEME.spacing.xs, 0, 0);

  return { view: root };
};
