import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GamePickerScreen } from "../src/components/GamePickerScreen/GamePickerScreen.js";

function renderPicker(
  overrides: Partial<{
    onPickBelote: () => void;
    onPickCoinche: () => void;
  }> = {},
) {
  const props = {
    onPickBelote: vi.fn(),
    onPickCoinche: vi.fn(),
    ...overrides,
  };
  const rendered = render(<GamePickerScreen {...props} />);
  return { ...rendered, ...props };
}

describe("GamePickerScreen", () => {
  it("renders the game picker container", () => {
    renderPicker();
    expect(screen.getByTestId("game-picker-screen")).toBeInTheDocument();
  });

  it("shows a Belote option", () => {
    renderPicker();
    expect(screen.getByText("Belote")).toBeInTheDocument();
  });

  it("shows a Coinche option", () => {
    renderPicker();
    expect(screen.getByText("Coinche")).toBeInTheDocument();
  });

  it("clicking Belote calls onPickBelote", async () => {
    const user = userEvent.setup();
    const { onPickBelote } = renderPicker();
    await user.click(screen.getByTestId("pick-belote"));
    expect(onPickBelote).toHaveBeenCalledTimes(1);
  });

  it("clicking Coinche calls onPickCoinche", async () => {
    const user = userEvent.setup();
    const { onPickCoinche } = renderPicker();
    await user.click(screen.getByTestId("pick-coinche"));
    expect(onPickCoinche).toHaveBeenCalledTimes(1);
  });

  it("shows game subtitles for each option", () => {
    renderPicker();
    expect(screen.getByText(/tunisian rules/i)).toBeInTheDocument();
    expect(screen.getByText(/SA.*TA/i)).toBeInTheDocument();
  });
});
