import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import App from "../src/App.js";

const originalSearch = window.location.search;

function setSearch(search: string): void {
  window.history.replaceState(null, "", `${window.location.pathname}${search}`);
}

function installLocalStorageShim(): void {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => {
      store.clear();
    },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() {
      return store.size;
    },
  });
}

function installMatchMedia(): void {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({
      matches: false,
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }),
  );
}

beforeEach(() => {
  installLocalStorageShim();
  installMatchMedia();
  setSearch("");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  setSearch(originalSearch);
});

describe("App dev-mode gate", () => {
  it("without ?screens, renders the menu (regression check)", () => {
    render(<App />);
    // ModeSelectScreen is the default landing surface.
    expect(screen.queryByTestId("screen-viewer")).not.toBeInTheDocument();
  });

  it("with ?screens and DEV true, renders the screen viewer", async () => {
    setSearch("?screens");
    render(<App />);

    // Lazy-loaded; await mount. Bump timeout — concurrent test workers can
    // be slow to import the dev module bundle.
    await waitFor(
      () => {
        expect(screen.getByTestId("screen-viewer")).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });

  it("with ?screens but DEV false, does NOT render the screen viewer (production safety)", () => {
    vi.stubEnv("DEV", "");
    setSearch("?screens");

    render(<App />);

    expect(screen.queryByTestId("screen-viewer")).not.toBeInTheDocument();
  });
});
