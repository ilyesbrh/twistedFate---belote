import { BidWinReveal } from "../../components/BidWinReveal/BidWinReveal.js";
import type { Fixture } from "../ScreenViewer/types.js";

const noop = (): void => {
  /* fixture: no-op */
};

export const bidWinRevealFixtures: readonly Fixture[] = [
  {
    id: "bid-win-reveal-suit-south",
    title: "BidWinReveal — suit contract (south wins)",
    group: "BidWinReveal",
    render: () => (
      <BidWinReveal
        contractValue={100}
        contractSuit="spades"
        contractCoincheLevel={1}
        winnerPosition="south"
        winnerName="ElenaP"
        onComplete={noop}
      />
    ),
  },
  {
    id: "bid-win-reveal-sa",
    title: "BidWinReveal — SA 90 (north wins)",
    group: "BidWinReveal",
    render: () => (
      <BidWinReveal
        contractValue={90}
        contractSuit="hearts"
        contractCoincheLevel={1}
        contractType="sans-atout"
        winnerPosition="north"
        winnerName="DilyanaBl"
        onComplete={noop}
      />
    ),
  },
  {
    id: "bid-win-reveal-ta",
    title: "BidWinReveal — TA 110 (east wins)",
    group: "BidWinReveal",
    render: () => (
      <BidWinReveal
        contractValue={110}
        contractSuit="hearts"
        contractCoincheLevel={1}
        contractType="tout-atout"
        winnerPosition="east"
        winnerName="Vane_Bane"
        onComplete={noop}
      />
    ),
  },
  {
    id: "bid-win-reveal-capot",
    title: "BidWinReveal — Capot ♣ (west wins)",
    group: "BidWinReveal",
    render: () => (
      <BidWinReveal
        contractValue={160}
        contractSuit="clubs"
        contractCoincheLevel={1}
        isCapot
        winnerPosition="west"
        winnerName="Villy"
        onComplete={noop}
      />
    ),
  },
  {
    id: "bid-win-reveal-coinche",
    title: "BidWinReveal — ×2 Coinche",
    group: "BidWinReveal",
    render: () => (
      <BidWinReveal
        contractValue={110}
        contractSuit="hearts"
        contractCoincheLevel={2}
        winnerPosition="south"
        winnerName="ElenaP"
        onComplete={noop}
      />
    ),
  },
];
