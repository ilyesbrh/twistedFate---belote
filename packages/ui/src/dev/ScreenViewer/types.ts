import type { ReactElement } from "react";

export interface Fixture {
  /** Stable, kebab-case, unique across the whole registry. */
  readonly id: string;
  /** Human-readable label shown in the picker. */
  readonly title: string;
  /** Top-level grouping in the sidebar (e.g. "Menu", "Board", "Modal"). */
  readonly group: string;
  /** Returns the element to mount in the preview pane. Must be referentially safe to call repeatedly. */
  readonly render: () => ReactElement;
}

export interface ViewportPreset {
  readonly id: string;
  readonly label: string;
  /** `null` width means "fit available space" — the preview wrapper stretches to its parent. */
  readonly width: number | null;
  readonly height: number | null;
}

export const VIEWPORT_PRESETS: readonly ViewportPreset[] = [
  { id: "fit", label: "Fit", width: null, height: null },
  { id: "iphone-se", label: "iPhone SE (320×568)", width: 320, height: 568 },
  { id: "iphone-12", label: "iPhone 12+ (390×844)", width: 390, height: 844 },
  { id: "ipad", label: "iPad portrait (768×1024)", width: 768, height: 1024 },
  { id: "desktop", label: "Desktop (1280×800)", width: 1280, height: 800 },
];
