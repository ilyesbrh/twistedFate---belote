import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  TrickHistoryPanel,
  type TrickHistoryRecord,
} from "../src/components/TrickHistoryPanel/TrickHistoryPanel.js";

function makeRecord(over: Partial<TrickHistoryRecord> = {}): TrickHistoryRecord {
  return {
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
    ...over,
  };
}

describe("TrickHistoryPanel", () => {
  it("renders nothing when open=false", () => {
    const { container } = render(
      <TrickHistoryPanel tricks={[makeRecord()]} open={false} onClose={() => undefined} />,
    );
    expect(container.querySelector("[role='dialog']")).toBeNull();
  });

  it("renders the drawer and one row per trick when open=true", () => {
    const tricks = [
      makeRecord({ trickNumber: 1 }),
      makeRecord({ trickNumber: 2, winnerName: "Sami", points: 19 }),
      makeRecord({ trickNumber: 3, winnerName: "Lina", points: 31 }),
    ];
    render(<TrickHistoryPanel tricks={tricks} open onClose={() => undefined} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /trick \d/i })).toHaveLength(3);
  });

  it("each row shows trick number, winner name, and points", () => {
    render(
      <TrickHistoryPanel
        tricks={[makeRecord({ trickNumber: 2, winnerName: "Sami", points: 19 })]}
        open
        onClose={() => undefined}
      />,
    );
    const row = screen.getByRole("button", { name: /trick 2/i });
    expect(row.textContent).toContain("Sami");
    expect(row.textContent).toContain("19");
  });

  it("clicking a row reveals 4 card images", () => {
    render(<TrickHistoryPanel tricks={[makeRecord()]} open onClose={() => undefined} />);
    expect(screen.queryAllByRole("img", { hidden: true })).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: /trick 1/i }));
    const cards = screen.getAllByRole("img", { hidden: true });
    expect(cards).toHaveLength(4);
  });

  it("clicking an expanded row collapses it again", () => {
    render(<TrickHistoryPanel tricks={[makeRecord()]} open onClose={() => undefined} />);
    const row = screen.getByRole("button", { name: /trick 1/i });
    fireEvent.click(row);
    expect(screen.getAllByRole("img", { hidden: true })).toHaveLength(4);
    fireEvent.click(row);
    expect(screen.queryAllByRole("img", { hidden: true })).toHaveLength(0);
  });

  it("close button calls onClose", () => {
    const onClose = vi.fn();
    render(<TrickHistoryPanel tricks={[makeRecord()]} open onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("backdrop click calls onClose", () => {
    const onClose = vi.fn();
    render(<TrickHistoryPanel tricks={[makeRecord()]} open onClose={onClose} />);
    fireEvent.click(screen.getByTestId("trick-history-backdrop"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("escape key calls onClose", () => {
    const onClose = vi.fn();
    render(<TrickHistoryPanel tricks={[makeRecord()]} open onClose={onClose} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("dialog has role='dialog' and aria-label='Trick history'", () => {
    render(<TrickHistoryPanel tricks={[makeRecord()]} open onClose={() => undefined} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-label")).toBe("Trick history");
  });
});
