import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import { Gateway } from "../src/gateway.js";
import type { ClientMessage, ServerMessage } from "@belote/protocol";

type HttpServer = ReturnType<typeof createServer>;

interface Harness {
  port: number;
  httpServer: HttpServer;
  wss: WebSocketServer;
  gateway: Gateway;
}

async function startServer(codeGenerator?: () => string): Promise<Harness> {
  const httpServer = createServer();
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  const gateway = new Gateway(wss, codeGenerator ? { codeGenerator } : {});
  await new Promise<void>((resolve) => {
    httpServer.listen(0, () => {
      resolve();
    });
  });
  const addr = httpServer.address();
  if (!addr || typeof addr === "string") throw new Error("no address");
  return { port: addr.port, httpServer, wss, gateway };
}

async function stopServer(h: Harness): Promise<void> {
  // Force-terminate any lingering client connections first so close() resolves.
  for (const client of h.wss.clients) client.terminate();
  await h.gateway.close();
  await new Promise<void>((resolve) => h.httpServer.close(() => resolve()));
}

/**
 * Minimal client wrapper: connect, collect inbound messages, expose `send`,
 * and a helper to await the next message matching a predicate.
 */
class TestClient {
  readonly ws: WebSocket;
  readonly inbox: ServerMessage[] = [];
  private _cursor = 0;
  private readonly _listeners: Array<(msg: ServerMessage) => void> = [];

  constructor(port: number) {
    this.ws = new WebSocket(`ws://127.0.0.1:${String(port)}/ws`);
    this.ws.on("message", (data) => {
      const msg = JSON.parse(data.toString()) as ServerMessage;
      this.inbox.push(msg);
      for (const fn of [...this._listeners]) fn(msg);
    });
  }

  async open(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.ws.once("open", () => resolve());
      this.ws.once("error", reject);
    });
  }

  send(msg: ClientMessage): void {
    this.ws.send(JSON.stringify(msg));
  }

  close(): void {
    if (this.ws.readyState === this.ws.OPEN) this.ws.close();
  }

  /**
   * Wait until a new (post-cursor) message matches. Returns the matched
   * message and advances the cursor past it, so repeat waitFor calls pick
   * up subsequent matches.
   */
  async waitFor<T extends ServerMessage["type"]>(
    type: T,
    predicate?: (msg: Extract<ServerMessage, { type: T }>) => boolean,
    timeoutMs = 3000,
  ): Promise<Extract<ServerMessage, { type: T }>> {
    const check = (msg: ServerMessage): Extract<ServerMessage, { type: T }> | null => {
      if (msg.type !== type) return null;
      const typed = msg as Extract<ServerMessage, { type: T }>;
      if (predicate && !predicate(typed)) return null;
      return typed;
    };
    // Scan un-consumed inbox.
    while (this._cursor < this.inbox.length) {
      const m = this.inbox[this._cursor]!;
      this._cursor += 1;
      const match = check(m);
      if (match) return match;
    }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this._listeners.splice(this._listeners.indexOf(listener), 1);
        reject(new Error(`waitFor(${type}) timed out`));
      }, timeoutMs);
      const listener = (msg: ServerMessage): void => {
        this._cursor = this.inbox.length; // advance cursor past observed
        const match = check(msg);
        if (match) {
          clearTimeout(timer);
          this._listeners.splice(this._listeners.indexOf(listener), 1);
          resolve(match);
        }
      };
      this._listeners.push(listener);
    });
  }
}

describe("Gateway — 4 real ws clients", () => {
  let h: Harness;
  beforeEach(async () => {
    h = await startServer(makeCodeGenerator(["WXYZ"]));
  });
  afterEach(async () => {
    await stopServer(h);
  });

  it("handshake → create_room → 3 joins → player_joined broadcasts", async () => {
    const c1 = new TestClient(h.port);
    await c1.open();
    await c1.waitFor("hello_ack");
    c1.send({ type: "hello", nickname: "Alice" });
    c1.send({ type: "create_room" });
    const created = await c1.waitFor("room_created");
    expect(created.code).toBe("WXYZ");
    expect(created.seat).toBe(0);

    const c2 = new TestClient(h.port);
    const c3 = new TestClient(h.port);
    const c4 = new TestClient(h.port);
    await Promise.all([c2.open(), c3.open(), c4.open()]);
    for (const c of [c2, c3, c4]) await c.waitFor("hello_ack");

    c2.send({ type: "hello", nickname: "Bob" });
    c2.send({ type: "join_room", code: "WXYZ" });
    const joined2 = await c2.waitFor("room_joined");
    expect(joined2.seat).toBe(1);

    c3.send({ type: "hello", nickname: "Carol" });
    c3.send({ type: "join_room", code: "WXYZ" });
    expect((await c3.waitFor("room_joined")).seat).toBe(2);

    c4.send({ type: "hello", nickname: "Dave" });
    c4.send({ type: "join_room", code: "WXYZ" });
    expect((await c4.waitFor("room_joined")).seat).toBe(3);

    // Everyone should eventually see all four player_joined broadcasts.
    // Count how many player_joined messages seat=3 c1 has received.
    await new Promise((r) => setTimeout(r, 100));
    const playerJoinedCount = c1.inbox.filter((m) => m.type === "player_joined").length;
    expect(playerJoinedCount).toBe(4); // one for each join (including own)

    for (const c of [c1, c2, c3, c4]) c.close();
  });

  it("start_game yields public_state and private_state per seat", async () => {
    const clients = [
      new TestClient(h.port),
      new TestClient(h.port),
      new TestClient(h.port),
      new TestClient(h.port),
    ];
    await Promise.all(clients.map((c) => c.open()));
    for (const c of clients) await c.waitFor("hello_ack");

    clients[0]!.send({ type: "hello", nickname: "A" });
    clients[0]!.send({ type: "create_room" });
    const created = await clients[0]!.waitFor("room_created");

    for (let i = 1; i < 4; i++) {
      clients[i]!.send({ type: "hello", nickname: "P" + String(i) });
      clients[i]!.send({ type: "join_room", code: created.code });
      await clients[i]!.waitFor("room_joined");
    }

    clients[0]!.send({ type: "start_game", targetScore: 501 });

    const pub = await clients[0]!.waitFor("public_state", (m) => m.state["phase"] === "bidding");
    expect(pub.state["phase"]).toBe("bidding");

    // Each client should receive a private_state with 8 cards for their seat.
    for (let i = 0; i < 4; i++) {
      const priv = await clients[i]!.waitFor("private_state");
      expect(priv.seat).toBe(i);
      expect(priv.hand.length).toBe(8);
    }

    for (const c of clients) c.close();
  });

  it("rejects invalid JSON and unknown message types with error", async () => {
    const c = new TestClient(h.port);
    await c.open();
    await c.waitFor("hello_ack");
    c.ws.send("not json at all");
    const err1 = await c.waitFor("error");
    expect(err1.code).toBe("BAD_JSON");

    c.ws.send(JSON.stringify({ type: "bogus" }));
    const err2 = await c.waitFor("error");
    expect(err2.code).toBe("BAD_MESSAGE");
    c.close();
  });
});

function makeCodeGenerator(codes: string[]): () => string {
  let i = 0;
  const fallback = "QQQQ";
  return () => codes[i++] ?? fallback;
}
