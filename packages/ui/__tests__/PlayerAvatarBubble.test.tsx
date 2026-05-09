import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Theme } from "@radix-ui/themes";
import { PlayerAvatar } from "../src/components/PlayerAvatar/PlayerAvatar.js";
import type { PlayerData } from "../src/data/mockGame.js";
import type { GameMessage } from "../src/messages/gameMessages.js";

function makePlayer(overrides: Partial<PlayerData> = {}): PlayerData {
  return {
    name: "TestPlayer",
    level: 10,
    avatarUrl: "https://example.com/avatar.png",
    isVip: false,
    isDealer: false,
    position: "south",
    cardCount: 8,
    ...overrides,
  };
}

function makeMessage(overrides: Partial<GameMessage> = {}): GameMessage {
  return {
    id: "msg-1",
    position: "south",
    playerName: "TestPlayer",
    text: "Pass",
    type: "bid",
    timestamp: Date.now(),
    ...overrides,
  };
}

function renderAvatar(player: PlayerData, bubbleMessage: GameMessage | null = null) {
  return render(
    <Theme>
      <PlayerAvatar player={player} bubbleMessage={bubbleMessage} />
    </Theme>,
  );
}

describe("PlayerAvatar — contract stamp", () => {
  it("shows suit glyph for normal suit contract", () => {
    render(
      <Theme>
        <PlayerAvatar
          player={makePlayer()}
          isContractHolder
          contractInfo={{ suit: "spades", value: 80 }}
        />
      </Theme>,
    );
    expect(screen.getByText("♠")).toBeInTheDocument();
    expect(screen.getByText("80")).toBeInTheDocument();
  });

  it("shows 'SA' for sans-atout contract", () => {
    render(
      <Theme>
        <PlayerAvatar
          player={makePlayer()}
          isContractHolder
          contractInfo={{ suit: "hearts", value: 90, contractType: "sans-atout" }}
        />
      </Theme>,
    );
    expect(screen.getByText("SA")).toBeInTheDocument();
    expect(screen.queryByText("♥")).not.toBeInTheDocument();
  });

  it("shows 'TA' for tout-atout contract", () => {
    render(
      <Theme>
        <PlayerAvatar
          player={makePlayer()}
          isContractHolder
          contractInfo={{ suit: "hearts", value: 100, contractType: "tout-atout" }}
        />
      </Theme>,
    );
    expect(screen.getByText("TA")).toBeInTheDocument();
    expect(screen.queryByText("♥")).not.toBeInTheDocument();
  });

  it("shows 'Capot' for capot contract without sentinel value 160", () => {
    render(
      <Theme>
        <PlayerAvatar
          player={makePlayer()}
          isContractHolder
          contractInfo={{ suit: "clubs", value: 160, isCapot: true }}
        />
      </Theme>,
    );
    expect(screen.getByText("Capot")).toBeInTheDocument();
    expect(screen.queryByText("160")).not.toBeInTheDocument();
  });

  it("shows generic star when isContractHolder but no contractInfo", () => {
    render(
      <Theme>
        <PlayerAvatar player={makePlayer()} isContractHolder contractInfo={null} />
      </Theme>,
    );
    expect(screen.getByText("★")).toBeInTheDocument();
  });
});

describe("PlayerAvatar — thought bubble tooltip", () => {
  it("does not render thought bubble when bubbleMessage is null", () => {
    renderAvatar(makePlayer());
    expect(screen.queryByTestId("thought-bubble")).toBeNull();
  });

  it("renders thought bubble when bubbleMessage is provided", () => {
    renderAvatar(makePlayer(), makeMessage());
    expect(screen.getByTestId("thought-bubble")).toBeInTheDocument();
  });

  it("shows message text content", () => {
    renderAvatar(makePlayer(), makeMessage({ text: "\u2660 80" }));
    expect(screen.getByText("\u2660 80")).toBeInTheDocument();
  });

  it("positions tooltip at bottom for north player", () => {
    renderAvatar(makePlayer({ position: "north" }), makeMessage());
    const bubble = screen.getByTestId("thought-bubble");
    expect(bubble.className).toContain("tooltipBottom");
  });

  it("positions tooltip at top for south player (toward center)", () => {
    renderAvatar(makePlayer({ position: "south" }), makeMessage());
    const bubble = screen.getByTestId("thought-bubble");
    expect(bubble.className).toContain("tooltipTop");
  });

  it("positions tooltip at right for west player (toward center)", () => {
    renderAvatar(makePlayer({ position: "west" }), makeMessage());
    const bubble = screen.getByTestId("thought-bubble");
    expect(bubble.className).toContain("tooltipRight");
  });

  it("positions tooltip at left for east player (toward center)", () => {
    renderAvatar(makePlayer({ position: "east" }), makeMessage());
    const bubble = screen.getByTestId("thought-bubble");
    expect(bubble.className).toContain("tooltipLeft");
  });

  it("applies bid type class", () => {
    renderAvatar(makePlayer(), makeMessage({ type: "bid" }));
    const bubble = screen.getByTestId("thought-bubble");
    expect(bubble.className).toContain("bid");
  });

  it("applies trick_win type class", () => {
    renderAvatar(makePlayer(), makeMessage({ type: "trick_win", text: "+15 pts" }));
    const bubble = screen.getByTestId("thought-bubble");
    expect(bubble.className).toContain("trickWin");
  });

  it("applies contract type class", () => {
    renderAvatar(makePlayer(), makeMessage({ type: "contract", text: "\u2665 80" }));
    const bubble = screen.getByTestId("thought-bubble");
    expect(bubble.className).toContain("contract");
  });
});
