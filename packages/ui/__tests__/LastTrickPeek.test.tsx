import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LastTrickPeek } from "../src/components/LastTrickPeek/LastTrickPeek.js";
import type { TrickCardData } from "../src/data/mockGame.js";

const MOCK_TRICK: readonly TrickCardData[] = [
  { suit: "spades", rank: "10", position: "south", rotation: 0, offsetX: 0, offsetY: 40 },
  { suit: "hearts", rank: "queen", position: "west", rotation: 0, offsetX: -40, offsetY: 0 },
  { suit: "diamonds", rank: "jack", position: "north", rotation: 0, offsetX: 0, offsetY: -40 },
  { suit: "clubs", rank: "ace", position: "east", rotation: 0, offsetX: 40, offsetY: 0 },
];

describe("LastTrickPeek", () => {
  it("renders 4 cards", () => {
    render(
      <LastTrickPeek
        cards={MOCK_TRICK}
        winnerPosition="south"
        winnerName="Imed"
        onClose={() => undefined}
      />,
    );
    const cards = screen.getAllByRole("img", { hidden: true });
    expect(cards.length).toBeGreaterThanOrEqual(4);
  });

  it("renders the winner name in the heading", () => {
    render(
      <LastTrickPeek
        cards={MOCK_TRICK}
        winnerPosition="south"
        winnerName="Imed"
        onClose={() => undefined}
      />,
    );
    expect(screen.getByText(/Imed/)).not.toBeNull();
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <LastTrickPeek
        cards={MOCK_TRICK}
        winnerPosition="south"
        winnerName="Imed"
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the backdrop is clicked", () => {
    const onClose = vi.fn();
    render(
      <LastTrickPeek
        cards={MOCK_TRICK}
        winnerPosition="south"
        winnerName="Imed"
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByTestId("last-trick-backdrop"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("has role='dialog' and aria-label='Last trick'", () => {
    render(
      <LastTrickPeek
        cards={MOCK_TRICK}
        winnerPosition="south"
        winnerName="Imed"
        onClose={() => undefined}
      />,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-label")).toBe("Last trick");
  });

  it("clicking inside the panel does not call onClose", () => {
    const onClose = vi.fn();
    render(
      <LastTrickPeek
        cards={MOCK_TRICK}
        winnerPosition="south"
        winnerName="Imed"
        onClose={onClose}
      />,
    );
    const dialog = screen.getByRole("dialog");
    fireEvent.click(dialog);
    expect(onClose).not.toHaveBeenCalled();
  });
});
