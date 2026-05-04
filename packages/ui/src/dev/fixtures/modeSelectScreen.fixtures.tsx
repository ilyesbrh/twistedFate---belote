import { ModeSelectScreen } from "../../components/ModeSelectScreen/ModeSelectScreen.js";
import type { Fixture } from "../ScreenViewer/types.js";

const noop = (): void => {
  /* fixture: no-op */
};

export const modeSelectScreenFixtures: readonly Fixture[] = [
  {
    id: "mode-select-default",
    title: "Default",
    group: "ModeSelectScreen",
    render: () => <ModeSelectScreen onSelect={noop} />,
  },
];
