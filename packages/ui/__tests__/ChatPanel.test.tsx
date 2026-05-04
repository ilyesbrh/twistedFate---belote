import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatPanel } from "../src/components/ChatPanel/ChatPanel.js";
import type { GameMessage } from "../src/messages/gameMessages.js";

function makeMessage(overrides: Partial<GameMessage> = {}): GameMessage {
  return {
    id: "msg-1",
    position: "south",
    playerName: "ElenaP",
    text: "Pass",
    type: "bid",
    timestamp: 1700000000000,
    ...overrides,
  };
}

function renderPanel(messages: GameMessage[] = [], isOpen = true) {
  const onClose = vi.fn();
  const result = render(<ChatPanel isOpen={isOpen} onClose={onClose} messages={messages} />);
  return { ...result, onClose };
}

describe("ChatPanel", () => {
  describe("empty state", () => {
    it("shows 'No messages yet.' when messages array is empty", () => {
      renderPanel([]);
      expect(screen.getByText("No messages yet.")).toBeInTheDocument();
    });
  });

  describe("message rendering", () => {
    it("renders message items when messages provided", () => {
      const messages = [
        makeMessage({ id: "m1", text: "Pass", playerName: "ElenaP" }),
        makeMessage({ id: "m2", text: "\u2660 80", playerName: "Villy" }),
      ];
      renderPanel(messages);
      expect(screen.getByTestId("chat-message-0")).toBeInTheDocument();
      expect(screen.getByTestId("chat-message-1")).toBeInTheDocument();
    });

    it("shows player name for each message", () => {
      const messages = [
        makeMessage({ id: "m1", playerName: "ElenaP" }),
        makeMessage({ id: "m2", playerName: "Villy" }),
      ];
      renderPanel(messages);
      expect(screen.getByText("ElenaP")).toBeInTheDocument();
      expect(screen.getByText("Villy")).toBeInTheDocument();
    });

    it("shows message text for each message", () => {
      const messages = [
        makeMessage({ id: "m1", text: "Pass" }),
        makeMessage({ id: "m2", text: "Coinche!" }),
      ];
      renderPanel(messages);
      expect(screen.getByText("Pass")).toBeInTheDocument();
      expect(screen.getByText("Coinche!")).toBeInTheDocument();
    });

    it("renders messages in order (first to last)", () => {
      const messages = [
        makeMessage({ id: "m1", text: "First" }),
        makeMessage({ id: "m2", text: "Second" }),
        makeMessage({ id: "m3", text: "Third" }),
      ];
      renderPanel(messages);
      const items = screen.getAllByTestId(/^chat-message-/);
      expect(items).toHaveLength(3);
      expect(items[0]).toHaveAttribute("data-testid", "chat-message-0");
      expect(items[2]).toHaveAttribute("data-testid", "chat-message-2");
    });

    it("hides empty placeholder when messages exist", () => {
      renderPanel([makeMessage()]);
      expect(screen.queryByText("No messages yet.")).not.toBeInTheDocument();
    });
  });

  describe("panel structure", () => {
    it("has Chat title in header", () => {
      renderPanel();
      expect(screen.getByText("Chat")).toBeInTheDocument();
    });

    it("has close button", () => {
      renderPanel();
      expect(screen.getByLabelText("Close chat")).toBeInTheDocument();
    });

    it("calls onClose when close button clicked", async () => {
      const user = userEvent.setup();
      const { onClose } = renderPanel();
      await user.click(screen.getByLabelText("Close chat"));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("close button is marked as a primary touch target", () => {
      renderPanel();
      expect(screen.getByLabelText("Close chat")).toHaveAttribute("data-touch", "primary");
    });
  });

  describe("round_cancelled messages", () => {
    it("renders round_cancelled without player name", () => {
      const messages = [
        makeMessage({ id: "m1", text: "All passed", type: "round_cancelled", playerName: "" }),
      ];
      renderPanel(messages);
      expect(screen.getByText("All passed")).toBeInTheDocument();
    });
  });
});
