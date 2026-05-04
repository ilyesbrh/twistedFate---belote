/**
 * FIFO matchmaking queue. Pure: no side effects, no transport.
 *
 * Pairs four players into a match. Re-enqueueing the same clientId is a no-op
 * (preserves the existing position) so reconnect/refresh storms can't grow
 * the queue past one slot per real client.
 */

export interface QueueEntry {
  readonly clientId: string;
  readonly nickname: string;
}

export type EnqueueResult =
  | {
      readonly matched: true;
      readonly group: readonly [QueueEntry, QueueEntry, QueueEntry, QueueEntry];
    }
  | { readonly matched: false; readonly position: number };

const GROUP_SIZE = 4;

export class MatchmakingQueue {
  private _entries: QueueEntry[] = [];

  get size(): number {
    return this._entries.length;
  }

  has(clientId: string): boolean {
    return this._entries.some((e) => e.clientId === clientId);
  }

  enqueue(entry: QueueEntry): EnqueueResult {
    const existingIdx = this._entries.findIndex((e) => e.clientId === entry.clientId);
    if (existingIdx >= 0) {
      return { matched: false, position: existingIdx + 1 };
    }
    this._entries.push(entry);
    if (this._entries.length >= GROUP_SIZE) {
      const head = this._entries.slice(0, GROUP_SIZE) as [
        QueueEntry,
        QueueEntry,
        QueueEntry,
        QueueEntry,
      ];
      this._entries = this._entries.slice(GROUP_SIZE);
      return { matched: true, group: head };
    }
    return { matched: false, position: this._entries.length };
  }

  cancel(clientId: string): boolean {
    const idx = this._entries.findIndex((e) => e.clientId === clientId);
    if (idx < 0) return false;
    this._entries.splice(idx, 1);
    return true;
  }

  /** Snapshot of current entries in FIFO order. Read-only. */
  get entries(): readonly QueueEntry[] {
    return this._entries;
  }
}
