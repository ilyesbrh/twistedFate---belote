/**
 * Session cookie helpers. Centralized so all routes use the same name
 * and attribute set — diverging on this is how cookie bugs ship.
 */
import type { FastifyReply } from "fastify";

export const SESSION_COOKIE = "belote.sid";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface CookieAttrs {
  readonly path: string;
  readonly httpOnly: true;
  readonly sameSite: "lax";
  readonly secure: boolean;
  readonly maxAge?: number;
  readonly expires?: Date;
}

function baseAttrs(): CookieAttrs {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env["NODE_ENV"] === "production",
  };
}

export function setSessionCookie(reply: FastifyReply, token: string): void {
  reply.setCookie(SESSION_COOKIE, token, {
    ...baseAttrs(),
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export function clearSessionCookie(reply: FastifyReply): void {
  reply.setCookie(SESSION_COOKIE, "", {
    ...baseAttrs(),
    expires: new Date(0),
  });
}
