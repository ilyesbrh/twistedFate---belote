/**
 * Thin client wrapper around a WebSocket to @belote/server.
 * Pure state plumbing — no React. Hooks wrap this.
 */
import { parseServerMessage } from "@belote/protocol";
import type { ClientMessage, ServerMessage } from "@belote/protocol";

export type OnlineStatus = "connecting" | "open" | "closed" | "error";

export interface OnlineClientOptions {
  readonly url: string;
}

export type MessageHandler = (msg: ServerMessage) => void;
export type StatusHandler = (status: OnlineStatus) => void;

export class OnlineClient {
  private _ws: WebSocket | null = null;
  private _status: OnlineStatus = "connecting";
  private readonly _msgHandlers = new Set<MessageHandler>();
  private readonly _statusHandlers = new Set<StatusHandler>();
  private readonly _url: string;

  constructor(options: OnlineClientOptions) {
    this._url = options.url;
  }

  get status(): OnlineStatus {
    return this._status;
  }

  connect(): void {
    if (this._ws) return;
    const ws = new WebSocket(this._url);
    this._ws = ws;
    ws.addEventListener("open", () => {
      this._setStatus("open");
    });
    ws.addEventListener("close", () => {
      this._setStatus("closed");
    });
    ws.addEventListener("error", () => {
      this._setStatus("error");
    });
    ws.addEventListener("message", (ev: MessageEvent<unknown>) => {
      const data = typeof ev.data === "string" ? ev.data : String(ev.data);
      let parsed: unknown;
      try {
        parsed = JSON.parse(data);
      } catch {
        return;
      }
      let msg: ServerMessage;
      try {
        msg = parseServerMessage(parsed);
      } catch {
        return;
      }
      for (const h of this._msgHandlers) h(msg);
    });
  }

  disconnect(): void {
    if (this._ws) {
      this._ws.close();
      this._ws = null;
    }
  }

  send(msg: ClientMessage): void {
    if (this._ws && this._ws.readyState === WebSocket.OPEN) {
      this._ws.send(JSON.stringify(msg));
    }
  }

  onMessage(h: MessageHandler): () => void {
    this._msgHandlers.add(h);
    return () => this._msgHandlers.delete(h);
  }

  onStatus(h: StatusHandler): () => void {
    this._statusHandlers.add(h);
    h(this._status);
    return () => this._statusHandlers.delete(h);
  }

  private _setStatus(s: OnlineStatus): void {
    this._status = s;
    for (const h of this._statusHandlers) h(s);
  }
}
