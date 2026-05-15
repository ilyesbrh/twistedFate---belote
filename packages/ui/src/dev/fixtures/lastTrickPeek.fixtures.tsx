import { LastTrickPeek } from "../../components/LastTrickPeek/LastTrickPeek.js";
import type { TrickCardData } from "../../data/mockGame.js";
import type { Fixture } from "../ScreenViewer/types.js";

const TRICK_SAMPLE: readonly TrickCardData[] = [
  { suit: "spades", rank: "ace", position: "south", rotation: 0, offsetX: 0, offsetY: 40 },
  { suit: "hearts", rank: "10", position: "west", rotation: 0, offsetX: -40, offsetY: 0 },
  { suit: "diamonds", rank: "queen", position: "north", rotation: 0, offsetX: 0, offsetY: -40 },
  { suit: "clubs", rank: "9", position: "east", rotation: 0, offsetX: 40, offsetY: 0 },
];

export const lastTrickPeekFixtures: readonly Fixture[] = [
  {
    id: "last-trick-peek-south-won",
    title: "South won the previous trick",
    group: "LastTrickPeek",
    render: () => (
      <LastTrickPeek
        cards={TRICK_SAMPLE}
        winnerPosition="south"
        winnerName="Imed"
        onClose={() => undefined}
      />
    ),
  },
  {
    id: "last-trick-peek-north-won",
    title: "North won the previous trick",
    group: "LastTrickPeek",
    render: () => (
      <LastTrickPeek
        cards={TRICK_SAMPLE}
        winnerPosition="north"
        winnerName="Sami"
        onClose={() => undefined}
      />
    ),
  },
];
