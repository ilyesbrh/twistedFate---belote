import { useEffect, useState } from "react";
import type { OnlineLobbyState } from "./useOnlineLobby.js";
import type { Seat, ServerMessage } from "@belote/protocol";

export interface OnlineCard {
  readonly id: string;
  readonly suit: "hearts" | "spades" | "diamonds" | "clubs";
  readonly rank: string;
}

export interface OnlinePublicState {
  readonly phase: "lobby" | "bidding" | "playing" | "round_complete" | "game_complete";
  readonly round: {
    readonly biddingRound: {
      readonly bids: readonly unknown[];
      readonly currentPlayerPosition: Seat;
      readonly highestBid: { readonly value: number; readonly suit: string } | null;
      readonly state: string;
    };
    readonly contract: {
      readonly suit: string;
      readonly value: number;
      readonly bidderPosition: Seat;
    } | null;
    readonly currentTrick: {
      readonly leadingPlayerPosition: Seat;
      readonly cards: readonly { readonly card: OnlineCard; readonly playerPosition: Seat }[];
    } | null;
    readonly tricks: readonly unknown[];
  } | null;
  readonly scores: readonly [number, number];
  readonly targetScore: number | null;
  readonly players: readonly { readonly seat: Seat; readonly nickname: string | null }[];
}

export interface OnlineGameState {
  readonly publicState: OnlinePublicState | null;
  readonly hand: readonly OnlineCard[];
  readonly legalCardIds: ReadonlySet<string>;
  readonly mySeat: Seat | null;
  readonly events: readonly { readonly type: string; readonly [k: string]: unknown }[];
  readonly lastError: string | null;
  /** Convenience derived flags. */
  readonly isMyBiddingTurn: boolean;
  readonly isMyPlayingTurn: boolean;
}

export function useOnlineGame(lobby: OnlineLobbyState): OnlineGameState {
  const [publicState, setPublicState] = useState<OnlinePublicState | null>(null);
  const [hand, setHand] = useState<readonly OnlineCard[]>([]);
  const [legalCardIds, setLegalCardIds] = useState<ReadonlySet<string>>(new Set());
  const [events, setEvents] = useState<{ type: string; [k: string]: unknown }[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    const off = lobby.client.onMessage((msg: ServerMessage) => {
      switch (msg.type) {
        case "public_state":
          setPublicState(msg.state as unknown as OnlinePublicState);
          return;
        case "private_state":
          if (msg.seat === lobby.seat) {
            setHand(msg.hand as readonly OnlineCard[]);
            setLegalCardIds(new Set(msg.legalCardIds));
          }
          return;
        case "event":
          setEvents((prev) => [...prev, msg.event as { type: string; [k: string]: unknown }]);
          return;
        case "error":
          setLastError(`${msg.code}: ${msg.reason}`);
          return;
      }
    });
    return off;
  }, [lobby.client, lobby.seat]);

  let isMyBiddingTurn = false;
  let isMyPlayingTurn = false;
  if (publicState && lobby.seat !== null) {
    if (publicState.phase === "bidding" && publicState.round) {
      isMyBiddingTurn = publicState.round.biddingRound.currentPlayerPosition === lobby.seat;
    }
    if (publicState.phase === "playing" && publicState.round?.currentTrick) {
      const trick = publicState.round.currentTrick;
      const nextSeat = ((trick.leadingPlayerPosition + trick.cards.length) % 4) as Seat;
      isMyPlayingTurn = nextSeat === lobby.seat;
    }
  }

  return {
    publicState,
    hand,
    legalCardIds,
    mySeat: lobby.seat,
    events,
    lastError,
    isMyBiddingTurn,
    isMyPlayingTurn,
  };
}
