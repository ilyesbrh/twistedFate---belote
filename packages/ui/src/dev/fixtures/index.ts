import type { Fixture } from "../ScreenViewer/types.js";
import { startScreenFixtures } from "./startScreen.fixtures.js";
import { chatButtonFixtures } from "./chatButton.fixtures.js";
import { trumpIndicatorFixtures } from "./trumpIndicator.fixtures.js";
import { playerAvatarFixtures } from "./playerAvatar.fixtures.js";
import { modeSelectScreenFixtures } from "./modeSelectScreen.fixtures.js";
import { scorePanelFixtures } from "./scorePanel.fixtures.js";
import { gameOverFixtures } from "./gameOver.fixtures.js";
import { chatPanelFixtures } from "./chatPanel.fixtures.js";
import { bidPanelFixtures } from "./bidPanel.fixtures.js";
import { bidWinRevealFixtures } from "./bidWinReveal.fixtures.js";
import { coinchBidPanelFixtures } from "./coinchBidPanel.fixtures.js";
import { onlineRandomScreenFixtures } from "./onlineRandomScreen.fixtures.js";
import { onlineLobbyFixtures } from "./onlineLobby.fixtures.js";
import { roundSummaryFixtures } from "./roundSummary.fixtures.js";
import { gameTableViewFixtures } from "./gameTableView.fixtures.js";

export const fixtures: readonly Fixture[] = [
  ...startScreenFixtures,
  ...modeSelectScreenFixtures,
  ...onlineLobbyFixtures,
  ...onlineRandomScreenFixtures,
  ...gameTableViewFixtures,
  ...bidPanelFixtures,
  ...bidWinRevealFixtures,
  ...coinchBidPanelFixtures,
  ...scorePanelFixtures,
  ...roundSummaryFixtures,
  ...chatPanelFixtures,
  ...gameOverFixtures,
  ...chatButtonFixtures,
  ...trumpIndicatorFixtures,
  ...playerAvatarFixtures,
];
