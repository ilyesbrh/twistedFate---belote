import type { IdGenerator } from "../utils/id.js";
import type { Card } from "./card.js";
import type { Player, PlayerPosition } from "./player.js";
import { dealCards } from "./player.js";
import type { Bid, BiddingRound, Contract } from "./bid.js";
import { createBiddingRound, placeBid, getContract } from "./bid.js";
import type { Trick } from "./trick.js";
import { createTrick, playCard, removeCardFromHand, getTrickWinner } from "./trick.js";
import type { RoundScore } from "./scoring.js";
import { calculateRoundScore } from "./scoring.js";
import { getNextPlayerPosition } from "./player-helpers.js";
import type { Announcement } from "./announcements.js";
import {
  findAnnouncements,
  resolveAnnouncementWinner,
  calculateAnnouncementTotal,
} from "./announcements.js";

// ── Types ──

export type RoundPhase = "bidding" | "playing" | "completed" | "cancelled";

export interface Round {
  readonly id: string;
  readonly roundNumber: number;
  readonly dealerPosition: PlayerPosition;
  readonly players: readonly [Player, Player, Player, Player];
  readonly biddingRound: BiddingRound;
  readonly contract: Contract | null;
  readonly tricks: readonly Trick[];
  readonly currentTrick: Trick | null;
  readonly roundScore: RoundScore | null;
  readonly phase: RoundPhase;
  /** Announcements for the NS team (positions 0 + 2), populated when bidding completes. */
  readonly nsAnnouncements: readonly Announcement[];
  /** Announcements for the EW team (positions 1 + 3), populated when bidding completes. */
  readonly ewAnnouncements: readonly Announcement[];
  /** Which team won the announcement comparison, or null if no announcements. */
  readonly announcementWinner: "ns" | "ew" | null;
  /** Total announcement points for the winning team (0 if no winner). */
  readonly announcementPoints: number;
}

// ── Factory ──

export function createRound(
  roundNumber: number,
  dealerPosition: PlayerPosition,
  players: readonly [Player, Player, Player, Player],
  deck: readonly Card[],
  idGenerator: IdGenerator,
): Round {
  const dealtPlayers = dealCards(deck, players);
  const biddingRound = createBiddingRound(dealerPosition, idGenerator);

  return Object.freeze({
    id: idGenerator.generateId("round"),
    roundNumber,
    dealerPosition,
    players: dealtPlayers,
    biddingRound,
    contract: null,
    tricks: Object.freeze([]),
    currentTrick: null,
    roundScore: null,
    phase: "bidding" as const,
    nsAnnouncements: Object.freeze([]) as readonly Announcement[],
    ewAnnouncements: Object.freeze([]) as readonly Announcement[],
    announcementWinner: null,
    announcementPoints: 0,
  });
}

// ── Bidding Phase ──

export function placeBidInRound(round: Round, bid: Bid, idGenerator: IdGenerator): Round {
  if (round.phase !== "bidding") {
    throw new Error(`Cannot place bid: round phase is "${round.phase}", not "bidding"`);
  }

  const updatedBidding = placeBid(round.biddingRound, bid);

  if (updatedBidding.state === "completed") {
    const contract = getContract(updatedBidding, idGenerator);
    const firstTrickLeader = getNextPlayerPosition(round.dealerPosition);
    const firstTrick = createTrick(
      firstTrickLeader,
      contract.suit,
      contract.contractType,
      idGenerator,
    );

    // Auto-detect announcements from each player's hand (V1: single-moment detection)
    const trumpSuit = contract.contractType === "suit" ? contract.suit : null;
    const nsAnnouncements = Object.freeze([
      ...findAnnouncements(round.players[0].hand),
      ...findAnnouncements(round.players[2].hand),
    ]);
    const ewAnnouncements = Object.freeze([
      ...findAnnouncements(round.players[1].hand),
      ...findAnnouncements(round.players[3].hand),
    ]);
    const winnerAB = resolveAnnouncementWinner(nsAnnouncements, ewAnnouncements, trumpSuit);
    const announcementWinner: "ns" | "ew" | null =
      winnerAB === "a" ? "ns" : winnerAB === "b" ? "ew" : null;
    const announcementPoints =
      announcementWinner === "ns"
        ? calculateAnnouncementTotal(nsAnnouncements)
        : announcementWinner === "ew"
          ? calculateAnnouncementTotal(ewAnnouncements)
          : 0;

    return Object.freeze({
      id: round.id,
      roundNumber: round.roundNumber,
      dealerPosition: round.dealerPosition,
      players: round.players,
      biddingRound: updatedBidding,
      contract,
      tricks: Object.freeze([]),
      currentTrick: firstTrick,
      roundScore: null,
      phase: "playing" as const,
      nsAnnouncements,
      ewAnnouncements,
      announcementWinner,
      announcementPoints,
    });
  }

  if (updatedBidding.state === "all_passed") {
    return Object.freeze({
      id: round.id,
      roundNumber: round.roundNumber,
      dealerPosition: round.dealerPosition,
      players: round.players,
      biddingRound: updatedBidding,
      contract: null,
      tricks: Object.freeze([]),
      currentTrick: null,
      roundScore: null,
      phase: "cancelled" as const,
      nsAnnouncements: round.nsAnnouncements,
      ewAnnouncements: round.ewAnnouncements,
      announcementWinner: round.announcementWinner,
      announcementPoints: round.announcementPoints,
    });
  }

  // Still in progress
  return Object.freeze({
    id: round.id,
    roundNumber: round.roundNumber,
    dealerPosition: round.dealerPosition,
    players: round.players,
    biddingRound: updatedBidding,
    contract: null,
    tricks: Object.freeze([]),
    currentTrick: null,
    roundScore: null,
    phase: "bidding" as const,
    nsAnnouncements: round.nsAnnouncements,
    ewAnnouncements: round.ewAnnouncements,
    announcementWinner: round.announcementWinner,
    announcementPoints: round.announcementPoints,
  });
}

// ── Playing Phase ──

export function playCardInRound(
  round: Round,
  card: Card,
  playerPosition: PlayerPosition,
  idGenerator: IdGenerator,
): Round {
  if (round.phase !== "playing") {
    throw new Error(`Cannot play card: round phase is "${round.phase}", not "playing"`);
  }

  if (round.currentTrick === null) {
    throw new Error("Cannot play card: no current trick (invariant violation)");
  }

  if (round.contract === null) {
    throw new Error("Cannot play card: no contract (invariant violation)");
  }

  // Find the player
  const playerIndex = round.players.findIndex((p) => p.position === playerPosition);
  if (playerIndex === -1) {
    throw new Error(`No player at position ${String(playerPosition)}`);
  }
  const player = round.players[playerIndex];
  if (player === undefined) {
    throw new Error(`Player array invariant violated at index ${String(playerIndex)}`);
  }

  // Play the card on the current trick (validates turn order, suit-following, etc.)
  const updatedTrick = playCard(round.currentTrick, card, playerPosition, player.hand);

  // Remove the card from the player's hand
  const updatedPlayer = removeCardFromHand(player, card);

  // Build the updated players tuple
  const newPlayers = [...round.players];
  newPlayers[playerIndex] = updatedPlayer;
  const frozenPlayers = Object.freeze(newPlayers as [Player, Player, Player, Player]);

  // Check if trick completed
  if (updatedTrick.state === "completed") {
    const newTricks = [...round.tricks, updatedTrick];
    const trickWinner = getTrickWinner(updatedTrick);

    if (newTricks.length === 8) {
      // Round complete — calculate score (pass announcement info)
      const roundScore = calculateRoundScore(
        newTricks,
        round.contract,
        round.announcementWinner,
        round.announcementPoints,
      );

      return Object.freeze({
        id: round.id,
        roundNumber: round.roundNumber,
        dealerPosition: round.dealerPosition,
        players: frozenPlayers,
        biddingRound: round.biddingRound,
        contract: round.contract,
        tricks: Object.freeze(newTricks),
        currentTrick: null,
        roundScore,
        phase: "completed" as const,
        nsAnnouncements: round.nsAnnouncements,
        ewAnnouncements: round.ewAnnouncements,
        announcementWinner: round.announcementWinner,
        announcementPoints: round.announcementPoints,
      });
    }

    // More tricks to play — create next trick with winner as leader
    const nextTrick = createTrick(
      trickWinner,
      round.contract.suit,
      round.contract.contractType,
      idGenerator,
    );

    return Object.freeze({
      id: round.id,
      roundNumber: round.roundNumber,
      dealerPosition: round.dealerPosition,
      players: frozenPlayers,
      biddingRound: round.biddingRound,
      contract: round.contract,
      tricks: Object.freeze(newTricks),
      currentTrick: nextTrick,
      roundScore: null,
      phase: "playing" as const,
      nsAnnouncements: round.nsAnnouncements,
      ewAnnouncements: round.ewAnnouncements,
      announcementWinner: round.announcementWinner,
      announcementPoints: round.announcementPoints,
    });
  }

  // Trick still in progress
  return Object.freeze({
    id: round.id,
    roundNumber: round.roundNumber,
    dealerPosition: round.dealerPosition,
    players: frozenPlayers,
    biddingRound: round.biddingRound,
    contract: round.contract,
    tricks: round.tricks,
    currentTrick: updatedTrick,
    roundScore: null,
    phase: "playing" as const,
    nsAnnouncements: round.nsAnnouncements,
    ewAnnouncements: round.ewAnnouncements,
    announcementWinner: round.announcementWinner,
    announcementPoints: round.announcementPoints,
  });
}
