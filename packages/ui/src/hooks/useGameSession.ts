import { useEffect, useRef, useState } from 'react';
import {
  GameSession,
  createStartGameCommand,
  createStartRoundCommand,
  createPlaceBidCommand,
  createPlayCardCommand,
} from '@belote/app';
import type { BiddingRound, GameCommand, TrickCompletedEvent } from '@belote/app';
import { BID_VALUES, getValidPlays } from '@belote/core';
import type { BidValue, Suit } from '@belote/core';
import type { CardData, PlayerData, Position, TrickCardData } from '../data/mockGame.js';

// ── Constants ───────────────────────────────────────────────────────────────

const HUMAN = 0 as const; // south position index

const POS_TO_SEAT: Record<number, Position> = {
  0: 'south',
  1: 'west',
  2: 'north',
  3: 'east',
};

const PROFILES: Record<
  number,
  { name: string; avatarUrl: string; level: number; isVip: boolean }
> = {
  0: { name: 'ElenaP',    avatarUrl: 'https://i.pravatar.cc/150?u=elenap-belote',   level: 14, isVip: true  },
  1: { name: 'Villy',     avatarUrl: 'https://i.pravatar.cc/150?u=villy-belote',    level: 17, isVip: true  },
  2: { name: 'DilyanaBl', avatarUrl: 'https://i.pravatar.cc/150?u=dilyanab-belote', level: 18, isVip: false },
  3: { name: 'Vane_Bane', avatarUrl: 'https://i.pravatar.cc/150?u=vanebane-belote', level: 10, isVip: true  },
};

const TRICK_OFFSETS: Record<Position, { rotation: number; offsetX: number; offsetY: number }> = {
  south: { rotation:  5, offsetX:   6, offsetY:  12 },
  north: { rotation: -4, offsetX:  -6, offsetY: -12 },
  west:  { rotation: -8, offsetX: -14, offsetY:   4 },
  east:  { rotation:  9, offsetX:  14, offsetY:  -4 },
};

// ── Exported types ───────────────────────────────────────────────────────────

export type GamePhase = 'idle' | 'bidding' | 'playing' | 'roundComplete' | 'gameComplete';

export interface GameSessionState {
  phase: GamePhase;
  players: PlayerData[];
  playerHand: CardData[];
  trickCards: TrickCardData[];
  /** Set during the sweep-out animation (≈800ms after trick completes). */
  trickWinnerPosition: Position | null;
  trumpSuit: Suit | null;
  activePosition: Position;
  targetScore: number;
  usTotalScore: number;
  themTotalScore: number;
  usScore: number;
  themScore: number;
  dealerName: string;
  isMyTurn: boolean;
  isDealing: boolean;
  /** Indices (into playerHand[]) the human is allowed to play. Empty = no restriction. */
  legalCardIndices: ReadonlySet<number>;
  biddingRound: BiddingRound | null;
  validBidValues: readonly BidValue[];
  dispatch: (cmd: GameCommand) => void;
  playCard: (cardIndex: number) => void;
  placeBid: (type: 'pass' | 'suit' | 'coinche', value?: BidValue, suit?: Suit) => void;
  startNextRound: () => void;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useGameSession(): GameSessionState {
  const sessionRef = useRef(
    new GameSession({ playerTypes: ['human', 'ai', 'ai', 'ai'], stepDelayMs: 800 }),
  );
  const [rev, setRev] = useState(0);
  const [isDealing, setIsDealing] = useState(false);
  const [completedTrick, setCompletedTrick] = useState<{
    cards: TrickCardData[];
    winnerPosition: Position | null;
  } | null>(null);

  useEffect(() => {
    const session = sessionRef.current;

    const unsub = session.on((event) => {
      if (event.type === 'round_started') {
        setIsDealing(true);
        setTimeout(() => { setIsDealing(false); }, 900);
      }

      if (event.type === 'trick_completed') {
        const ev = event as TrickCompletedEvent;
        const winnerPos = POS_TO_SEAT[ev.winnerPosition]!;
        const cards = ev.trick.cards.map((pc) => {
          const seat = POS_TO_SEAT[pc.playerPosition]!;
          return { suit: pc.card.suit as Suit, rank: pc.card.rank, position: seat, ...TRICK_OFFSETS[seat] };
        });
        // Phase 1: show all 4 cards with no sweep so player can see the completed trick
        setCompletedTrick({ cards, winnerPosition: null });
        // Phase 2: trigger sweep toward winner after a short pause
        setTimeout(() => { setCompletedTrick({ cards, winnerPosition: winnerPos }); }, 700);
        // Phase 3: clear DOM after sweep completes (700ms pause + 650ms sweep)
        setTimeout(() => { setCompletedTrick(null); }, 1400);
      }

      setRev((r) => r + 1);
    });

    // Auto-start (guard against React StrictMode double-invoke)
    if (session.state === 'idle') {
      session.dispatch(
        createStartGameCommand(
          [PROFILES[0].name, PROFILES[1].name, PROFILES[2].name, PROFILES[3].name],
          501,
        ),
      );
      session.dispatch(createStartRoundCommand());
    }

    return unsub;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // suppress unused warning in dev
  void rev;

  // ── Derive state ────────────────────────────────────────────────────────

  const session = sessionRef.current;
  const game    = session.game;
  const round   = session.currentRound;

  // Phase
  let phase: GamePhase = 'idle';
  if (session.state === 'game_completed')  phase = 'gameComplete';
  else if (session.state === 'round_completed') phase = 'roundComplete';
  else if (session.state === 'round_playing')   phase = 'playing';
  else if (session.state === 'round_bidding')   phase = 'bidding';

  // Players
  const players: PlayerData[] = [0, 1, 2, 3].map((i) => {
    const profile = PROFILES[i]!;
    const cardCount = round?.players[i]?.hand.length ?? 0;
    const isDealer  = round?.dealerPosition === i;
    return {
      name:      profile.name,
      level:     profile.level,
      avatarUrl: profile.avatarUrl,
      isVip:     profile.isVip,
      isDealer,
      position:  POS_TO_SEAT[i]!,
      cardCount,
    };
  });

  // Player hand (south = position 0)
  const coreHand = round?.players[HUMAN]?.hand ?? [];
  const playerHand: CardData[] = coreHand.map((c) => ({ suit: c.suit as Suit, rank: c.rank }));

  // Trick cards — prefer completedTrick while sweep animation plays
  const currentTrick = round?.currentTrick;
  const liveTrickCards: TrickCardData[] = (currentTrick?.cards ?? []).map((pc) => {
    const seat    = POS_TO_SEAT[pc.playerPosition]!;
    const offsets = TRICK_OFFSETS[seat];
    return { suit: pc.card.suit as Suit, rank: pc.card.rank, position: seat, ...offsets };
  });
  const trickCards     = completedTrick?.cards ?? liveTrickCards;
  const trickWinnerPosition = completedTrick?.winnerPosition ?? null;

  // Trump
  const trumpSuit = (round?.contract?.suit ?? null) as Suit | null;

  // Active position
  let activePosition: Position = 'south';
  if (phase === 'bidding' && round) {
    activePosition = POS_TO_SEAT[round.biddingRound.currentPlayerPosition]!;
  } else if (phase === 'playing' && round?.currentTrick) {
    const trick  = round.currentTrick;
    const nextIdx = (trick.leadingPlayerPosition + trick.cards.length) % 4;
    activePosition = POS_TO_SEAT[nextIdx]!;
  }

  // Scores
  const targetScore   = game?.targetScore   ?? 501;
  const usTotalScore  = game?.teamScores[0] ?? 0;
  const themTotalScore = game?.teamScores[1] ?? 0;
  const usScore       = 0; // mid-round scores not surfaced; update on round_completed
  const themScore     = 0;
  const dealerName    = round ? PROFILES[round.dealerPosition]!.name : '';

  // Is human's turn?
  let isMyTurn = false;
  if (phase === 'bidding' && round) {
    isMyTurn = round.biddingRound.currentPlayerPosition === HUMAN;
  } else if (phase === 'playing' && round?.currentTrick) {
    const trick   = round.currentTrick;
    const nextIdx = (trick.leadingPlayerPosition + trick.cards.length) % 4;
    isMyTurn = nextIdx === HUMAN;
  }

  // Legal card indices (into playerHand[]) — during playing phase when it's human's turn
  let legalCardIndices: ReadonlySet<number> = new Set();
  if (phase === 'playing' && isMyTurn) {
    if (round?.currentTrick) {
      const legal = getValidPlays(round.currentTrick, HUMAN, coreHand);
      const legalIds = new Set(legal.map((c) => c.id));
      legalCardIndices = new Set(
        coreHand.reduce<number[]>((acc, c, i) => { if (legalIds.has(c.id)) acc.push(i); return acc; }, []),
      );
    } else {
      // Human leads first trick — all cards legal
      legalCardIndices = new Set(coreHand.map((_, i) => i));
    }
  }

  // Bidding state (only passed down when it's human's turn)
  const biddingRound = (phase === 'bidding' && isMyTurn && round)
    ? round.biddingRound
    : null;

  // Valid bid values: those > current highest bid
  const highestValue = biddingRound?.highestBid?.value ?? 70;
  const validBidValues = BID_VALUES.filter((v) => v > highestValue);

  // ── Dispatch helpers ────────────────────────────────────────────────────

  const dispatch = (cmd: GameCommand) => { sessionRef.current.dispatch(cmd); };

  const playCard = (cardIndex: number) => {
    const card = coreHand[cardIndex];
    if (card) dispatch(createPlayCardCommand(HUMAN, card));
  };

  const placeBid = (type: 'pass' | 'suit' | 'coinche', value?: BidValue, suit?: Suit) => {
    dispatch(createPlaceBidCommand(HUMAN, type, value, suit));
  };

  const startNextRound = () => {
    dispatch(createStartRoundCommand());
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
    legalCardIndices,
    biddingRound,
    validBidValues,
    dispatch,
    playCard,
    placeBid,
    startNextRound,
  };
}
