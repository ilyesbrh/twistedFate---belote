import {
  TrickHistoryPanel,
  type TrickHistoryRecord,
} from "../../components/TrickHistoryPanel/TrickHistoryPanel.js";
import type { Fixture } from "../ScreenViewer/types.js";

const TRICK1: TrickHistoryRecord = {
  trickNumber: 1,
  cards: [
    { suit: "spades", rank: "ace", position: "south", rotation: 0, offsetX: 0, offsetY: 40 },
    { suit: "hearts", rank: "10", position: "west", rotation: 0, offsetX: -40, offsetY: 0 },
    { suit: "diamonds", rank: "queen", position: "north", rotation: 0, offsetX: 0, offsetY: -40 },
    { suit: "clubs", rank: "9", position: "east", rotation: 0, offsetX: 40, offsetY: 0 },
  ],
  winnerPosition: "south",
  winnerName: "Imed",
  points: 28,
};

const TRICK2: TrickHistoryRecord = {
  trickNumber: 2,
  cards: [
    { suit: "hearts", rank: "jack", position: "west", rotation: 0, offsetX: -40, offsetY: 0 },
    { suit: "hearts", rank: "king", position: "north", rotation: 0, offsetX: 0, offsetY: -40 },
    { suit: "hearts", rank: "7", position: "east", rotation: 0, offsetX: 40, offsetY: 0 },
    { suit: "hearts", rank: "8", position: "south", rotation: 0, offsetX: 0, offsetY: 40 },
  ],
  winnerPosition: "west",
  winnerName: "Bilal",
  points: 24,
};

const TRICK3: TrickHistoryRecord = {
  trickNumber: 3,
  cards: [
    { suit: "clubs", rank: "10", position: "south", rotation: 0, offsetX: 0, offsetY: 40 },
    { suit: "clubs", rank: "jack", position: "west", rotation: 0, offsetX: -40, offsetY: 0 },
    { suit: "clubs", rank: "ace", position: "north", rotation: 0, offsetX: 0, offsetY: -40 },
    { suit: "diamonds", rank: "7", position: "east", rotation: 0, offsetX: 40, offsetY: 0 },
  ],
  winnerPosition: "north",
  winnerName: "Sami",
  points: 32,
};

export const trickHistoryPanelFixtures: readonly Fixture[] = [
  {
    id: "trick-history-three-tricks",
    title: "Three tricks (one each side wins)",
    group: "TrickHistoryPanel",
    render: () => (
      <TrickHistoryPanel tricks={[TRICK1, TRICK2, TRICK3]} open onClose={() => undefined} />
    ),
  },
  {
    id: "trick-history-empty-closed",
    title: "Closed (open=false) — renders nothing",
    group: "TrickHistoryPanel",
    render: () => <TrickHistoryPanel tricks={[TRICK1]} open={false} onClose={() => undefined} />,
  },
];
