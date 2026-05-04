import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OnlineRandomScreen } from "../src/components/OnlineRandomScreen/OnlineRandomScreen.js";

describe("OnlineRandomScreen", () => {
  it("idle state: shows nickname input + Find a game button + Back", () => {
    render(
      <OnlineRandomScreen
        phase="idle"
        position={null}
        size={0}
        status="open"
        error={null}
        onFind={vi.fn()}
        onCancel={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByTestId("random-nickname-input")).toBeInTheDocument();
    expect(screen.getByTestId("random-find-btn")).toBeInTheDocument();
    expect(screen.getByTestId("random-back-btn")).toBeInTheDocument();
    expect(screen.queryByTestId("random-cancel-btn")).not.toBeInTheDocument();
  });

  it("Find button is disabled until a non-empty nickname is entered", async () => {
    const user = userEvent.setup();
    render(
      <OnlineRandomScreen
        phase="idle"
        position={null}
        size={0}
        status="open"
        error={null}
        onFind={vi.fn()}
        onCancel={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    const btn = screen.getByTestId("random-find-btn");
    expect(btn).toBeDisabled();
    await user.type(screen.getByTestId("random-nickname-input"), "Alice");
    expect(btn).not.toBeDisabled();
  });

  it("clicking Find calls onFind with the trimmed nickname", async () => {
    const user = userEvent.setup();
    const onFind = vi.fn();
    render(
      <OnlineRandomScreen
        phase="idle"
        position={null}
        size={0}
        status="open"
        error={null}
        onFind={onFind}
        onCancel={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    await user.type(screen.getByTestId("random-nickname-input"), "  Alice  ");
    await user.click(screen.getByTestId("random-find-btn"));
    expect(onFind).toHaveBeenCalledTimes(1);
    expect(onFind).toHaveBeenCalledWith("Alice");
  });

  it("Find is disabled when status is not open", () => {
    render(
      <OnlineRandomScreen
        phase="idle"
        position={null}
        size={0}
        status="connecting"
        error={null}
        onFind={vi.fn()}
        onCancel={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByTestId("random-find-btn")).toBeDisabled();
  });

  it("queued state: shows Searching with N/4 progress and a Cancel button", () => {
    render(
      <OnlineRandomScreen
        phase="queued"
        position={2}
        size={3}
        status="open"
        error={null}
        onFind={vi.fn()}
        onCancel={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByTestId("random-progress")).toHaveTextContent("3/4");
    expect(screen.getByTestId("random-cancel-btn")).toBeInTheDocument();
    expect(screen.queryByTestId("random-find-btn")).not.toBeInTheDocument();
  });

  it("clicking Cancel calls onCancel", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <OnlineRandomScreen
        phase="queued"
        position={1}
        size={1}
        status="open"
        error={null}
        onFind={vi.fn()}
        onCancel={onCancel}
        onBack={vi.fn()}
      />,
    );
    await user.click(screen.getByTestId("random-cancel-btn"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("renders the error message when one is supplied", () => {
    render(
      <OnlineRandomScreen
        phase="idle"
        position={null}
        size={0}
        status="open"
        error="ALREADY_IN_ROOM: leave the current room first"
        onFind={vi.fn()}
        onCancel={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByTestId("random-error")).toHaveTextContent(/ALREADY_IN_ROOM/);
  });

  it("clicking Back calls onBack", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(
      <OnlineRandomScreen
        phase="idle"
        position={null}
        size={0}
        status="open"
        error={null}
        onFind={vi.fn()}
        onCancel={vi.fn()}
        onBack={onBack}
      />,
    );
    await user.click(screen.getByTestId("random-back-btn"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
