/**
 * App-level auth hook. Owns the React state for the current identity
 * (user or guest). Runs the preflight `/me` → guest-fallback dance on
 * mount, and exposes login / signup / logout actions.
 *
 * One instance per app. Other hooks (`useOnlineLobby`, future profile
 * components) read identity from this and don't refetch.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { Identity } from "@belote/protocol";
import {
  AuthApiError,
  apiGuest,
  apiLogin,
  apiLogout,
  apiMe,
  apiSignup,
  type LoginInput,
  type SignupInput,
} from "./api.js";

export type AuthStatus = "loading" | "ready" | "error";

export interface AuthState {
  readonly identity: Identity | null;
  readonly status: AuthStatus;
  /** Last error from a login/signup/logout call. Cleared on the next successful action. */
  readonly error: AuthApiError | null;
  login(input: LoginInput): Promise<void>;
  signup(input: SignupInput): Promise<void>;
  logout(): Promise<void>;
  /** Re-run the preflight (e.g. after a server-side cookie change). */
  refresh(): Promise<void>;
}

function userToIdentity(u: { id: string; nickname: string; avatarUrl: string | null }): Identity {
  return u.avatarUrl
    ? { kind: "user", id: u.id, nickname: u.nickname, avatarUrl: u.avatarUrl }
    : { kind: "user", id: u.id, nickname: u.nickname };
}

export function useAuth(): AuthState {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [error, setError] = useState<AuthApiError | null>(null);
  const mountedRef = useRef<boolean>(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const preflight = useCallback(async (): Promise<void> => {
    try {
      const me = await apiMe();
      if (!mountedRef.current) return;
      if (me) {
        setIdentity(toIdentity(me));
        setStatus("ready");
        return;
      }
      const guest = await apiGuest();
      if (!mountedRef.current) return;
      setIdentity({ kind: "guest", id: guest.id, nickname: guest.nickname });
      setStatus("ready");
    } catch (e) {
      if (!mountedRef.current) return;
      setError(e instanceof AuthApiError ? e : new AuthApiError("unknown", 0, String(e)));
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void preflight();
  }, [preflight]);

  const login = useCallback(async (input: LoginInput): Promise<void> => {
    setError(null);
    try {
      const user = await apiLogin(input);
      if (!mountedRef.current) return;
      setIdentity(userToIdentity(user));
    } catch (e) {
      if (!mountedRef.current) return;
      const err = e instanceof AuthApiError ? e : new AuthApiError("unknown", 0, String(e));
      setError(err);
      throw err;
    }
  }, []);

  const signup = useCallback(async (input: SignupInput): Promise<void> => {
    setError(null);
    try {
      const user = await apiSignup(input);
      if (!mountedRef.current) return;
      setIdentity(userToIdentity(user));
    } catch (e) {
      if (!mountedRef.current) return;
      const err = e instanceof AuthApiError ? e : new AuthApiError("unknown", 0, String(e));
      setError(err);
      throw err;
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      await apiLogout();
    } catch (e) {
      // Ignore — even if logout failed server-side, the user wants to drop the session.
      if (e instanceof AuthApiError) setError(e);
    }
    // Re-mint a fresh guest so anonymous play stays available.
    try {
      const guest = await apiGuest();
      if (!mountedRef.current) return;
      setIdentity({ kind: "guest", id: guest.id, nickname: guest.nickname });
    } catch (e) {
      if (!mountedRef.current) return;
      setIdentity(null);
      setError(e instanceof AuthApiError ? e : new AuthApiError("unknown", 0, String(e)));
    }
  }, []);

  return { identity, status, error, login, signup, logout, refresh: preflight };
}

function toIdentity(me: {
  kind: "user" | "guest";
  id: string;
  nickname: string;
  avatarUrl?: string;
}): Identity {
  return me.avatarUrl
    ? { kind: me.kind, id: me.id, nickname: me.nickname, avatarUrl: me.avatarUrl }
    : { kind: me.kind, id: me.id, nickname: me.nickname };
}
