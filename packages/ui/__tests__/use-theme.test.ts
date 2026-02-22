import { describe, it, expect } from "vitest";

describe("useTheme", () => {
  it("exports useTheme function", async () => {
    const mod = await import("../src/hooks/use-theme.js");
    expect(mod.useTheme).toBeTypeOf("function");
  });

  it("returns the frozen THEME object", async () => {
    const { useTheme } = await import("../src/hooks/use-theme.js");
    const theme = useTheme();
    expect(theme).toBeDefined();
    expect(theme.colors).toBeDefined();
    expect(theme.typography).toBeDefined();
    expect(theme.spacing).toBeDefined();
    expect(Object.isFrozen(theme)).toBe(true);
  });

  it("returns the same object on repeated calls", async () => {
    const { useTheme } = await import("../src/hooks/use-theme.js");
    const a = useTheme();
    const b = useTheme();
    expect(a).toBe(b);
  });
});
