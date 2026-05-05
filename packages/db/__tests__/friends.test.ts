import { beforeEach, describe, expect, it } from "vitest";
import { openDb, type Db } from "../src/openDb.js";
import { runMigrations } from "../src/migrations/runMigrations.js";
import { createUser } from "../src/queries/users.js";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  listFriends,
  listIncomingRequests,
  listOutgoingRequests,
  rejectFriendRequest,
  removeFriend,
  sendFriendRequest,
} from "../src/queries/friends.js";

let db: Db;
beforeEach(() => {
  db = openDb({ filename: ":memory:" });
  runMigrations(db);
});

async function makeAlice(): Promise<{ id: string }> {
  return createUser(db, { email: "alice@x.com", password: "pwpwpwpw", nickname: "Alice" });
}
async function makeBob(): Promise<{ id: string }> {
  return createUser(db, { email: "bob@x.com", password: "pwpwpwpw", nickname: "Bob" });
}

describe("sendFriendRequest", () => {
  it("creates a pending row and returns its id", async () => {
    const a = await makeAlice();
    const b = await makeBob();
    const id = sendFriendRequest(db, a.id, b.id);
    expect(typeof id).toBe("string");
    const row = db.prepare("SELECT status FROM friendships WHERE id = ?").get(id) as
      | { status: string }
      | undefined;
    expect(row?.status).toBe("pending");
  });

  it("rejects a self-request", async () => {
    const a = await makeAlice();
    expect(() => sendFriendRequest(db, a.id, a.id)).toThrow();
  });

  it("rejects a duplicate pending request from the same requester", async () => {
    const a = await makeAlice();
    const b = await makeBob();
    sendFriendRequest(db, a.id, b.id);
    expect(() => sendFriendRequest(db, a.id, b.id)).toThrow();
  });
});

describe("acceptFriendRequest / rejectFriendRequest / cancelFriendRequest", () => {
  it("accept flips status to accepted and surfaces in listFriends both ways", async () => {
    const a = await makeAlice();
    const b = await makeBob();
    const id = sendFriendRequest(db, a.id, b.id);
    acceptFriendRequest(db, id, b.id);
    const aFriends = listFriends(db, a.id);
    const bFriends = listFriends(db, b.id);
    expect(aFriends.length).toBe(1);
    expect(bFriends.length).toBe(1);
    expect(aFriends[0]?.userId).toBe(b.id);
    expect(bFriends[0]?.userId).toBe(a.id);
  });

  it("accept fails if the actor is not the addressee", async () => {
    const a = await makeAlice();
    const b = await makeBob();
    const id = sendFriendRequest(db, a.id, b.id);
    expect(() => acceptFriendRequest(db, id, a.id)).toThrow();
  });

  it("reject deletes the row", async () => {
    const a = await makeAlice();
    const b = await makeBob();
    const id = sendFriendRequest(db, a.id, b.id);
    rejectFriendRequest(db, id, b.id);
    expect(listIncomingRequests(db, b.id)).toEqual([]);
    expect(listOutgoingRequests(db, a.id)).toEqual([]);
  });

  it("cancel deletes the row from the requester side", async () => {
    const a = await makeAlice();
    const b = await makeBob();
    const id = sendFriendRequest(db, a.id, b.id);
    cancelFriendRequest(db, id, a.id);
    expect(listIncomingRequests(db, b.id)).toEqual([]);
  });

  it("cancel by non-requester is a no-op (security)", async () => {
    const a = await makeAlice();
    const b = await makeBob();
    const id = sendFriendRequest(db, a.id, b.id);
    cancelFriendRequest(db, id, b.id); // Bob, not the requester
    expect(listIncomingRequests(db, b.id).length).toBe(1);
  });

  it("re-sending after a reject succeeds (rejected rows are deleted)", async () => {
    const a = await makeAlice();
    const b = await makeBob();
    const id = sendFriendRequest(db, a.id, b.id);
    rejectFriendRequest(db, id, b.id);
    const id2 = sendFriendRequest(db, a.id, b.id);
    expect(typeof id2).toBe("string");
  });
});

describe("listFriends / listIncomingRequests / listOutgoingRequests", () => {
  it("incoming and outgoing requests are kept distinct", async () => {
    const a = await makeAlice();
    const b = await makeBob();
    sendFriendRequest(db, a.id, b.id);
    expect(listIncomingRequests(db, b.id).length).toBe(1);
    expect(listIncomingRequests(db, a.id).length).toBe(0);
    expect(listOutgoingRequests(db, a.id).length).toBe(1);
    expect(listOutgoingRequests(db, b.id).length).toBe(0);
  });

  it("listFriends ignores pending rows", async () => {
    const a = await makeAlice();
    const b = await makeBob();
    sendFriendRequest(db, a.id, b.id);
    expect(listFriends(db, a.id)).toEqual([]);
    expect(listFriends(db, b.id)).toEqual([]);
  });

  it("listFriends includes nickname + email of the friend (not me)", async () => {
    const a = await makeAlice();
    const b = await makeBob();
    const id = sendFriendRequest(db, a.id, b.id);
    acceptFriendRequest(db, id, b.id);
    const list = listFriends(db, a.id);
    expect(list[0]?.nickname).toBe("Bob");
    expect(list[0]?.email).toBe("bob@x.com");
  });
});

describe("removeFriend", () => {
  it("removes the friendship from both sides", async () => {
    const a = await makeAlice();
    const b = await makeBob();
    const id = sendFriendRequest(db, a.id, b.id);
    acceptFriendRequest(db, id, b.id);
    removeFriend(db, a.id, b.id);
    expect(listFriends(db, a.id)).toEqual([]);
    expect(listFriends(db, b.id)).toEqual([]);
  });

  it("is a no-op when no friendship exists", async () => {
    const a = await makeAlice();
    const b = await makeBob();
    expect(() => removeFriend(db, a.id, b.id)).not.toThrow();
  });
});
