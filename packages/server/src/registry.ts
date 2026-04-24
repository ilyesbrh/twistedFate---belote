import { Room, type Broadcaster } from "./room.js";

export interface RoomRegistryConfig {
  readonly codeGenerator?: () => string;
  readonly maxRetries?: number;
}

function defaultCodeGenerator(): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let s = "";
  for (let i = 0; i < 4; i++) {
    s += letters[Math.floor(Math.random() * letters.length)];
  }
  return s;
}

export class RoomRegistry {
  private readonly _rooms = new Map<string, Room>();
  private readonly _gen: () => string;
  private readonly _maxRetries: number;

  constructor(config: RoomRegistryConfig = {}) {
    this._gen = config.codeGenerator ?? defaultCodeGenerator;
    this._maxRetries = config.maxRetries ?? 16;
  }

  createRoom(broadcaster: Broadcaster): Room {
    for (let attempt = 0; attempt < this._maxRetries; attempt++) {
      const code = this._gen();
      if (!this._rooms.has(code)) {
        const room = new Room(code, broadcaster);
        this._rooms.set(code, room);
        return room;
      }
    }
    throw new Error("ROOM_CODE_EXHAUSTED");
  }

  lookup(code: string): Room | undefined {
    return this._rooms.get(code);
  }

  delete(code: string): void {
    this._rooms.delete(code);
  }

  get size(): number {
    return this._rooms.size;
  }
}
