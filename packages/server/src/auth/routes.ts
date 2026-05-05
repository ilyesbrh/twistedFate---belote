/**
 * Auth routes. Mounted under /api/auth.
 *
 *   POST /signup  → creates user + session, sets cookie, returns user shape
 *   POST /login   → verifies password, creates session, sets cookie
 *   POST /logout  → deletes session, clears cookie (idempotent)
 *   GET  /me      → returns the current identity, or 401
 */
import type { FastifyInstance } from "fastify";
import {
  createGuest,
  createSession,
  createUser,
  deleteSession,
  verifyUserPassword,
  type Db,
} from "@belote/db";
import { SESSION_COOKIE, SESSION_TTL_MS, clearSessionCookie, setSessionCookie } from "./cookie.js";

export interface AuthRoutesOptions {
  readonly db: Db;
}

interface SignupBody {
  readonly email?: unknown;
  readonly password?: unknown;
  readonly nickname?: unknown;
}

interface LoginBody {
  readonly email?: unknown;
  readonly password?: unknown;
}

const MIN_PASSWORD = 8;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NICKNAME_MAX = 32;

function validateSignup(
  b: SignupBody,
): { ok: true; v: SignupValid } | { ok: false; reason: string } {
  if (typeof b.email !== "string" || !EMAIL_RE.test(b.email)) {
    return { ok: false, reason: "invalid_email" };
  }
  if (typeof b.password !== "string" || b.password.length < MIN_PASSWORD) {
    return { ok: false, reason: "weak_password" };
  }
  if (
    typeof b.nickname !== "string" ||
    b.nickname.trim().length === 0 ||
    b.nickname.length > NICKNAME_MAX
  ) {
    return { ok: false, reason: "invalid_nickname" };
  }
  return { ok: true, v: { email: b.email, password: b.password, nickname: b.nickname.trim() } };
}

interface SignupValid {
  readonly email: string;
  readonly password: string;
  readonly nickname: string;
}

export function registerAuthRoutes(fastify: FastifyInstance, opts: AuthRoutesOptions): void {
  const db = opts.db;

  fastify.post("/api/auth/signup", async (req, reply) => {
    const v = validateSignup(req.body as SignupBody);
    if (!v.ok) return reply.code(400).send({ error: v.reason });

    let user;
    try {
      user = await createUser(db, v.v);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("UNIQUE")) {
        return reply.code(409).send({ error: "email_taken" });
      }
      throw e;
    }

    const { token } = createSession(db, { userId: user.id, ttlMs: SESSION_TTL_MS });
    setSessionCookie(reply, token);
    return reply.code(200).send({
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
    });
  });

  fastify.post("/api/auth/login", async (req, reply) => {
    const b = (req.body ?? {}) as LoginBody;
    if (typeof b.email !== "string" || typeof b.password !== "string") {
      return reply.code(401).send({ error: "invalid_credentials" });
    }
    const user = await verifyUserPassword(db, b.email, b.password);
    if (!user) {
      return reply.code(401).send({ error: "invalid_credentials" });
    }
    const { token } = createSession(db, { userId: user.id, ttlMs: SESSION_TTL_MS });
    setSessionCookie(reply, token);
    return reply.code(200).send({
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
    });
  });

  fastify.post("/api/auth/logout", (req, reply) => {
    const token = req.cookies[SESSION_COOKIE];
    if (token) deleteSession(db, token);
    clearSessionCookie(reply);
    return reply.code(204).send();
  });

  fastify.post("/api/auth/guest", (req, reply) => {
    const body = (req.body ?? {}) as { nickname?: unknown };
    const nicknameInput = typeof body.nickname === "string" ? body.nickname.trim() : "";
    const guest = createGuest(
      db,
      nicknameInput.length > 0 && nicknameInput.length <= NICKNAME_MAX
        ? { nickname: nicknameInput }
        : {},
    );
    const { token } = createSession(db, { guestId: guest.id, ttlMs: SESSION_TTL_MS });
    setSessionCookie(reply, token);
    return reply.code(200).send({
      kind: "guest" as const,
      id: guest.id,
      nickname: guest.nickname,
    });
  });

  fastify.get("/api/auth/me", (req, reply) => {
    const session = req.session;
    if (!session) return reply.code(401).send({ error: "unauthenticated" });
    if (session.kind === "user") {
      return reply.code(200).send({
        kind: "user" as const,
        id: session.user.id,
        email: session.user.email,
        nickname: session.user.nickname,
        avatarUrl: session.user.avatarUrl,
      });
    }
    return reply.code(200).send({
      kind: "guest" as const,
      id: session.guest.id,
      nickname: session.guest.nickname,
    });
  });
}
