import type { ReactElement } from "react";
import type { Suit } from "@belote/core";
import type { PlayerData, Position } from "../../data/mockGame.js";
import type { GameMessage, MessageType } from "../../messages/gameMessages.js";
import styles from "./PlayerAvatar.module.css";

type AvatarSize = "lg" | "md" | "sm";

interface PlayerAvatarProps {
  player: PlayerData;
  size?: AvatarSize;
  isActive?: boolean;
  isContractHolder?: boolean;
  /** When set + isContractHolder, the stamp shows the suit + value instead of a generic ★. */
  contractInfo?: {
    suit: Suit;
    value: number;
    contractType?: "suit" | "sans-atout" | "tout-atout";
    isCapot?: boolean;
  } | null;
  bubbleMessage?: GameMessage | null;
}

const SUIT_GLYPH: Record<Suit, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

const isRedSuit = (s: Suit): boolean => s === "hearts" || s === "diamonds";

const TOOLTIP_SIDE: Record<Position, string> = {
  north: styles.tooltipBottom,
  south: styles.tooltipTop,
  west: styles.tooltipRight,
  east: styles.tooltipLeft,
};

const TYPE_CLASS: Record<MessageType, string> = {
  bid: styles.bid,
  trick_win: styles.trickWin,
  contract: styles.contract,
  round_cancelled: styles.roundCancelled,
};

/**
 * Player avatar — paper "name-tag" token.
 *
 * Replaces the iteration-016 photo+badge avatar (round pravatar photo,
 * Radix VIP/level/dealer badges, timer ring) with a compact cream paper
 * card showing the player's monogram in serif. Indicators (dealer, VIP,
 * contract holder, active turn) are small ink/terracotta stamps in the
 * corners of the card.
 */
export function PlayerAvatar({
  player,
  size = "md",
  isActive = false,
  isContractHolder = false,
  contractInfo = null,
  bubbleMessage,
}: PlayerAvatarProps): ReactElement {
  // 2-letter monogram so players with the same first letter are
  // distinguishable (e.g. Villy / Vane_Bane → "Vi" / "Va").
  const monogram = player.name.slice(0, 2).replace(/_/g, "").toUpperCase();
  return (
    <div
      className={`${styles.wrapper} ${styles[size]} ${isActive ? styles.wrapperActive : ""}`}
      data-testid={`player-avatar-${player.position}`}
    >
      {/* Token: paper card with monogram */}
      <div className={styles.token}>
        <span className={styles.monogram}>{monogram}</span>

        {player.isDealer && (
          <span className={styles.dealerStamp} aria-label="Dealer">
            D
          </span>
        )}
        {isContractHolder &&
          (contractInfo !== null ? (() => {
            const isSA = contractInfo?.contractType === "sans-atout";
            const isTA = contractInfo?.contractType === "tout-atout";
            const isCap = contractInfo?.isCapot === true;
            const isRed = isRedSuit(contractInfo.suit);
            return (
              <span
                className={`${styles.contractStamp} ${styles.contractStampRich} ${
                  isRed && !isSA && !isTA ? styles.contractStampRed : ""
                }`}
                aria-label={`Contract holder — ${isCap ? "Capot" : isSA ? "SA" : isTA ? "TA" : String(contractInfo.value)} ${contractInfo.suit}`}
                title={`Contract: ${isCap ? "Capot" : isSA ? `SA ${String(contractInfo.value)}` : isTA ? `TA ${String(contractInfo.value)}` : `${String(contractInfo.value)} ${SUIT_GLYPH[contractInfo.suit]}`}`}
              >
                {isCap ? (
                  <span className={styles.contractSuit}>Capot</span>
                ) : isSA ? (
                  <span className={styles.contractSuit}>SA</span>
                ) : isTA ? (
                  <span className={styles.contractSuit}>TA</span>
                ) : (
                  <span className={styles.contractSuit}>{SUIT_GLYPH[contractInfo.suit]}</span>
                )}
                {!isCap && <span className={styles.contractValue}>{contractInfo.value}</span>}
              </span>
            );
          })() : (
            <span
              className={styles.contractStamp}
              aria-label="Contract holder"
              title="Contract holder"
            >
              ★
            </span>
          ))}
        {isActive && <span className={styles.activeRing} aria-hidden="true" />}
      </div>

      {/* Thought bubble — same shape & vocabulary as iteration 023. */}
      {bubbleMessage != null && (
        <div
          className={`${styles.tooltip} ${TOOLTIP_SIDE[player.position]} ${TYPE_CLASS[bubbleMessage.type]}`}
          data-testid="thought-bubble"
        >
          <span className={styles.tooltipText}>{bubbleMessage.text}</span>
          <div className={styles.tooltipArrow} aria-hidden="true" />
        </div>
      )}

      {/* Name label — handwritten under the token */}
      <div className={styles.nameLabel}>
        <span className={styles.name}>{player.name}</span>
      </div>
    </div>
  );
}
