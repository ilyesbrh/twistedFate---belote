import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BidPanel } from "../src/components/BidPanel/BidPanel.js";
import type { BiddingRound, BidValue } from "@belote/core";

const VALID_VALUES: readonly BidValue[] = [80, 90, 100, 110, 120, 130, 140, 150, 160] as never;

function makeBiddingRound(overrides: Partial<BiddingRound> = {}): BiddingRound {
  return {
    bids: [],
    currentPlayerPosition: 0,
    highestBid: null,
    coinched: false,
    surcoinched: false,
    ...overrides,
  } as BiddingRound;
}

describe("BidPanel", () => {
  it("renders the bid-panel testid", () => {
    render(
      <BidPanel biddingRound={makeBiddingRound()} validBidValues={VALID_VALUES} onBid={vi.fn()} />,
    );
    expect(screen.getByTestId("bid-panel")).toBeInTheDocument();
  });

  it("renders one button per suit, each with an accessible label", () => {
    render(
      <BidPanel biddingRound={makeBiddingRound()} validBidValues={VALID_VALUES} onBid={vi.fn()} />,
    );
    for (const suit of ["spades", "hearts", "diamonds", "clubs"] as const) {
      expect(
        screen.getByRole("button", { name: new RegExp(`pick.*${suit}`, "i") }),
      ).toBeInTheDocument();
    }
  });

  it("renders one button per valid bid value, each with an accessible label", () => {
    render(
      <BidPanel
        biddingRound={makeBiddingRound()}
        validBidValues={[80, 90, 100] as never}
        onBid={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /bid 80 points/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /bid 90 points/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /bid 100 points/i })).toBeInTheDocument();
  });

  it("Pass button has an explicit aria-label", () => {
    render(
      <BidPanel biddingRound={makeBiddingRound()} validBidValues={VALID_VALUES} onBid={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: /^pass$/i })).toBeInTheDocument();
  });

  it("Pass forwards the bid via onBid('pass')", async () => {
    const user = userEvent.setup();
    const onBid = vi.fn();
    render(
      <BidPanel biddingRound={makeBiddingRound()} validBidValues={VALID_VALUES} onBid={onBid} />,
    );
    await user.click(screen.getByRole("button", { name: /^pass$/i }));
    expect(onBid).toHaveBeenCalledWith("pass");
  });

  it("primary action buttons (Pass, Bid) carry data-touch='primary'", () => {
    render(
      <BidPanel biddingRound={makeBiddingRound()} validBidValues={VALID_VALUES} onBid={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: /^pass$/i })).toHaveAttribute(
      "data-touch",
      "primary",
    );
    expect(screen.getByRole("button", { name: /place bid/i })).toHaveAttribute(
      "data-touch",
      "primary",
    );
  });

  it("after a coinche, only Pass and (for the bidding team) Surcontrer remain", () => {
    const round = makeBiddingRound({
      coinched: true,
      surcoinched: false,
      highestBid: {
        playerPosition: 0,
        type: "suit",
        value: 100,
        suit: "hearts",
      } as never,
      currentPlayerPosition: 2,
    });
    render(<BidPanel biddingRound={round} validBidValues={VALID_VALUES} onBid={vi.fn()} />);
    expect(screen.getByRole("button", { name: /^pass$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /surcontrer/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /place bid/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^contrer$/i })).not.toBeInTheDocument();
  });
});
