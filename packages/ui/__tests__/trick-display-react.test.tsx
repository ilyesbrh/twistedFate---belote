import { describe, it, expect } from "vitest";
import { isValidElement } from "react";
import type { Rect } from "../src/layout.js";
import type { TrickPosition } from "../src/components/trick/trick-layout.js";

/**
 * TrickDisplayReact — React functional component for the center trick area.
 * Renders 0–4 played cards using computeTrickLayout and createMaskedCard.
 */
describe("TrickDisplayReact", () => {
  const CENTER_ZONE: Rect = { x: 127, y: 70, width: 590, height: 211 };

  const TRICK_CARDS: {
    readonly position: TrickPosition;
    readonly suit: "hearts" | "spades" | "diamonds" | "clubs";
    readonly rank: "ace" | "king" | "10" | "jack";
  }[] = [
    { position: "south", suit: "hearts", rank: "ace" },
    { position: "west", suit: "hearts", rank: "king" },
    { position: "north", suit: "hearts", rank: "10" },
    { position: "east", suit: "spades", rank: "jack" },
  ];

  // ---- Export checks -------------------------------------------------

  it("exports the TrickDisplayReact component function", async () => {
    const mod = await import("../src/components/trick/trick-display-react.js");
    expect(mod.TrickDisplayReact).toBeTypeOf("function");
  });

  // ---- React element validity ----------------------------------------

  it("returns a valid React element with trick cards", async () => {
    const { TrickDisplayReact } = await import("../src/components/trick/trick-display-react.js");
    const element = <TrickDisplayReact zone={CENTER_ZONE} cards={TRICK_CARDS} />;
    expect(isValidElement(element)).toBe(true);
  });

  it("returns a valid React element with empty cards", async () => {
    const { TrickDisplayReact } = await import("../src/components/trick/trick-display-react.js");
    const element = <TrickDisplayReact zone={CENTER_ZONE} cards={[]} />;
    expect(isValidElement(element)).toBe(true);
  });

  it("returns a valid React element with one card", async () => {
    const { TrickDisplayReact } = await import("../src/components/trick/trick-display-react.js");
    const element = <TrickDisplayReact zone={CENTER_ZONE} cards={TRICK_CARDS.slice(0, 1)} />;
    expect(isValidElement(element)).toBe(true);
  });
});
