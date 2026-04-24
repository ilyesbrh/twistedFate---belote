/**
 * Belote server entry point.
 *   pnpm --filter @belote/server dev   (live-reload via tsx watch)
 *   pnpm --filter @belote/server start
 * Default port: 4100. Override with PORT env.
 */
import Fastify from "fastify";
import { WebSocketServer } from "ws";
import { Gateway } from "../gateway.js";

const port = Number(process.env["PORT"] ?? 4100);
const host = process.env["HOST"] ?? "0.0.0.0";

const fastify = Fastify({ logger: true });

// Health endpoint (useful for sanity checks and container probes).
fastify.get("/health", async () => ({ ok: true }));

await fastify.listen({ port, host });

const wss = new WebSocketServer({ server: fastify.server, path: "/ws" });
new Gateway(wss);

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
