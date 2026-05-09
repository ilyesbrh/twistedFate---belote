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

describe("CoinchBidPanel — SA (sans-atout) tab", () => {
  it("renders a SA tab button", () => {
    render(
      <CoinchBidPanel
        biddingRound={makeBiddingRound()}
        validBidValues={VALID_VALUES}
        onBid={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /sans-atout/i })).toBeInTheDocument();
  });

  it("selecting SA tab shows a value picker but no suit picker", async () => {
    const user = userEvent.setup();
    render(
      <CoinchBidPanel
        biddingRound={makeBiddingRound()}
        validBidValues={[90, 100]}
        onBid={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: /sans-atout/i }));
    expect(screen.getByRole("button", { name: /bid 90 points/i })).toBeInTheDocument();
    // No suit picker for SA
    expect(screen.queryByRole("button", { name: /pick hearts/i })).not.toBeInTheDocument();
  });

  it("SA tab + value selection fires onBid('sans-atout', value)", async () => {
    const user = userEvent.setup();
    const onBid = vi.fn();
    render(
      <CoinchBidPanel
        biddingRound={makeBiddingRound()}
        validBidValues={[90, 100]}
        onBid={onBid}
      />,
    );
    await user.click(screen.getByRole("button", { name: /sans-atout/i }));
    await user.click(screen.getByRole("button", { name: /bid 90 points/i }));
    await user.click(screen.getByRole("button", { name: /place bid/i }));
    expect(onBid).toHaveBeenCalledWith("sans-atout", 90);
  });
});

describe("CoinchBidPanel — TA (tout-atout) tab", () => {
  it("renders a TA tab button", () => {
    render(
      <CoinchBidPanel
        biddingRound={makeBiddingRound()}
        validBidValues={VALID_VALUES}
        onBid={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /tout-atout/i })).toBeInTheDocument();
  });

  it("TA tab + value selection fires onBid('tout-atout', value)", async () => {
    const user = userEvent.setup();
    const onBid = vi.fn();
    render(
      <CoinchBidPanel
        biddingRound={makeBiddingRound()}
        validBidValues={[90, 100]}
        onBid={onBid}
      />,
    );
    await user.click(screen.getByRole("button", { name: /tout-atout/i }));
    await user.click(screen.getByRole("button", { name: /bid 100 points/i }));
    await user.click(screen.getByRole("button", { name: /place bid/i }));
    expect(onBid).toHaveBeenCalledWith("tout-atout", 100);
  });
});

describe("CoinchBidPanel — pass button", () => {
  it("shows a Pass button", () => {
    render(
      <CoinchBidPanel
        biddingRound={makeBiddingRound()}
        validBidValues={VALID_VALUES}
        onBid={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /pass/i })).toBeInTheDocument();
  });

  it("clicking Pass fires onBid('pass')", async () => {
    const user = userEvent.setup();
    const onBid = vi.fn();
    render(
      <CoinchBidPanel
        biddingRound={makeBiddingRound()}
        validBidValues={VALID_VALUES}
        onBid={onBid}
      />,
    );
    await user.click(screen.getByRole("button", { name: /pass/i }));
    expect(onBid).toHaveBeenCalledWith("pass");
  });
});

describe("CoinchBidPanel — coinche button", () => {
  it("shows Contrer button when opponent has the highest bid", () => {
    render(
      <CoinchBidPanel
        biddingRound={makeBiddingRound({
          highestBid: {
            id: "b1",
            type: "suit",
            suit: "hearts",
            value: 90,
            playerPosition: 1 as import("@belote/core").PlayerPosition,
          },
          currentPlayerPosition: 2 as import("@belote/core").PlayerPosition,
        })}
        validBidValues={[100, 110]}
        onBid={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /contrer/i })).toBeInTheDocument();
  });

  it("clicking Contrer fires onBid('coinche')", async () => {
    const user = userEvent.setup();
    const onBid = vi.fn();
    render(
      <CoinchBidPanel
        biddingRound={makeBiddingRound({
          highestBid: {
            id: "b1",
            type: "suit",
            suit: "spades",
            value: 90,
            playerPosition: 1 as import("@belote/core").PlayerPosition,
          },
          currentPlayerPosition: 2 as import("@belote/core").PlayerPosition,
        })}
        validBidValues={[100]}
        onBid={onBid}
      />,
    );
    await user.click(screen.getByRole("button", { name: /contrer/i }));
    expect(onBid).toHaveBeenCalledWith("coinche");
  });
});

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
