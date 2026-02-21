// ====================================================================
// Deep freeze utility — recursively freezes an object and all nested
// objects. Used by theme.ts and layout.ts to produce immutable exports.
// ====================================================================

export function deepFreeze<T extends object>(obj: T): Readonly<T> {
  for (const value of Object.values(obj)) {
    if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
      deepFreeze(value as object);
    }
  }
  return Object.freeze(obj);
}
