import type { Preview } from "@pixi/storybook-renderer";
import { THEME } from "../src/theme.js";

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    pixi: {
      applicationOptions: {
        background: THEME.colors.table.bgDark,
        antialias: true,
        autoDensity: true,
        resolution: window.devicePixelRatio,
        preference: "webgl",
      },
    },
  },
};

export default preview;
