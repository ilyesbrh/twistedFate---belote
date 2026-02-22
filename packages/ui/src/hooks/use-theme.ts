import { THEME } from "../theme.js";
import type { Theme } from "../theme.js";

/**
 * Returns the frozen THEME design tokens.
 *
 * Currently a plain function (not a React hook) so it can be used
 * in both React components and non-React code. When we add runtime
 * theme switching, this will become a true React hook backed by context.
 */
export function useTheme(): Readonly<Theme> {
  return THEME;
}
