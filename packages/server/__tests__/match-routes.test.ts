import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import fastifyCookie from "@fastify/cookie";
import { openDb, runMigrations, recordMatch, type Db } from "@belote/db";
import { sessionPlugin } from "../src/auth/sessionPlugin.js";
import { registerAuthRoutes } from "../src/auth/routes.js";
import { registerMatchRoutes } from "../src/match-history/routes.js";

let db: Db;
let app: FastifyInstance;

beforeEach(async () => {
  db = openDb({ filename: ":memory:" });
  runMigrations(db);
  app = Fastify({ logger: false });
  await app.register(fastifyCookie);
  await app.register(sessionPlugin, { db });
  registerAuthRoutes(app, { db });
  registerMatchRoutes(app, { db });
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

describe("GET /api/matches", () => {
  it("returns 401 when no session cookie is present", async () => {
    const res = await app.inject({ method: "GET", url: "/api/matches" });
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 for a guest cookie (not a real account)", async () => {
    const guestRes = await app.inject({ method: "POST", url: "/api/auth/guest" });
    const sid = extractSidCookie(guestRes.headers["set-cookie"])!;
    const res = await app.inject({
      method: "GET",
      url: "/api/matches",
      headers: { cookie: `belote.sid=${sid}` },
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns 200 with the user's matches in newest-first order", async () => {
    const signup = await app.inject({
      method: "POST",
      url: "/api/auth/signup",
      payload: { email: "alice@x.com", password: "hunter22-pw", nickname: "Alice" },
    });
    const sid = extractSidCookie(signup.headers["set-cookie"])!;
    const userId = (signup.json() as { id: string }).id;
    // Insert two matches directly via DB.
    const m1 = recordMatch(db, {
      code: "AAAA",
      startedAt: 100,
      endedAt: 200,
      targetScore: 501,
      finalScoreNs: 510,
      finalScoreEw: 220,
      winnerTeam: 0,
      seats: [
        { seat: 0, userId, guestId: null, nickname: "Alice" },
        { seat: 1, userId, guestId: null, nickname: "Alice" },
        { seat: 2, userId, guestId: null, nickname: "Alice" },
        { seat: 3, userId, guestId: null, nickname: "Alice" },
      ],
    });
    const m2 = recordMatch(db, {
      code: "BBBB",
      startedAt: 300,
      endedAt: 400,
      targetScore: 501,
      finalScoreNs: 100,
      finalScoreEw: 510,
      winnerTeam: 1,
      seats: [
        { seat: 0, userId, guestId: null, nickname: "Alice" },
        { seat: 1, userId, guestId: null, nickname: "Alice" },
        { seat: 2, userId, guestId: null, nickname: "Alice" },
        { seat: 3, userId, guestId: null, nickname: "Alice" },
      ],
    });

    const res = await app.inject({
      method: "GET",
      url: "/api/matches",
      headers: { cookie: `belote.sid=${sid}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { matches: { id: string; code: string }[] };
    expect(body.matches.length).toBe(2);
    expect(body.matches[0]?.id).toBe(m2);
    expect(body.matches[1]?.id).toBe(m1);
    expect(body.matches[0]?.code).toBe("BBBB");
  });

  it("returns 200 with empty array for a user with no matches", async () => {
    const signup = await app.inject({
      method: "POST",
      url: "/api/auth/signup",
      payload: { email: "fresh@x.com", password: "hunter22-pw", nickname: "Fresh" },
    });
    const sid = extractSidCookie(signup.headers["set-cookie"])!;
    const res = await app.inject({
      method: "GET",
      url: "/api/matches",
      headers: { cookie: `belote.sid=${sid}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ matches: [] });
  });
});
