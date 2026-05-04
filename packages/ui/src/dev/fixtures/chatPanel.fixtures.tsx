import { ChatPanel } from "../../components/ChatPanel/ChatPanel.js";
import type { GameMessage } from "../../messages/gameMessages.js";
import type { Fixture } from "../ScreenViewer/types.js";

const noop = (): void => {
  /* fixture: no-op */
};

const SAMPLE_MESSAGES: GameMessage[] = [
  {
    id: "m1",
    position: "south",
    playerName: "ElenaP",
    text: "100 ♠",
    type: "bid",
    timestamp: 1,
  },
  {
    id: "m2",
    position: "west",
    playerName: "Villy",
    text: "Pass",
    type: "bid",
    timestamp: 2,
  },
  {
    id: "m3",
    position: "north",
    playerName: "DilyanaBl",
    text: "110 ♠",
    type: "bid",
    timestamp: 3,
  },
  {
    id: "m4",
    position: "east",
    playerName: "Vane_Bane",
    text: "Pass",
    type: "bid",
    timestamp: 4,
  },
  {
    id: "m5",
    position: "north",
    playerName: "DilyanaBl",
    text: "Contract: 110 ♠",
    type: "contract",
    timestamp: 5,
  },
  {
    id: "m6",
    position: "north",
    playerName: "DilyanaBl",
    text: "Belote !",
    type: "contract",
    timestamp: 6,
  },
  {
    id: "m7",
    position: "south",
    playerName: "ElenaP",
    text: "+24",
    type: "trick_win",
    timestamp: 7,
  },
];

export const chatPanelFixtures: readonly Fixture[] = [
  {
    id: "chat-panel-empty",
    title: "Open — no messages",
    group: "ChatPanel",
    render: () => <ChatPanel isOpen onClose={noop} messages={[]} />,
  },
  {
    id: "chat-panel-conversation",
    title: "Open — full conversation",
    group: "ChatPanel",
    render: () => <ChatPanel isOpen onClose={noop} messages={SAMPLE_MESSAGES} />,
  },
];
