import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GameOver, type GameOverMode } from "../src/components/GameOver/GameOver.js";
import type { RoundHistoryEntry } from "../src/hooks/useGameSession.js";

interface RenderOptions {
  winnerTeamIndex?: 0 | 1;
  nsTotal?: number;
  ewTotal?: number;
  targetScore?: number;
  mode?: GameOverMode;
  roundHistory?: readonly RoundHistoryEntry[];
}

function renderGameOver(opts: RenderOptions = {}) {
  const props = {
    winnerTeamIndex: opts.winnerTeamIndex ?? 0,
    nsTotal: opts.nsTotal ?? 520,
    ewTotal: opts.ewTotal ?? 380,
    targetScore: opts.targetScore ?? 501,
    mode: opts.mode ?? ({ kind: "ai", gameVariant: "belote" } as const),
    roundHistory: opts.roundHistory,
    onPlayAgain: vi.fn(),
    onBackToMenu: vi.fn(),
    onFindNewOpponents: vi.fn(),
  };
  const rendered = render(<GameOver {...props} />);
  return {
    ...rendered,
    onPlayAgain: props.onPlayAgain,
    onBackToMenu: props.onBackToMenu,
    onFindNewOpponents: props.onFindNewOpponents,
  };
}

function makeHistoryEntry(over: Partial<RoundHistoryEntry> = {}): RoundHistoryEntry {
  return {
    roundNumber: 1,
    bidderName: "South",
    contract: {
      id: "c1",
      suit: "hearts",
      value: 90,
      bidderPosition: 0,
      coincheLevel: 1,
    },
    roundScore: {
      contractingTeamPoints: 100,
      opponentTeamPoints: 62,
      contractingTeamRoundedPoints: 100,
      opponentTeamRoundedPoints: 60,
      contractMet: true,
      contractingTeamScore: 100,
      opponentTeamScore: 62,
      beloteBonusTeam: null,
      contractingTeamFinalScore: 100,
      opponentTeamFinalScore: 62,
    },
    nsCumulative: 100,
    ewCumulative: 62,
    ...over,
  };
}

describe("GameOver", () => {
  describe("game over label", () => {
    it("shows GAME OVER text", () => {
      renderGameOver();
      expect(screen.getByText("GAME OVER")).toBeInTheDocument();
    });
  });

  describe("winner announcement — NS wins", () => {
    it("shows NS WINS when NS team wins", () => {
      renderGameOver({ winnerTeamIndex: 0 });
      expect(screen.getByText("NS WINS!")).toBeInTheDocument();
    });

    it("shows the gold trophy when you win (NS)", () => {
      renderGameOver({ winnerTeamIndex: 0 });
      expect(screen.getByText("🏆")).toBeInTheDocument();
    });

    it('shows "You won this game!" message', () => {
      renderGameOver({ winnerTeamIndex: 0 });
      expect(screen.getByText("You won this game!")).toBeInTheDocument();
    });

    it("shows NS player names", () => {
      renderGameOver({ winnerTeamIndex: 0 });
      expect(screen.getByText("ElenaP & DilyanaBl")).toBeInTheDocument();
    });
  });

  describe("winner announcement — EW wins", () => {
    it("shows EW WINS when EW team wins", () => {
      renderGameOver({ winnerTeamIndex: 1 });
      expect(screen.getByText("EW WINS!")).toBeInTheDocument();
    });

    it("shows the silver trophy when you lose", () => {
      renderGameOver({ winnerTeamIndex: 1 });
      expect(screen.getByText("🥈")).toBeInTheDocument();
    });

    it('shows "Better luck next time!" message', () => {
      renderGameOver({ winnerTeamIndex: 1 });
      expect(screen.getByText("Better luck next time!")).toBeInTheDocument();
    });

    it("shows EW player names", () => {
      renderGameOver({ winnerTeamIndex: 1 });
      expect(screen.getByText("Villy & Vane_Bane")).toBeInTheDocument();
    });
  });

  describe("score bars", () => {
    it("shows NS (You) label", () => {
      renderGameOver();
      expect(screen.getByText("NS (You)")).toBeInTheDocument();
    });

    it("shows EW label", () => {
      renderGameOver();
      expect(screen.getByText("EW")).toBeInTheDocument();
    });

    it("displays NS total score", () => {
      renderGameOver({ nsTotal: 520 });
      expect(screen.getByText("520")).toBeInTheDocument();
    });

    it("displays EW total score", () => {
      renderGameOver({ ewTotal: 380 });
      expect(screen.getByText("380")).toBeInTheDocument();
    });

    it("shows target score goal", () => {
      renderGameOver({ targetScore: 501 });
      expect(screen.getByText(/Goal: 501 pts/)).toBeInTheDocument();
    });

    it("shows checkmark for the winning score", () => {
      renderGameOver({ winnerTeamIndex: 0, nsTotal: 520, targetScore: 501 });
      expect(screen.getByText("✓")).toBeInTheDocument();
    });

    it("does not show checkmark for the losing score", () => {
      renderGameOver({ winnerTeamIndex: 0, nsTotal: 520, ewTotal: 380, targetScore: 501 });
      // Only one checkmark (for NS who reached target)
      const checks = screen.getAllByText("✓");
      expect(checks).toHaveLength(1);
    });
  });

  describe("play again button", () => {
    it("renders PLAY AGAIN button", () => {
      renderGameOver();
      expect(screen.getByRole("button", { name: /play again/i })).toBeInTheDocument();
    });

    it("calls onPlayAgain when clicked", async () => {
      const user = userEvent.setup();
      const { onPlayAgain } = renderGameOver();

      await user.click(screen.getByRole("button", { name: /play again/i }));
      expect(onPlayAgain).toHaveBeenCalledTimes(1);
    });

    it("is marked as a primary touch target", () => {
      renderGameOver();
      expect(screen.getByRole("button", { name: /play again/i })).toHaveAttribute(
        "data-touch",
        "primary",
      );
    });
  });

  describe("accessibility", () => {
    it("has dialog role with aria-modal", () => {
      renderGameOver();
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
    });
  });

  describe("mode-aware CTAs", () => {
    it("AI mode renders PLAY AGAIN + Back to Menu, no Find Opponents", () => {
      renderGameOver({ mode: { kind: "ai", gameVariant: "belote" } });
      expect(screen.getByRole("button", { name: /play again/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /back to menu/i })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /find new opponents/i })).toBeNull();
    });

    it("AI mode: Back to Menu fires onBackToMenu", async () => {
      const user = userEvent.setup();
      const { onBackToMenu } = renderGameOver({ mode: { kind: "ai", gameVariant: "belote" } });
      await user.click(screen.getByRole("button", { name: /back to menu/i }));
      expect(onBackToMenu).toHaveBeenCalledTimes(1);
    });

    it("online-friends renders LEAVE ROOM + Back to Menu", () => {
      renderGameOver({ mode: { kind: "online-friends" } });
      expect(screen.getByRole("button", { name: /leave room/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /back to menu/i })).toBeInTheDocument();
    });

    it("online-friends does NOT render Find Opponents", () => {
      renderGameOver({ mode: { kind: "online-friends" } });
      expect(screen.queryByRole("button", { name: /find new opponents/i })).toBeNull();
    });

    it("online-random renders FIND NEW OPPONENTS + LEAVE + Back to Menu", () => {
      renderGameOver({ mode: { kind: "online-random" } });
      expect(screen.getByRole("button", { name: /find new opponents/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^leave$/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /back to menu/i })).toBeInTheDocument();
    });

    it("online-random: FIND NEW OPPONENTS fires onFindNewOpponents", async () => {
      const user = userEvent.setup();
      const { onFindNewOpponents } = renderGameOver({ mode: { kind: "online-random" } });
      await user.click(screen.getByRole("button", { name: /find new opponents/i }));
      expect(onFindNewOpponents).toHaveBeenCalledTimes(1);
    });
  });

  describe("score breakdown", () => {
    it("does NOT render the breakdown toggle when roundHistory is empty/undefined", () => {
      renderGameOver();
      expect(screen.queryByRole("button", { name: /see breakdown/i })).toBeNull();
    });

    it("renders the toggle when roundHistory has entries", () => {
      renderGameOver({ roundHistory: [makeHistoryEntry()] });
      expect(screen.getByRole("button", { name: /see breakdown/i })).toBeInTheDocument();
    });

    it("clicking the toggle opens the breakdown table", async () => {
      const user = userEvent.setup();
      renderGameOver({ roundHistory: [makeHistoryEntry()] });
      expect(screen.queryByLabelText("Score breakdown")).toBeNull();
      await user.click(screen.getByRole("button", { name: /see breakdown/i }));
      expect(screen.getByLabelText("Score breakdown")).toBeInTheDocument();
    });

    it("renders one row per history entry", async () => {
      const user = userEvent.setup();
      renderGameOver({
        roundHistory: [
          makeHistoryEntry({ roundNumber: 1, nsCumulative: 100, ewCumulative: 62 }),
          makeHistoryEntry({ roundNumber: 2, nsCumulative: 230, ewCumulative: 130 }),
          makeHistoryEntry({ roundNumber: 3, nsCumulative: 350, ewCumulative: 220 }),
        ],
      });
      await user.click(screen.getByRole("button", { name: /see breakdown/i }));
      const rows = screen.getAllByRole("row");
      // header + 3 body rows
      expect(rows.length).toBeGreaterThanOrEqual(4);
    });
  });
});
