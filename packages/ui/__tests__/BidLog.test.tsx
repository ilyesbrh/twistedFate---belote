import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BidLog, type LogBid, type BidLogProfile } from "../src/components/BidLog/BidLog.js";

function makeBid(over: Partial<LogBid> = {}): LogBid {
  return {
    id: `bid-${Math.random().toString(36).slice(2)}`,
    type: "pass",
    playerPosition: 0,
    value: null,
    suit: null,
    ...over,
  };
}

const PROFILES: Partial<Record<number, BidLogProfile>> = {
  0: { name: "South_Sam" },
  1: { name: "West_Walt" },
  2: { name: "North_Ned" },
  3: { name: "East_Eve" },
};

describe("BidLog", () => {
  it("renders nothing when bids is empty", () => {
    const { container } = render(<BidLog bids={[]} profiles={PROFILES} />);
    expect(container.querySelector("[role='log']")).toBeNull();
  });

  it("renders one entry per bid in order", () => {
    const bids: LogBid[] = [
      makeBid({ id: "b1", type: "pass", playerPosition: 0 }),
      makeBid({ id: "b2", type: "suit", playerPosition: 1, value: 90, suit: "spades" }),
      makeBid({ id: "b3", type: "pass", playerPosition: 2 }),
    ];
    render(<BidLog bids={bids} profiles={PROFILES} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
  });

  it("formats a pass bid", () => {
    const bids = [makeBid({ type: "pass", playerPosition: 0 })];
    render(<BidLog bids={bids} profiles={PROFILES} />);
    const item = screen.getByRole("listitem");
    expect(item.textContent).toContain("Pass");
  });

  it("formats a suit bid with glyph and value", () => {
    const bids = [makeBid({ type: "suit", playerPosition: 0, value: 110, suit: "spades" })];
    render(<BidLog bids={bids} profiles={PROFILES} />);
    const item = screen.getByRole("listitem");
    expect(item.textContent).toContain("♠");
    expect(item.textContent).toContain("110");
  });

  it("formats a sans-atout bid", () => {
    const bids = [makeBid({ type: "sans-atout", playerPosition: 0, value: 130, suit: null })];
    render(<BidLog bids={bids} profiles={PROFILES} />);
    const item = screen.getByRole("listitem");
    expect(item.textContent).toContain("SA");
    expect(item.textContent).toContain("130");
  });

  it("formats a tout-atout bid", () => {
    const bids = [makeBid({ type: "tout-atout", playerPosition: 0, value: 120, suit: null })];
    render(<BidLog bids={bids} profiles={PROFILES} />);
    const item = screen.getByRole("listitem");
    expect(item.textContent).toContain("TA");
    expect(item.textContent).toContain("120");
  });

  it("formats a capot bid with suit glyph", () => {
    const bids = [makeBid({ type: "capot", playerPosition: 0, value: 250, suit: "hearts" })];
    render(<BidLog bids={bids} profiles={PROFILES} />);
    const item = screen.getByRole("listitem");
    expect(item.textContent).toContain("Capot");
    expect(item.textContent).toContain("♥");
  });

  it("formats a coinche bid as 'Contre'", () => {
    const bids = [makeBid({ type: "coinche", playerPosition: 1 })];
    render(<BidLog bids={bids} profiles={PROFILES} />);
    const item = screen.getByRole("listitem");
    expect(item.textContent).toContain("Contre");
  });

  it("formats a surcoinche bid as 'Surcontre'", () => {
    const bids = [makeBid({ type: "surcoinche", playerPosition: 2 })];
    render(<BidLog bids={bids} profiles={PROFILES} />);
    const item = screen.getByRole("listitem");
    expect(item.textContent).toContain("Surcontre");
  });

  it("resolves player name from profiles when available", () => {
    const bids = [makeBid({ type: "pass", playerPosition: 1 })];
    render(<BidLog bids={bids} profiles={PROFILES} />);
    const item = screen.getByRole("listitem");
    expect(item.textContent).toContain("West_Walt");
  });

  it("falls back to seat label when profile missing", () => {
    const bids = [makeBid({ type: "pass", playerPosition: 3 })];
    render(<BidLog bids={bids} profiles={{}} />);
    const item = screen.getByRole("listitem");
    expect(item.textContent).toContain("East");
  });

  it("container has role='log', aria-live='polite', aria-atomic='false'", () => {
    const bids = [makeBid({ type: "pass", playerPosition: 0 })];
    render(<BidLog bids={bids} profiles={PROFILES} />);
    const log = screen.getByRole("log");
    expect(log).not.toBeNull();
    expect(log.getAttribute("aria-live")).toBe("polite");
    expect(log.getAttribute("aria-atomic")).toBe("false");
  });
});
