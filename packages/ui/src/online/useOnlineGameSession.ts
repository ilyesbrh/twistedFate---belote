/**
 * Adapter that turns the server-driven online lobby into a
 * `GameSessionState` shaped object so the regular `<GameTableView>` can
 * render online play with identical visuals to the AI mode.
 *
 * Seat rotation: the local player is always shown at the SOUTH visual
 * position. We rotate seats → visual positions using
 *   visual = (seat - mySeat + 4) % 4
 *   south=0, west=1, north=2, east=3
 */
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { BID_VALUES, calculateRunningPoints, getCardRankOrder, isOnSameTeam } from "@belote/core";
import type {
  BidValue,
  BiddingRound,
  Card,
  Contract,
  PlayerPosition,
  RoundScore,
  Suit,
} from "@belote/core";
import type { Seat, ServerMessage } from "@belote/protocol";
import type { OnlineLobbyState } from "./useOnlineLobby.js";
import type { GameSessionState, GamePhase, LastRoundResult } from "../hooks/useGameSession.js";
import type { CardData, PlayerData, Position, TrickCardData } from "../data/mockGame.js";
import { eventToMessage, createBeloteMessage } from "../messages/gameMessages.js";
import type { GameMessage, ProfileLookup } from "../messages/gameMessages.js";

const VISUAL_POS: readonly Position[] = ["south", "west", "north", "east"];

const TRICK_OFFSETS: Record<Position, { rotation: number; offsetX: number; offsetY: number }> = {
  south: { rotation: 5, offsetX: 6, offsetY: 12 },
  north: { rotation: -4, offsetX: -6, offsetY: -12 },
  west: { rotation: -8, offsetX: -14, offsetY: 4 },
  east: { rotation: 9, offsetX: 14, offsetY: -4 },
};

/** Stable avatar URL based on nickname (so two players with same name still differ via avatarUrl param). */
function avatarFor(nickname: string, seat: Seat): string {
  return `https://i.pravatar.cc/150?u=belote-${encodeURIComponent(nickname)}-${String(seat)}`;
}

interface OnlineRoundShape {
  readonly dealerPosition: PlayerPosition;
  readonly phase: "bidding" | "playing" | "completed" | "cancelled";
  readonly biddingRound: BiddingRound;
  readonly contract: Contract | null;
  readonly tricks: readonly {
    readonly winnerPosition: PlayerPosition | null;
    readonly cards: readonly { readonly card: Card; readonly playerPosition: PlayerPosition }[];
  }[];
  readonly currentTrick: {
    readonly leadingPlayerPosition: PlayerPosition;
    readonly cards: readonly { readonly card: Card; readonly playerPosition: PlayerPosition }[];
  } | null;
}

interface OnlinePublicShape {
  readonly phase: "lobby" | "bidding" | "playing" | "round_complete" | "game_complete";
  readonly round: OnlineRoundShape | null;
  readonly scores: readonly [number, number];
  readonly targetScore: number | null;
  readonly roundNumber: number;
  readonly players: readonly { readonly seat: Seat; readonly nickname: string | null }[];
}

export function useOnlineGameSession(lobby: OnlineLobbyState): GameSessionState {
  const [pub, setPub] = useState<OnlinePublicShape | null>(null);
  const [hand, setHand] = useState<readonly Card[]>([]);
  const [legalIds, setLegalIds] = useState<ReadonlySet<string>>(new Set());
  const [lastRoundResult, setLastRoundResult] = useState<LastRoundResult | null>(null);
  const [delayedWinner, setDelayedWinner] = useState<0 | 1 | null>(null);
  const [messages, setMessages] = useState<GameMessage[]>([]);
  /**
   * Holds a completed trick during the sweep animation. Mirrors
   * `useGameSession.completedTrick`: the public state will clear
   * `currentTrick` immediately after `trick_completed`, but we want to keep
   * the 4 cards visible for ~700ms then sweep them toward the winner.
   */
  const [completedTrick, setCompletedTrick] = useState<{
    cards: TrickCardData[];
    winnerPosition: Position | null;
  } | null>(null);
  const [bubbles, setBubbles] = useState<Record<Position, GameMessage | null>>({
    south: null,
    north: null,
    west: null,
    east: null,
  });

  // Refs for state we read inside the WS subscription without triggering re-subscribes.
  const pubRef = useRef<OnlinePublicShape | null>(null);
  const handRef = useRef<readonly Card[]>([]);
  const mySeatRef = useRef<Seat>(0);
  pubRef.current = pub;
  handRef.current = hand;
  mySeatRef.current = (lobby.seat ?? 0) as Seat;

  // Per-round Belote tracking: which trump-court (Q/K) cards each seat has played.
  const beloteHistory = useRef<Record<number, { q: boolean; k: boolean }>>({
    0: { q: false, k: false },
    1: { q: false, k: false },
    2: { q: false, k: false },
    3: { q: false, k: false },
  });
  // Per-position bubble auto-dismiss timers.
  const bubbleTimers = useRef<Record<Position, ReturnType<typeof setTimeout> | null>>({
    south: null,
    north: null,
    west: null,
    east: null,
  });

  const showBubble = useCallback((msg: GameMessage) => {
    const pos = msg.position;
    if (bubbleTimers.current[pos]) clearTimeout(bubbleTimers.current[pos]!);
    setBubbles((prev) => ({ ...prev, [pos]: msg }));
    bubbleTimers.current[pos] = setTimeout(() => {
      setBubbles((prev) => ({ ...prev, [pos]: null }));
      bubbleTimers.current[pos] = null;
    }, 4000);
  }, []);

  const seatToPos = useCallback((seat: number): Position => {
    const v = (seat - mySeatRef.current + 4) % 4;
    return VISUAL_POS[v]!;
  }, []);

  const buildProfiles = useCallback((): ProfileLookup => {
    const profiles: ProfileLookup = {};
    for (const p of pubRef.current?.players ?? []) {
      profiles[p.seat] = { name: p.nickname ?? `Seat ${String(p.seat + 1)}` };
    }
    return profiles;
  }, []);

  /** Re-emit a message after rotating its position to match this client's seat. */
  const rotateMessage = useCallback(
    (msg: GameMessage, actualSeat: number): GameMessage => {
      return { ...msg, position: seatToPos(actualSeat) };
    },
    [seatToPos],
  );

  useEffect(() => {
    const off = lobby.client.onMessage((msg: ServerMessage) => {
      switch (msg.type) {
        case "public_state":
          setPub(msg.state as unknown as OnlinePublicShape);
          return;
        case "private_state":
          if (msg.seat === lobby.seat) {
            setHand(msg.hand as readonly Card[]);
            setLegalIds(new Set(msg.legalCardIds));
          }
          return;
        case "event": {
          const ev = msg.event as Record<string, unknown> & { type?: string };
          handleEvent(ev);
          return;
        }
      }
    });

    function handleEvent(ev: Record<string, unknown> & { type?: string }): void {
      const profiles = buildProfiles();

      // Reset belote tracker on round_started.
      if (ev.type === "round_started") {
        beloteHistory.current = {
          0: { q: false, k: false },
          1: { q: false, k: false },
          2: { q: false, k: false },
          3: { q: false, k: false },
        };
      }

      // Trick sweep animation — same 3-phase choreography as the local AI hook.
      if (ev.type === "trick_completed") {
        const trick = ev["trick"] as
          | {
              cards?: { card?: { suit?: string; rank?: string }; playerPosition?: number }[];
            }
          | undefined;
        const winnerSeat = ev["winnerPosition"] as number | undefined;
        if (trick?.cards && winnerSeat !== undefined) {
          const winnerVisual = seatToPos(winnerSeat);
          const cards: TrickCardData[] = trick.cards
            .filter((pc) => pc.card?.suit && pc.card?.rank && pc.playerPosition !== undefined)
            .map((pc) => {
              const visual = seatToPos(pc.playerPosition!);
              return {
                suit: pc.card!.suit as Suit,
                rank: pc.card!.rank as TrickCardData["rank"],
                position: visual,
                ...TRICK_OFFSETS[visual],
              };
            });
          // Phase 1: keep cards on the felt, no winner yet (no sweep).
          setCompletedTrick({ cards, winnerPosition: null });
          // Phase 2: trigger sweep toward the winner after ~700ms.
          setTimeout(() => {
            setCompletedTrick({ cards, winnerPosition: winnerVisual });
          }, 700);
          // Phase 3: clear the overlay after the sweep completes.
          setTimeout(() => {
            setCompletedTrick(null);
          }, 1400);
        }
      }

      // Belote / Rebelote announcement on card_played.
      if (ev.type === "card_played") {
        const card = ev["card"] as { suit?: string; rank?: string } | undefined;
        const playerPos = ev["playerPosition"] as number | undefined;
        const trump = pubRef.current?.round?.contract?.suit ?? null;
        if (
          trump &&
          card &&
          playerPos !== undefined &&
          card.suit === trump &&
          (card.rank === "queen" || card.rank === "king")
        ) {
          const hist = beloteHistory.current[playerPos]!;
          const wasQ = hist.q;
          const wasK = hist.k;
          if (card.rank === "queen") hist.q = true;
          if (card.rank === "king") hist.k = true;
          // Detection: announce the FIRST time we see a trump Q or K only if
          // we know the player has both. We can know that for OUR own seat
          // (we have our hand) — for others we wait for the second card and
          // announce both retroactively.
          const isMe = playerPos === mySeatRef.current;
          if (isMe) {
            const myHand = handRef.current;
            const otherRank = card.rank === "queen" ? "king" : "queen";
            const stillHas = myHand.some((c) => c.suit === trump && c.rank === otherRank);
            const alreadyPlayed = card.rank === "queen" ? wasK : wasQ;
            if (alreadyPlayed) {
              const m = createBeloteMessage(playerPos, "rebelote", profiles);
              const rot = rotateMessage(m, playerPos);
              setMessages((prev) => [...prev, rot]);
              showBubble(rot);
            } else if (stillHas) {
              const m = createBeloteMessage(playerPos, "belote", profiles);
              const rot = rotateMessage(m, playerPos);
              setMessages((prev) => [...prev, rot]);
              showBubble(rot);
            }
          } else {
            // For other players we can't detect Belote on the first card
            // (no hand info). Announce it the moment we see Rebelote, with
            // both bubbles fired in sequence.
            const alreadyPlayed = card.rank === "queen" ? wasK : wasQ;
            if (alreadyPlayed) {
              const beloteM = rotateMessage(
                createBeloteMessage(playerPos, "belote", profiles),
                playerPos,
              );
              const rebeloteM = rotateMessage(
                createBeloteMessage(playerPos, "rebelote", profiles),
                playerPos,
              );
              setMessages((prev) => [...prev, beloteM, rebeloteM]);
              showBubble(rebeloteM);
            }
          }
        }
      }

      // Standard event → message + bubble.
      const m = eventToMessage(ev as never, profiles);
      if (m) {
        // Determine actual seat from the event so we can rotate the bubble
        // position into this client's coordinate system.
        const actualSeat = seatFromEvent(ev) ?? 0;
        const rotated = rotateMessage(m, actualSeat);
        setMessages((prev) => [...prev, rotated]);
        showBubble(rotated);
      }

      // Side-effects mirroring the local AI hook.
      if (ev.type === "round_completed") {
        const contract =
          (ev["round"] as { contract?: Contract | null } | undefined)?.contract ?? null;
        const bidderPos = contract?.bidderPosition ?? 0;
        const bidderName =
          (pubRef.current?.players ?? []).find((p) => p.seat === bidderPos)?.nickname ?? "";
        const roundScore = (ev["roundScore"] as RoundScore | undefined) ?? null;
        setTimeout(() => {
          setLastRoundResult({
            wasCancelled: false,
            contract,
            bidderName: bidderName ?? "",
            roundScore,
          });
        }, 1200);
      }
      if (ev.type === "round_cancelled") {
        setTimeout(() => {
          setLastRoundResult({
            wasCancelled: true,
            contract: null,
            bidderName: "",
            roundScore: null,
          });
        }, 1200);
      }
      if (ev.type === "game_completed") {
        const winner = (ev["winnerTeamIndex"] as 0 | 1 | undefined) ?? 0;
        setTimeout(() => {
          setDelayedWinner(winner);
        }, 1500);
      }
    }

    return off;
  }, [lobby.client, lobby.seat, buildProfiles, rotateMessage, showBubble]);

  return useMemo<GameSessionState>(() => {
    return adapt({
      pub,
      hand,
      legalIds,
      lobby,
      lastRoundResult,
      delayedWinner,
      messages,
      bubbles,
      completedTrick,
    });
  }, [
    pub,
    hand,
    legalIds,
    lobby,
    lastRoundResult,
    delayedWinner,
    messages,
    bubbles,
    completedTrick,
  ]);
}

/** Derive the relevant seat from a raw event for bubble-position rotation. */
function seatFromEvent(ev: Record<string, unknown> & { type?: string }): number | null {
  switch (ev.type) {
    case "bid_placed": {
      const bid = ev["bid"] as { playerPosition?: number } | undefined;
      return bid?.playerPosition ?? null;
    }
    case "bidding_completed": {
      const c = ev["contract"] as { bidderPosition?: number } | undefined;
      return c?.bidderPosition ?? null;
    }
    case "card_played":
      return (ev["playerPosition"] as number | undefined) ?? null;
    case "trick_completed":
      return (ev["winnerPosition"] as number | undefined) ?? null;
    case "round_cancelled": {
      const r = ev["round"] as { dealerPosition?: number } | undefined;
      return r?.dealerPosition ?? null;
    }
    default:
      return null;
  }
}

interface AdaptInput {
  pub: OnlinePublicShape | null;
  hand: readonly Card[];
  legalIds: ReadonlySet<string>;
  lobby: OnlineLobbyState;
  lastRoundResult: LastRoundResult | null;
  delayedWinner: 0 | 1 | null;
  messages: GameMessage[];
  bubbles: Record<Position, GameMessage | null>;
  completedTrick: { cards: TrickCardData[]; winnerPosition: Position | null } | null;
}

function adapt(input: AdaptInput): GameSessionState {
  const {
    pub,
    hand,
    legalIds,
    lobby,
    lastRoundResult,
    delayedWinner,
    messages,
    bubbles,
    completedTrick,
  } = input;
  const mySeat: Seat = lobby.seat ?? 0;

  // Seat → visual position (always-south-is-me).
  const seatToPos = (seat: number): Position => {
    const v = (seat - mySeat + 4) % 4;
    return VISUAL_POS[v]!;
  };

  // Phase mapping.
  let phase: GamePhase = "idle";
  switch (pub?.phase) {
    case "bidding":
      phase = "bidding";
      break;
    case "playing":
      phase = "playing";
      break;
    case "round_complete":
      phase = "roundComplete";
      break;
    case "game_complete":
      phase = "gameComplete";
      break;
  }

  // Players (in seat order 0..3, but mapped to visual positions).
  const players: PlayerData[] = [0, 1, 2, 3].map((seat) => {
    const summary = pub?.players.find((p) => p.seat === seat);
    const nickname = summary?.nickname ?? `Seat ${String(seat + 1)}`;
    const cardCount =
      seat === mySeat ? hand.length : pub?.round ? remainingCardCount(pub.round, seat as Seat) : 0;
    const isDealer = pub?.round ? pub.round.dealerPosition === seat : false;
    return {
      name: nickname,
      level: 1,
      avatarUrl: avatarFor(nickname, seat as Seat),
      isVip: false,
      isDealer,
      position: seatToPos(seat),
      cardCount,
    };
  });

  // Hand sorting + mapping to CardData (south player only).
  const trumpForSort = (pub?.round?.contract?.suit ?? null) as Suit | null;
  const DEFAULT_SUIT_ORDER: readonly Suit[] = ["hearts", "spades", "diamonds", "clubs"];
  const suitRank = (s: Suit): number => {
    if (trumpForSort && s === trumpForSort) return -1;
    return DEFAULT_SUIT_ORDER.indexOf(s);
  };
  const sortedHand: readonly Card[] = [...hand].sort((a, b) => {
    const sa = suitRank(a.suit) - suitRank(b.suit);
    if (sa !== 0) return sa;
    return getCardRankOrder(a, trumpForSort) - getCardRankOrder(b, trumpForSort);
  });
  const playerHand: CardData[] = sortedHand.map((c) => ({ suit: c.suit, rank: c.rank }));

  // Trick cards. While a sweep is in progress (completedTrick set), prefer
  // those cards over whatever the live state currently exposes — the public
  // state already cleared the trick once `trick_completed` fired.
  const trick = pub?.round?.currentTrick ?? null;
  const liveTrickCards: TrickCardData[] = (trick?.cards ?? []).map((pc) => {
    const visual = seatToPos(pc.playerPosition);
    return {
      suit: pc.card.suit,
      rank: pc.card.rank,
      position: visual,
      ...TRICK_OFFSETS[visual],
    };
  });
  const trickCards = completedTrick?.cards ?? liveTrickCards;
  const trickWinnerPosition = completedTrick?.winnerPosition ?? null;

  // Active position.
  let activePosition: Position = "south";
  let isMyTurn = false;
  if (phase === "bidding" && pub?.round) {
    const seat = pub.round.biddingRound.currentPlayerPosition as Seat;
    activePosition = seatToPos(seat);
    isMyTurn = seat === mySeat;
  } else if (phase === "playing" && trick) {
    const nextSeat = ((trick.leadingPlayerPosition + trick.cards.length) % 4) as Seat;
    activePosition = seatToPos(nextSeat);
    isMyTurn = nextSeat === mySeat;
  }

  // Scores.
  const game = pub;
  const targetScore = game?.targetScore ?? 501;
  const usTotalScore = game?.scores[0] ?? 0;
  const themTotalScore = game?.scores[1] ?? 0;

  // "us" = my team. NS in local mode means seats 0+2 (south+north). In online
  // we keep the same convention: my visual team owns positions south+north,
  // which corresponds to seats { mySeat, mySeat^2 }. Live points:
  let usScore = 0;
  let themScore = 0;
  const contract = pub?.round?.contract ?? null;
  if (pub?.round && contract) {
    const running = calculateRunningPoints(
      pub.round.tricks as never,
      contract.suit,
      contract.bidderPosition,
    );
    const contractingIsMyTeam = isOnSameTeam(contract.bidderPosition, mySeat as PlayerPosition);
    if (contractingIsMyTeam) {
      usScore = running.contractingTeamPoints;
      themScore = running.opponentTeamPoints;
    } else {
      themScore = running.contractingTeamPoints;
      usScore = running.opponentTeamPoints;
    }
  }

  // Legal card indices (into the SORTED playerHand).
  const legalCardIndices = new Set<number>();
  sortedHand.forEach((c, i) => {
    if (legalIds.has(c.id)) legalCardIndices.add(i);
  });

  // Bidding round + valid bid values (only forwarded when it's my turn).
  const biddingRound = phase === "bidding" && isMyTurn ? (pub?.round?.biddingRound ?? null) : null;
  const highestValue = biddingRound?.highestBid?.value ?? 80;
  const validBidValues = BID_VALUES.filter((v) => v > highestValue);

  // Contract holder visual position.
  const contractHolderPosition = contract ? seatToPos(contract.bidderPosition) : null;

  // Trump suit.
  const trumpSuit: Suit | null = (contract?.suit ?? null) as Suit | null;

  // Dealer name.
  const dealerSeat = pub?.round?.dealerPosition ?? 0;
  const dealerName = players[dealerSeat]?.name ?? "";

  // Bubbles are produced by the hook from incoming events (with rotation).

  // Wire up actions.
  const send = lobby.client.send.bind(lobby.client);
  const playCard = (cardIndex: number): void => {
    const card = sortedHand[cardIndex];
    if (card) send({ type: "play_card", cardId: card.id });
  };
  const placeBid = (
    type: "pass" | "suit" | "coinche" | "surcoinche",
    value?: BidValue,
    suit?: Suit,
  ): void => {
    if (type === "suit") {
      if (value === undefined || suit === undefined) return;
      send({
        type: "place_bid",
        bid: { type: "suit", value: value as never, suit: suit as never },
      });
    } else if (type === "coinche") {
      send({ type: "place_bid", bid: { type: "coinche" } });
    } else if (type === "surcoinche") {
      send({ type: "place_bid", bid: { type: "surcoinche" } });
    } else {
      send({ type: "place_bid", bid: { type: "pass" } });
    }
  };
  const startNextRound = (): void => {
    // Online mode: server auto-starts next round; nothing to do client-side.
  };
  const startGame = (): void => {
    send({ type: "start_game", targetScore: 501 });
  };

  return {
    phase,
    players,
    playerHand,
    trickCards,
    trickWinnerPosition,
    trumpSuit,
    activePosition,
    targetScore,
    usTotalScore,
    themTotalScore,
    usScore,
    themScore,
    dealerName,
    isMyTurn,
    isDealing: false,
    roundNumber: pub?.roundNumber ?? 0,
    lastRoundResult,
    winnerTeamIndex: delayedWinner,
    legalCardIndices,
    biddingRound,
    validBidValues,
    contract,
    contractHolderPosition,
    messages,
    bubbles,
    dispatch: () => undefined,
    playCard,
    placeBid,
    startNextRound,
    startGame,
  };
}

function remainingCardCount(round: OnlineRoundShape, seat: Seat): number {
  const trumpKnown = round.contract !== null;
  const total = 8;
  // We don't have direct hand-size info for other seats from public state.
  // Approximation: count cards already played by this seat in the round
  // (across completed tricks + current trick) and subtract from 8.
  let played = 0;
  for (const t of round.tricks) {
    for (const pc of t.cards) {
      if (pc.playerPosition === seat) played += 1;
    }
  }
  if (round.currentTrick) {
    for (const pc of round.currentTrick.cards) {
      if (pc.playerPosition === seat) played += 1;
    }
  }
  void trumpKnown;
  return total - played;
}
