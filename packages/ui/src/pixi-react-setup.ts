import { extend } from "@pixi/react";
import { Container, Graphics, Text, Sprite } from "pixi.js";
import { LayoutContainer } from "@pixi/layout/components";
import { FancyButton, ButtonContainer } from "@pixi/ui";

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
  });
}
