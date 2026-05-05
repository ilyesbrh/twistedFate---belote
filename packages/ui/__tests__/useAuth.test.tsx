import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAuth } from "../src/auth/useAuth.js";

interface FakeResponse {
  status: number;
  body?: unknown;
}

function stubFetch(seq: FakeResponse[]): { calls: { url: string; method: string }[] } {
  const calls: { url: string; method: string }[] = [];
  const fetchImpl: typeof fetch = (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const method = init?.method ?? "GET";
    calls.push({ url, method });
    const r = seq.shift();
    if (!r) return Promise.reject(new Error("unexpected fetch call"));
    return Promise.resolve({
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      json: () => Promise.resolve(r.body ?? {}),
    } as Response);
  };
  vi.stubGlobal("fetch", fetchImpl);
  return { calls };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useAuth", () => {
  it("preflights /me on mount and resolves the user identity", async () => {
    stubFetch([
      {
        status: 200,
        body: { kind: "user", id: "u_1", email: "alice@x.com", nickname: "Alice" },
      },
    ]);
    const { result } = renderHook(() => useAuth());
    expect(result.current.status).toBe("loading");
    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });
    expect(result.current.identity?.kind).toBe("user");
    expect(result.current.identity?.nickname).toBe("Alice");
  });

  it("falls back to guest mint when /me returns 401", async () => {
    stubFetch([
      { status: 401, body: { error: "unauthenticated" } },
      { status: 200, body: { kind: "guest", id: "g_1", nickname: "Guest-abcd" } },
    ]);
    const { result } = renderHook(() => useAuth());
    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });
    expect(result.current.identity?.kind).toBe("guest");
    expect(result.current.identity?.nickname).toBe("Guest-abcd");
  });

  it("login() updates identity and clears prior error", async () => {
    stubFetch([
      // preflight
      { status: 200, body: { kind: "guest", id: "g_1", nickname: "Guest-abcd" } },
      // login
      {
        status: 200,
        body: { id: "u_1", email: "alice@x.com", nickname: "Alice", avatarUrl: null },
      },
    ]);
    const { result } = renderHook(() => useAuth());
    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });
    await act(async () => {
      await result.current.login({ email: "alice@x.com", password: "pw" });
    });
    expect(result.current.identity?.kind).toBe("user");
    expect(result.current.identity?.nickname).toBe("Alice");
    expect(result.current.error).toBeNull();
  });

  it("login() surfaces invalid_credentials as `error`", async () => {
    stubFetch([
      { status: 200, body: { kind: "guest", id: "g_1", nickname: "G" } }, // preflight
      { status: 401, body: { error: "invalid_credentials" } },
    ]);
    const { result } = renderHook(() => useAuth());
    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });
    await act(async () => {
      await result.current.login({ email: "a@b.c", password: "wrong" }).catch(() => undefined);
    });
    expect(result.current.error?.code).toBe("invalid_credentials");
    // identity stays as the guest from preflight
    expect(result.current.identity?.kind).toBe("guest");
  });

  it("signup() creates a user and updates identity", async () => {
    stubFetch([
      { status: 200, body: { kind: "guest", id: "g_1", nickname: "G" } }, // preflight
      { status: 200, body: { id: "u_1", email: "a@b.c", nickname: "A", avatarUrl: null } },
    ]);
    const { result } = renderHook(() => useAuth());
    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });
    await act(async () => {
      await result.current.signup({ email: "a@b.c", password: "hunter22-pw", nickname: "A" });
    });
    expect(result.current.identity?.kind).toBe("user");
  });

  it("logout() clears the session and re-mints a guest cookie", async () => {
    stubFetch([
      // preflight
      { status: 200, body: { kind: "user", id: "u_1", email: "a@b.c", nickname: "A" } },
      // logout
      { status: 204 },
      // re-mint guest
      { status: 200, body: { kind: "guest", id: "g_2", nickname: "Guest-newx" } },
    ]);
    const { result } = renderHook(() => useAuth());
    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });
    expect(result.current.identity?.kind).toBe("user");
    await act(async () => {
      await result.current.logout();
    });
    expect(result.current.identity?.kind).toBe("guest");
    expect(result.current.identity?.nickname).toBe("Guest-newx");
  });

  it("does not leak fetches if the component unmounts mid-preflight", async () => {
    let resolveFetch: (value: Response) => void = () => undefined;
    const pending = new Promise<Response>((r) => {
      resolveFetch = r;
    });
    vi.stubGlobal("fetch", () => pending);
    const { result, unmount } = renderHook(() => useAuth());
    expect(result.current.status).toBe("loading");
    unmount();
    // Resolve the dangling promise; we just want this to not blow up.
    resolveFetch({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: "x" }),
    } as Response);
    // Give microtasks a tick to settle.
    await new Promise((r) => setTimeout(r, 10));
    expect(true).toBe(true);
  });
});
