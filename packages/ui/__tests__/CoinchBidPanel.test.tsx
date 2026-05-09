/**
 * Iteration 055 — CoinchBidPanel capot tab tests.
 * Written RED before implementation.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CoinchBidPanel } from "../src/components/CoinchBidPanel/CoinchBidPanel.js";
import type { BiddingRound, BidValue } from "@belote/core";

const VALID_VALUES: readonly BidValue[] = [90, 100, 110, 120] as never;

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

describe("CoinchBidPanel — capot tab", () => {
  it("renders a Capot tab button", () => {
    render(
      <CoinchBidPanel
        biddingRound={makeBiddingRound()}
        validBidValues={VALID_VALUES}
        onBid={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /capot/i })).toBeInTheDocument();
  });

  it("selecting capot tab shows suit picker", async () => {
    const user = userEvent.setup();
    render(
      <CoinchBidPanel
        biddingRound={makeBiddingRound()}
        validBidValues={VALID_VALUES}
        onBid={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: /capot/i }));
    expect(screen.getByRole("button", { name: /pick hearts/i })).toBeInTheDocument();
  });

  it("selecting capot tab hides value picker", async () => {
    const user = userEvent.setup();
    render(
      <CoinchBidPanel
        biddingRound={makeBiddingRound()}
        validBidValues={VALID_VALUES}
        onBid={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: /capot/i }));
    expect(screen.queryByRole("button", { name: /bid 90 points/i })).not.toBeInTheDocument();
  });

  it("capot + suit fires onBid('capot', undefined, suit)", async () => {
    const user = userEvent.setup();
    const onBid = vi.fn();
    render(
      <CoinchBidPanel
        biddingRound={makeBiddingRound()}
        validBidValues={VALID_VALUES}
        onBid={onBid}
      />,
    );
    await user.click(screen.getByRole("button", { name: /capot/i }));
    await user.click(screen.getByRole("button", { name: /pick hearts/i }));
    await user.click(screen.getByRole("button", { name: /announce capot/i }));
    expect(onBid).toHaveBeenCalledWith("capot", undefined, "hearts");
  });

  it("capot bid button is disabled until a suit is chosen", async () => {
    const user = userEvent.setup();
    render(
      <CoinchBidPanel
        biddingRound={makeBiddingRound()}
        validBidValues={VALID_VALUES}
        onBid={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: /capot/i }));
    expect(screen.getByRole("button", { name: /announce capot/i })).toBeDisabled();
  });
});
