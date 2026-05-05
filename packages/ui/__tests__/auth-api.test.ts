import { afterEach, describe, expect, it, vi } from "vitest";
import { apiSignup, apiLogin, apiLogout, apiMe, apiGuest, AuthApiError } from "../src/auth/api.js";

interface FakeResponse {
  status: number;
  body?: unknown;
}

function stubFetch(responses: FakeResponse[]): { calls: { url: string; method: string }[] } {
  const calls: { url: string; method: string }[] = [];
  const fetchImpl: typeof fetch = (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const method = init?.method ?? "GET";
    calls.push({ url, method });
    const r = responses.shift();
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

describe("apiSignup", () => {
  it("posts to /api/auth/signup with credentials and returns the user identity", async () => {
    const { calls } = stubFetch([
      {
        status: 200,
        body: { id: "u_1", email: "alice@x.com", nickname: "Alice", avatarUrl: null },
      },
    ]);
    const user = await apiSignup({
      email: "alice@x.com",
      password: "hunter22-pw",
      nickname: "Alice",
    });
    expect(user.id).toBe("u_1");
    expect(user.email).toBe("alice@x.com");
    expect(user.nickname).toBe("Alice");
    expect(calls[0]?.url).toContain("/api/auth/signup");
    expect(calls[0]?.method).toBe("POST");
  });

  it("throws AuthApiError with server code on 409", async () => {
    stubFetch([{ status: 409, body: { error: "email_taken" } }]);
    let caught: unknown = null;
    try {
      await apiSignup({ email: "dup@x.com", password: "hunter22-pw", nickname: "B" });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(AuthApiError);
    expect((caught as AuthApiError).code).toBe("email_taken");
    expect((caught as AuthApiError).status).toBe(409);
  });

  it("throws AuthApiError on 400 weak password", async () => {
    stubFetch([{ status: 400, body: { error: "weak_password" } }]);
    await expect(
      apiSignup({ email: "a@b.c", password: "short", nickname: "A" }),
    ).rejects.toMatchObject({ code: "weak_password" });
  });
});

describe("apiLogin", () => {
  it("returns the user identity on 200", async () => {
    stubFetch([
      {
        status: 200,
        body: { id: "u_1", email: "alice@x.com", nickname: "Alice", avatarUrl: null },
      },
    ]);
    const u = await apiLogin({ email: "alice@x.com", password: "pw1" });
    expect(u.id).toBe("u_1");
  });

  it("throws AuthApiError with code 'invalid_credentials' on 401", async () => {
    stubFetch([{ status: 401, body: { error: "invalid_credentials" } }]);
    await expect(apiLogin({ email: "a@b.c", password: "wrong" })).rejects.toMatchObject({
      code: "invalid_credentials",
      status: 401,
    });
  });
});

describe("apiLogout", () => {
  it("posts to /api/auth/logout and resolves on 204", async () => {
    const { calls } = stubFetch([{ status: 204 }]);
    await expect(apiLogout()).resolves.toBeUndefined();
    expect(calls[0]?.url).toContain("/api/auth/logout");
    expect(calls[0]?.method).toBe("POST");
  });

  it("does not throw on 204 with empty body", async () => {
    stubFetch([{ status: 204 }]);
    await expect(apiLogout()).resolves.toBeUndefined();
  });
});

describe("apiMe", () => {
  it("returns the user identity on 200", async () => {
    stubFetch([
      {
        status: 200,
        body: { kind: "user", id: "u_1", email: "alice@x.com", nickname: "Alice" },
      },
    ]);
    const id = await apiMe();
    expect(id?.kind).toBe("user");
    expect(id?.id).toBe("u_1");
  });

  it("returns null on 401 (no error thrown — caller decides what to do)", async () => {
    stubFetch([{ status: 401, body: { error: "unauthenticated" } }]);
    const id = await apiMe();
    expect(id).toBeNull();
  });

  it("returns the guest identity when /me returns kind=guest", async () => {
    stubFetch([{ status: 200, body: { kind: "guest", id: "g_1", nickname: "Guest-abcd" } }]);
    const id = await apiMe();
    expect(id?.kind).toBe("guest");
    expect(id?.id).toBe("g_1");
  });
});

describe("apiGuest", () => {
  it("posts to /api/auth/guest and returns the guest identity", async () => {
    const { calls } = stubFetch([
      { status: 200, body: { kind: "guest", id: "g_1", nickname: "Guest-abcd" } },
    ]);
    const id = await apiGuest();
    expect(id.kind).toBe("guest");
    expect(id.id).toBe("g_1");
    expect(calls[0]?.url).toContain("/api/auth/guest");
    expect(calls[0]?.method).toBe("POST");
  });

  it("can request a custom nickname", async () => {
    const { calls } = stubFetch([
      { status: 200, body: { kind: "guest", id: "g_1", nickname: "Visitor" } },
    ]);
    const id = await apiGuest({ nickname: "Visitor" });
    expect(id.nickname).toBe("Visitor");
    expect(calls[0]?.method).toBe("POST");
  });
});

describe("AuthApiError shape", () => {
  it("exposes code, status and message", () => {
    const e = new AuthApiError("some_code", 400, "msg");
    expect(e.code).toBe("some_code");
    expect(e.status).toBe(400);
    expect(e.message).toBe("msg");
    expect(e).toBeInstanceOf(Error);
  });
});

describe("network error handling", () => {
  it("apiSignup wraps fetch network errors in AuthApiError", async () => {
    vi.stubGlobal("fetch", () => Promise.reject(new Error("offline")));
    await expect(
      apiSignup({ email: "a@b.c", password: "hunter22-pw", nickname: "A" }),
    ).rejects.toBeInstanceOf(AuthApiError);
  });
});
