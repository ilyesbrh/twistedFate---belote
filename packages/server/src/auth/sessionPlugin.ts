/**
 * Fastify plugin: resolves the session cookie into a user-or-guest
 * identity and attaches it to the request as `request.session`.
 *
 * Routes that need authentication check `request.session?.kind === "user"`.
 * Routes that allow guests check truthiness only.
 */
import fp from "fastify-plugin";
import type { FastifyPluginCallback } from "fastify";
import {
  findGuestById,
  findSessionByToken,
  findUserById,
  type Db,
  type Guest,
  type User,
} from "@belote/db";
import { SESSION_COOKIE } from "./cookie.js";

export type RequestSession =
  | { readonly kind: "user"; readonly user: User }
  | { readonly kind: "guest"; readonly guest: Guest };

declare module "fastify" {
  interface FastifyRequest {
    session: RequestSession | null;
  }
}

export interface SessionPluginOptions {
  readonly db: Db;
}

const plugin: FastifyPluginCallback<SessionPluginOptions> = (fastify, opts, done) => {
  fastify.decorateRequest("session", null);
  fastify.addHook("preHandler", (req, _reply, hookDone) => {
    req.session = resolveSession(opts.db, req.cookies[SESSION_COOKIE]);
    hookDone();
  });
  done();
};

export const sessionPlugin = fp(plugin, {
  name: "belote-session",
  fastify: "5.x",
});

export function resolveSession(db: Db, token: string | undefined): RequestSession | null {
  if (!token) return null;
  const session = findSessionByToken(db, token);
  if (!session) return null;
  if (session.userId) {
    const user = findUserById(db, session.userId);
    return user ? { kind: "user", user } : null;
  }
  if (session.guestId) {
    const guest = findGuestById(db, session.guestId);
    return guest ? { kind: "guest", guest } : null;
  }
  return null;
}
