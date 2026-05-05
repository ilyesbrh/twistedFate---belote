/**
 * Ensure the browser holds a valid session cookie before opening the WS.
 *
 *   1. GET /api/auth/me — if 200, we already have a session (user or guest).
 *   2. On 401, POST /api/auth/guest — mints a fresh guest cookie.
 *   3. Any other failure throws.
 *
 * The returned `Identity` is what the server says we are at this instant.
 * The eventual WS `hello_ack` should match it; if it doesn't (e.g. the
 * cookie expired between the two calls), the wire value wins.
 */

export interface Identity {
  readonly kind: "user" | "guest";
  readonly id: string;
  readonly nickname: string;
  readonly avatarUrl?: string;
}

const ME_URL = "/api/auth/me";
const GUEST_URL = "/api/auth/guest";

export async function ensureSession(): Promise<Identity> {
  const me = await fetch(ME_URL, { credentials: "include" });
  if (me.ok) {
    const body: unknown = await me.json();
    return parseIdentity(body);
  }
  if (me.status !== 401) {
    throw new Error(`ensureSession: /api/auth/me failed (${String(me.status)})`);
  }
  // No session yet — mint a guest.
  const guest = await fetch(GUEST_URL, { method: "POST", credentials: "include" });
  if (!guest.ok) {
    throw new Error(`ensureSession: /api/auth/guest failed (${String(guest.status)})`);
  }
  const body: unknown = await guest.json();
  return parseIdentity(body);
}

interface IdentityShape {
  kind?: unknown;
  id?: unknown;
  nickname?: unknown;
  avatarUrl?: unknown;
}

function parseIdentity(body: unknown): Identity {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new Error("ensureSession: response body is not an object");
  }
  const obj = body as IdentityShape;
  if (obj.kind !== "user" && obj.kind !== "guest") {
    throw new Error(`ensureSession: unknown identity kind: ${String(obj.kind)}`);
  }
  if (typeof obj.id !== "string" || obj.id.length === 0) {
    throw new Error("ensureSession: missing identity.id");
  }
  if (typeof obj.nickname !== "string" || obj.nickname.length === 0) {
    throw new Error("ensureSession: missing identity.nickname");
  }
  return typeof obj.avatarUrl === "string"
    ? { kind: obj.kind, id: obj.id, nickname: obj.nickname, avatarUrl: obj.avatarUrl }
    : { kind: obj.kind, id: obj.id, nickname: obj.nickname };
}
