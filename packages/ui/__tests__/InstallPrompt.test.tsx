import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InstallPrompt } from "../src/components/InstallPrompt/InstallPrompt.js";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function fireBeforeInstall(): BeforeInstallPromptEvent {
  const ev = new Event("beforeinstallprompt") as BeforeInstallPromptEvent;
  ev.prompt = vi.fn(() => Promise.resolve());
  Object.defineProperty(ev, "userChoice", {
    value: Promise.resolve({ outcome: "dismissed" as const }),
    writable: false,
  });
  return ev;
}

// jsdom in this project's vitest env doesn't expose a writable localStorage
// directly on `window`; use a shim that the component can read via the global.
function installLocalStorageShim(): Map<string, string> {
  const store = new Map<string, string>();
  const ls = {
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
  };
  vi.stubGlobal("localStorage", ls);
  return store;
}

function installMatchMedia(matches: boolean): void {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({
      matches,
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }),
  );
}

describe("InstallPrompt", () => {
  beforeEach(() => {
    installLocalStorageShim();
    installMatchMedia(false);
  });

  it("does not render before the beforeinstallprompt event fires", () => {
    render(<InstallPrompt />);
    expect(screen.queryByText(/Install Belote/i)).not.toBeInTheDocument();
  });

  it("renders the banner after beforeinstallprompt with Install + dismiss buttons", () => {
    render(<InstallPrompt />);
    act(() => {
      window.dispatchEvent(fireBeforeInstall());
    });
    expect(screen.getByText(/Install Belote/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^install$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Dismiss/i })).toBeInTheDocument();
  });

  it("does not render in standalone (already-installed) mode", () => {
    installMatchMedia(true);
    render(<InstallPrompt />);
    act(() => {
      window.dispatchEvent(fireBeforeInstall());
    });
    expect(screen.queryByText(/Install Belote/i)).not.toBeInTheDocument();
  });

  it("dismissing persists the choice and hides the banner", async () => {
    const user = userEvent.setup();
    render(<InstallPrompt />);
    act(() => {
      window.dispatchEvent(fireBeforeInstall());
    });
    await user.click(screen.getByRole("button", { name: /Dismiss/i }));
    expect(screen.queryByText(/Install Belote/i)).not.toBeInTheDocument();
    expect(localStorage.getItem("belote-install-dismissed")).toBe("1");
  });

  it("does not render when previously dismissed (localStorage flag)", () => {
    localStorage.setItem("belote-install-dismissed", "1");
    render(<InstallPrompt />);
    act(() => {
      window.dispatchEvent(fireBeforeInstall());
    });
    expect(screen.queryByText(/Install Belote/i)).not.toBeInTheDocument();
  });
});
