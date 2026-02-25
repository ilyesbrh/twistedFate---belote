import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StartScreen } from "../src/components/StartScreen/StartScreen.js";
import type { PlayerData } from "../src/data/mockGame.js";

const PLAYERS: PlayerData[] = [
  {
    name: "ElenaP",
    level: 14,
    avatarUrl: "/a/0.png",
    isVip: true,
    isDealer: true,
    position: "south",
    cardCount: 0,
  },
  {
    name: "Villy",
    level: 17,
    avatarUrl: "/a/1.png",
    isVip: true,
    isDealer: false,
    position: "west",
    cardCount: 0,
  },
  {
    name: "DilyanaBl",
    level: 18,
    avatarUrl: "/a/2.png",
    isVip: false,
    isDealer: false,
    position: "north",
    cardCount: 0,
  },
  {
    name: "Vane_Bane",
    level: 10,
    avatarUrl: "/a/3.png",
    isVip: true,
    isDealer: false,
    position: "east",
    cardCount: 0,
  },
];

function renderStartScreen(
  overrides: Partial<{ players: PlayerData[]; targetScore: number; onPlay: () => void }> = {},
) {
  const props = {
    players: PLAYERS,
    targetScore: 501,
    onPlay: vi.fn(),
    ...overrides,
  };
  const result = render(<StartScreen {...props} />);
  return { ...result, onPlay: props.onPlay };
}

describe("StartScreen", () => {
  it("renders the hero image", () => {
    renderStartScreen();
    const img = screen.getByAltText("Belote card game");
    expect(img).toBeInTheDocument();
  });

  it("displays the target score", () => {
    renderStartScreen({ targetScore: 501 });
    expect(screen.getByText("501")).toBeInTheDocument();
    expect(screen.getByText(/first to/i)).toBeInTheDocument();
  });

  it("displays a custom target score", () => {
    renderStartScreen({ targetScore: 1001 });
    expect(screen.getByText("1001")).toBeInTheDocument();
  });

  it("renders the PLAY GAME button", () => {
    renderStartScreen();
    expect(screen.getByRole("button", { name: /play game/i })).toBeInTheDocument();
  });

  it("calls onPlay when PLAY GAME is clicked", async () => {
    const user = userEvent.setup();
    const { onPlay } = renderStartScreen();

    await user.click(screen.getByRole("button", { name: /play game/i }));
    expect(onPlay).toHaveBeenCalledTimes(1);
  });
});
