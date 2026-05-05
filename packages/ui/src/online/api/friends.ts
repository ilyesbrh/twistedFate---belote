/**
 * Friends API client. All endpoints require a user session and
 * surface AuthApiError("unauthenticated") on 401 so the caller can
 * route to /login.
 */
import { AuthApiError } from "../../auth/api.js";

export interface Friend {
  readonly userId: string;
  readonly email: string;
  readonly nickname: string;
  readonly avatarUrl: string | null;
}

export interface FriendRequest {
  readonly id: string;
  readonly otherUserId: string;
  readonly otherEmail: string;
  readonly otherNickname: string;
  readonly createdAt: number;
}

export interface FriendsView {
  readonly friends: readonly Friend[];
  readonly incoming: readonly FriendRequest[];
  readonly outgoing: readonly FriendRequest[];
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

export async function apiListFriends(): Promise<FriendsView> {
  const res = await call("GET", "/api/friends");
  if (!res.ok) throw await readError(res);
  return (await res.json()) as FriendsView;
}

export async function apiSendFriendRequest(email: string): Promise<{ id: string }> {
  const res = await call("POST", "/api/friends/requests", { email });
  if (!res.ok) throw await readError(res);
  return (await res.json()) as { id: string };
}

export async function apiAcceptFriendRequest(id: string): Promise<void> {
  const res = await call("POST", `/api/friends/requests/${encodeURIComponent(id)}/accept`);
  if (!res.ok && res.status !== 204) throw await readError(res);
}

export async function apiRejectFriendRequest(id: string): Promise<void> {
  const res = await call("POST", `/api/friends/requests/${encodeURIComponent(id)}/reject`);
  if (!res.ok && res.status !== 204) throw await readError(res);
}

export async function apiCancelFriendRequest(id: string): Promise<void> {
  const res = await call("DELETE", `/api/friends/requests/${encodeURIComponent(id)}`);
  if (!res.ok && res.status !== 204) throw await readError(res);
}

export async function apiRemoveFriend(userId: string): Promise<void> {
  const res = await call("DELETE", `/api/friends/${encodeURIComponent(userId)}`);
  if (!res.ok && res.status !== 204) throw await readError(res);
}
