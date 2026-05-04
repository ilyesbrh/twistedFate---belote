import { TrumpIndicator } from "../../components/TrumpIndicator/TrumpIndicator.js";
import type { Fixture } from "../ScreenViewer/types.js";

export const trumpIndicatorFixtures: readonly Fixture[] = [
  {
    id: "trump-indicator-spades",
    title: "Spades",
    group: "TrumpIndicator",
    render: () => <TrumpIndicator suit="spades" />,
  },
  {
    id: "trump-indicator-hearts",
    title: "Hearts",
    group: "TrumpIndicator",
    render: () => <TrumpIndicator suit="hearts" />,
  },
  {
    id: "trump-indicator-diamonds",
    title: "Diamonds",
    group: "TrumpIndicator",
    render: () => <TrumpIndicator suit="diamonds" />,
  },
  {
    id: "trump-indicator-clubs",
    title: "Clubs",
    group: "TrumpIndicator",
    render: () => <TrumpIndicator suit="clubs" />,
  },
];
