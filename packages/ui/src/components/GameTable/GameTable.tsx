import { useState } from "react";
import { useGameSession } from "../../hooks/useGameSession.js";
import type { GameSessionState } from "../../hooks/useGameSession.js";
import { AvatarActionMenu } from "../AvatarActionMenu/AvatarActionMenu.js";
import { BidPanel } from "../BidPanel/BidPanel.js";
import { BidWinReveal } from "../BidWinReveal/BidWinReveal.js";
import { ChatPanel } from "../ChatPanel/ChatPanel.js";
import { GameOver } from "../GameOver/GameOver.js";
import { HandDisplay } from "../HandDisplay/HandDisplay.js";
import { OpponentHand } from "../OpponentHand/OpponentHand.js";
import { PlayerAvatar } from "../PlayerAvatar/PlayerAvatar.js";
import { RoundSummary } from "../RoundSummary/RoundSummary.js";
import { ScorePanel } from "../ScorePanel/ScorePanel.js";
import { StartScreen } from "../StartScreen/StartScreen.js";
import { TrickArea } from "../TrickArea/TrickArea.js";
import styles from "./GameTable.module.css";

interface GameTableProps {
  onPlayAgain: () => void;
}

/** Container: wires the local AI session and renders the table. */
export function GameTable({ onPlayAgain }: GameTableProps) {
  const state = useGameSession();
  return <GameTableView state={state} onPlayAgain={onPlayAgain} />;
}

interface GameTableViewProps {
  state: GameSessionState;
  onPlayAgain: () => void;
  gameName?: string;
  gameSubtitle?: string;
}

/** Pure-presentation game table — accepts any GameSessionState (AI or online). */
export function GameTableView({ state, onPlayAgain, gameName, gameSubtitle }: GameTableViewProps) {
  const [chatOpen, setChatOpen] = useState(false);

  const south = state.players.find((p) => p.position === "south")!;
  const north = state.players.find((p) => p.position === "north")!;
  const west = state.players.find((p) => p.position === "west")!;
  const east = state.players.find((p) => p.position === "east")!;

  const active = state.activePosition;
  const showBid = state.phase === "bidding" && state.isMyTurn && state.biddingRound !== null;
  const contractInfo = state.contract
    ? { suit: state.contract.suit, value: state.contract.value }
    : null;

  const tableBg = `url('${import.meta.env.BASE_URL}table-paper.svg') center / cover no-repeat`;

  return (
    <div className={styles.table} style={{ background: tableBg }} data-testid="game-table">
      {/* ── Felt layers ── */}
      <div className={styles.felt} aria-hidden="true" />
      <div className={styles.feltWeave} aria-hidden="true" />
      <div className={styles.feltCenter} aria-hidden="true" />
      <div className={styles.rings} aria-hidden="true" />
      <div className={styles.woodRim} aria-hidden="true" />

      {/* ── Score panel — top left ── */}
      <div className={styles.scorePanel}>
        <ScorePanel
          target={state.targetScore}
          usScore={state.usScore}
          themScore={state.themScore}
          usTotalScore={state.usTotalScore}
          themTotalScore={state.themTotalScore}
          trumpSuit={state.trumpSuit ?? "spades"}
          dealerName={state.dealerName}
          contractValue={state.contract?.value ?? null}
          contractCoincheLevel={state.contract?.coincheLevel ?? 1}
        />
      </div>

      {/* ── North hand — top center ── */}
      <div className={styles.northHand}>
        <OpponentHand cardCount={north.cardCount} orientation="top" isDealing={state.isDealing} />
      </div>

      {/* ── North avatar ── */}
      <div className={styles.northAvatar}>
        <PlayerAvatar
          player={north}
          size="md"
          isActive={active === "north"}
          isContractHolder={state.contractHolderPosition === "north"}
          contractInfo={state.contractHolderPosition === "north" ? contractInfo : null}
          bubbleMessage={state.bubbles.north}
        />
      </div>

      {/* ── West avatar ── */}
      <div className={styles.westAvatar}>
        <PlayerAvatar
          player={west}
          size="sm"
          isActive={active === "west"}
          isContractHolder={state.contractHolderPosition === "west"}
          contractInfo={state.contractHolderPosition === "west" ? contractInfo : null}
          bubbleMessage={state.bubbles.west}
        />
      </div>

      {/* ── West card stack ── */}
      <div className={styles.westCards}>
        <OpponentHand cardCount={west.cardCount} orientation="left" isDealing={state.isDealing} />
      </div>

      {/* ── East avatar ── */}
      <div className={styles.eastAvatar}>
        <PlayerAvatar
          player={east}
          size="sm"
          isActive={active === "east"}
          isContractHolder={state.contractHolderPosition === "east"}
          contractInfo={state.contractHolderPosition === "east" ? contractInfo : null}
          bubbleMessage={state.bubbles.east}
        />
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
          <PlayerAvatar
            player={south}
            size="lg"
            isActive={active === "south"}
            isContractHolder={state.contractHolderPosition === "south"}
            contractInfo={state.contractHolderPosition === "south" ? contractInfo : null}
            bubbleMessage={state.bubbles.south}
          />
          <div className={styles.chatBtn}>
            <AvatarActionMenu onChatOpen={() => setChatOpen(true)} />
          </div>
        </div>
      </div>

      {/* ── Chat panel overlay ── */}
      <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} messages={state.messages} />

      {/* ── Bid-win reveal overlay (one-shot per round, animates to winner) ── */}
      {state.bidReveal != null && (
        <BidWinReveal
          key={state.bidReveal.key}
          contractValue={state.bidReveal.contract.value}
          contractSuit={state.bidReveal.contract.suit}
          contractCoincheLevel={state.bidReveal.contract.coincheLevel}
          winnerPosition={state.bidReveal.winnerPosition}
          winnerName={state.bidReveal.winnerName}
          onComplete={state.dismissBidReveal}
        />
      )}

      {/* ── Start screen ── */}
      {state.phase === "idle" && (
        <StartScreen
          players={state.players}
          targetScore={state.targetScore}
          onPlay={state.startGame}
          gameName={gameName}
          gameSubtitle={gameSubtitle}
        />
      )}

      {/* ── Round summary (inter-party) ── */}
      {state.phase === "roundComplete" && state.lastRoundResult !== null && (
        <RoundSummary
          roundNumber={state.roundNumber}
          result={state.lastRoundResult}
          nsTotal={state.usTotalScore}
          ewTotal={state.themTotalScore}
          targetScore={state.targetScore}
          onNextRound={state.startNextRound}
          autoNextRoundMs={state.isOnline ? 5000 : undefined}
        />
      )}

      {/* ── Game over screen ── */}
      {state.phase === "gameComplete" && state.winnerTeamIndex !== null && (
        <GameOver
          winnerTeamIndex={state.winnerTeamIndex}
          nsTotal={state.usTotalScore}
          ewTotal={state.themTotalScore}
          targetScore={state.targetScore}
          onPlayAgain={onPlayAgain}
        />
      )}
    </div>
  );
}
