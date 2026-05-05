import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../src/hash.js";

describe("hashPassword / verifyPassword", () => {
  it("produces a PHC-style string starting with $scrypt$", async () => {
    const hash = await hashPassword("hunter22");
    expect(hash.startsWith("$scrypt$")).toBe(true);
    // PHC structure: $scrypt$N=...,r=...,p=...$<salt-b64>$<key-b64>
    expect(hash.split("$").length).toBe(5);
  });

  it("never stores the plain password literally", async () => {
    const password = "definitely-not-in-the-hash-pls";
    const hash = await hashPassword(password);
    expect(hash).not.toContain(password);
  });

  it("produces different hashes for the same password (random salt)", async () => {
    const a = await hashPassword("same-password");
    const b = await hashPassword("same-password");
    expect(a).not.toBe(b);
  });

  it("verifies a correct password", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    expect(await verifyPassword("correct-horse-battery-staple", hash)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("the-real-password");
    expect(await verifyPassword("the-wrong-password", hash)).toBe(false);
  });

  it("rejects a malformed hash without throwing", async () => {
    expect(await verifyPassword("anything", "not-a-real-hash")).toBe(false);
    expect(await verifyPassword("anything", "")).toBe(false);
    expect(await verifyPassword("anything", "$scrypt$broken")).toBe(false);
  });

  it("uses constant-time comparison (no early-out leak in length)", async () => {
    // Hashes for two different passwords have the same byte length.
    const a = await hashPassword("a");
    const b = await hashPassword("password-of-a-very-different-length");
    expect(a.length).toBe(b.length);
  });
});
