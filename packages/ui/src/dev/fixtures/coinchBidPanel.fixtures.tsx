import { CoinchBidPanel } from "../../components/CoinchBidPanel/CoinchBidPanel.js";
import type { BidValue, BiddingRound } from "@belote/core";
import type { Fixture } from "../ScreenViewer/types.js";

const noop = (): void => {
  /* fixture: no-op */
};

const ALL_BID_VALUES: readonly BidValue[] = [80, 90, 100, 110, 120, 130, 140, 150, 160, 250];

function makeBiddingRound(over: Partial<BiddingRound> = {}): BiddingRound {
  return {
    id: "fixture-br",
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

export const coinchBidPanelFixtures: readonly Fixture[] = [
  {
    id: "coinch-bid-panel-fresh",
    title: "CoinchBidPanel — fresh (all bids available)",
    group: "CoinchBidPanel",
    render: () => (
      <CoinchBidPanel
        biddingRound={makeBiddingRound()}
        validBidValues={ALL_BID_VALUES}
        onBid={noop}
      />
    ),
  },
  {
    id: "coinch-bid-panel-mid-bidding",
    title: "CoinchBidPanel — mid-bidding (coinche available)",
    group: "CoinchBidPanel",
    render: () => (
      <CoinchBidPanel
        biddingRound={makeBiddingRound({
          highestBid: {
            id: "b1",
            type: "suit",
            suit: "spades",
            value: 90,
            playerPosition: 1,
          },
        })}
        validBidValues={[100, 110, 120, 130, 140, 150, 160, 250]}
        onBid={noop}
      />
    ),
  },
];
