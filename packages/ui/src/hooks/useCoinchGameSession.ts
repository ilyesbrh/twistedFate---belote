import { useCallback, useEffect, useRef, useState } from "react";
import {
  GameSession,
  createStartGameCommand,
  createStartRoundCommand,
  createPlaceBidCommand,
  createPlayCardCommand,
} from "@coinche/app";

import {
  BID_VALUES,
  getValidPlays,
  calculateRunningPoints,
  calculateTrickPoints,
  getCardRankOrder,
} from "@coinche/core";
import type {
  Announcement,
  Card,
  BiddingRound as CoinchBiddingRound,
  ContractType,
  PlayerPosition,
  Suit,
} from "@coinche/core";
import type {
  BiddingRound as BeloteBiddingRound,
  BidValue,
  Contract,
  RoundScore,
} from "@belote/core";
import type { CardData, PlayerData, Position, TrickCardData } from "../data/mockGame.js";
import type { GameSessionState, LastRoundResult, BidReveal } from "./useGameSession.js";
import { SUIT_SYMBOLS } from "../messages/gameMessages.js";
import type { GameMessage, ProfileLookup } from "../messages/gameMessages.js";

// ── Constants ───────────────────────────────────────────────────────────────

const HUMAN = 0 as const;

const POS_TO_SEAT: Record<number, Position> = {
  0: "south",
  1: "west",
  2: "north",
  3: "east",
};

const PROFILES: Record<number, { name: string; avatarUrl: string; level: number; isVip: boolean }> =
  {
    0: {
      name: "ElenaP",
      avatarUrl: "https://i.pravatar.cc/150?u=elenap-coinche",
      level: 14,
      isVip: true,
    },
    1: {
      name: "Villy",
      avatarUrl: "https://i.pravatar.cc/150?u=villy-coinche",
      level: 17,
      isVip: true,
    },
    2: {
      name: "DilyanaBl",
      avatarUrl: "https://i.pravatar.cc/150?u=dilyanab-coinche",
      level: 18,
      isVip: false,
    },
    3: {
      name: "Vane_Bane",
      avatarUrl: "https://i.pravatar.cc/150?u=vanebane-coinche",
      level: 10,
      isVip: true,
    },
  };

const FALLBACK_PROFILE = { name: "Unknown", avatarUrl: "", level: 1, isVip: false };

const TRICK_OFFSETS: Record<Position, { rotation: number; offsetX: number; offsetY: number }> = {
  south: { rotation: 5, offsetX: 6, offsetY: 12 },
  north: { rotation: -4, offsetX: -6, offsetY: -12 },
  west: { rotation: -8, offsetX: -14, offsetY: 4 },
  east: { rotation: 9, offsetX: 14, offsetY: -4 },
};

function getProfile(i: number): { name: string; avatarUrl: string; level: number; isVip: boolean } {
  return PROFILES[i] ?? FALLBACK_PROFILE;
}

function getSeat(i: number): Position {
  return POS_TO_SEAT[i] ?? "south";
}

const EMPTY_BUBBLES: Record<Position, GameMessage | null> = {
  south: null,
  north: null,
  west: null,
  east: null,
};

// ── Coinche-aware event→message ──────────────────────────────────────────────

let msgCounter = 0;
function nextMsgId(): string {
  msgCounter += 1;
  return `coinch-msg-${String(Date.now())}-${String(msgCounter)}`;
}

function coinchEventToMessage(
  event: { type: string; [key: string]: unknown },
  profiles: ProfileLookup,
  getContractType: () => ContractType,
): GameMessage | null {
  if (event.type === "bid_placed") {
    const bid = (
      event as { bid: { type: string; playerPosition: number; value?: number; suit?: Suit } }
    ).bid;
    const position: Position = POS_TO_SEAT[bid.playerPosition] ?? "south";
    const playerName = profiles[bid.playerPosition]?.name ?? "Unknown";
    let text: string;
    switch (bid.type) {
      case "pass":
        text = "Pass";
        break;
      case "coinche":
        text = "Contre !";
        break;
      case "surcoinche":
        text = "Surcontre !";
        break;
      case "sans-atout":
        text = `SA ${String(bid.value)}`;
        break;
      case "tout-atout":
        text = `TA ${String(bid.value)}`;
        break;
      case "suit":
        text = `${bid.suit ? SUIT_SYMBOLS[bid.suit] : "?"} ${String(bid.value)}`;
        break;
      case "capot":
        text = `Capot ${bid.suit ? SUIT_SYMBOLS[bid.suit] : "?"}`;
        break;
      default:
        text = "Bid";
    }
    return { id: nextMsgId(), position, playerName, text, type: "bid", timestamp: Date.now() };
  }

  if (event.type === "bidding_completed") {
    const contract = (
      event as {
        contract: { bidderPosition: number; value: number; suit: Suit; contractType: ContractType };
      }
    ).contract;
    const position: Position = POS_TO_SEAT[contract.bidderPosition] ?? "south";
    const playerName = profiles[contract.bidderPosition]?.name ?? "Unknown";
    let text: string;
    const isCapot = (contract as { isCapot?: boolean }).isCapot === true;
    if (isCapot) text = `Capot ${SUIT_SYMBOLS[contract.suit]}`;
    else if (contract.contractType === "sans-atout") text = `SA ${String(contract.value)}`;
    else if (contract.contractType === "tout-atout") text = `TA ${String(contract.value)}`;
    else text = `${SUIT_SYMBOLS[contract.suit]} ${String(contract.value)}`;
    return { id: nextMsgId(), position, playerName, text, type: "contract", timestamp: Date.now() };
  }

  if (event.type === "trick_completed") {
    const ev = event as { winnerPosition: number; trick: { trumpSuit: Suit; cards: unknown[] } };
    const position: Position = POS_TO_SEAT[ev.winnerPosition] ?? "south";
    const playerName = profiles[ev.winnerPosition]?.name ?? "Unknown";
    const contractType = getContractType();
    const pts = calculateTrickPoints(
      ev.trick as Parameters<typeof calculateTrickPoints>[0],
      contractType === "suit" ? ev.trick.trumpSuit : null,
      contractType,
    );
    return {
      id: nextMsgId(),
      position,
      playerName,
      text: `+${String(pts)} pts`,
      type: "trick_win",
      timestamp: Date.now(),
    };
  }

  if (event.type === "round_cancelled") {
    const ev = event as { round: { dealerPosition: number } };
    const position: Position = POS_TO_SEAT[ev.round.dealerPosition] ?? "south";
    return {
      id: nextMsgId(),
      position,
      playerName: "",
      text: "All passed",
      type: "round_cancelled",
      timestamp: Date.now(),
    };
  }

  // announcements_revealed is handled separately in the event effect
  if (event.type === "announcements_revealed") {
    return null;
  }

  return null;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useCoinchGameSession(): GameSessionState {
  const sessionRef = useRef(
    new GameSession({ playerTypes: ["human", "ai", "ai", "ai"], stepDelayMs: 3000 }),
  );
  const [rev, setRev] = useState(0);
  const [isDealing, setIsDealing] = useState(false);
  const [completedTrick, setCompletedTrick] = useState<{
    cards: TrickCardData[];
    winnerPosition: Position | null;
  } | null>(null);
  const [lastRoundResult, setLastRoundResult] = useState<LastRoundResult | null>(null);
  const [bidReveal, setBidReveal] = useState<BidReveal | null>(null);
  const bidRevealKey = useRef(0);
  const [delayedWinnerTeamIndex, setDelayedWinnerTeamIndex] = useState<0 | 1 | null>(null);
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const [bubbles, setBubbles] = useState<Record<Position, GameMessage | null>>(EMPTY_BUBBLES);
  const bubbleTimers = useRef<Record<Position, ReturnType<typeof setTimeout> | null>>({
    south: null,
    north: null,
    west: null,
    east: null,
  });

  const showBubble = useCallback((msg: GameMessage): void => {
    const pos = msg.position;
    const existing = bubbleTimers.current[pos];
    if (existing !== null) clearTimeout(existing);
    setBubbles((prev) => ({ ...prev, [pos]: msg }));
    bubbleTimers.current[pos] = setTimeout((): void => {
      setBubbles((prev) => ({ ...prev, [pos]: null }));
      bubbleTimers.current[pos] = null;
    }, 4000);
  }, []);

  const dismissBidReveal = useCallback((): void => {
    setBidReveal(null);
  }, []);

  useEffect((): (() => void) => {
    const session = sessionRef.current;

    const unsub = session.on((event): void => {
      if (event.type === "round_started") {
        setIsDealing(true);
        setTimeout((): void => {
          setIsDealing(false);
        }, 900);
      }

      if (event.type === "bidding_completed") {
        bidRevealKey.current += 1;
        const bidderPos = event.contract.bidderPosition;
        const revealContract = event.contract as unknown as Contract & {
          contractType?: "suit" | "sans-atout" | "tout-atout";
          isCapot?: boolean;
        };
        setBidReveal({
          key: bidRevealKey.current,
          contract: revealContract as unknown as Contract,
          winnerPosition: getSeat(bidderPos),
          winnerName: getProfile(bidderPos).name,
          contractType: revealContract.contractType,
          isCapot: revealContract.isCapot,
        });
      }

      if (event.type === "announcements_revealed") {
        const ev = event;
        for (const [posStr, anns] of Object.entries(ev.byPosition)) {
          const pos = Number(posStr) as PlayerPosition;
          const seat = getSeat(pos);
          const playerName = getProfile(pos).name;
          const annText = (anns as Announcement[])
            .map((a) => {
              if (a.kind === "carre") return `Carré de ${a.highCard}s`;
              const label = a.points === 20 ? "Tierce" : a.points === 50 ? "Cinquante" : "Cent";
              return `${label} ${SUIT_SYMBOLS[a.suit]}`;
            })
            .join(" + ");
          const annMsg: GameMessage = {
            id: nextMsgId(),
            position: seat,
            playerName,
            text: annText,
            type: "bid",
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, annMsg]);
          showBubble(annMsg);
        }
        if (ev.winner !== null) {
          const winnerText = `${ev.winner.toUpperCase()} wins announcements (+${String(ev.totalPoints)} pts)`;
          const sysMsg: GameMessage = {
            id: nextMsgId(),
            position: "south",
            playerName: "",
            text: winnerText,
            type: "contract",
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, sysMsg]);
        }
      }

      if (event.type === "trick_completed") {
        const winnerPos = getSeat(event.winnerPosition);
        const cards: TrickCardData[] = event.trick.cards.map((pc): TrickCardData => {
          const seat = getSeat(pc.playerPosition);
          return {
            suit: pc.card.suit,
            rank: pc.card.rank,
            position: seat,
            ...TRICK_OFFSETS[seat],
          };
        });
        setCompletedTrick({ cards, winnerPosition: null });
        setTimeout((): void => {
          setCompletedTrick({ cards, winnerPosition: winnerPos });
        }, 700);
        setTimeout((): void => {
          setCompletedTrick(null);
        }, 1400);
      }

      if (event.type === "round_completed") {
        const bidderPos = event.round.contract?.bidderPosition ?? 0;
        const rs = event.roundScore as unknown as RoundScore & {
          announcementWinner?: "ns" | "ew" | null;
          announcementPoints?: number;
        };
        const rc = event.round.contract as unknown as
          | (Contract & {
              contractType?: "suit" | "sans-atout" | "tout-atout";
              isCapot?: boolean;
            })
          | null;
        setTimeout((): void => {
          setLastRoundResult({
            wasCancelled: false,
            contract: rc as unknown as Contract | null,
            bidderName: getProfile(bidderPos).name,
            roundScore: rs as unknown as RoundScore,
            announcementWinner: rs.announcementWinner,
            announcementPoints: rs.announcementPoints,
            contractType: rc?.contractType,
            isCapot: rc?.isCapot,
          });
        }, 2000);
      }

      if (event.type === "round_cancelled") {
        setTimeout((): void => {
          setLastRoundResult({
            wasCancelled: true,
            contract: null,
            bidderName: "",
            roundScore: null,
          });
        }, 2000);
      }

      if (event.type === "game_completed") {
        setTimeout((): void => {
          setDelayedWinnerTeamIndex(event.winnerTeamIndex);
        }, 2500);
      }

      // Generate chat message + thought bubble for every game event.
      const getContractType = (): ContractType =>
        (sessionRef.current.currentRound?.contract?.contractType as ContractType | undefined) ??
        "suit";
      const msg = coinchEventToMessage(
        event as { type: string; [key: string]: unknown },
        PROFILES,
        getContractType,
      );
      if (msg) {
        setMessages((prev) => [...prev, msg]);
        showBubble(msg);
      }

      setRev((r) => r + 1);
    });

    return unsub;
  }, [showBubble]);

  void rev;

  const session = sessionRef.current;
  const game = session.game;
  const round = session.currentRound;

  type GamePhase = "idle" | "bidding" | "playing" | "roundComplete" | "gameComplete";
  let phase: GamePhase = "idle";
  if (session.state === "game_completed") phase = "gameComplete";
  else if (session.state === "round_completed") phase = "roundComplete";
  else if (session.state === "round_playing") phase = "playing";
  else if (session.state === "round_bidding") phase = "bidding";

  const players: PlayerData[] = [0, 1, 2, 3].map((i): PlayerData => {
    const profile = getProfile(i);
    return {
      name: profile.name,
      level: profile.level,
      avatarUrl: profile.avatarUrl,
      isVip: profile.isVip,
      isDealer: round?.dealerPosition === i,
      position: getSeat(i),
      cardCount: round?.players[i]?.hand.length ?? 0,
    };
  });

  const coinchContract = round?.contract ?? null;
  const rawHand: readonly Card[] = round?.players[HUMAN]?.hand ?? [];
  // Only use the trump suit for sorting when it's a suit contract (SA/TA have no real trump)
  const trumpForSort: Suit | null =
    coinchContract?.contractType === "suit" ? coinchContract.suit : null;
  const DEFAULT_SUIT_ORDER: readonly Suit[] = ["hearts", "spades", "diamonds", "clubs"];

  const suitRank = (suit: Suit): number => {
    if (trumpForSort !== null && suit === trumpForSort) return -1;
    return DEFAULT_SUIT_ORDER.indexOf(suit);
  };

  const coreHand: readonly Card[] = [...rawHand].sort((a, b): number => {
    const s = suitRank(a.suit) - suitRank(b.suit);
    if (s !== 0) return s;
    return getCardRankOrder(a, trumpForSort) - getCardRankOrder(b, trumpForSort);
  });

  const playerHand: CardData[] = coreHand.map((c): CardData => ({ suit: c.suit, rank: c.rank }));

  const currentTrick = round?.currentTrick;
  const liveTrickCards: TrickCardData[] = (currentTrick?.cards ?? []).map((pc): TrickCardData => {
    const seat = getSeat(pc.playerPosition);
    return { suit: pc.card.suit, rank: pc.card.rank, position: seat, ...TRICK_OFFSETS[seat] };
  });
  const trickCards = completedTrick?.cards ?? liveTrickCards;
  const trickWinnerPosition = completedTrick?.winnerPosition ?? null;

  const trumpSuit: Suit | null =
    coinchContract?.contractType === "suit" ? coinchContract.suit : null;

  let activePosition: Position = "south";
  if (phase === "bidding" && round !== null) {
    activePosition = getSeat(round.biddingRound.currentPlayerPosition);
  } else if (phase === "playing" && round?.currentTrick !== null) {
    const trick = round.currentTrick;
    const nextIdx = (trick.leadingPlayerPosition + trick.cards.length) % 4;
    activePosition = getSeat(nextIdx);
  }

  const targetScore = game?.targetScore ?? 1000;
  const usTotalScore = game?.teamScores[0] ?? 0;
  const themTotalScore = game?.teamScores[1] ?? 0;
  let usScore = 0;
  let themScore = 0;

  if (round !== null && coinchContract !== null) {
    const running = calculateRunningPoints(
      round.tricks,
      coinchContract.contractType === "suit" ? coinchContract.suit : null,
      coinchContract.contractType,
      coinchContract.bidderPosition,
    );
    const contractingIsNS =
      coinchContract.bidderPosition === 0 || coinchContract.bidderPosition === 2;
    if (contractingIsNS) {
      usScore = running.contractingTeamPoints;
      themScore = running.opponentTeamPoints;
    } else {
      themScore = running.contractingTeamPoints;
      usScore = running.opponentTeamPoints;
    }
  }

  const contractHolderPosition: Position | null =
    coinchContract !== null ? getSeat(coinchContract.bidderPosition) : null;
  const dealerName: string = round !== null ? getProfile(round.dealerPosition).name : "";

  let isMyTurn = false;
  if (phase === "bidding" && round !== null) {
    isMyTurn = round.biddingRound.currentPlayerPosition === HUMAN;
  } else if (
    phase === "playing" &&
    round?.currentTrick !== null &&
    round?.currentTrick !== undefined
  ) {
    const trick = round.currentTrick;
    const nextIdx = (trick.leadingPlayerPosition + trick.cards.length) % 4;
    isMyTurn = nextIdx === HUMAN;
  }

  let legalCardIndices: ReadonlySet<number> = new Set();
  if (phase === "playing" && isMyTurn) {
    if (round?.currentTrick !== null) {
      const legal = getValidPlays(round.currentTrick, HUMAN, coreHand);
      const legalIds = new Set(legal.map((c) => c.id));
      legalCardIndices = new Set(
        coreHand.reduce<number[]>((acc, c, i) => {
          if (legalIds.has(c.id)) acc.push(i);
          return acc;
        }, []),
      );
    } else {
      legalCardIndices = new Set(coreHand.map((_c, i) => i));
    }
  }

  const coinchBiddingRound: CoinchBiddingRound | null =
    phase === "bidding" && isMyTurn && round !== null ? round.biddingRound : null;
  // Coinche BidType is a superset of Belote BidType; cast is safe since BidPanel
  // only reads coinched/surcoinched booleans and highestBid.value (same fields).
  const biddingRound = coinchBiddingRound as unknown as BeloteBiddingRound | null;

  const highestValue: number = coinchBiddingRound?.highestBid?.value ?? 70;
  const validBidValues: readonly BidValue[] = BID_VALUES.filter((v) => v > highestValue);

  const placeBid = (
    type: "pass" | "suit" | "sans-atout" | "tout-atout" | "capot" | "coinche" | "surcoinche",
    value?: BidValue,
    suit?: Suit,
  ): void => {
    sessionRef.current.dispatch(createPlaceBidCommand(HUMAN, type, value, suit));
  };

  const playCard = (cardIndex: number): void => {
    sessionRef.current.dispatch(createPlayCardCommand(HUMAN, coreHand[cardIndex]));
  };

  const startNextRound = (): void => {
    sessionRef.current.dispatch(createStartRoundCommand());
  };

  const startGame = (): void => {
    sessionRef.current.dispatch(
      createStartGameCommand(
        [getProfile(0).name, getProfile(1).name, getProfile(2).name, getProfile(3).name],
        1000,
      ),
    );
    sessionRef.current.dispatch(createStartRoundCommand());
  };

  const dispatch = (cmd: unknown): void => {
    sessionRef.current.dispatch(cmd as Parameters<typeof sessionRef.current.dispatch>[0]);
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
    isDealing,
    roundNumber: session.roundNumber,
    lastRoundResult,
    winnerTeamIndex: delayedWinnerTeamIndex,
    legalCardIndices,
    biddingRound,
    validBidValues,
    contract: coinchContract as unknown as Contract | null,
    contractHolderPosition,
    messages,
    bubbles,
    bidReveal,
    dismissBidReveal,
    isOnline: false,
    dispatch: dispatch as GameSessionState["dispatch"],
    playCard,
    placeBid,
    startNextRound,
    startGame,
  };
}
