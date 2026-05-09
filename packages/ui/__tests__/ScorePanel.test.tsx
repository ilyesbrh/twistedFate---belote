import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScorePanel } from "../src/components/ScorePanel/ScorePanel.js";

const BASE = {
  target: 501,
  usScore: 32,
  themScore: 28,
  usTotalScore: 142,
  themTotalScore: 89,
  trumpSuit: "hearts" as const,
  dealerName: "ElenaP",
};

describe("ScorePanel", () => {
  it("renders the score-panel testid", () => {
    render(<ScorePanel {...BASE} />);
    expect(screen.getByTestId("score-panel")).toBeInTheDocument();
  });

  it("displays target, both teams' totals, and the trump suit", () => {
    render(<ScorePanel {...BASE} />);
    expect(screen.getByText("501")).toBeInTheDocument();
    expect(screen.getByText("NS")).toBeInTheDocument();
    expect(screen.getByText("EW")).toBeInTheDocument();
    expect(screen.getByText("32")).toBeInTheDocument();
    expect(screen.getByText("28")).toBeInTheDocument();
    expect(screen.getByText("142")).toBeInTheDocument();
    expect(screen.getByText("89")).toBeInTheDocument();
    expect(screen.getByText("♥")).toBeInTheDocument();
  });

  it("renders the contract value when provided", () => {
    render(<ScorePanel {...BASE} contractValue={120} />);
    expect(screen.getByText("120")).toBeInTheDocument();
  });

  it("does not render a coinche badge for a normal contract", () => {
    render(<ScorePanel {...BASE} contractValue={100} contractCoincheLevel={1} />);
    expect(screen.queryByText(/CONTRE/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/SURCONTRE/i)).not.toBeInTheDocument();
  });

  it("renders a CONTRE badge for coinche level 2", () => {
    render(<ScorePanel {...BASE} contractValue={100} contractCoincheLevel={2} />);
    expect(screen.getByText(/CONTRE/)).toBeInTheDocument();
  });

  it("renders a SURCONTRE badge for coinche level 4", () => {
    render(<ScorePanel {...BASE} contractValue={100} contractCoincheLevel={4} />);
    expect(screen.getByText(/SURCONTRE/)).toBeInTheDocument();
  });

  it("renders without crashing at a 320px viewport", () => {
    Object.defineProperty(window, "innerWidth", { value: 320, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 568, configurable: true });
    render(<ScorePanel {...BASE} />);
    expect(screen.getByTestId("score-panel")).toBeInTheDocument();
  });

  describe("no contract yet (bidding phase)", () => {
    it("shows '—' when no trumpSuit and no contractType (pre-contract)", () => {
      render(
        <ScorePanel
          target={1000}
          usScore={0}
          themScore={0}
          usTotalScore={0}
          themTotalScore={0}
          dealerName="ElenaP"
        />,
      );
      expect(screen.getByText("—")).toBeInTheDocument();
      // Should NOT show a suit symbol fallback
      expect(screen.queryByText("♠")).not.toBeInTheDocument();
    });
  });

  describe("Coinche contract type display", () => {
    it("shows 'SA' instead of suit symbol for sans-atout contract", () => {
      render(<ScorePanel {...BASE} contractValue={90} contractType="sans-atout" />);
      expect(screen.getByText("SA")).toBeInTheDocument();
      expect(screen.queryByText("♥")).not.toBeInTheDocument();
    });

    it("shows 'TA' instead of suit symbol for tout-atout contract", () => {
      render(<ScorePanel {...BASE} contractValue={100} contractType="tout-atout" />);
      expect(screen.getByText("TA")).toBeInTheDocument();
      expect(screen.queryByText("♥")).not.toBeInTheDocument();
    });

    it("shows 'Cap' for a capot contract and does not show 160", () => {
      render(<ScorePanel {...BASE} contractValue={160} isCapot />);
      expect(screen.getByText("Cap")).toBeInTheDocument();
      expect(screen.queryByText("160")).not.toBeInTheDocument();
    });
  });
});
