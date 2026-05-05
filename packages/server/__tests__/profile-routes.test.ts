import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import fastifyCookie from "@fastify/cookie";
import { openDb, runMigrations, type Db } from "@belote/db";
import { sessionPlugin } from "../src/auth/sessionPlugin.js";
import { registerAuthRoutes } from "../src/auth/routes.js";
import { registerProfileRoutes } from "../src/profiles/routes.js";

let db: Db;
let app: FastifyInstance;

beforeEach(async () => {
  db = openDb({ filename: ":memory:" });
  runMigrations(db);
  app = Fastify({ logger: false });
  await app.register(fastifyCookie);
  await app.register(sessionPlugin, { db });
  registerAuthRoutes(app, { db });
  registerProfileRoutes(app, { db });
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

async function signup(email: string, nickname: string): Promise<{ id: string; sid: string }> {
  const res = await app.inject({
    method: "POST",
    url: "/api/auth/signup",
    payload: { email, password: "hunter22-pw", nickname },
  });
  return {
    id: (res.json() as { id: string }).id,
    sid: extractSidCookie(res.headers["set-cookie"])!,
  };
}

const cookie = (sid: string): { cookie: string } => ({ cookie: `belote.sid=${sid}` });

describe("GET /api/users/:id", () => {
  it("returns 404 for unknown id", async () => {
    const a = await signup("alice@x.com", "Alice");
    const res = await app.inject({
      method: "GET",
      url: "/api/users/no-such-id",
      headers: cookie(a.sid),
    });
    expect(res.statusCode).toBe(404);
  });

  it("returns the public profile of another user (no email)", async () => {
    const a = await signup("alice@x.com", "Alice");
    const b = await signup("bob@x.com", "Bob");
    const res = await app.inject({
      method: "GET",
      url: `/api/users/${b.id}`,
      headers: cookie(a.sid),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as Record<string, unknown>;
    expect(body["id"]).toBe(b.id);
    expect(body["nickname"]).toBe("Bob");
    expect(body["email"]).toBeUndefined();
    expect(body["stats"]).toBeDefined();
  });

  it("returns the full profile (with email) when fetching self", async () => {
    const a = await signup("alice@x.com", "Alice");
    const res = await app.inject({
      method: "GET",
      url: `/api/users/${a.id}`,
      headers: cookie(a.sid),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as Record<string, unknown>;
    expect(body["email"]).toBe("alice@x.com");
  });

  it("returns 401 with no session", async () => {
    const a = await signup("alice@x.com", "Alice");
    const res = await app.inject({ method: "GET", url: `/api/users/${a.id}` });
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 for guest session", async () => {
    const guest = await app.inject({ method: "POST", url: "/api/auth/guest" });
    const sid = extractSidCookie(guest.headers["set-cookie"])!;
    const a = await signup("alice@x.com", "Alice");
    const res = await app.inject({
      method: "GET",
      url: `/api/users/${a.id}`,
      headers: cookie(sid),
    });
    expect(res.statusCode).toBe(401);
  });

  it("/api/users/me returns the self-profile", async () => {
    const a = await signup("alice@x.com", "Alice");
    const res = await app.inject({
      method: "GET",
      url: "/api/users/me",
      headers: cookie(a.sid),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { id: string; email?: string };
    expect(body.id).toBe(a.id);
    expect(body.email).toBe("alice@x.com");
  });
});

describe("PATCH /api/users/me", () => {
  it("updates the nickname", async () => {
    const a = await signup("alice@x.com", "Alice");
    const res = await app.inject({
      method: "PATCH",
      url: "/api/users/me",
      headers: cookie(a.sid),
      payload: { nickname: "Alicia" },
    });
    expect(res.statusCode).toBe(200);
    expect((res.json() as { nickname: string }).nickname).toBe("Alicia");
  });

  it("updates the avatarUrl", async () => {
    const a = await signup("alice@x.com", "Alice");
    const res = await app.inject({
      method: "PATCH",
      url: "/api/users/me",
      headers: cookie(a.sid),
      payload: { avatarUrl: "https://x/me.png" },
    });
    expect(res.statusCode).toBe(200);
    expect((res.json() as { avatarUrl: string }).avatarUrl).toBe("https://x/me.png");
  });

  it("rejects an empty nickname with 400", async () => {
    const a = await signup("alice@x.com", "Alice");
    const res = await app.inject({
      method: "PATCH",
      url: "/api/users/me",
      headers: cookie(a.sid),
      payload: { nickname: "" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns 401 with no session", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/api/users/me",
      payload: { nickname: "X" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 for a guest session", async () => {
    const guest = await app.inject({ method: "POST", url: "/api/auth/guest" });
    const sid = extractSidCookie(guest.headers["set-cookie"])!;
    const res = await app.inject({
      method: "PATCH",
      url: "/api/users/me",
      headers: cookie(sid),
      payload: { nickname: "X" },
    });
    expect(res.statusCode).toBe(401);
  });
});
