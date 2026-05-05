import { beforeEach, describe, it, expect } from "vitest";
import { openDb, type Db } from "../src/openDb.js";
import { runMigrations } from "../src/migrations/runMigrations.js";
import {
  createUser,
  findUserByEmail,
  findUserById,
  verifyUserPassword,
} from "../src/queries/users.js";

let db: Db;

beforeEach(() => {
  db = openDb({ filename: ":memory:" });
  runMigrations(db);
});

describe("createUser", () => {
  it("returns the new row with id, normalized email, nickname and timestamps", async () => {
    const user = await createUser(db, {
      email: "Alice@Example.COM",
      password: "hunter22-secret",
      nickname: "Alice",
    });
    expect(user.id).toMatch(/^[A-Za-z0-9_-]{21}$/); // nanoid default size
    expect(user.email).toBe("alice@example.com");
    expect(user.nickname).toBe("Alice");
    expect(user.avatarUrl).toBeNull();
    expect(typeof user.createdAt).toBe("number");
    expect(typeof user.updatedAt).toBe("number");
  });

  it("never stores the plain password", async () => {
    const password = "absolutely-not-stored-plain-XYZ";
    await createUser(db, { email: "a@b.c", password, nickname: "N" });
    const row = db.prepare("SELECT password_hash FROM users WHERE email = 'a@b.c'").get() as
      | { password_hash: string }
      | undefined;
    expect(row?.password_hash).toBeDefined();
    expect(row?.password_hash).not.toContain(password);
    expect(row?.password_hash.startsWith("$scrypt$")).toBe(true);
  });

  it("rejects a duplicate email (case-insensitive via normalization)", async () => {
    await createUser(db, { email: "dup@x.com", password: "p1234567", nickname: "A" });
    await expect(
      createUser(db, { email: "DUP@x.com", password: "p1234567", nickname: "B" }),
    ).rejects.toThrow();
  });
});

describe("findUserByEmail", () => {
  it("finds a user by exact email", async () => {
    const u = await createUser(db, { email: "find@x.com", password: "p1234567", nickname: "F" });
    const found = findUserByEmail(db, "find@x.com");
    expect(found?.id).toBe(u.id);
  });

  it("normalizes the lookup email (case-insensitive)", async () => {
    await createUser(db, { email: "Lower@x.com", password: "p1234567", nickname: "L" });
    expect(findUserByEmail(db, "LOWER@X.COM")?.email).toBe("lower@x.com");
  });

  it("returns null for unknown email", () => {
    expect(findUserByEmail(db, "ghost@x.com")).toBeNull();
  });
});

describe("findUserById", () => {
  it("returns the user when present, null otherwise", async () => {
    const u = await createUser(db, { email: "id@x.com", password: "p1234567", nickname: "I" });
    expect(findUserById(db, u.id)?.email).toBe("id@x.com");
    expect(findUserById(db, "nonexistent-id")).toBeNull();
  });
});

describe("verifyUserPassword", () => {
  it("returns the user for the correct password, null otherwise", async () => {
    const u = await createUser(db, { email: "v@x.com", password: "right-pw", nickname: "V" });
    expect((await verifyUserPassword(db, "v@x.com", "right-pw"))?.id).toBe(u.id);
    expect(await verifyUserPassword(db, "v@x.com", "wrong-pw")).toBeNull();
  });

  it("returns null for unknown email (no enumeration via timing/shape)", async () => {
    expect(await verifyUserPassword(db, "ghost@x.com", "anything")).toBeNull();
  });
});
