/**
 * Friends HTTP routes. All require a user session; guests get 401.
 *
 *   GET    /api/friends                                → friends + incoming + outgoing
 *   POST   /api/friends/requests          (body: email) → 201 / 404 / 409
 *   POST   /api/friends/requests/:id/accept            → 204 / 403 / 404
 *   POST   /api/friends/requests/:id/reject            → 204 / 403 / 404
 *   DELETE /api/friends/requests/:id                   → 204 (cancel)
 *   DELETE /api/friends/:userId                        → 204 (remove friend)
 */
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  findUserByEmail,
  listFriends,
  listIncomingRequests,
  listOutgoingRequests,
  rejectFriendRequest,
  removeFriend,
  sendFriendRequest,
  type Db,
} from "@belote/db";

export interface FriendsRoutesOptions {
  readonly db: Db;
}

function requireUser(req: FastifyRequest, reply: FastifyReply): { userId: string } | null {
  const session = req.session;
  if (!session || session.kind !== "user") {
    void reply.code(401).send({ error: "unauthenticated" });
    return null;
  }
  return { userId: session.user.id };
}

export function registerFriendsRoutes(fastify: FastifyInstance, opts: FriendsRoutesOptions): void {
  const db = opts.db;

  fastify.get("/api/friends", (req, reply) => {
    const auth = requireUser(req, reply);
    if (!auth) return;
    return reply.code(200).send({
      friends: listFriends(db, auth.userId),
      incoming: listIncomingRequests(db, auth.userId),
      outgoing: listOutgoingRequests(db, auth.userId),
    });
  });

  fastify.post("/api/friends/requests", (req, reply) => {
    const auth = requireUser(req, reply);
    if (!auth) return;
    const body = (req.body ?? {}) as { email?: unknown };
    if (typeof body.email !== "string" || body.email.length === 0) {
      return reply.code(400).send({ error: "invalid_email" });
    }
    const target = findUserByEmail(db, body.email);
    if (!target) {
      return reply.code(404).send({ error: "user_not_found" });
    }
    if (target.id === auth.userId) {
      return reply.code(409).send({ error: "cannot_friend_self" });
    }
    try {
      const id = sendFriendRequest(db, auth.userId, target.id);
      return reply.code(201).send({ id });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("already")) {
        return reply.code(409).send({ error: "already_exists" });
      }
      throw e;
    }
  });

  fastify.post<{ Params: { id: string } }>("/api/friends/requests/:id/accept", (req, reply) => {
    const auth = requireUser(req, reply);
    if (!auth) return;
    try {
      acceptFriendRequest(db, req.params.id, auth.userId);
      return reply.code(204).send();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("only the addressee")) {
        return reply.code(403).send({ error: "forbidden" });
      }
      if (msg.includes("not found")) {
        return reply.code(404).send({ error: "not_found" });
      }
      throw e;
    }
  });

  fastify.post<{ Params: { id: string } }>("/api/friends/requests/:id/reject", (req, reply) => {
    const auth = requireUser(req, reply);
    if (!auth) return;
    try {
      rejectFriendRequest(db, req.params.id, auth.userId);
      return reply.code(204).send();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("only the addressee")) {
        return reply.code(403).send({ error: "forbidden" });
      }
      throw e;
    }
  });

  fastify.delete<{ Params: { id: string } }>("/api/friends/requests/:id", (req, reply) => {
    const auth = requireUser(req, reply);
    if (!auth) return;
    cancelFriendRequest(db, req.params.id, auth.userId);
    return reply.code(204).send();
  });

  fastify.delete<{ Params: { userId: string } }>("/api/friends/:userId", (req, reply) => {
    const auth = requireUser(req, reply);
    if (!auth) return;
    removeFriend(db, auth.userId, req.params.userId);
    return reply.code(204).send();
  });
}
