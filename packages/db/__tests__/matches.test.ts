import { beforeEach, describe, expect, it } from "vitest";
import { openDb, type Db } from "../src/openDb.js";
import { runMigrations } from "../src/migrations/runMigrations.js";
import { createUser } from "../src/queries/users.js";
import { createGuest } from "../src/queries/guests.js";
import { listGuestMatches, listUserMatches, recordMatch } from "../src/queries/matches.js";

let db: Db;
beforeEach(() => {
  db = openDb({ filename: ":memory:" });
  runMigrations(db);
});

const SEATS_OF = (
  ids: readonly (
    | { kind: "user"; id: string; nickname: string }
    | { kind: "guest"; id: string; nickname: string }
  )[],
): readonly {
  seat: 0 | 1 | 2 | 3;
  userId: string | null;
  guestId: string | null;
  nickname: string;
}[] =>
  ids.map((p, i) => ({
    seat: i as 0 | 1 | 2 | 3,
    userId: p.kind === "user" ? p.id : null,
    guestId: p.kind === "guest" ? p.id : null,
    nickname: p.nickname,
  }));

describe("recordMatch", () => {
  it("inserts one match row + four seat rows in a single transaction", async () => {
    const u0 = await createUser(db, { email: "a@b.c", password: "pwpwpwpw", nickname: "Alice" });
    const u1 = await createUser(db, { email: "b@b.c", password: "pwpwpwpw", nickname: "Bob" });
    const g2 = createGuest(db, { nickname: "Guest-aaaa" });
    const g3 = createGuest(db, { nickname: "Guest-bbbb" });
    const matchId = recordMatch(db, {
      code: "ABCD",
      startedAt: 1_000,
      endedAt: 2_000,
      targetScore: 501,
      finalScoreNs: 510,
      finalScoreEw: 320,
      winnerTeam: 0,
      seats: SEATS_OF([
        { kind: "user", id: u0.id, nickname: "Alice" },
        { kind: "user", id: u1.id, nickname: "Bob" },
        { kind: "guest", id: g2.id, nickname: "Guest-aaaa" },
        { kind: "guest", id: g3.id, nickname: "Guest-bbbb" },
      ]),
    });
    expect(typeof matchId).toBe("string");
    const matches = db.prepare("SELECT COUNT(*) AS c FROM matches").get() as { c: number };
    const seats = db.prepare("SELECT COUNT(*) AS c FROM match_seats").get() as { c: number };
    expect(matches.c).toBe(1);
    expect(seats.c).toBe(4);
  });

  it("rejects a winner_team outside [0,1]", async () => {
    const u = await createUser(db, { email: "a@b.c", password: "pwpwpwpw", nickname: "A" });
    const g = createGuest(db);
    expect(() =>
      recordMatch(db, {
        code: "ABCD",
        startedAt: 1,
        endedAt: 2,
        targetScore: 501,
        finalScoreNs: 100,
        finalScoreEw: 50,
        winnerTeam: 2 as 0 | 1, // contraband cast
        seats: SEATS_OF([
          { kind: "user", id: u.id, nickname: "A" },
          { kind: "user", id: u.id, nickname: "A" },
          { kind: "guest", id: g.id, nickname: "G" },
          { kind: "guest", id: g.id, nickname: "G" },
        ]),
      }),
    ).toThrow();
  });

  it("rejects a seat row that has both user_id and guest_id null", async () => {
    expect(() =>
      recordMatch(db, {
        code: "ABCD",
        startedAt: 1,
        endedAt: 2,
        targetScore: 501,
        finalScoreNs: 100,
        finalScoreEw: 50,
        winnerTeam: 0,
        seats: [
          { seat: 0, userId: null, guestId: null, nickname: "Anon" },
          { seat: 1, userId: null, guestId: null, nickname: "Anon" },
          { seat: 2, userId: null, guestId: null, nickname: "Anon" },
          { seat: 3, userId: null, guestId: null, nickname: "Anon" },
        ],
      }),
    ).toThrow();
  });

  it("CASCADE-deletes seat rows when the match is deleted", async () => {
    const u = await createUser(db, { email: "a@b.c", password: "pwpwpwpw", nickname: "A" });
    const matchId = recordMatch(db, {
      code: "ABCD",
      startedAt: 1,
      endedAt: 2,
      targetScore: 501,
      finalScoreNs: 100,
      finalScoreEw: 50,
      winnerTeam: 0,
      seats: SEATS_OF([
        { kind: "user", id: u.id, nickname: "A" },
        { kind: "user", id: u.id, nickname: "A" },
        { kind: "user", id: u.id, nickname: "A" },
        { kind: "user", id: u.id, nickname: "A" },
      ]),
    });
    db.prepare("DELETE FROM matches WHERE id = ?").run(matchId);
    const seats = db.prepare("SELECT COUNT(*) AS c FROM match_seats").get() as { c: number };
    expect(seats.c).toBe(0);
  });
});

describe("listUserMatches", () => {
  it("returns matches the user participated in, newest first", async () => {
    const u = await createUser(db, { email: "a@b.c", password: "pwpwpwpw", nickname: "Alice" });
    const u2 = await createUser(db, { email: "b@b.c", password: "pwpwpwpw", nickname: "Bob" });
    const g = createGuest(db);
    const seats = SEATS_OF([
      { kind: "user", id: u.id, nickname: "Alice" },
      { kind: "user", id: u2.id, nickname: "Bob" },
      { kind: "guest", id: g.id, nickname: "G" },
      { kind: "guest", id: g.id, nickname: "G" },
    ]);
    const m1 = recordMatch(db, {
      code: "AAAA",
      startedAt: 1,
      endedAt: 100,
      targetScore: 501,
      finalScoreNs: 510,
      finalScoreEw: 220,
      winnerTeam: 0,
      seats,
    });
    const m2 = recordMatch(db, {
      code: "BBBB",
      startedAt: 200,
      endedAt: 300,
      targetScore: 501,
      finalScoreNs: 100,
      finalScoreEw: 510,
      winnerTeam: 1,
      seats,
    });
    const list = listUserMatches(db, u.id);
    expect(list.length).toBe(2);
    expect(list[0]?.id).toBe(m2);
    expect(list[1]?.id).toBe(m1);
    expect(list[0]?.seats.length).toBe(4);
    expect(list[0]?.code).toBe("BBBB");
  });

  it("returns an empty array for a user with no matches", async () => {
    const u = await createUser(db, { email: "a@b.c", password: "pwpwpwpw", nickname: "A" });
    expect(listUserMatches(db, u.id)).toEqual([]);
  });

  it("does not include matches the user did not participate in", async () => {
    const u = await createUser(db, { email: "a@b.c", password: "pwpwpwpw", nickname: "A" });
    const other = await createUser(db, { email: "x@y.z", password: "pwpwpwpw", nickname: "X" });
    const g = createGuest(db);
    recordMatch(db, {
      code: "ABCD",
      startedAt: 1,
      endedAt: 2,
      targetScore: 501,
      finalScoreNs: 510,
      finalScoreEw: 100,
      winnerTeam: 0,
      seats: SEATS_OF([
        { kind: "user", id: other.id, nickname: "X" },
        { kind: "guest", id: g.id, nickname: "G" },
        { kind: "guest", id: g.id, nickname: "G" },
        { kind: "guest", id: g.id, nickname: "G" },
      ]),
    });
    expect(listUserMatches(db, u.id)).toEqual([]);
  });
});

describe("listGuestMatches", () => {
  it("returns the guest's matches", () => {
    const g = createGuest(db);
    recordMatch(db, {
      code: "ABCD",
      startedAt: 1,
      endedAt: 2,
      targetScore: 501,
      finalScoreNs: 100,
      finalScoreEw: 50,
      winnerTeam: 0,
      seats: SEATS_OF([
        { kind: "guest", id: g.id, nickname: "G" },
        { kind: "guest", id: g.id, nickname: "G" },
        { kind: "guest", id: g.id, nickname: "G" },
        { kind: "guest", id: g.id, nickname: "G" },
      ]),
    });
    expect(listGuestMatches(db, g.id).length).toBe(1);
  });
});
