import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OnlineLobby } from "../src/components/OnlineLobby/OnlineLobby.js";
import type { OnlineLobbyState } from "../src/online/useOnlineLobby.js";

function makeLobby(overrides: Partial<OnlineLobbyState> = {}): OnlineLobbyState {
  const base: OnlineLobbyState = {
    status: "open",
    phase: "idle",
    code: null,
    seat: null,
    playerToken: null,
    players: [],
    error: null,
    queuePosition: null,
    queueSize: 0,
    createRoom: vi.fn(),
    joinRoom: vi.fn(),
    findRandom: vi.fn(),
    cancelRandom: vi.fn(),
    startGame: vi.fn(),
    disconnect: vi.fn(),
    clearSavedSession: vi.fn(),
    // We don't need the actual OnlineClient in component tests.
    client: {} as OnlineLobbyState["client"],
  };
  return { ...base, ...overrides };
}

describe("OnlineLobby", () => {
  it("renders the lobby idle form", () => {
    render(<OnlineLobby lobby={makeLobby()} onBack={vi.fn()} onGameStarted={vi.fn()} />);
    expect(screen.getByTestId("online-lobby")).toBeInTheDocument();
    expect(screen.getByTestId("nickname-input")).toBeInTheDocument();
    expect(screen.getByTestId("create-room-btn")).toBeInTheDocument();
    expect(screen.getByTestId("enter-join-btn")).toBeInTheDocument();
  });

  it("clicking Back calls onBack", async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();
    render(<OnlineLobby lobby={makeLobby()} onBack={onBack} onGameStarted={vi.fn()} />);
    await user.click(screen.getByTestId("lobby-back"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("interactive controls expose accessible labels (idle phase)", () => {
    render(<OnlineLobby lobby={makeLobby()} onBack={vi.fn()} onGameStarted={vi.fn()} />);
    expect(screen.getByTestId("lobby-back")).toHaveAttribute("aria-label", "Back to menu");
    expect(screen.getByTestId("nickname-input")).toHaveAttribute("aria-label", "Nickname");
    expect(screen.getByTestId("create-room-btn")).toHaveAttribute("aria-label", "Create a room");
    expect(screen.getByTestId("enter-join-btn")).toHaveAttribute(
      "aria-label",
      "Join an existing room",
    );
  });

  it("primary CTAs are tagged data-touch='primary'", () => {
    render(<OnlineLobby lobby={makeLobby()} onBack={vi.fn()} onGameStarted={vi.fn()} />);
    expect(screen.getByTestId("create-room-btn")).toHaveAttribute("data-touch", "primary");
    expect(screen.getByTestId("enter-join-btn")).toHaveAttribute("data-touch", "primary");
  });

  it("renders the in_room view with seat list and start button when host + full", () => {
    const lobby = makeLobby({
      phase: "in_room",
      code: "ABCD",
      seat: 0,
      players: [
        { seat: 0, nickname: "A" },
        { seat: 1, nickname: "B" },
        { seat: 2, nickname: "C" },
        { seat: 3, nickname: "D" },
      ],
    });
    render(<OnlineLobby lobby={lobby} onBack={vi.fn()} onGameStarted={vi.fn()} />);
    expect(screen.getByTestId("room-code")).toHaveTextContent("ABCD");
    expect(screen.getByTestId("start-game-btn")).not.toBeDisabled();
  });

  it("start_game button is disabled when waiting for more players", () => {
    const lobby = makeLobby({
      phase: "in_room",
      code: "ABCD",
      seat: 0,
      players: [
        { seat: 0, nickname: "A" },
        { seat: 1, nickname: "B" },
      ],
    });
    render(<OnlineLobby lobby={lobby} onBack={vi.fn()} onGameStarted={vi.fn()} />);
    expect(screen.getByTestId("start-game-btn")).toBeDisabled();
  });

  it("renders cleanly at a 320px viewport (smallest common phone width)", () => {
    Object.defineProperty(window, "innerWidth", { value: 320, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 568, configurable: true });
    render(<OnlineLobby lobby={makeLobby()} onBack={vi.fn()} onGameStarted={vi.fn()} />);
    expect(screen.getByTestId("online-lobby")).toBeInTheDocument();
  });
});
