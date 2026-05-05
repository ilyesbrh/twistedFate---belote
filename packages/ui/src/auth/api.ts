/**
 * Typed wrappers around the /api/auth/* endpoints.
 *
 * All requests use `credentials: "include"` so the `belote.sid` cookie
 * round-trips. Failed responses produce a `AuthApiError` carrying the
 * server-provided error code (e.g. "email_taken", "invalid_credentials"),
 * the HTTP status, and a human-readable message.
 */

export interface UserSummary {
  readonly id: string;
  readonly email: string;
  readonly nickname: string;
  readonly avatarUrl: string | null;
}

export interface MeIdentity {
  readonly kind: "user" | "guest";
  readonly id: string;
  readonly nickname: string;
  /** Only present when kind === "user". */
  readonly email?: string;
  readonly avatarUrl?: string;
}

export interface GuestIdentity {
  readonly kind: "guest";
  readonly id: string;
  readonly nickname: string;
}

export class AuthApiError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    message?: string,
  ) {
    super(message ?? code);
    this.name = "AuthApiError";
  }
}

const SIGNUP = "/api/auth/signup";
const LOGIN = "/api/auth/login";
const LOGOUT = "/api/auth/logout";
const ME = "/api/auth/me";
const GUEST = "/api/auth/guest";

interface ServerError {
  error?: unknown;
}

async function readError(res: Response): Promise<AuthApiError> {
  let body: ServerError = {};
  try {
    body = (await res.json()) as ServerError;
  } catch {
    // ignore — body wasn't JSON
  }
  const code = typeof body.error === "string" ? body.error : `http_${String(res.status)}`;
  return new AuthApiError(code, res.status);
}

async function postJson(url: string, payload?: unknown): Promise<Response> {
  try {
    return await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: payload === undefined ? {} : { "content-type": "application/json" },
      body: payload === undefined ? undefined : JSON.stringify(payload),
    });
  } catch (e) {
    throw new AuthApiError("network", 0, e instanceof Error ? e.message : String(e));
  }
}

async function getJson(url: string): Promise<Response> {
  try {
    return await fetch(url, { credentials: "include" });
  } catch (e) {
    throw new AuthApiError("network", 0, e instanceof Error ? e.message : String(e));
  }
}

export interface SignupInput {
  readonly email: string;
  readonly password: string;
  readonly nickname: string;
}

export async function apiSignup(input: SignupInput): Promise<UserSummary> {
  const res = await postJson(SIGNUP, input);
  if (!res.ok) throw await readError(res);
  return (await res.json()) as UserSummary;
}

export interface LoginInput {
  readonly email: string;
  readonly password: string;
}

export async function apiLogin(input: LoginInput): Promise<UserSummary> {
  const res = await postJson(LOGIN, input);
  if (!res.ok) throw await readError(res);
  return (await res.json()) as UserSummary;
}

export async function apiLogout(): Promise<void> {
  const res = await postJson(LOGOUT);
  if (!res.ok && res.status !== 204) {
    throw await readError(res);
  }
}

/**
 * Fetch the current identity. Returns `null` on 401 (caller decides
 * whether to treat that as "not logged in" or fall back to guest mint).
 */
export async function apiMe(): Promise<MeIdentity | null> {
  const res = await getJson(ME);
  if (res.status === 401) return null;
  if (!res.ok) throw await readError(res);
  return (await res.json()) as MeIdentity;
}

export interface GuestInput {
  readonly nickname?: string;
}

export async function apiGuest(input?: GuestInput): Promise<GuestIdentity> {
  const res = await postJson(GUEST, input ?? {});
  if (!res.ok) throw await readError(res);
  return (await res.json()) as GuestIdentity;
}
