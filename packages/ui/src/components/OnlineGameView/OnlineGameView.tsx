/**
 * Minimal-but-functional online game view.
 *
 * This is intentionally simpler than the local AI GameTable: it shows the
 * essential public state (phase, contract, scores, current trick), the
 * player's hand, and exposes bid + play controls when it's their turn.
 * Visual polish parity with the AI table is a follow-up; correctness comes
 * first since this is the first iteration where four humans actually play
 * over the network.
 */
import type { ReactElement } from "react";
import type { OnlineLobbyState } from "../../online/useOnlineLobby.js";
import type { OnlineCard, OnlineGameState, OnlinePublicState } from "../../online/useOnlineGame.js";
import type { Seat, SuitName, BidValueWire } from "@belote/protocol";
import { BID_VALUES_WIRE } from "@belote/protocol";
import styles from "./OnlineGameView.module.css";

const SUIT_SYMBOLS: Record<SuitName, string> = {
  hearts: "♥",
  spades: "♠",
  diamonds: "♦",
  clubs: "♣",
};
const ALL_SUITS: SuitName[] = ["hearts", "spades", "diamonds", "clubs"];

interface Props {
  lobby: OnlineLobbyState;
  game: OnlineGameState;
  onLeave: () => void;
}

export function OnlineGameView({ lobby, game, onLeave }: Props): ReactElement {
  const { publicState, hand, mySeat, isMyBiddingTurn, isMyPlayingTurn, lastError } = game;
  const phase = publicState?.phase ?? "lobby";
  const contract = publicState?.round?.contract ?? null;

  return (
    <div className={styles.root} data-testid="online-game-view">
      <header className={styles.header}>
        <button className={styles.leaveBtn} onClick={onLeave} data-testid="leave-game">
          ← Leave
        </button>
        <div className={styles.headerInfo}>
          <span className={styles.code}>Room {lobby.code}</span>
          <span className={styles.seat}>You: seat {mySeat !== null ? mySeat + 1 : "?"}</span>
          <span className={styles.phase} data-testid="game-phase">
            Phase: {phase}
          </span>
        </div>
      </header>

      <section className={styles.state}>
        <div className={styles.scoreRow} data-testid="score-row">
          <span>NS: {publicState?.scores[0] ?? 0}</span>
          <span>EW: {publicState?.scores[1] ?? 0}</span>
          <span>Target: {publicState?.targetScore ?? 0}</span>
        </div>
        {contract && (
          <div className={styles.contract} data-testid="contract-banner">
            Contract: {contract.value} {SUIT_SYMBOLS[contract.suit as SuitName]} (seat{" "}
            {contract.bidderPosition + 1})
          </div>
        )}

        <PlayersStrip publicState={publicState} mySeat={mySeat} />

        <CurrentTrick publicState={publicState} />
      </section>

      {phase === "bidding" && isMyBiddingTurn && <BidControls lobby={lobby} />}
      {phase === "bidding" && !isMyBiddingTurn && (
        <p className={styles.note} data-testid="waiting-note">
          Waiting for seat{" "}
          {publicState?.round ? publicState.round.biddingRound.currentPlayerPosition + 1 : "?"} to
          bid…
        </p>
      )}

      {phase === "playing" && (
        <Hand
          cards={hand}
          legalCardIds={game.legalCardIds}
          onPlay={(c) => lobby.client.send({ type: "play_card", cardId: c.id })}
        />
      )}

      {phase !== "playing" && hand.length > 0 && (
        <Hand cards={hand} legalCardIds={new Set()} onPlay={() => undefined} />
      )}

      {lastError && (
        <p className={styles.error} data-testid="game-error">
          {lastError}
        </p>
      )}
    </div>
  );
}

function PlayersStrip({
  publicState,
  mySeat,
}: {
  publicState: OnlinePublicState | null;
  mySeat: Seat | null;
}): ReactElement {
  const players = publicState?.players ?? [];
  return (
    <div className={styles.players} data-testid="players-strip">
      {[0, 1, 2, 3].map((s) => {
        const p = players.find((pp) => pp.seat === s);
        return (
          <div
            key={s}
            className={`${styles.playerSlot} ${mySeat === s ? styles.playerMe : ""}`}
            data-testid={`game-seat-${s}`}
          >
            <span className={styles.playerSeat}>S{s + 1}</span>
            <span className={styles.playerName}>{p?.nickname ?? "—"}</span>
          </div>
        );
      })}
    </div>
  );
}

function CurrentTrick({ publicState }: { publicState: OnlinePublicState | null }): ReactElement {
  const trick = publicState?.round?.currentTrick;
  if (!trick) return <div className={styles.trickEmpty} data-testid="trick-area" />;
  return (
    <div className={styles.trick} data-testid="trick-area">
      {trick.cards.map((pc) => (
        <span key={String(pc.playerPosition)} className={styles.trickCard}>
          S{pc.playerPosition + 1}: {pc.card.rank} {SUIT_SYMBOLS[pc.card.suit]}
        </span>
      ))}
    </div>
  );
}

function BidControls({ lobby }: { lobby: OnlineLobbyState }): ReactElement {
  return (
    <div className={styles.bidPanel} data-testid="bid-controls">
      <div className={styles.bidRow}>
        {BID_VALUES_WIRE.map((value) => (
          <span key={value} className={styles.bidValueGroup}>
            <span className={styles.bidValueLabel}>{value}</span>
            {ALL_SUITS.map((suit) => (
              <button
                key={`${value}-${suit}`}
                className={styles.bidBtn}
                onClick={() =>
                  lobby.client.send({
                    type: "place_bid",
                    bid: { type: "suit", value: value as BidValueWire, suit },
                  })
                }
                data-testid={`bid-${value}-${suit}`}
              >
                {SUIT_SYMBOLS[suit]}
              </button>
            ))}
          </span>
        ))}
      </div>
      <div className={styles.bidActions}>
        <button
          className={styles.passBtn}
          onClick={() => lobby.client.send({ type: "place_bid", bid: { type: "pass" } })}
          data-testid="bid-pass"
        >
          Pass
        </button>
        <button
          className={styles.contreBtn}
          onClick={() => lobby.client.send({ type: "place_bid", bid: { type: "coinche" } })}
          data-testid="bid-contrer"
        >
          Contrer
        </button>
      </div>
    </div>
  );
}

function Hand({
  cards,
  legalCardIds,
  onPlay,
}: {
  cards: readonly OnlineCard[];
  legalCardIds: ReadonlySet<string>;
  onPlay: (c: OnlineCard) => void;
}): ReactElement {
  return (
    <div className={styles.hand} data-testid="hand">
      {cards.map((c, i) => {
        const enabled = legalCardIds.has(c.id);
        return (
          <button
            key={c.id}
            className={`${styles.handCard} ${enabled ? styles.handCardEnabled : styles.handCardDisabled}`}
            disabled={!enabled}
            onClick={() => onPlay(c)}
            data-testid={`online-card-${i}`}
            data-card-id={c.id}
            data-card-suit={c.suit}
            data-card-rank={c.rank}
          >
            <span>{c.rank}</span>
            <span>{SUIT_SYMBOLS[c.suit]}</span>
          </button>
        );
      })}
    </div>
  );
}
