import { ChatButton } from "../../components/ChatButton/ChatButton.js";
import type { Fixture } from "../ScreenViewer/types.js";

const noop = (): void => {
  /* fixture: no-op */
};

export const chatButtonFixtures: readonly Fixture[] = [
  {
    id: "chat-button-no-badge",
    title: "No unread badge",
    group: "ChatButton",
    render: () => <ChatButton onClick={noop} />,
  },
  {
    id: "chat-button-badge-1",
    title: "Badge — 1 unread",
    group: "ChatButton",
    render: () => <ChatButton onClick={noop} unreadCount={1} />,
  },
  {
    id: "chat-button-badge-9",
    title: "Badge — 9 unread",
    group: "ChatButton",
    render: () => <ChatButton onClick={noop} unreadCount={9} />,
  },
  {
    id: "chat-button-badge-99",
    title: "Badge — 99 unread (clamped to 9+)",
    group: "ChatButton",
    render: () => <ChatButton onClick={noop} unreadCount={99} />,
  },
];
