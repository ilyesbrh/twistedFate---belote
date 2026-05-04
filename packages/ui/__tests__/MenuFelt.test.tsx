import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MenuFelt } from "../src/components/MenuFelt/MenuFelt.js";

describe("MenuFelt", () => {
  it("renders its children inside the felt root", () => {
    render(
      <MenuFelt>
        <p data-testid="child">hello</p>
      </MenuFelt>,
    );
    expect(screen.getByTestId("menu-felt")).toBeInTheDocument();
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("emits a decorative watermark layer marked aria-hidden", () => {
    render(<MenuFelt>x</MenuFelt>);
    const watermarks = screen.getByTestId("menu-felt-watermarks");
    expect(watermarks).toBeInTheDocument();
    expect(watermarks).toHaveAttribute("aria-hidden", "true");
  });
});
