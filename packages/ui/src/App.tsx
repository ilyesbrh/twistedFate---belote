import { type ReactElement, Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate, useLocation } from "react-router-dom";
import { CoinchGameTable } from "./components/CoinchGameTable/CoinchGameTable.js";
import { FriendsScreen } from "./components/FriendsScreen/FriendsScreen.js";
import { GamePickerScreen } from "./components/GamePickerScreen/GamePickerScreen.js";
import { GameTable, GameTableView } from "./components/GameTable/GameTable.js";
import { HistoryScreen } from "./components/HistoryScreen/HistoryScreen.js";
import { InstallPrompt } from "./components/InstallPrompt/InstallPrompt.js";
import { LoginScreen } from "./components/LoginScreen/LoginScreen.js";
import { ModeSelectScreen, type Mode } from "./components/ModeSelectScreen/ModeSelectScreen.js";
import { OnlineLobby } from "./components/OnlineLobby/OnlineLobby.js";
import { OnlineRandomScreen } from "./components/OnlineRandomScreen/OnlineRandomScreen.js";
import { ProfileScreen } from "./components/ProfileScreen/ProfileScreen.js";
import { SignupScreen } from "./components/SignupScreen/SignupScreen.js";
import { useAuth } from "./auth/useAuth.js";
import { useOnlineLobby } from "./online/useOnlineLobby.js";
import { useOnlineGameSession } from "./online/useOnlineGameSession.js";
import { useMatchHistory } from "./online/useMatchHistory.js";
import { useFriends } from "./online/useFriends.js";
import {
  apiGetProfile,
  apiUpdateMyProfile,
  type ProfilePatch,
  type PublicProfile,
  type SelfProfile,
} from "./online/api/profile.js";
import { AuthApiError } from "./auth/api.js";
import { authErrorMessage } from "./auth/messages.js";

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

// ── Card preload (rendered invisibly on every route) ──────────────────────────

function CardPreload(): ReactElement {
  return (
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
  );
}

// ── Root: wraps everything in BrowserRouter ───────────────────────────────────

export default function App(): ReactElement {
  if (shouldRenderDevScreens()) {
    return (
      <Suspense fallback={null}>
        <ScreenViewerHost />
      </Suspense>
    );
  }

  // Strip the Vite base path to get a clean basename for the router.
  // import.meta.env.BASE_URL is "/twistedFate-belote/" in dev/prod.
  const base = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

  return (
    <BrowserRouter basename={base}>
      <CardPreload />
      <RoomDeepLinkRedirect />
      <AppRoutes />
    </BrowserRouter>
  );
}

/** Redirect ?room=XXXX&pid=YYY deep links to /belote/online (preserving query params). */
function RoomDeepLinkRedirect(): null {
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get("room");
    const pid = params.get("pid");
    if (code && pid && /^[A-Z]{4}$/.test(code) && location.pathname === "/") {
      void navigate(`/belote/online${location.search}`, { replace: true });
    }
  }, []); // runs once on mount
  return null;
}

// ── Route tree ────────────────────────────────────────────────────────────────

function AppRoutes(): ReactElement {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authPending, setAuthPending] = useState(false);

  // Block until auth resolves (prevents WS opening before cookie is minted).
  if (auth.status === "loading") return <></>;

  const handleSignIn = (): void => {
    void navigate("/signin");
  };
  const handleSignUp = (): void => {
    void navigate("/signup");
  };
  const handleSignOut = async (): Promise<void> => {
    await auth.logout();
    void navigate("/");
  };

  const authProps = {
    identity: auth.identity,
    onSignIn: handleSignIn,
    onSignUp: handleSignUp,
    onSignOut: () => void handleSignOut(),
  };

  const viewHistory =
    auth.identity?.kind === "user"
      ? (): void => {
          void navigate("/history");
        }
      : undefined;
  const viewFriends =
    auth.identity?.kind === "user"
      ? (): void => {
          void navigate("/friends");
        }
      : undefined;
  const viewProfile =
    auth.identity?.kind === "user"
      ? (): void => {
          void navigate("/profile");
        }
      : undefined;

  return (
    <Routes>
      {/* ── Game Picker ── */}
      <Route
        path="/"
        element={
          <GamePickerScreen
            {...authProps}
            onPickBelote={() => {
              void navigate("/belote");
            }}
            onPickCoinche={() => {
              void navigate("/coinche");
            }}
          />
        }
      />

      {/* ── Belote menu ── */}
      <Route
        path="/belote"
        element={
          <>
            <InstallPrompt />
            <ModeSelectScreen
              {...authProps}
              onSelect={(mode: Mode) => {
                if (mode === "ai") void navigate("/belote/ai");
                else if (mode === "friends") void navigate("/belote/online");
                else if (mode === "random") void navigate("/belote/random");
              }}
              onViewHistory={viewHistory}
              onViewFriends={viewFriends}
              onViewProfile={viewProfile}
            />
          </>
        }
      />

      {/* ── Belote AI ── */}
      <Route
        path="/belote/ai"
        element={
          <GameTable
            key={location.key}
            onPlayAgain={() => {
              void navigate("/belote");
            }}
            onBackToMenu={() => {
              void navigate("/belote");
            }}
          />
        }
      />

      {/* ── Belote Online lobby ── */}
      <Route
        path="/belote/online"
        element={
          <OnlineFlow
            onLeave={() => {
              void navigate("/belote");
            }}
          />
        }
      />

      {/* ── Belote Random matchmaking ── */}
      <Route
        path="/belote/random"
        element={
          <OnlineRandomFlow
            onLeave={() => {
              void navigate("/belote");
            }}
          />
        }
      />

      {/* ── Coinche menu ── */}
      <Route
        path="/coinche"
        element={
          <ModeSelectScreen
            {...authProps}
            gameName="Coinche"
            gameSubtitle="— Coinchée —"
            disabledModes={new Set<Mode>(["friends", "random", "ranked"])}
            onSelect={(mode: Mode) => {
              if (mode === "ai") void navigate("/coinche/ai");
            }}
            onViewHistory={viewHistory}
            onViewFriends={viewFriends}
            onViewProfile={viewProfile}
          />
        }
      />

      {/* ── Coinche AI ── */}
      <Route
        path="/coinche/ai"
        element={
          <CoinchGameTable
            key={location.key}
            onPlayAgain={() => {
              void navigate("/coinche");
            }}
            onBackToMenu={() => {
              void navigate("/coinche");
            }}
          />
        }
      />

      {/* ── Auth ── */}
      <Route
        path="/signin"
        element={
          <LoginScreen
            error={auth.error}
            loading={authPending}
            onSubmit={(input) => {
              setAuthPending(true);
              auth
                .login(input)
                .then(() => {
                  void navigate("/belote");
                })
                .catch(() => {
                  /* error on auth.error */
                })
                .finally(() => {
                  setAuthPending(false);
                });
            }}
            onGotoSignup={() => {
              void navigate("/signup");
            }}
            onCancel={() => {
              void navigate(-1);
            }}
          />
        }
      />
      <Route
        path="/signup"
        element={
          <SignupScreen
            error={auth.error}
            loading={authPending}
            onSubmit={(input) => {
              setAuthPending(true);
              auth
                .signup(input)
                .then(() => {
                  void navigate("/belote");
                })
                .catch(() => {
                  /* error on auth.error */
                })
                .finally(() => {
                  setAuthPending(false);
                });
            }}
            onGotoLogin={() => {
              void navigate("/signin");
            }}
            onCancel={() => {
              void navigate(-1);
            }}
          />
        }
      />

      {/* ── Account screens (require user auth) ── */}
      <Route
        path="/history"
        element={
          auth.identity?.kind === "user" ? (
            <HistoryScreenContainer
              currentUserId={auth.identity.id}
              onBack={() => {
                void navigate(-1);
              }}
            />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/friends"
        element={
          auth.identity?.kind === "user" ? (
            <FriendsScreenContainer
              onBack={() => {
                void navigate(-1);
              }}
            />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/profile"
        element={
          auth.identity?.kind === "user" ? (
            <ProfileScreenContainer
              userId={auth.identity.id}
              onBack={() => {
                void navigate(-1);
              }}
              onIdentityChanged={() => {
                void auth.refresh();
              }}
            />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ── Online flow containers ────────────────────────────────────────────────────

function OnlineFlow({ onLeave }: { onLeave: () => void }): ReactElement {
  const lobby = useOnlineLobby();
  const sessionState = useOnlineGameSession(lobby);
  const [view, setView] = useState<"lobby" | "game">("lobby");

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
      <OnlineLobby
        lobby={lobby}
        onBack={leaveAndForget}
        onGameStarted={() => {
          setView("game");
        }}
      />
    );
  }
  return (
    <GameTableView
      state={sessionState}
      onPlayAgain={leaveAndForget}
      onBackToMenu={leaveAndForget}
      gameOverMode={{ kind: "online-friends" }}
    />
  );
}

function OnlineRandomFlow({ onLeave }: { onLeave: () => void }): ReactElement {
  const lobby = useOnlineLobby();
  const sessionState = useOnlineGameSession(lobby);
  const [view, setView] = useState<"queue" | "game">("queue");

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
        nickname={lobby.identity?.nickname ?? ""}
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
  const findNewOpponents = (): void => {
    if (lobby.phase === "queued") lobby.cancelRandom();
    lobby.clearSavedSession();
    lobby.disconnect();
    const nick = lobby.identity?.nickname ?? "";
    lobby.findRandom(nick);
    setView("queue");
  };
  return (
    <GameTableView
      state={sessionState}
      onPlayAgain={leaveAndForget}
      onBackToMenu={leaveAndForget}
      onFindNewOpponents={findNewOpponents}
      gameOverMode={{ kind: "online-random" }}
    />
  );
}

// ── Account screen containers ─────────────────────────────────────────────────

function ProfileScreenContainer({
  userId,
  onBack,
  onIdentityChanged,
}: {
  userId: string;
  onBack: () => void;
  onIdentityChanged: () => void;
}): ReactElement {
  const [profile, setProfile] = useState<PublicProfile | SelfProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiGetProfile(userId)
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const code = e instanceof AuthApiError ? e.code : "unknown";
        setError(authErrorMessage(code));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const onSave = (patch: ProfilePatch): void => {
    setError(null);
    apiUpdateMyProfile(patch)
      .then((p) => {
        setProfile(p);
        onIdentityChanged();
      })
      .catch((e: unknown) => {
        const code = e instanceof AuthApiError ? e.code : "unknown";
        setError(authErrorMessage(code));
      });
  };

  return (
    <ProfileScreen
      profile={profile}
      isSelf
      loading={loading}
      error={error}
      onSave={onSave}
      onBack={onBack}
    />
  );
}

function FriendsScreenContainer({ onBack }: { onBack: () => void }): ReactElement {
  const f = useFriends();
  return (
    <FriendsScreen
      friends={f.friends}
      incoming={f.incoming}
      outgoing={f.outgoing}
      loading={f.loading}
      error={f.error}
      mutating={f.mutating}
      onSendRequest={(email) => {
        void f.sendRequest(email);
      }}
      onAccept={(id) => {
        void f.accept(id);
      }}
      onReject={(id) => {
        void f.reject(id);
      }}
      onCancel={(id) => {
        void f.cancel(id);
      }}
      onRemove={(userId) => {
        void f.remove(userId);
      }}
      onBack={onBack}
    />
  );
}

function HistoryScreenContainer({
  currentUserId,
  onBack,
}: {
  currentUserId: string;
  onBack: () => void;
}): ReactElement {
  const { matches, loading, error } = useMatchHistory();
  return (
    <HistoryScreen
      matches={matches}
      loading={loading}
      error={error}
      currentUserId={currentUserId}
      onBack={onBack}
    />
  );
}
