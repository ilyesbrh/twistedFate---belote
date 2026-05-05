/**
 * Profile API client.
 */
import { AuthApiError } from "../../auth/api.js";

export interface UserStats {
  readonly total: number;
  readonly wins: number;
  readonly losses: number;
  readonly winRate: number;
}

export interface PublicProfile {
  readonly id: string;
  readonly nickname: string;
  readonly avatarUrl: string | null;
  readonly createdAt: number;
  readonly stats: UserStats;
}

export interface SelfProfile extends PublicProfile {
  readonly email: string;
  readonly updatedAt: number;
}

export interface ProfilePatch {
  readonly nickname?: string;
  readonly avatarUrl?: string | null;
}

async function readError(res: Response): Promise<AuthApiError> {
  let code = `http_${String(res.status)}`;
  try {
    const body = (await res.json()) as { error?: unknown };
    if (typeof body.error === "string") code = body.error;
  } catch {
    // ignore
  }
  return new AuthApiError(code, res.status);
}

async function call(method: string, url: string, body?: unknown): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      credentials: "include",
      headers: body === undefined ? {} : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (e) {
    throw new AuthApiError("network", 0, e instanceof Error ? e.message : String(e));
  }
  if (res.status === 401) throw new AuthApiError("unauthenticated", 401);
  return res;
}

export async function apiGetProfile(id: string): Promise<PublicProfile | SelfProfile> {
  const res = await call("GET", `/api/users/${encodeURIComponent(id)}`);
  if (!res.ok) throw await readError(res);
  return (await res.json()) as PublicProfile | SelfProfile;
}

export async function apiUpdateMyProfile(patch: ProfilePatch): Promise<SelfProfile> {
  const res = await call("PATCH", "/api/users/me", patch);
  if (!res.ok) throw await readError(res);
  return (await res.json()) as SelfProfile;
}
