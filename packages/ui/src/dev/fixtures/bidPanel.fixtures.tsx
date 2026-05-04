import { BidPanel } from "../../components/BidPanel/BidPanel.js";
import type { Bid, BidValue, BiddingRound } from "@belote/core";
import type { Fixture } from "../ScreenViewer/types.js";

const noop = (): void => {
  /* fixture: no-op */
};

const ALL_BID_VALUES: readonly BidValue[] = [80, 90, 100, 110, 120, 130, 140, 150, 160, 250];

function makeBiddingRound(over: Partial<BiddingRound> = {}): BiddingRound {
  return {
    id: "fixture-bidding-round",
    dealerPosition: 3,
    bids: [],
    currentPlayerPosition: 0,
    state: "active",
    consecutivePasses: 0,
    highestBid: null,
    coinched: false,
    surcoinched: false,
    ...over,
  };
}

const NORTH_BID_110_SPADES: Bid = {
  id: "fixture-north-bid",
  type: "suit",
  playerPosition: 2,
  value: 110,
  suit: "spades",
};

export const bidPanelFixtures: readonly Fixture[] = [
  {
    id: "bid-panel-fresh-auction",
    title: "Fresh auction (no current bid)",
    group: "BidPanel",
    render: () => (
      <BidPanel biddingRound={makeBiddingRound()} validBidValues={ALL_BID_VALUES} onBid={noop} />
    ),
  },
  {
    id: "bid-panel-raise-required",
    title: "Raise required (north bid 110 ♠)",
    group: "BidPanel",
    render: () => (
      <BidPanel
        biddingRound={makeBiddingRound({
          highestBid: NORTH_BID_110_SPADES,
          bids: [NORTH_BID_110_SPADES],
        })}
        validBidValues={ALL_BID_VALUES.filter((v) => v > 110)}
        onBid={noop}
      />
    ),
  },
  {
    id: "bid-panel-coinche-available",
    title: "Coinche available (opponent contract)",
    group: "BidPanel",
    render: () => (
      <BidPanel
        biddingRound={makeBiddingRound({
          highestBid: NORTH_BID_110_SPADES,
          bids: [NORTH_BID_110_SPADES],
          currentPlayerPosition: 1,
        })}
        validBidValues={ALL_BID_VALUES.filter((v) => v > 110)}
        onBid={noop}
      />
    ),
  },
  {
    id: "bid-panel-surcoinche-available",
    title: "Surcoinche available (own team coinched)",
    group: "BidPanel",
    render: () => (
      <BidPanel
        biddingRound={makeBiddingRound({
          highestBid: NORTH_BID_110_SPADES,
          bids: [NORTH_BID_110_SPADES],
          currentPlayerPosition: 2,
          coinched: true,
        })}
        validBidValues={[]}
        onBid={noop}
      />
    ),
  },
];
