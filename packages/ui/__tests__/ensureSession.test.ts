import { afterEach, describe, expect, it, vi } from "vitest";
import { ensureSession } from "../src/online/ensureSession.js";

interface FakeResponse {
  status: number;
  body: unknown;
}

function makeFetch(responses: FakeResponse[]): {
  fetch: typeof fetch;
  calls: { url: string; method: string }[];
} {
  const calls: { url: string; method: string }[] = [];
  const fetchImpl: typeof fetch = (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const method = init?.method ?? "GET";
    calls.push({ url, method });
    const r = responses.shift();
    if (!r) {
      return Promise.reject(new Error("unexpected fetch call"));
    }
    return Promise.resolve({
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      json: () => Promise.resolve(r.body),
    } as Response);
  };
  return { fetch: fetchImpl, calls };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ensureSession", () => {
  it("returns the user identity when /api/auth/me responds 200", async () => {
    const { fetch, calls } = makeFetch([
      {
        status: 200,
        body: {
          kind: "user",
          id: "u_1",
          email: "alice@example.com",
          nickname: "Alice",
          avatarUrl: null,
        },
      },
    ]);
    vi.stubGlobal("fetch", fetch);
    const identity = await ensureSession();
    expect(identity.kind).toBe("user");
    expect(identity.id).toBe("u_1");
    expect(identity.nickname).toBe("Alice");
    // /api/auth/me with credentials, no fallback call
    expect(calls.length).toBe(1);
    expect(calls[0]?.url).toContain("/api/auth/me");
    expect(calls[0]?.method).toBe("GET");
  });

  it("falls back to POST /api/auth/guest on 401 from /me", async () => {
    const { fetch, calls } = makeFetch([
      { status: 401, body: { error: "unauthenticated" } },
      { status: 200, body: { kind: "guest", id: "g_1", nickname: "Guest-abcd" } },
    ]);
    vi.stubGlobal("fetch", fetch);
    const identity = await ensureSession();
    expect(identity.kind).toBe("guest");
    expect(identity.id).toBe("g_1");
    expect(calls.length).toBe(2);
    expect(calls[0]?.url).toContain("/api/auth/me");
    expect(calls[1]?.url).toContain("/api/auth/guest");
    expect(calls[1]?.method).toBe("POST");
  });

  it("throws if /me succeeds but body is not a valid identity shape", async () => {
    const { fetch } = makeFetch([{ status: 200, body: { not: "an identity" } }]);
    vi.stubGlobal("fetch", fetch);
    await expect(ensureSession()).rejects.toThrow();
  });

  it("throws if both /me and /guest fail", async () => {
    const { fetch } = makeFetch([
      { status: 401, body: { error: "unauthenticated" } },
      { status: 500, body: { error: "boom" } },
    ]);
    vi.stubGlobal("fetch", fetch);
    await expect(ensureSession()).rejects.toThrow();
  });

  it("throws on network error from /me", async () => {
    vi.stubGlobal("fetch", () => Promise.reject(new Error("offline")));
    await expect(ensureSession()).rejects.toThrow(/offline|fetch/);
  });

  it("uses credentials: 'include' on both calls", async () => {
    const calls: RequestInit[] = [];
    const fetchImpl: typeof fetch = (_input, init) => {
      calls.push(init ?? {});
      // Always 401 to force the guest fallback so we observe both calls.
      const status = calls.length === 1 ? 401 : 200;
      const body = calls.length === 1 ? { error: "x" } : { kind: "guest", id: "g", nickname: "n" };
      return Promise.resolve({
        ok: status === 200,
        status,
        json: () => Promise.resolve(body),
      } as Response);
    };
    vi.stubGlobal("fetch", fetchImpl);
    await ensureSession();
    expect(calls[0]?.credentials).toBe("include");
    expect(calls[1]?.credentials).toBe("include");
  });
});
