import { type ReactElement, useEffect, useState } from "react";
import { GameTable } from "./components/GameTable/GameTable.js";
import { InstallPrompt } from "./components/InstallPrompt/InstallPrompt.js";
import { ModeSelectScreen, type Mode } from "./components/ModeSelectScreen/ModeSelectScreen.js";
import { OnlineLobby } from "./components/OnlineLobby/OnlineLobby.js";
import { OnlineGameView } from "./components/OnlineGameView/OnlineGameView.js";
import { useOnlineLobby } from "./online/useOnlineLobby.js";
import { useOnlineGame } from "./online/useOnlineGame.js";

const SUITS = ["hearts", "diamonds", "clubs", "spades"] as const;
const RANKS = ["7", "8", "9", "10", "jack", "queen", "king", "ace"] as const;
const CARD_SRCS = SUITS.flatMap((s) =>
  RANKS.map((r) => `${import.meta.env.BASE_URL}cards/${r}_of_${s}.png`),
);

type Screen = "menu" | "ai" | "online";

export default function App(): ReactElement {
  const [screen, setScreen] = useState<Screen>("menu");
  const [gameKey, setGameKey] = useState(0);

  return (
    <>
      <InstallPrompt />
      <div
        style={{
          position: "absolute",
          width: 0,
          height: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }}
        aria-hidden="true"
      >
        {CARD_SRCS.map((src) => (
          <img key={src} src={src} alt="" loading="eager" />
        ))}
      </div>

      {screen === "menu" && (
        <ModeSelectScreen
          onSelect={(mode: Mode) => {
            if (mode === "ai") setScreen("ai");
            else if (mode === "friends") setScreen("online");
          }}
        />
      )}

      {screen === "ai" && (
        <GameTable
          key={gameKey}
          onPlayAgain={() => {
            setGameKey((k) => k + 1);
            setScreen("menu");
          }}
        />
      )}

      {screen === "online" && <OnlineFlow onLeave={() => setScreen("menu")} />}
    </>
  );
}

function OnlineFlow({ onLeave }: { onLeave: () => void }): ReactElement {
  const lobby = useOnlineLobby();
  const game = useOnlineGame(lobby);
  const [view, setView] = useState<"lobby" | "game">("lobby");

  // Auto-switch to game view when the server has put us past the lobby phase.
  useEffect(() => {
    if (game.publicState && game.publicState.phase !== "lobby") {
      setView("game");
    }
  }, [game.publicState]);

  if (view === "lobby") {
    return (
      <OnlineLobby
        lobby={lobby}
        onBack={() => {
          lobby.disconnect();
          onLeave();
        }}
        onGameStarted={() => setView("game")}
      />
    );
  }
  return (
    <OnlineGameView
      lobby={lobby}
      game={game}
      onLeave={() => {
        lobby.disconnect();
        onLeave();
      }}
    />
  );
}
