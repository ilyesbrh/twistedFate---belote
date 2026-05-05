/**
 * Password hashing — scrypt with a PHC-style string.
 *
 * Format: `$scrypt$N=<n>,r=<r>,p=<p>$<salt-b64>$<key-b64>`
 *
 * Parameters live inside the stored hash so we can raise them later
 * without invalidating existing hashes — `verifyPassword` reads N/r/p
 * from the stored string. New hashes always use the current defaults.
 *
 * Defaults (OWASP-aligned, modest): N=2^14, r=8, p=1.
 *   memory ≈ 128·N·r = 16 MB, well under Node's 32 MB scrypt cap.
 */
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem?: number },
) => Promise<Buffer>;

const N_DEFAULT = 16384;
const R_DEFAULT = 8;
const P_DEFAULT = 1;
const KEY_LEN = 32;
const SALT_LEN = 16;
const MAXMEM = 64 * 1024 * 1024;

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(SALT_LEN);
  const key = await scrypt(plain, salt, KEY_LEN, {
    N: N_DEFAULT,
    r: R_DEFAULT,
    p: P_DEFAULT,
    maxmem: MAXMEM,
  });
  return [
    "",
    "scrypt",
    `N=${String(N_DEFAULT)},r=${String(R_DEFAULT)},p=${String(P_DEFAULT)}`,
    salt.toString("base64"),
    key.toString("base64"),
  ].join("$");
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const parsed = parseHash(stored);
  if (parsed === null) return false;

  let actualKey: Buffer;
  try {
    actualKey = await scrypt(plain, parsed.salt, parsed.expected.length, {
      N: parsed.N,
      r: parsed.r,
      p: parsed.p,
      maxmem: MAXMEM,
    });
  } catch {
    return false;
  }
  if (actualKey.length !== parsed.expected.length) return false;
  return timingSafeEqual(actualKey, parsed.expected);
}

interface ParsedHash {
  readonly N: number;
  readonly r: number;
  readonly p: number;
  readonly salt: Buffer;
  readonly expected: Buffer;
}

function parseHash(stored: string): ParsedHash | null {
  if (!stored.startsWith("$scrypt$")) return null;
  const parts = stored.split("$");
  if (parts.length !== 5) return null;
  const [, , paramsRaw, saltB64, keyB64] = parts;
  if (!paramsRaw || !saltB64 || !keyB64) return null;

  const params = new Map<string, number>();
  for (const segment of paramsRaw.split(",")) {
    const eq = segment.indexOf("=");
    if (eq === -1) return null;
    const key = segment.slice(0, eq);
    const value = Number(segment.slice(eq + 1));
    if (!Number.isFinite(value) || value <= 0) return null;
    params.set(key, value);
  }
  const N = params.get("N");
  const r = params.get("r");
  const p = params.get("p");
  if (N === undefined || r === undefined || p === undefined) return null;

  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(saltB64, "base64");
    expected = Buffer.from(keyB64, "base64");
  } catch {
    return null;
  }
  if (salt.length === 0 || expected.length === 0) return null;

  return { N, r, p, salt, expected };
}
