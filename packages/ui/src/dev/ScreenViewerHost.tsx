import { type ReactElement } from "react";
import { ScreenViewer } from "./ScreenViewer/ScreenViewer.js";
import { fixtures } from "./fixtures/index.js";

/** Dev-only host: pairs the ScreenViewer with the live fixture registry. */
export default function ScreenViewerHost(): ReactElement {
  return <ScreenViewer fixtures={fixtures} />;
}
