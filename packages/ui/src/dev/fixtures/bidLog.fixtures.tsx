import { BidLog, type LogBid, type BidLogProfile } from "../../components/BidLog/BidLog.js";
import type { Fixture } from "../ScreenViewer/types.js";

const PROFILES: Partial<Record<number, BidLogProfile>> = {
  0: { name: "Imed" },
  1: { name: "Bilal" },
  2: { name: "Sami" },
  3: { name: "Lina" },
};

const EARLY_AUCTION: readonly LogBid[] = [
  { id: "f1", type: "pass", playerPosition: 1, value: null, suit: null },
  { id: "f2", type: "suit", playerPosition: 2, value: 90, suit: "hearts" },
];

const MID_AUCTION: readonly LogBid[] = [
  { id: "g1", type: "pass", playerPosition: 1, value: null, suit: null },
  { id: "g2", type: "suit", playerPosition: 2, value: 90, suit: "hearts" },
  { id: "g3", type: "pass", playerPosition: 3, value: null, suit: null },
  { id: "g4", type: "suit", playerPosition: 0, value: 110, suit: "spades" },
  { id: "g5", type: "coinche", playerPosition: 1, value: null, suit: null },
  { id: "g6", type: "surcoinche", playerPosition: 2, value: null, suit: null },
];

const COINCHE_BIDS: readonly LogBid[] = [
  { id: "c1", type: "pass", playerPosition: 1, value: null, suit: null },
  { id: "c2", type: "sans-atout", playerPosition: 2, value: 130, suit: null },
  { id: "c3", type: "tout-atout", playerPosition: 3, value: 140, suit: null },
  { id: "c4", type: "capot", playerPosition: 0, value: 250, suit: "spades" },
];

export const bidLogFixtures: readonly Fixture[] = [
  {
    id: "bid-log-early-auction",
    title: "Early auction (2 bids)",
    group: "BidLog",
    render: () => (
      <div style={{ width: 320, padding: 16, background: "#3a5429" }}>
        <BidLog bids={EARLY_AUCTION} profiles={PROFILES} />
      </div>
    ),
  },
  {
    id: "bid-log-mid-auction-coinche",
    title: "Mid auction with coinche + surcoinche",
    group: "BidLog",
    render: () => (
      <div style={{ width: 320, padding: 16, background: "#3a5429" }}>
        <BidLog bids={MID_AUCTION} profiles={PROFILES} />
      </div>
    ),
  },
  {
    id: "bid-log-coinche-bid-types",
    title: "Coinche-only bid types (SA, TA, Capot)",
    group: "BidLog",
    render: () => (
      <div style={{ width: 320, padding: 16, background: "#3a5429" }}>
        <BidLog bids={COINCHE_BIDS} profiles={PROFILES} />
      </div>
    ),
  },
];
