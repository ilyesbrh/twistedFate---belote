/**
 * Profile HTTP routes. Mounted under /api/users.
 *
 *   GET   /api/users/:id   public profile (or full self-profile)
 *   GET   /api/users/me    alias for the self-profile
 *   PATCH /api/users/me    update nickname / avatarUrl
 *
 * Guests get 401 — they don't have stable identities.
 */
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  findUserById,
  getUserStats,
  updateUser,
  type Db,
  type User,
  type UserStats,
} from "@belote/db";

export interface ProfileRoutesOptions {
  readonly db: Db;
}

interface PublicProfile {
  readonly id: string;
  readonly nickname: string;
  readonly avatarUrl: string | null;
  readonly createdAt: number;
  readonly stats: UserStats;
}

interface SelfProfile extends PublicProfile {
  readonly email: string;
  readonly updatedAt: number;
}

function publicView(user: User, stats: UserStats): PublicProfile {
  return {
    id: user.id,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    stats,
  };
}

function selfView(user: User, stats: UserStats): SelfProfile {
  return {
    ...publicView(user, stats),
    email: user.email,
    updatedAt: user.updatedAt,
  };
}

function requireUser(req: FastifyRequest, reply: FastifyReply): { userId: string } | null {
  const session = req.session;
  if (!session || session.kind !== "user") {
    void reply.code(401).send({ error: "unauthenticated" });
    return null;
  }
  return { userId: session.user.id };
}

export function registerProfileRoutes(fastify: FastifyInstance, opts: ProfileRoutesOptions): void {
  const db = opts.db;

  fastify.get<{ Params: { id: string } }>("/api/users/:id", (req, reply) => {
    const auth = requireUser(req, reply);
    if (!auth) return;
    const targetId = req.params.id === "me" ? auth.userId : req.params.id;
    const user = findUserById(db, targetId);
    if (!user) {
      return reply.code(404).send({ error: "not_found" });
    }
    const stats = getUserStats(db, user.id);
    return reply
      .code(200)
      .send(targetId === auth.userId ? selfView(user, stats) : publicView(user, stats));
  });

  fastify.patch("/api/users/me", (req, reply) => {
    const auth = requireUser(req, reply);
    if (!auth) return;
    const body = (req.body ?? {}) as { nickname?: unknown; avatarUrl?: unknown };
    const patch: { nickname?: string; avatarUrl?: string | null } = {};
    if (body.nickname !== undefined) {
      if (typeof body.nickname !== "string") {
        return reply.code(400).send({ error: "invalid_nickname" });
      }
      patch.nickname = body.nickname;
    }
    if (body.avatarUrl !== undefined) {
      if (body.avatarUrl !== null && typeof body.avatarUrl !== "string") {
        return reply.code(400).send({ error: "invalid_avatar" });
      }
      patch.avatarUrl = body.avatarUrl;
    }
    let updated: User | null;
    try {
      updated = updateUser(db, auth.userId, patch);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("invalid nickname")) {
        return reply.code(400).send({ error: "invalid_nickname" });
      }
      throw e;
    }
    if (!updated) return reply.code(404).send({ error: "not_found" });
    const stats = getUserStats(db, updated.id);
    return reply.code(200).send(selfView(updated, stats));
  });
}
