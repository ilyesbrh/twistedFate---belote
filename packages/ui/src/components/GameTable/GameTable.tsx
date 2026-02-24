import { useState } from 'react';
import { useGameSession } from '../../hooks/useGameSession.js';
import { BidPanel } from '../BidPanel/BidPanel.js';
import { ChatButton } from '../ChatButton/ChatButton.js';
import { ChatPanel } from '../ChatPanel/ChatPanel.js';
import { HandDisplay } from '../HandDisplay/HandDisplay.js';
import { OpponentHand } from '../OpponentHand/OpponentHand.js';
import { PlayerAvatar } from '../PlayerAvatar/PlayerAvatar.js';
import { ScorePanel } from '../ScorePanel/ScorePanel.js';
import { TrickArea } from '../TrickArea/TrickArea.js';
import styles from './GameTable.module.css';

export function GameTable() {
  const state = useGameSession();
  const [chatOpen, setChatOpen] = useState(false);

  const south = state.players.find((p) => p.position === 'south')!;
  const north = state.players.find((p) => p.position === 'north')!;
  const west  = state.players.find((p) => p.position === 'west')!;
  const east  = state.players.find((p) => p.position === 'east')!;

  const active  = state.activePosition;
  const showBid = state.phase === 'bidding' && state.isMyTurn && state.biddingRound !== null;

  return (
    <div className={styles.table} data-testid="game-table">
      {/* ── Felt layers ── */}
      <div className={styles.felt}       aria-hidden="true" />
      <div className={styles.feltWeave}  aria-hidden="true" />
      <div className={styles.feltCenter} aria-hidden="true" />
      <div className={styles.rings}      aria-hidden="true" />
      <div className={styles.woodRim}    aria-hidden="true" />

      {/* ── Score panel — top left ── */}
      <div className={styles.scorePanel}>
        <ScorePanel
          target={state.targetScore}
          usScore={state.usScore}
          themScore={state.themScore}
          usTotalScore={state.usTotalScore}
          themTotalScore={state.themTotalScore}
          trumpSuit={state.trumpSuit ?? 'spades'}
          dealerName={state.dealerName}
        />
      </div>

      {/* ── North hand — top center ── */}
      <div className={styles.northHand}>
        <OpponentHand cardCount={north.cardCount} orientation="top" isDealing={state.isDealing} />
      </div>

      {/* ── North avatar ── */}
      <div className={styles.northAvatar}>
        <PlayerAvatar player={north} size="md" isActive={active === 'north'} />
      </div>

      {/* ── West avatar ── */}
      <div className={styles.westAvatar}>
        <PlayerAvatar player={west} size="sm" isActive={active === 'west'} />
      </div>

      {/* ── West card stack ── */}
      <div className={styles.westCards}>
        <OpponentHand cardCount={west.cardCount} orientation="left" isDealing={state.isDealing} />
      </div>

      {/* ── East avatar ── */}
      <div className={styles.eastAvatar}>
        <PlayerAvatar player={east} size="sm" isActive={active === 'east'} />
      </div>

      {/* ── East card stack ── */}
      <div className={styles.eastCards}>
        <OpponentHand cardCount={east.cardCount} orientation="right" isDealing={state.isDealing} />
      </div>

      {/* ── Trick area — center ── */}
      <div className={styles.trickArea}>
        <TrickArea cards={state.trickCards} winnerPosition={state.trickWinnerPosition} />
      </div>

      {/* ── Bid panel — above south hand, only when it's human's turn to bid ── */}
      {showBid && (
        <div className={styles.bidPanel}>
          <BidPanel
            biddingRound={state.biddingRound!}
            validBidValues={state.validBidValues}
            onBid={state.placeBid}
          />
        </div>
      )}

      {/* ── South row: hand + avatar (flex bar at bottom) ── */}
      <div className={styles.southRow}>
        <div className={styles.handDisplay}>
          <HandDisplay
            cards={state.playerHand}
            legalCardIndices={state.legalCardIndices}
            onPlayCard={state.playCard}
            isDealing={state.isDealing}
          />
        </div>
        <div className={styles.southAvatar}>
          <PlayerAvatar player={south} size="lg" isActive={active === 'south'} />
          <div className={styles.chatBtn}>
            <ChatButton onClick={() => setChatOpen(true)} />
          </div>
        </div>
      </div>

      {/* ── Chat panel overlay ── */}
      <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
