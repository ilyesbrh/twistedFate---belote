import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { ScreenViewer } from "../src/dev/ScreenViewer/ScreenViewer.js";
import type { Fixture } from "../src/dev/ScreenViewer/types.js";

function makeFixture(over: Partial<Fixture> & { id: string; render: () => ReactElement }): Fixture {
  return {
    title: over.title ?? `Title-${over.id}`,
    group: over.group ?? "Group",
    ...over,
  };
}

describe("ScreenViewer", () => {
  it("renders an empty-state placeholder when the fixture registry is empty", () => {
    render(<ScreenViewer fixtures={[]} />);
    expect(screen.getByTestId("screen-viewer")).toBeInTheDocument();
    expect(screen.getByTestId("screen-viewer-empty")).toBeInTheDocument();
  });

  it("renders the only fixture by default and calls its render() function", () => {
    const renderFn = vi.fn(() => <div data-testid="fixture-output">hello</div>);
    const fixtures: Fixture[] = [makeFixture({ id: "only", title: "Only one", render: renderFn })];

    render(<ScreenViewer fixtures={fixtures} />);

    expect(renderFn).toHaveBeenCalled();
    expect(screen.getByTestId("fixture-output")).toBeInTheDocument();
    // Sidebar entry exists with the fixture title
    expect(screen.getByRole("button", { name: /only one/i })).toBeInTheDocument();
  });

  it("groups fixtures by their group field and shows group headers", () => {
    const fixtures: Fixture[] = [
      makeFixture({ id: "a", title: "Alpha", group: "Menu", render: () => <span>A</span> }),
      makeFixture({ id: "b", title: "Beta", group: "Board", render: () => <span>B</span> }),
    ];

    render(<ScreenViewer fixtures={fixtures} />);

    expect(screen.getByRole("heading", { name: "Menu" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Board" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /alpha/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /beta/i })).toBeInTheDocument();
  });

  it("clicking a sidebar entry switches the active fixture", async () => {
    const user = userEvent.setup();
    const renderA = vi.fn(() => <div data-testid="out-a">A</div>);
    const renderB = vi.fn(() => <div data-testid="out-b">B</div>);
    const fixtures: Fixture[] = [
      makeFixture({ id: "a", title: "Alpha", render: renderA }),
      makeFixture({ id: "b", title: "Beta", render: renderB }),
    ];

    render(<ScreenViewer fixtures={fixtures} />);

    // Default: first fixture mounted
    expect(screen.getByTestId("out-a")).toBeInTheDocument();
    expect(screen.queryByTestId("out-b")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /beta/i }));

    expect(screen.queryByTestId("out-a")).not.toBeInTheDocument();
    expect(screen.getByTestId("out-b")).toBeInTheDocument();
  });

  it("renders a viewport picker with the documented presets", () => {
    const fixtures: Fixture[] = [makeFixture({ id: "x", render: () => <span>x</span> })];

    render(<ScreenViewer fixtures={fixtures} />);

    expect(screen.getByRole("button", { name: /fit/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /iphone se/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /iphone 12/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ipad/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /desktop/i })).toBeInTheDocument();
  });

  it("clicking a viewport preset applies its dimensions to the preview wrapper", async () => {
    const user = userEvent.setup();
    const fixtures: Fixture[] = [makeFixture({ id: "x", render: () => <span>x</span> })];

    render(<ScreenViewer fixtures={fixtures} />);

    await user.click(screen.getByRole("button", { name: /iphone 12/i }));

    const stage = screen.getByTestId("screen-viewer-stage");
    expect(stage.style.width).toBe("390px");
    expect(stage.style.height).toBe("844px");
  });

  it("shows the active fixture title in the header", async () => {
    const user = userEvent.setup();
    const fixtures: Fixture[] = [
      makeFixture({ id: "a", title: "Alpha", render: () => <span>A</span> }),
      makeFixture({ id: "b", title: "Beta", render: () => <span>B</span> }),
    ];

    render(<ScreenViewer fixtures={fixtures} />);

    const header = screen.getByTestId("screen-viewer-active-title");
    expect(header).toHaveTextContent("Alpha");

    await user.click(screen.getByRole("button", { name: /beta/i }));
    expect(header).toHaveTextContent("Beta");
  });
});
