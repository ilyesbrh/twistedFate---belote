import { beforeEach, describe, it, expect } from "vitest";
import { openDb, type Db } from "../src/openDb.js";
import { runMigrations } from "../src/migrations/runMigrations.js";
import { createGuest, findGuestById, upgradeGuestToUser } from "../src/queries/guests.js";
import { createUser } from "../src/queries/users.js";

let db: Db;

beforeEach(() => {
  db = openDb({ filename: ":memory:" });
  runMigrations(db);
});

describe("createGuest", () => {
  it("returns a guest row with default Guest-XXXX nickname", () => {
    const g = createGuest(db);
    expect(g.id).toMatch(/^[A-Za-z0-9_-]{21}$/);
    expect(g.nickname).toMatch(/^Guest-[0-9a-f]{4}$/);
    expect(g.upgradedToUserId).toBeNull();
    expect(typeof g.createdAt).toBe("number");
  });

  it("accepts a custom nickname when provided", () => {
    const g = createGuest(db, { nickname: "Visitor" });
    expect(g.nickname).toBe("Visitor");
  });

  it("creates distinct ids for distinct guests", () => {
    const a = createGuest(db);
    const b = createGuest(db);
    expect(a.id).not.toBe(b.id);
  });
});

describe("findGuestById", () => {
  it("returns the guest, or null", () => {
    const g = createGuest(db);
    expect(findGuestById(db, g.id)?.id).toBe(g.id);
    expect(findGuestById(db, "no-such")).toBeNull();
  });
});

describe("upgradeGuestToUser", () => {
  it("links the guest to the user without changing the guest's id", async () => {
    const g = createGuest(db);
    const u = await createUser(db, { email: "u@x.com", password: "p1234567", nickname: "U" });
    upgradeGuestToUser(db, g.id, u.id);
    const after = findGuestById(db, g.id);
    expect(after?.id).toBe(g.id);
    expect(after?.upgradedToUserId).toBe(u.id);
  });

  it("throws if the guest does not exist", async () => {
    const u = await createUser(db, { email: "u@x.com", password: "p1234567", nickname: "U" });
    expect(() => {
      upgradeGuestToUser(db, "no-such", u.id);
    }).toThrow();
  });

  it("throws if the user does not exist (FK enforcement)", () => {
    const g = createGuest(db);
    expect(() => {
      upgradeGuestToUser(db, g.id, "no-such-user");
    }).toThrow();
  });
});
