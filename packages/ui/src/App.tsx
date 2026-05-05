import { type ReactElement, Suspense, lazy, useEffect, useState } from "react";
import { GameTable, GameTableView } from "./components/GameTable/GameTable.js";
import { InstallPrompt } from "./components/InstallPrompt/InstallPrompt.js";
import { LoginScreen } from "./components/LoginScreen/LoginScreen.js";
import { ModeSelectScreen, type Mode } from "./components/ModeSelectScreen/ModeSelectScreen.js";
import { OnlineLobby } from "./components/OnlineLobby/OnlineLobby.js";
import { OnlineRandomScreen } from "./components/OnlineRandomScreen/OnlineRandomScreen.js";
import { SignupScreen } from "./components/SignupScreen/SignupScreen.js";
import { useAuth } from "./auth/useAuth.js";
import { useOnlineLobby } from "./online/useOnlineLobby.js";
import { useOnlineGameSession } from "./online/useOnlineGameSession.js";

const ScreenViewerHost = lazy(() => import("./dev/ScreenViewerHost.js"));

function shouldRenderDevScreens(): boolean {
  if (!import.meta.env.DEV) return false;
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has("screens");
}

const SUITS = ["hearts", "diamonds", "clubs", "spades"] as const;
const RANKS = ["7", "8", "9", "10", "jack", "queen", "king", "ace"] as const;
const CARD_SRCS = SUITS.flatMap((s) =>
  RANKS.map((r) => `${import.meta.env.BASE_URL}cards/${r}_of_${s}.png`),
);

type Screen = "menu" | "ai" | "online" | "random" | "login" | "signup";

/** Auto-jump into the online flow if a saved session is present in the URL. */
function initialScreen(): Screen {
  if (typeof window === "undefined") return "menu";
  const url = new URL(window.location.href);
  const code = url.searchParams.get("room");
  const pid = url.searchParams.get("pid");
  if (code && pid && /^[A-Z]{4}$/.test(code)) return "online";
  return "menu";
}

export default function App(): ReactElement {
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [gameKey, setGameKey] = useState(0);
  const [authPending, setAuthPending] = useState(false);
  const auth = useAuth();

  if (shouldRenderDevScreens()) {
    return (
      <Suspense fallback={null}>
        <ScreenViewerHost />
      </Suspense>
    );
  }

  // Block rendering while the auth preflight is in flight. Prevents the
  // online lobby from opening a WS before the cookie is minted.
  if (auth.status === "loading") {
    return null;
  }

  const handleSignIn = (): void => {
    setScreen("login");
  };
  const handleSignUp = (): void => {
    setScreen("signup");
  };
  const handleSignOut = async (): Promise<void> => {
    await auth.logout();
    setScreen("menu");
  };

  return (
    <>
      {/* Install banner only on the menu — it overlaps the in-game score panel. */}
      {screen === "menu" && <InstallPrompt />}
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
            else if (mode === "random") setScreen("random");
          }}
          identity={auth.identity}
          onSignIn={handleSignIn}
          onSignUp={handleSignUp}
          onSignOut={() => {
            void handleSignOut();
          }}
        />
      )}

      {screen === "login" && (
        <LoginScreen
          error={auth.error}
          loading={authPending}
          onSubmit={(input) => {
            setAuthPending(true);
            auth
              .login(input)
              .then(() => {
                setScreen("menu");
              })
              .catch(() => {
                // error is already on auth.error
              })
              .finally(() => {
                setAuthPending(false);
              });
          }}
          onGotoSignup={() => {
            setScreen("signup");
          }}
          onCancel={() => {
            setScreen("menu");
          }}
        />
      )}

      {screen === "signup" && (
        <SignupScreen
          error={auth.error}
          loading={authPending}
          onSubmit={(input) => {
            setAuthPending(true);
            auth
              .signup(input)
              .then(() => {
                setScreen("menu");
              })
              .catch(() => {
                // error is already on auth.error
              })
              .finally(() => {
                setAuthPending(false);
              });
          }}
          onGotoLogin={() => {
            setScreen("login");
          }}
          onCancel={() => {
            setScreen("menu");
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

      {screen === "online" && (
        <OnlineFlow
          onLeave={() => {
            setScreen("menu");
          }}
        />
      )}

      {screen === "random" && (
        <OnlineRandomFlow
          onLeave={() => {
            setScreen("menu");
          }}
        />
      )}
    </>
  );
}

function OnlineFlow({ onLeave }: { onLeave: () => void }): ReactElement {
  const lobby = useOnlineLobby();
  const sessionState = useOnlineGameSession(lobby);
  const [view, setView] = useState<"lobby" | "game">("lobby");

  // Auto-switch to the game view as soon as the server moves past the lobby phase.
  useEffect(() => {
    if (sessionState.phase !== "idle") setView("game");
  }, [sessionState.phase]);

  const leaveAndForget = (): void => {
    lobby.clearSavedSession();
    lobby.disconnect();
    onLeave();
  };

  if (view === "lobby") {
    return (
      <OnlineLobby lobby={lobby} onBack={leaveAndForget} onGameStarted={() => setView("game")} />
    );
  }
  return <GameTableView state={sessionState} onPlayAgain={leaveAndForget} />;
}

function OnlineRandomFlow({ onLeave }: { onLeave: () => void }): ReactElement {
  const lobby = useOnlineLobby();
  const sessionState = useOnlineGameSession(lobby);
  const [view, setView] = useState<"queue" | "game">("queue");

  // Once the server kicks the game past idle, show the table.
  useEffect(() => {
    if (sessionState.phase !== "idle") setView("game");
  }, [sessionState.phase]);

  const leaveAndForget = (): void => {
    if (lobby.phase === "queued") lobby.cancelRandom();
    lobby.clearSavedSession();
    lobby.disconnect();
    onLeave();
  };

  if (view === "queue") {
    const queuePhase = lobby.phase === "queued" ? "queued" : "idle";
    return (
      <OnlineRandomScreen
        phase={queuePhase}
        position={lobby.queuePosition}
        size={lobby.queueSize}
        status={lobby.status}
        error={lobby.error}
        onFind={(nickname) => {
          lobby.findRandom(nickname);
        }}
        onCancel={() => {
          lobby.cancelRandom();
        }}
        onBack={leaveAndForget}
      />
    );
  }
  return <GameTableView state={sessionState} onPlayAgain={leaveAndForget} />;
}
