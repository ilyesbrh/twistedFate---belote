import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OnlineRandomScreen } from "../src/components/OnlineRandomScreen/OnlineRandomScreen.js";

describe("OnlineRandomScreen", () => {
  it("idle state: shows Find a game button + Back", () => {
    render(
      <OnlineRandomScreen
        phase="idle"
        position={null}
        size={0}
        status="open"
        error={null}
        nickname="Alice"
        onFind={vi.fn()}
        onCancel={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByTestId("random-find-btn")).toBeInTheDocument();
    expect(screen.getByTestId("random-back-btn")).toBeInTheDocument();
    expect(screen.queryByTestId("random-cancel-btn")).not.toBeInTheDocument();
  });

  it("Find button is disabled when nickname is empty", () => {
    render(
      <OnlineRandomScreen
        phase="idle"
        position={null}
        size={0}
        status="open"
        error={null}
        nickname=""
        onFind={vi.fn()}
        onCancel={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByTestId("random-find-btn")).toBeDisabled();
  });

  it("Find button is enabled once a nickname is provided", () => {
    render(
      <OnlineRandomScreen
        phase="idle"
        position={null}
        size={0}
        status="open"
        error={null}
        nickname="Alice"
        onFind={vi.fn()}
        onCancel={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByTestId("random-find-btn")).not.toBeDisabled();
  });

  it("clicking Find calls onFind with the resolved nickname", async () => {
    const user = userEvent.setup();
    const onFind = vi.fn();
    render(
      <OnlineRandomScreen
        phase="idle"
        position={null}
        size={0}
        status="open"
        error={null}
        nickname="Alice"
        onFind={onFind}
        onCancel={vi.fn()}
        onBack={vi.fn()}
      />,
    );
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
        nickname="Alice"
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
        nickname="Alice"
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
        nickname="Alice"
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
        nickname="Alice"
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
        nickname="Alice"
        onFind={vi.fn()}
        onCancel={vi.fn()}
        onBack={onBack}
      />,
    );
    await user.click(screen.getByTestId("random-back-btn"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("queued progress is announced via role='status' + aria-live='polite'", () => {
    render(
      <OnlineRandomScreen
        phase="queued"
        position={2}
        size={3}
        status="open"
        error={null}
        nickname="Alice"
        onFind={vi.fn()}
        onCancel={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    const progress = screen.getByTestId("random-progress");
    expect(progress).toHaveAttribute("role", "status");
    expect(progress).toHaveAttribute("aria-live", "polite");
  });

  it("interactive controls expose accessible labels", () => {
    const { rerender } = render(
      <OnlineRandomScreen
        phase="idle"
        position={null}
        size={0}
        status="open"
        error={null}
        nickname="Alice"
        onFind={vi.fn()}
        onCancel={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByTestId("random-back-btn")).toHaveAttribute("aria-label", "Back to menu");
    expect(screen.getByTestId("random-find-btn")).toHaveAttribute(
      "aria-label",
      "Find a random game",
    );

    rerender(
      <OnlineRandomScreen
        phase="queued"
        position={1}
        size={1}
        status="open"
        error={null}
        nickname="Alice"
        onFind={vi.fn()}
        onCancel={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByTestId("random-cancel-btn")).toHaveAttribute(
      "aria-label",
      "Cancel matchmaking",
    );
  });

  it("primary CTAs are tagged data-touch='primary' for sizing", () => {
    render(
      <OnlineRandomScreen
        phase="idle"
        position={null}
        size={0}
        status="open"
        error={null}
        nickname="Alice"
        onFind={vi.fn()}
        onCancel={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByTestId("random-find-btn")).toHaveAttribute("data-touch", "primary");
  });

  // ── iteration 020: visual alignment with iteration 019 menu ───────────────

  it("wraps content in the shared MenuFelt surface", () => {
    render(
      <OnlineRandomScreen
        phase="idle"
        position={null}
        size={0}
        status="open"
        error={null}
        nickname="Alice"
        onFind={vi.fn()}
        onCancel={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByTestId("menu-felt")).toBeInTheDocument();
    expect(screen.getByTestId("menu-felt-watermarks")).toBeInTheDocument();
  });

  it("renders the queue progress as a paper-card badge when queued", () => {
    render(
      <OnlineRandomScreen
        phase="queued"
        position={2}
        size={2}
        status="open"
        error={null}
        nickname="Alice"
        onFind={vi.fn()}
        onCancel={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByTestId("random-progress-card")).toBeInTheDocument();
  });
});
