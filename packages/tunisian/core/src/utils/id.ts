export type EntityType =
  | "game"
  | "player"
  | "card"
  | "deck"
  | "trick"
  | "round"
  | "bidding_round"
  | "team"
  | "bid"
  | "contract"
  | "ui-component"
  | "animation-instance";

export interface IdGeneratorConfig {
  readonly seed?: number;
}

export interface IdGenerator {
  generateId(entityType: EntityType): string;
  reset(): void;
}

const BASE36_CHARS = "0123456789abcdefghijklmnopqrstuvwxyz";
const DETERMINISTIC_ID_LENGTH = 8;
const RANDOM_ID_LENGTH = 12;

function mulberry32(seed: number): () => number {
  let state = seed | 0;
  return (): number => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function toBase36Id(rng: () => number, length: number): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    const index = Math.floor(rng() * 36);
    result += BASE36_CHARS.charAt(index);
  }
  return result;
}

export function createIdGenerator(config: IdGeneratorConfig = {}): IdGenerator {
  const { seed } = config;

  if (seed !== undefined) {
    let rng = mulberry32(seed);
    return {
      generateId(entityType: EntityType): string {
        return `${entityType}_${toBase36Id(rng, DETERMINISTIC_ID_LENGTH)}`;
      },
      reset(): void {
        rng = mulberry32(seed);
      },
    };
  }

  return {
    generateId(entityType: EntityType): string {
      const uuid = crypto.randomUUID().replace(/-/g, "").slice(0, RANDOM_ID_LENGTH);
      return `${entityType}_${uuid}`;
    },
    reset(): void {
      // No-op in random mode
    },
  };
}

const defaultGenerator = createIdGenerator();

export function generateId(entityType: EntityType): string {
  return defaultGenerator.generateId(entityType);
}
