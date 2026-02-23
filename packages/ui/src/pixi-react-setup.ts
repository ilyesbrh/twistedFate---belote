import { extend } from "@pixi/react";
import { Container, Graphics, Text, Sprite } from "pixi.js";
import { LayoutContainer } from "@pixi/layout/components";
import { FancyButton, ButtonContainer, MaskedFrame, Dialog } from "@pixi/ui";

// Apply Container mixin (adds `layout` property to all Containers)
import "@pixi/layout";
// Augment @pixi/react JSX types with layout elements (<layoutContainer>, etc.)
import "@pixi/layout/react";

/**
 * Register PixiJS display objects, layout components, and UI widgets
 * with @pixi/react's internal catalogue.
 * Must be called before any React PixiJS rendering.
 * Safe to call multiple times (idempotent).
 */
export function initPixiReact(): void {
  extend({
    // Core PixiJS
    Container,
    Graphics,
    Text,
    Sprite,
    // @pixi/layout
    LayoutContainer,
    // @pixi/ui
    FancyButton,
    ButtonContainer,
    MaskedFrame,
    Dialog,
  });
}
