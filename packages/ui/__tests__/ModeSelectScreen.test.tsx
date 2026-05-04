import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ModeSelectScreen } from "../src/components/ModeSelectScreen/ModeSelectScreen.js";

describe("ModeSelectScreen", () => {
  it("renders all four mode buttons", () => {
    render(<ModeSelectScreen onSelect={vi.fn()} />);
    expect(screen.getByTestId("mode-btn-ai")).toBeInTheDocument();
    expect(screen.getByTestId("mode-btn-friends")).toBeInTheDocument();
    expect(screen.getByTestId("mode-btn-random")).toBeInTheDocument();
    expect(screen.getByTestId("mode-btn-ranked")).toBeInTheDocument();
  });

  it("ai and friends buttons are enabled", () => {
    render(<ModeSelectScreen onSelect={vi.fn()} />);
    expect(screen.getByTestId("mode-btn-ai")).not.toBeDisabled();
    expect(screen.getByTestId("mode-btn-friends")).not.toBeDisabled();
  });

  it("random button is enabled (matchmaking is live in iteration 014)", () => {
    render(<ModeSelectScreen onSelect={vi.fn()} />);
    expect(screen.getByTestId("mode-btn-random")).not.toBeDisabled();
  });

  it("ranked button remains disabled (still coming soon)", () => {
    render(<ModeSelectScreen onSelect={vi.fn()} />);
    expect(screen.getByTestId("mode-btn-ranked")).toBeDisabled();
  });

  it("clicking the random button fires onSelect with 'random'", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ModeSelectScreen onSelect={onSelect} />);
    await user.click(screen.getByTestId("mode-btn-random"));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("random");
  });

  it("clicking the ranked button does not fire onSelect", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ModeSelectScreen onSelect={onSelect} />);
    await user.click(screen.getByTestId("mode-btn-ranked"));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
