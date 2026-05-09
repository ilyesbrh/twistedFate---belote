import { PlayerAvatar } from "../../components/PlayerAvatar/PlayerAvatar.js";
import type { PlayerData } from "../../data/mockGame.js";
import type { GameMessage } from "../../messages/gameMessages.js";
import type { Fixture } from "../ScreenViewer/types.js";

const SOUTH_PLAYER: PlayerData = {
  name: "ElenaP",
  level: 14,
  avatarUrl: "https://i.pravatar.cc/150?u=elenap-belote",
  isVip: true,
  isDealer: true,
  position: "south",
  cardCount: 8,
};

const NORTH_PLAYER: PlayerData = {
  name: "DilyanaBl",
  level: 18,
  avatarUrl: "https://i.pravatar.cc/150?u=dilyanab-belote",
  isVip: false,
  isDealer: false,
  position: "north",
  cardCount: 8,
};

const BID_BUBBLE: GameMessage = {
  id: "fixture-bubble-bid",
  position: "north",
  playerName: "DilyanaBl",
  text: "100 ♥",
  type: "bid",
  timestamp: 0,
};

const BELOTE_BUBBLE: GameMessage = {
  id: "fixture-bubble-belote",
  position: "north",
  playerName: "DilyanaBl",
  text: "Belote !",
  type: "contract",
  timestamp: 0,
};

export const playerAvatarFixtures: readonly Fixture[] = [
  {
    id: "player-avatar-south-large",
    title: "South seat (large)",
    group: "PlayerAvatar",
    render: () => <PlayerAvatar player={SOUTH_PLAYER} size="lg" />,
  },
  {
    id: "player-avatar-north-medium-active",
    title: "North seat — active turn (medium)",
    group: "PlayerAvatar",
    render: () => <PlayerAvatar player={NORTH_PLAYER} size="md" isActive />,
  },
  {
    id: "player-avatar-north-contract-holder",
    title: "Contract holder (medium)",
    group: "PlayerAvatar",
    render: () => <PlayerAvatar player={NORTH_PLAYER} size="md" isContractHolder />,
  },
  {
    id: "player-avatar-north-bid-bubble",
    title: "Bid thought bubble",
    group: "PlayerAvatar",
    render: () => <PlayerAvatar player={NORTH_PLAYER} size="md" bubbleMessage={BID_BUBBLE} />,
  },
  {
    id: "player-avatar-north-belote-bubble",
    title: "Belote announcement bubble",
    group: "PlayerAvatar",
    render: () => <PlayerAvatar player={NORTH_PLAYER} size="md" bubbleMessage={BELOTE_BUBBLE} />,
  },
  {
    id: "player-avatar-small",
    title: "Small (side seat)",
    group: "PlayerAvatar",
    render: () => <PlayerAvatar player={NORTH_PLAYER} size="sm" />,
  },
  {
    id: "player-avatar-contract-suit",
    title: "Contract holder — suit contract (♠ 100)",
    group: "PlayerAvatar",
    render: () => (
      <PlayerAvatar
        player={NORTH_PLAYER}
        size="md"
        isContractHolder
        contractInfo={{ suit: "spades", value: 100 }}
      />
    ),
  },
  {
    id: "player-avatar-contract-sa",
    title: "Contract holder — SA 90",
    group: "PlayerAvatar",
    render: () => (
      <PlayerAvatar
        player={NORTH_PLAYER}
        size="md"
        isContractHolder
        contractInfo={{ suit: "hearts", value: 90, contractType: "sans-atout" }}
      />
    ),
  },
  {
    id: "player-avatar-contract-ta",
    title: "Contract holder — TA 100",
    group: "PlayerAvatar",
    render: () => (
      <PlayerAvatar
        player={NORTH_PLAYER}
        size="md"
        isContractHolder
        contractInfo={{ suit: "hearts", value: 100, contractType: "tout-atout" }}
      />
    ),
  },
  {
    id: "player-avatar-contract-capot",
    title: "Contract holder — Capot ♣",
    group: "PlayerAvatar",
    render: () => (
      <PlayerAvatar
        player={NORTH_PLAYER}
        size="md"
        isContractHolder
        contractInfo={{ suit: "clubs", value: 160, isCapot: true }}
      />
    ),
  },
];
