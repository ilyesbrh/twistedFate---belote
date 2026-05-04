import { GameTableView } from "../../components/GameTable/GameTable.js";
import {
  buildBiddingMidAuctionState,
  buildBiddingState,
  buildPlayingBeloteState,
  buildPlayingEndOfTrickState,
  buildPlayingHumanTurnState,
  buildPlayingMidTrickState,
} from "./state-builders.js";
import type { Fixture } from "../ScreenViewer/types.js";

const noop = (): void => {
  /* fixture: no-op */
};

export const gameTableViewFixtures: readonly Fixture[] = [
  {
    id: "game-table-bidding-south",
    title: "Bidding — south (your) turn",
    group: "GameTableView",
    render: () => <GameTableView state={buildBiddingState("south")} onPlayAgain={noop} />,
  },
  {
    id: "game-table-bidding-west",
    title: "Bidding — west turn",
    group: "GameTableView",
    render: () => <GameTableView state={buildBiddingState("west")} onPlayAgain={noop} />,
  },
  {
    id: "game-table-bidding-north",
    title: "Bidding — north turn",
    group: "GameTableView",
    render: () => <GameTableView state={buildBiddingState("north")} onPlayAgain={noop} />,
  },
  {
    id: "game-table-bidding-east",
    title: "Bidding — east turn",
    group: "GameTableView",
    render: () => <GameTableView state={buildBiddingState("east")} onPlayAgain={noop} />,
  },
  {
    id: "game-table-bidding-mid-auction",
    title: "Bidding — mid-auction (1 bid + 1 pass)",
    group: "GameTableView",
    render: () => <GameTableView state={buildBiddingMidAuctionState()} onPlayAgain={noop} />,
  },
  {
    id: "game-table-playing-mid-trick",
    title: "Playing — mid-trick (2 cards down)",
    group: "GameTableView",
    render: () => <GameTableView state={buildPlayingMidTrickState()} onPlayAgain={noop} />,
  },
  {
    id: "game-table-playing-end-of-trick",
    title: "Playing — end-of-trick (4 cards, winner highlighted)",
    group: "GameTableView",
    render: () => <GameTableView state={buildPlayingEndOfTrickState()} onPlayAgain={noop} />,
  },
  {
    id: "game-table-playing-human-turn",
    title: "Playing — your turn (legal cards highlighted)",
    group: "GameTableView",
    render: () => <GameTableView state={buildPlayingHumanTurnState()} onPlayAgain={noop} />,
  },
  {
    id: "game-table-playing-belote",
    title: "Playing — belote announcement",
    group: "GameTableView",
    render: () => <GameTableView state={buildPlayingBeloteState()} onPlayAgain={noop} />,
  },
];
