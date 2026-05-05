import { beforeEach, describe, expect, it } from "vitest";
import { openDb, type Db } from "../src/openDb.js";
import { runMigrations } from "../src/migrations/runMigrations.js";
import { createUser, getUserStats, updateUser } from "../src/queries/users.js";
import { createGuest } from "../src/queries/guests.js";
import { recordMatch } from "../src/queries/matches.js";

let db: Db;
beforeEach(() => {
  db = openDb({ filename: ":memory:" });
  runMigrations(db);
});

describe("getUserStats", () => {
  it("returns zeros for a new user", async () => {
    const u = await createUser(db, { email: "a@b.c", password: "pwpwpwpw", nickname: "A" });
    const stats = getUserStats(db, u.id);
    expect(stats.total).toBe(0);
    expect(stats.wins).toBe(0);
    expect(stats.losses).toBe(0);
    expect(stats.winRate).toBe(0);
  });

  it("counts a win when the user's seat parity matches winnerTeam", async () => {
    const u = await createUser(db, { email: "a@b.c", password: "pwpwpwpw", nickname: "A" });
    const g = createGuest(db);
    recordMatch(db, {
      code: "ABCD",
      startedAt: 1,
      endedAt: 2,
      targetScore: 501,
      finalScoreNs: 510,
      finalScoreEw: 200,
      winnerTeam: 0,
      seats: [
        { seat: 0, userId: u.id, guestId: null, nickname: "A" }, // team 0 (NS)
        { seat: 1, userId: null, guestId: g.id, nickname: "B" },
        { seat: 2, userId: null, guestId: g.id, nickname: "C" },
        { seat: 3, userId: null, guestId: g.id, nickname: "D" },
      ],
    });
    const stats = getUserStats(db, u.id);
    expect(stats.total).toBe(1);
    expect(stats.wins).toBe(1);
    expect(stats.losses).toBe(0);
    expect(stats.winRate).toBe(1);
  });

  it("counts a loss when seat parity does not match winnerTeam", async () => {
    const u = await createUser(db, { email: "a@b.c", password: "pwpwpwpw", nickname: "A" });
    const g = createGuest(db);
    recordMatch(db, {
      code: "ABCD",
      startedAt: 1,
      endedAt: 2,
      targetScore: 501,
      finalScoreNs: 510,
      finalScoreEw: 200,
      winnerTeam: 0,
      seats: [
        { seat: 0, userId: null, guestId: g.id, nickname: "B" },
        { seat: 1, userId: u.id, guestId: null, nickname: "A" }, // team 1 (EW)
        { seat: 2, userId: null, guestId: g.id, nickname: "C" },
        { seat: 3, userId: null, guestId: g.id, nickname: "D" },
      ],
    });
    const stats = getUserStats(db, u.id);
    expect(stats.total).toBe(1);
    expect(stats.wins).toBe(0);
    expect(stats.losses).toBe(1);
    expect(stats.winRate).toBe(0);
  });

  it("aggregates multiple matches", async () => {
    const u = await createUser(db, { email: "a@b.c", password: "pwpwpwpw", nickname: "A" });
    const g = createGuest(db);
    // 2 wins, 1 loss
    for (let i = 0; i < 2; i++) {
      recordMatch(db, {
        code: `W${String(i)}A`,
        startedAt: i,
        endedAt: i + 1,
        targetScore: 501,
        finalScoreNs: 510,
        finalScoreEw: 200,
        winnerTeam: 0,
        seats: [
          { seat: 0, userId: u.id, guestId: null, nickname: "A" },
          { seat: 1, userId: null, guestId: g.id, nickname: "X" },
          { seat: 2, userId: null, guestId: g.id, nickname: "Y" },
          { seat: 3, userId: null, guestId: g.id, nickname: "Z" },
        ],
      });
    }
    recordMatch(db, {
      code: "LOSS",
      startedAt: 100,
      endedAt: 200,
      targetScore: 501,
      finalScoreNs: 100,
      finalScoreEw: 510,
      winnerTeam: 1,
      seats: [
        { seat: 0, userId: u.id, guestId: null, nickname: "A" }, // team 0 lost
        { seat: 1, userId: null, guestId: g.id, nickname: "X" },
        { seat: 2, userId: null, guestId: g.id, nickname: "Y" },
        { seat: 3, userId: null, guestId: g.id, nickname: "Z" },
      ],
    });
    const stats = getUserStats(db, u.id);
    expect(stats.total).toBe(3);
    expect(stats.wins).toBe(2);
    expect(stats.losses).toBe(1);
    expect(stats.winRate).toBeCloseTo(2 / 3);
  });
});

describe("updateUser", () => {
  it("updates the nickname and updated_at", async () => {
    const u = await createUser(db, { email: "a@b.c", password: "pwpwpwpw", nickname: "A" });
    const before = u.updatedAt;
    await new Promise((r) => setTimeout(r, 5));
    const updated = updateUser(db, u.id, { nickname: "Alice" });
    expect(updated?.nickname).toBe("Alice");
    expect(updated?.updatedAt).toBeGreaterThan(before);
  });

  it("updates the avatarUrl", async () => {
    const u = await createUser(db, { email: "a@b.c", password: "pwpwpwpw", nickname: "A" });
    const updated = updateUser(db, u.id, { avatarUrl: "https://x/avatar.png" });
    expect(updated?.avatarUrl).toBe("https://x/avatar.png");
  });

  it("returns null for unknown id", () => {
    expect(updateUser(db, "no-such", { nickname: "X" })).toBeNull();
  });

  it("rejects an empty nickname", async () => {
    const u = await createUser(db, { email: "a@b.c", password: "pwpwpwpw", nickname: "A" });
    expect(() => updateUser(db, u.id, { nickname: "" })).toThrow();
  });
});
