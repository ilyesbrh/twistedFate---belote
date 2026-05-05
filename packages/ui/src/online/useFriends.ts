/**
 * Friends hook: loads /api/friends on mount + after every mutation.
 * Exposes the view + the five mutation actions wrapped to refetch on
 * success.
 */
import { useCallback, useEffect, useState } from "react";
import { AuthApiError } from "../auth/api.js";
import { authErrorMessage } from "../auth/messages.js";
import {
  apiAcceptFriendRequest,
  apiCancelFriendRequest,
  apiListFriends,
  apiRejectFriendRequest,
  apiRemoveFriend,
  apiSendFriendRequest,
  type FriendsView,
} from "./api/friends.js";

const EMPTY: FriendsView = { friends: [], incoming: [], outgoing: [] };

export interface FriendsState extends FriendsView {
  readonly loading: boolean;
  readonly error: string | null;
  readonly mutating: boolean;
  refresh(): Promise<void>;
  sendRequest(email: string): Promise<void>;
  accept(requestId: string): Promise<void>;
  reject(requestId: string): Promise<void>;
  cancel(requestId: string): Promise<void>;
  remove(userId: string): Promise<void>;
}

export function useFriends(): FriendsState {
  const [view, setView] = useState<FriendsView>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiListFriends();
      setView(data);
    } catch (e) {
      const code = e instanceof AuthApiError ? e.code : "unknown";
      setError(authErrorMessage(code));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const wrap = (fn: () => Promise<unknown>) => async (): Promise<void> => {
    setMutating(true);
    setError(null);
    try {
      await fn();
      await refresh();
    } catch (e) {
      const code = e instanceof AuthApiError ? e.code : "unknown";
      setError(authErrorMessage(code));
    } finally {
      setMutating(false);
    }
  };

  return {
    ...view,
    loading,
    error,
    mutating,
    refresh,
    sendRequest: (email: string) => wrap(() => apiSendFriendRequest(email))(),
    accept: (requestId: string) => wrap(() => apiAcceptFriendRequest(requestId))(),
    reject: (requestId: string) => wrap(() => apiRejectFriendRequest(requestId))(),
    cancel: (requestId: string) => wrap(() => apiCancelFriendRequest(requestId))(),
    remove: (userId: string) => wrap(() => apiRemoveFriend(userId))(),
  };
}
