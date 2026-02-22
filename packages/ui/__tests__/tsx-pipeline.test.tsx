import { describe, it, expect } from "vitest";
import { createElement, isValidElement } from "react";

/**
 * Proof-of-concept: validates that .tsx files compile,
 * JSX pragma resolves, and React.createElement works
 * in the Vitest environment.
 */
describe("TSX pipeline validation", () => {
  it("JSX compiles to valid React elements", () => {
    const element = <div data-testid="hello">world</div>;
    expect(isValidElement(element)).toBe(true);
    expect(element.type).toBe("div");
  });

  it("React.createElement produces valid elements", () => {
    const element = createElement("span", { className: "test" }, "content");
    expect(isValidElement(element)).toBe(true);
    expect(element.type).toBe("span");
  });

  it("functional component produces element with correct type", () => {
    function Greeting({ name }: { name: string }): React.JSX.Element {
      return <span>{name}</span>;
    }
    const element = <Greeting name="Belote" />;
    expect(isValidElement(element)).toBe(true);
    expect(element.type).toBe(Greeting);
  });
});
