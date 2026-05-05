import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import fastifyCookie from "@fastify/cookie";
import { openDb, runMigrations, type Db } from "@belote/db";
import { sessionPlugin } from "../src/auth/sessionPlugin.js";
import { registerAuthRoutes } from "../src/auth/routes.js";
import { registerFriendsRoutes } from "../src/friends/routes.js";

let db: Db;
let app: FastifyInstance;

beforeEach(async () => {
  db = openDb({ filename: ":memory:" });
  runMigrations(db);
  app = Fastify({ logger: false });
  await app.register(fastifyCookie);
  await app.register(sessionPlugin, { db });
  registerAuthRoutes(app, { db });
  registerFriendsRoutes(app, { db });
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
  if (res.statusCode !== 200) {
    throw new Error(`signup failed: ${String(res.statusCode)} ${res.body}`);
  }
  return {
    id: (res.json() as { id: string }).id,
    sid: extractSidCookie(res.headers["set-cookie"])!,
  };
}

const cookie = (sid: string): { cookie: string } => ({ cookie: `belote.sid=${sid}` });

describe("GET /api/friends", () => {
  it("returns 401 without a user session", async () => {
    const res = await app.inject({ method: "GET", url: "/api/friends" });
    expect(res.statusCode).toBe(401);
  });

  it("returns empty arrays for a fresh user", async () => {
    const a = await signup("alice@x.com", "Alice");
    const res = await app.inject({
      method: "GET",
      url: "/api/friends",
      headers: cookie(a.sid),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ friends: [], incoming: [], outgoing: [] });
  });
});

describe("POST /api/friends/requests", () => {
  it("creates a pending request and surfaces it on both sides", async () => {
    const a = await signup("alice@x.com", "Alice");
    const b = await signup("bob@x.com", "Bob");
    const res = await app.inject({
      method: "POST",
      url: "/api/friends/requests",
      headers: cookie(a.sid),
      payload: { email: "bob@x.com" },
    });
    expect(res.statusCode).toBe(201);
    expect((res.json() as { id: string }).id).toBeTruthy();

    const aList = await app.inject({
      method: "GET",
      url: "/api/friends",
      headers: cookie(a.sid),
    });
    const aBody = aList.json() as {
      outgoing: { otherUserId: string; otherEmail: string }[];
    };
    expect(aBody.outgoing.length).toBe(1);
    expect(aBody.outgoing[0]?.otherUserId).toBe(b.id);

    const bList = await app.inject({
      method: "GET",
      url: "/api/friends",
      headers: cookie(b.sid),
    });
    const bBody = bList.json() as { incoming: { otherUserId: string }[] };
    expect(bBody.incoming.length).toBe(1);
    expect(bBody.incoming[0]?.otherUserId).toBe(a.id);
  });

  it("returns 404 when the email is unknown", async () => {
    const a = await signup("alice@x.com", "Alice");
    const res = await app.inject({
      method: "POST",
      url: "/api/friends/requests",
      headers: cookie(a.sid),
      payload: { email: "ghost@x.com" },
    });
    expect(res.statusCode).toBe(404);
  });

  it("returns 409 when targeting yourself", async () => {
    const a = await signup("alice@x.com", "Alice");
    const res = await app.inject({
      method: "POST",
      url: "/api/friends/requests",
      headers: cookie(a.sid),
      payload: { email: "alice@x.com" },
    });
    expect(res.statusCode).toBe(409);
  });

  it("returns 409 when a request already exists", async () => {
    const a = await signup("alice@x.com", "Alice");
    await signup("bob@x.com", "Bob");
    await app.inject({
      method: "POST",
      url: "/api/friends/requests",
      headers: cookie(a.sid),
      payload: { email: "bob@x.com" },
    });
    const res = await app.inject({
      method: "POST",
      url: "/api/friends/requests",
      headers: cookie(a.sid),
      payload: { email: "bob@x.com" },
    });
    expect(res.statusCode).toBe(409);
  });
});

describe("POST /api/friends/requests/:id/accept", () => {
  it("transitions to accepted; both users see each other in friends", async () => {
    const a = await signup("alice@x.com", "Alice");
    const b = await signup("bob@x.com", "Bob");
    const send = await app.inject({
      method: "POST",
      url: "/api/friends/requests",
      headers: cookie(a.sid),
      payload: { email: "bob@x.com" },
    });
    const reqId = (send.json() as { id: string }).id;
    const accept = await app.inject({
      method: "POST",
      url: `/api/friends/requests/${reqId}/accept`,
      headers: cookie(b.sid),
    });
    expect(accept.statusCode).toBe(204);
    const aFriends = await app.inject({
      method: "GET",
      url: "/api/friends",
      headers: cookie(a.sid),
    });
    expect((aFriends.json() as { friends: unknown[] }).friends.length).toBe(1);
  });

  it("returns 403 if non-addressee tries to accept", async () => {
    const a = await signup("alice@x.com", "Alice");
    await signup("bob@x.com", "Bob");
    const send = await app.inject({
      method: "POST",
      url: "/api/friends/requests",
      headers: cookie(a.sid),
      payload: { email: "bob@x.com" },
    });
    const reqId = (send.json() as { id: string }).id;
    const accept = await app.inject({
      method: "POST",
      url: `/api/friends/requests/${reqId}/accept`,
      headers: cookie(a.sid), // Alice can't accept her own request
    });
    expect(accept.statusCode).toBe(403);
  });
});

describe("POST /api/friends/requests/:id/reject + DELETE", () => {
  it("reject removes the row", async () => {
    const a = await signup("alice@x.com", "Alice");
    const b = await signup("bob@x.com", "Bob");
    const send = await app.inject({
      method: "POST",
      url: "/api/friends/requests",
      headers: cookie(a.sid),
      payload: { email: "bob@x.com" },
    });
    const reqId = (send.json() as { id: string }).id;
    const reject = await app.inject({
      method: "POST",
      url: `/api/friends/requests/${reqId}/reject`,
      headers: cookie(b.sid),
    });
    expect(reject.statusCode).toBe(204);
    const after = await app.inject({
      method: "GET",
      url: "/api/friends",
      headers: cookie(a.sid),
    });
    expect((after.json() as { outgoing: unknown[] }).outgoing).toEqual([]);
  });

  it("DELETE cancels a pending request from the requester", async () => {
    const a = await signup("alice@x.com", "Alice");
    await signup("bob@x.com", "Bob");
    const send = await app.inject({
      method: "POST",
      url: "/api/friends/requests",
      headers: cookie(a.sid),
      payload: { email: "bob@x.com" },
    });
    const reqId = (send.json() as { id: string }).id;
    const cancel = await app.inject({
      method: "DELETE",
      url: `/api/friends/requests/${reqId}`,
      headers: cookie(a.sid),
    });
    expect(cancel.statusCode).toBe(204);
  });
});

describe("DELETE /api/friends/:userId", () => {
  it("removes an accepted friendship", async () => {
    const a = await signup("alice@x.com", "Alice");
    const b = await signup("bob@x.com", "Bob");
    const send = await app.inject({
      method: "POST",
      url: "/api/friends/requests",
      headers: cookie(a.sid),
      payload: { email: "bob@x.com" },
    });
    const reqId = (send.json() as { id: string }).id;
    await app.inject({
      method: "POST",
      url: `/api/friends/requests/${reqId}/accept`,
      headers: cookie(b.sid),
    });
    const remove = await app.inject({
      method: "DELETE",
      url: `/api/friends/${b.id}`,
      headers: cookie(a.sid),
    });
    expect(remove.statusCode).toBe(204);
    const after = await app.inject({
      method: "GET",
      url: "/api/friends",
      headers: cookie(a.sid),
    });
    expect((after.json() as { friends: unknown[] }).friends).toEqual([]);
  });
});
