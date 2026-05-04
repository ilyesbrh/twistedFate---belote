import { ScorePanel } from "../../components/ScorePanel/ScorePanel.js";
import type { Fixture } from "../ScreenViewer/types.js";

export const scorePanelFixtures: readonly Fixture[] = [
  {
    id: "score-panel-early",
    title: "Early round (low scores)",
    group: "ScorePanel",
    render: () => (
      <ScorePanel
        target={501}
        usScore={32}
        themScore={28}
        usTotalScore={48}
        themTotalScore={62}
        trumpSuit="hearts"
        dealerName="ElenaP"
      />
    ),
  },
  {
    id: "score-panel-with-contract",
    title: "With active contract (110 ♠)",
    group: "ScorePanel",
    render: () => (
      <ScorePanel
        target={501}
        usScore={45}
        themScore={37}
        usTotalScore={148}
        themTotalScore={192}
        trumpSuit="spades"
        dealerName="DilyanaBl"
        contractValue={110}
      />
    ),
  },
  {
    id: "score-panel-contre",
    title: "Contre (×2) badge",
    group: "ScorePanel",
    render: () => (
      <ScorePanel
        target={501}
        usScore={52}
        themScore={20}
        usTotalScore={203}
        themTotalScore={148}
        trumpSuit="diamonds"
        dealerName="Villy"
        contractValue={120}
        contractCoincheLevel={2}
      />
    ),
  },
  {
    id: "score-panel-surcontre",
    title: "Surcontre (×4) badge",
    group: "ScorePanel",
    render: () => (
      <ScorePanel
        target={501}
        usScore={62}
        themScore={20}
        usTotalScore={355}
        themTotalScore={210}
        trumpSuit="clubs"
        dealerName="Vane_Bane"
        contractValue={140}
        contractCoincheLevel={4}
      />
    ),
  },
  {
    id: "score-panel-near-target",
    title: "Late game — near target",
    group: "ScorePanel",
    render: () => (
      <ScorePanel
        target={501}
        usScore={28}
        themScore={45}
        usTotalScore={478}
        themTotalScore={462}
        trumpSuit="hearts"
        dealerName="ElenaP"
        contractValue={100}
      />
    ),
  },
];
