import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BidWinReveal } from "../src/components/BidWinReveal/BidWinReveal.js";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("BidWinReveal", () => {
  describe("suit contract (default)", () => {
    it("shows the suit glyph for a hearts suit contract", () => {
      render(
        <BidWinReveal
          contractValue={80}
          contractSuit="hearts"
          contractCoincheLevel={1}
          winnerPosition="south"
          winnerName="ElenaP"
          onComplete={vi.fn()}
        />,
      );
      expect(screen.getByText("♥")).toBeInTheDocument();
      expect(screen.getByText("80")).toBeInTheDocument();
    });

    it("shows the suit glyph for a spades suit contract", () => {
      render(
        <BidWinReveal
          contractValue={90}
          contractSuit="spades"
          contractCoincheLevel={1}
          winnerPosition="north"
          winnerName="DilyanaBl"
          onComplete={vi.fn()}
        />,
      );
      expect(screen.getByText("♠")).toBeInTheDocument();
    });
  });

  describe("SA (sans-atout) contract", () => {
    it("shows 'SA' instead of a suit glyph", () => {
      render(
        <BidWinReveal
          contractValue={90}
          contractSuit="hearts"
          contractCoincheLevel={1}
          contractType="sans-atout"
          winnerPosition="south"
          winnerName="ElenaP"
          onComplete={vi.fn()}
        />,
      );
      expect(screen.getByText("SA")).toBeInTheDocument();
      expect(screen.queryByText("♥")).not.toBeInTheDocument();
      expect(screen.getByText("90")).toBeInTheDocument();
    });
  });

  describe("TA (tout-atout) contract", () => {
    it("shows 'TA' instead of a suit glyph", () => {
      render(
        <BidWinReveal
          contractValue={100}
          contractSuit="hearts"
          contractCoincheLevel={1}
          contractType="tout-atout"
          winnerPosition="east"
          winnerName="Vane_Bane"
          onComplete={vi.fn()}
        />,
      );
      expect(screen.getByText("TA")).toBeInTheDocument();
      expect(screen.queryByText("♥")).not.toBeInTheDocument();
    });
  });

  describe("Capot contract", () => {
    it("shows 'Capot' and the suit glyph (not 160)", () => {
      render(
        <BidWinReveal
          contractValue={160}
          contractSuit="spades"
          contractCoincheLevel={1}
          isCapot
          winnerPosition="west"
          winnerName="Villy"
          onComplete={vi.fn()}
        />,
      );
      expect(screen.getByText("Capot")).toBeInTheDocument();
      expect(screen.queryByText("160")).not.toBeInTheDocument();
      expect(screen.getByText("♠")).toBeInTheDocument();
    });
  });

  describe("coinche/surcoinche label", () => {
    it("shows 'Coinche!' when coincheLevel is 2", () => {
      render(
        <BidWinReveal
          contractValue={80}
          contractSuit="hearts"
          contractCoincheLevel={2}
          winnerPosition="south"
          winnerName="ElenaP"
          onComplete={vi.fn()}
        />,
      );
      expect(screen.getByText("Coinche!")).toBeInTheDocument();
    });

    it("shows 'Surcoinche!' when coincheLevel is 4", () => {
      render(
        <BidWinReveal
          contractValue={80}
          contractSuit="hearts"
          contractCoincheLevel={4}
          winnerPosition="south"
          winnerName="ElenaP"
          onComplete={vi.fn()}
        />,
      );
      expect(screen.getByText("Surcoinche!")).toBeInTheDocument();
    });
  });

  describe("winner label", () => {
    it("shows the winner name", () => {
      render(
        <BidWinReveal
          contractValue={80}
          contractSuit="hearts"
          contractCoincheLevel={1}
          winnerPosition="south"
          winnerName="ElenaP"
          onComplete={vi.fn()}
        />,
      );
      expect(screen.getByText("ElenaP")).toBeInTheDocument();
    });
  });

  describe("onComplete callback", () => {
    it("calls onComplete after the animation completes", () => {
      const onComplete = vi.fn();
      render(
        <BidWinReveal
          contractValue={80}
          contractSuit="hearts"
          contractCoincheLevel={1}
          winnerPosition="south"
          winnerName="ElenaP"
          onComplete={onComplete}
        />,
      );
      expect(onComplete).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1800);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });
});
