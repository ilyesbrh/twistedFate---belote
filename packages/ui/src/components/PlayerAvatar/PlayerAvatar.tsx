import { Badge, Tooltip } from "@radix-ui/themes";
import type { PlayerData, Position } from "../../data/mockGame.js";
import type { GameMessage, MessageType } from "../../messages/gameMessages.js";
import { TimerRing } from "../TimerRing/TimerRing.js";
import styles from "./PlayerAvatar.module.css";

type AvatarSize = "lg" | "md" | "sm";

interface PlayerAvatarProps {
  player: PlayerData;
  size?: AvatarSize;
  isActive?: boolean;
  isContractHolder?: boolean;
  bubbleMessage?: GameMessage | null;
}

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

export function PlayerAvatar({
  player,
  size = "md",
  isActive = false,
  isContractHolder = false,
  bubbleMessage,
}: PlayerAvatarProps) {
  return (
    <div
      className={`${styles.wrapper} ${styles[size]}`}
      data-testid={`player-avatar-${player.position}`}
    >
      {/* Circular photo frame */}
      <div className={styles.frame}>
        {/* Timer countdown ring */}
        <TimerRing isActive={isActive} />

        {player.isVip && (
          <span className={styles.vipBadge}>
            <Badge color="yellow" variant="solid" size="1" radius="small">
              VIP
            </Badge>
          </span>
        )}

        <img className={styles.photo} src={player.avatarUrl} alt={player.name} draggable={false} />

        <div className={styles.levelBadge}>
          <Badge color="blue" variant="solid" size="1" radius="full">
            {player.level}
          </Badge>
        </div>

        {isContractHolder && (
          <div
            className={styles.contractHolderBadge}
            aria-label="Contract holder"
            title="Contract holder"
          >
            ★
          </div>
        )}

        {player.isDealer && (
          <div className={styles.dealerBadge}>
            <Badge color="orange" variant="solid" size="1" radius="full">
              D
            </Badge>
          </div>
        )}
      </div>

      {/* Thought bubble tooltip */}
      {bubbleMessage != null && (
        <div
          className={`${styles.tooltip} ${TOOLTIP_SIDE[player.position]} ${TYPE_CLASS[bubbleMessage.type]}`}
          data-testid="thought-bubble"
        >
          <span className={styles.tooltipText}>{bubbleMessage.text}</span>
          <div className={styles.tooltipArrow} aria-hidden="true" />
        </div>
      )}

      {/* Name pill label */}
      <Tooltip content={player.name} side="bottom">
        <div className={`${styles.nameLabel} ${isActive ? styles.nameLabelActive : ""}`}>
          <span className={styles.globeIcon}>🌐</span>
          <span className={styles.name}>{player.name}</span>
          {isActive && <span className={styles.timerDot} aria-hidden="true" />}
        </div>
      </Tooltip>
    </div>
  );
}
