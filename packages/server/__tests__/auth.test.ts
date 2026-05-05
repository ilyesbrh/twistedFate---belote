import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import fastifyCookie from "@fastify/cookie";
import { openDb, runMigrations, type Db } from "@belote/db";
import { sessionPlugin } from "../src/auth/sessionPlugin.js";
import { registerAuthRoutes } from "../src/auth/routes.js";

let db: Db;
let app: FastifyInstance;

beforeEach(async () => {
  db = openDb({ filename: ":memory:" });
  runMigrations(db);
  app = Fastify({ logger: false });
  await app.register(fastifyCookie);
  await app.register(sessionPlugin, { db });
  registerAuthRoutes(app, { db });
});

afterEach(async () => {
  await app.close();
});

function extractSidCookie(setCookie: string | string[] | undefined): string | null {
  if (!setCookie) return null;
  const headers = Array.isArray(setCookie) ? setCookie : [setCookie];
  for (const h of headers) {
    const m = /^belote\.sid=([^;]+)/.exec(h);
    if (m) return m[1] ?? null;
  }
  return null;
}

describe("POST /api/auth/signup", () => {
  it("creates a user, sets the session cookie, returns the user shape (200)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/signup",
      payload: { email: "alice@example.com", password: "hunter22-pw", nickname: "Alice" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { id: string; email: string; nickname: string };
    expect(body.email).toBe("alice@example.com");
    expect(body.nickname).toBe("Alice");
    expect(body.id).toBeTruthy();
    const sid = extractSidCookie(res.headers["set-cookie"]);
    expect(sid).toBeTruthy();
  });

  it("rejects a duplicate email with 409", async () => {
    const payload = { email: "dup@x.com", password: "hunter22-pw", nickname: "A" };
    await app.inject({ method: "POST", url: "/api/auth/signup", payload });
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/signup",
      payload: { ...payload, nickname: "B" },
    });
    expect(res.statusCode).toBe(409);
  });

  it("rejects a weak password (< 8 chars) with 400", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/signup",
      payload: { email: "weak@x.com", password: "short", nickname: "W" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("rejects missing nickname with 400", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/signup",
      payload: { email: "x@y.com", password: "hunter22-pw" },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await app.inject({
      method: "POST",
      url: "/api/auth/signup",
      payload: { email: "login@x.com", password: "hunter22-pw", nickname: "L" },
    });
  });

  it("returns 200 + cookie for correct credentials", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "login@x.com", password: "hunter22-pw" },
    });
    expect(res.statusCode).toBe(200);
    expect(extractSidCookie(res.headers["set-cookie"])).toBeTruthy();
  });

  it("returns 401 for wrong password (no enumeration)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "login@x.com", password: "wrong-pw" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 for unknown email with the same response shape", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "ghost@x.com", password: "anything-pw" },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the session cookie and deletes the DB row (204)", async () => {
    const signup = await app.inject({
      method: "POST",
      url: "/api/auth/signup",
      payload: { email: "out@x.com", password: "hunter22-pw", nickname: "O" },
    });
    const sid = extractSidCookie(signup.headers["set-cookie"]);
    expect(sid).toBeTruthy();
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/logout",
      headers: { cookie: `belote.sid=${sid!}` },
    });
    expect(res.statusCode).toBe(204);
    // Cookie cleared
    const setCookie = res.headers["set-cookie"];
    expect(String(setCookie)).toMatch(/belote\.sid=;/);
    // DB row gone — /me should now 401
    const me = await app.inject({
      method: "GET",
      url: "/api/auth/me",
      headers: { cookie: `belote.sid=${sid!}` },
    });
    expect(me.statusCode).toBe(401);
  });

  it("returns 204 even when no session cookie is present (idempotent)", async () => {
    const res = await app.inject({ method: "POST", url: "/api/auth/logout" });
    expect(res.statusCode).toBe(204);
  });
});

describe("POST /api/auth/guest", () => {
  it("creates a guest, sets the cookie, returns guest identity", async () => {
    const res = await app.inject({ method: "POST", url: "/api/auth/guest" });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { kind: string; id: string; nickname: string };
    expect(body.kind).toBe("guest");
    expect(body.id).toBeTruthy();
    expect(body.nickname).toMatch(/^Guest-[0-9a-f]{4}$/);
    const sid = extractSidCookie(res.headers["set-cookie"]);
    expect(sid).toBeTruthy();
  });

  it("accepts a custom nickname when provided", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/guest",
      payload: { nickname: "Visitor" },
    });
    expect(res.statusCode).toBe(200);
    expect((res.json() as { nickname: string }).nickname).toBe("Visitor");
  });

  it("makes the guest reachable via /me on the same cookie", async () => {
    const guestRes = await app.inject({ method: "POST", url: "/api/auth/guest" });
    const sid = extractSidCookie(guestRes.headers["set-cookie"])!;
    const me = await app.inject({
      method: "GET",
      url: "/api/auth/me",
      headers: { cookie: `belote.sid=${sid}` },
    });
    expect(me.statusCode).toBe(200);
    const body = me.json() as { kind: string; nickname: string };
    expect(body.kind).toBe("guest");
  });
});

describe("GET /api/auth/me", () => {
  it("returns 401 with no cookie", async () => {
    const res = await app.inject({ method: "GET", url: "/api/auth/me" });
    expect(res.statusCode).toBe(401);
  });

  it("returns the user identity for a valid user cookie", async () => {
    const signup = await app.inject({
      method: "POST",
      url: "/api/auth/signup",
      payload: { email: "me@x.com", password: "hunter22-pw", nickname: "Me" },
    });
    const sid = extractSidCookie(signup.headers["set-cookie"])!;
    const res = await app.inject({
      method: "GET",
      url: "/api/auth/me",
      headers: { cookie: `belote.sid=${sid}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { kind: string; email?: string; nickname: string };
    expect(body.kind).toBe("user");
    expect(body.email).toBe("me@x.com");
    expect(body.nickname).toBe("Me");
  });

  it("returns 401 for a tampered cookie", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/auth/me",
      headers: { cookie: "belote.sid=not-a-real-token" },
    });
    expect(res.statusCode).toBe(401);
  });
});
