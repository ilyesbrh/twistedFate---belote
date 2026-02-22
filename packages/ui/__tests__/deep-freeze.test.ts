import { describe, it, expect } from "vitest";
import { deepFreeze } from "../src/deep-freeze.js";

// ====================================================================
// deep-freeze — recursively freezes objects and nested structures.
// ====================================================================

describe("deepFreeze", () => {
  it("returns a frozen object", () => {
    const obj = { a: 1, b: "hello" };
    const frozen = deepFreeze(obj);
    expect(Object.isFrozen(frozen)).toBe(true);
  });

  it("freezes nested objects", () => {
    const obj = { outer: { inner: { value: 42 } } };
    const frozen = deepFreeze(obj);
    expect(Object.isFrozen(frozen)).toBe(true);
    expect(Object.isFrozen(frozen.outer)).toBe(true);
    expect(Object.isFrozen(frozen.outer.inner)).toBe(true);
  });

  it("freezes nested arrays", () => {
    const obj = { items: [1, 2, 3], nested: { list: ["a", "b"] } };
    const frozen = deepFreeze(obj);
    expect(Object.isFrozen(frozen)).toBe(true);
    expect(Object.isFrozen(frozen.items)).toBe(true);
    expect(Object.isFrozen(frozen.nested.list)).toBe(true);
  });

  it("freezes arrays containing objects", () => {
    const obj = { items: [{ x: 1 }, { x: 2 }] };
    const frozen = deepFreeze(obj);
    expect(Object.isFrozen(frozen.items[0]!)).toBe(true);
    expect(Object.isFrozen(frozen.items[1]!)).toBe(true);
  });

  it("throws when modifying a frozen property in strict mode", () => {
    "use strict";
    const obj = deepFreeze({ a: 1 });
    expect(() => {
      (obj as { a: number }).a = 2;
    }).toThrow(TypeError);
  });

  it("throws when modifying a nested frozen property in strict mode", () => {
    "use strict";
    const obj = deepFreeze({ outer: { inner: 10 } });
    expect(() => {
      (obj.outer as { inner: number }).inner = 99;
    }).toThrow(TypeError);
  });

  it("throws when pushing to a frozen array in strict mode", () => {
    "use strict";
    const obj = deepFreeze({ items: [1, 2, 3] });
    expect(() => {
      (obj.items as number[]).push(4);
    }).toThrow(TypeError);
  });

  it("returns the same object reference", () => {
    const obj = { value: "test" };
    const frozen = deepFreeze(obj);
    expect(frozen).toBe(obj);
  });

  it("handles objects with null values without errors", () => {
    const obj = { a: null, b: { c: null } };
    const frozen = deepFreeze(obj);
    expect(Object.isFrozen(frozen)).toBe(true);
    expect(Object.isFrozen(frozen.b)).toBe(true);
  });

  it("does not re-freeze already frozen nested objects", () => {
    const inner = Object.freeze({ x: 1 });
    const obj = { inner };
    const frozen = deepFreeze(obj);
    expect(Object.isFrozen(frozen)).toBe(true);
    expect(Object.isFrozen(frozen.inner)).toBe(true);
  });
});
