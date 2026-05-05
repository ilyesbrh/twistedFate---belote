/**
 * Belote server entry point.
 *   pnpm --filter @belote/server dev   (live-reload via tsx watch)
 *   pnpm --filter @belote/server start
 * Default port: 4100. Override with PORT env.
 *
 * Set `STATIC_ROOT=/abs/path/to/ui/dist` to also serve the built UI
 * from this process — used by the docker production image.
 *
 * Set `DB_PATH=/abs/path/to/belote.db` to override the SQLite file
 * location (default: ./data/belote.db). The file is created if missing.
 */
import Fastify from "fastify";
import fastifyCookie from "@fastify/cookie";
import { WebSocketServer } from "ws";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { openDb, runMigrations } from "@belote/db";
import { Gateway } from "../gateway.js";
import { sessionPlugin } from "../auth/sessionPlugin.js";
import { registerAuthRoutes } from "../auth/routes.js";
import { registerMatchRoutes } from "../match-history/routes.js";

const port = Number(process.env["PORT"] ?? 4100);
const host = process.env["HOST"] ?? "0.0.0.0";
const staticRoot = process.env["STATIC_ROOT"];
const dbPath = resolve(process.env["DB_PATH"] ?? "./data/belote.db");

mkdirSync(dirname(dbPath), { recursive: true });
const db = openDb({ filename: dbPath });
runMigrations(db);

const fastify = Fastify({ logger: true });
fastify.log.info({ dbPath }, "database ready");

await fastify.register(fastifyCookie);
await fastify.register(sessionPlugin, { db });
registerAuthRoutes(fastify, { db });
registerMatchRoutes(fastify, { db });

// Health endpoint (useful for sanity checks and container probes).
fastify.get("/health", async () => ({ ok: true }));

if (staticRoot) {
  const root = resolve(staticRoot);
  if (!existsSync(root)) {
    fastify.log.error({ root }, "STATIC_ROOT does not exist; refusing to start");
    process.exit(1);
  }
  // Lazy-import so dev runs (tsx watch) don't need the dependency at all.
  const { default: fastifyStatic } = await import("@fastify/static");
  await fastify.register(fastifyStatic, { root, wildcard: false });
  // SPA fallback — anything that didn't match a static file or /health/ws/api
  // gets index.html so client-side routing works on direct URL hits.
  fastify.setNotFoundHandler((req, reply) => {
    if (req.url.startsWith("/ws") || req.url.startsWith("/health") || req.url.startsWith("/api/")) {
      void reply.status(404).send({ error: "not found" });
      return;
    }
    void reply.sendFile("index.html");
  });
  fastify.log.info({ root }, "serving UI static assets");
}

await fastify.listen({ port, host });

const wss = new WebSocketServer({ server: fastify.server, path: "/ws" });
new Gateway(wss, { db });

fastify.log.info(`WebSocket ready at ws://${host}:${String(port)}/ws`);

// Graceful shutdown.
const shutdown = async (): Promise<void> => {
  fastify.log.info("shutting down");
  wss.close();
  await fastify.close();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
