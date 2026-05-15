import type { ReactElement } from "react";
import { useState } from "react";
import type { RoundHistoryEntry } from "../../hooks/useGameSession.js";
import styles from "./GameOver.module.css";

const SUIT_GLYPH: Record<string, string> = {
  spades: "♠",
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
};

// NS = positions 0 (ElenaP) & 2 (DilyanaBl)
// EW = positions 1 (Villy) & 3 (Vane_Bane)
const NS_PLAYERS = "ElenaP & DilyanaBl";
const EW_PLAYERS = "Villy & Vane_Bane";

export type GameOverMode =
  | { readonly kind: "ai"; readonly gameVariant: "belote" | "coinche" }
  | { readonly kind: "online-friends" }
  | { readonly kind: "online-random" };

interface GameOverProps {
  /** 0 = NS wins, 1 = EW wins */
  winnerTeamIndex: 0 | 1;
  nsTotal: number;
  ewTotal: number;
  targetScore: number;
  mode: GameOverMode;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
  onFindNewOpponents?: () => void;
  /** Round-by-round history for the optional score breakdown panel. */
  roundHistory?: readonly RoundHistoryEntry[];
}

export function GameOver({
  winnerTeamIndex,
  nsTotal,
  ewTotal,
  targetScore,
  mode,
  onPlayAgain,
  onBackToMenu,
  onFindNewOpponents,
  roundHistory,
}: GameOverProps): ReactElement {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const hasHistory = (roundHistory?.length ?? 0) > 0;
  const nsWins = winnerTeamIndex === 0;
  const winner = nsWins ? "NS" : "EW";
  const winnerPlayers = nsWins ? NS_PLAYERS : EW_PLAYERS;
  const youWon = nsWins; // human is always position 0 = NS team

  // Progress bar widths (cap at 100%)
  const nsWidth = Math.min(100, Math.round((nsTotal / targetScore) * 100));
  const ewWidth = Math.min(100, Math.round((ewTotal / targetScore) * 100));

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.panel}>
        {/* ── Game Over label ── */}
        <div className={styles.gameOverLabel}>GAME OVER</div>

        {/* ── Winner announcement ── */}
        <div className={styles.winnerSection}>
          <div className={`${styles.trophy} ${youWon ? styles.trophyGold : styles.trophySilver}`}>
            {youWon ? "🏆" : "🥈"}
          </div>
          <div className={`${styles.winnerTeam} ${nsWins ? styles.nsColor : styles.ewColor}`}>
            {winner} WINS!
          </div>
          <div className={styles.winnerNames}>{winnerPlayers}</div>
          <div className={`${styles.youResult} ${youWon ? styles.youWon : styles.youLost}`}>
            {youWon ? "You won this game!" : "Better luck next time!"}
          </div>
        </div>

        {/* ── Score bars ── */}
        <div className={styles.scoreBars}>
          <ScoreBar
            label="NS (You)"
            score={nsTotal}
            target={targetScore}
            widthPct={nsWidth}
            isWinner={nsWins}
            colorClass={styles.barNS}
          />

          <ScoreBar
            label="EW"
            score={ewTotal}
            target={targetScore}
            widthPct={ewWidth}
            isWinner={!nsWins}
            colorClass={styles.barEW}
          />

          <div className={styles.targetLine}>
            <span className={styles.targetLabel}>Goal: {String(targetScore)} pts</span>
          </div>
        </div>

        {/* ── Score breakdown toggle + panel ── */}
        {hasHistory && roundHistory && (
          <>
            <button
              type="button"
              className={styles.breakdownToggle}
              onClick={() => {
                setShowBreakdown((s) => !s);
              }}
              aria-expanded={showBreakdown}
            >
              {showBreakdown ? "Hide breakdown" : "See breakdown"}
            </button>
            {showBreakdown && <ScoreBreakdown entries={roundHistory} />}
          </>
        )}

        {/* ── CTAs — mode-aware ── */}
        <div className={styles.ctaGroup}>
          <CtaSet
            mode={mode}
            onPlayAgain={onPlayAgain}
            onBackToMenu={onBackToMenu}
            onFindNewOpponents={onFindNewOpponents}
          />
        </div>
      </div>
    </div>
  );
}

// ── ScoreBreakdown ────────────────────────────────────────────────────────────

interface ScoreBreakdownProps {
  entries: readonly RoundHistoryEntry[];
}

function formatContract(entry: RoundHistoryEntry): string {
  if (entry.contract === null) return "—";
  const c = entry.contract;
  const lvlSuffix = c.coincheLevel === 4 ? " ×4" : c.coincheLevel === 2 ? " ×2" : "";
  if (entry.isCapot === true) return `Capot ${SUIT_GLYPH[c.suit] ?? ""}${lvlSuffix}`;
  if (entry.contractType === "sans-atout") return `SA ${String(c.value)}${lvlSuffix}`;
  if (entry.contractType === "tout-atout") return `TA ${String(c.value)}${lvlSuffix}`;
  return `${SUIT_GLYPH[c.suit] ?? c.suit} ${String(c.value)}${lvlSuffix}`;
}

function formatBonus(entry: RoundHistoryEntry): string {
  const parts: string[] = [];
  if (entry.roundScore?.beloteBonusTeam) parts.push("Belote +20");
  if (entry.announcementPoints && entry.announcementPoints > 0) {
    parts.push(`Annonces +${String(entry.announcementPoints)}`);
  }
  return parts.join(", ") || "—";
}

function ScoreBreakdown({ entries }: ScoreBreakdownProps): ReactElement {
  return (
    <div className={styles.breakdownWrap}>
      <table className={styles.breakdownTable} aria-label="Score breakdown">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Contract</th>
            <th scope="col">Result</th>
            <th scope="col">NS</th>
            <th scope="col">EW</th>
            <th scope="col">Bonus</th>
            <th scope="col">NS tot</th>
            <th scope="col">EW tot</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => {
            const made = e.roundScore?.contractMet ?? false;
            return (
              <tr key={e.roundNumber}>
                <td>{e.roundNumber}</td>
                <td>{formatContract(e)}</td>
                <td className={made ? styles.resultMade : styles.resultFailed}>
                  {e.contract === null ? "—" : made ? "Made" : "Failed"}
                </td>
                <td>{e.roundScore?.contractingTeamFinalScore ?? 0}</td>
                <td>{e.roundScore?.opponentTeamFinalScore ?? 0}</td>
                <td>{formatBonus(e)}</td>
                <td>{e.nsCumulative}</td>
                <td>{e.ewCumulative}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── CTA set ──────────────────────────────────────────────────────────────────

interface CtaSetProps {
  mode: GameOverMode;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
  onFindNewOpponents?: () => void;
}

function CtaSet({
  mode,
  onPlayAgain,
  onBackToMenu,
  onFindNewOpponents,
}: CtaSetProps): ReactElement {
  if (mode.kind === "ai") {
    return (
      <>
        <button
          type="button"
          className={styles.playAgainBtn}
          onClick={onPlayAgain}
          aria-label="Play again"
          data-touch="primary"
        >
          PLAY AGAIN
        </button>
        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={onBackToMenu}
          aria-label="Back to Menu"
          data-touch="primary"
        >
          Back to Menu
        </button>
      </>
    );
  }
  if (mode.kind === "online-friends") {
    return (
      <>
        <button
          type="button"
          className={styles.playAgainBtn}
          onClick={onPlayAgain}
          aria-label="Leave room"
          data-touch="primary"
        >
          LEAVE ROOM
        </button>
        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={onBackToMenu}
          aria-label="Back to Menu"
          data-touch="primary"
        >
          Back to Menu
        </button>
      </>
    );
  }
  // online-random
  return (
    <>
      <button
        type="button"
        className={styles.playAgainBtn}
        onClick={() => {
          onFindNewOpponents?.();
        }}
        aria-label="Find new opponents"
        data-touch="primary"
      >
        FIND NEW OPPONENTS
      </button>
      <button
        type="button"
        className={styles.secondaryBtn}
        onClick={onPlayAgain}
        aria-label="Leave"
        data-touch="primary"
      >
        LEAVE
      </button>
      <button
        type="button"
        className={styles.tertiaryBtn}
        onClick={onBackToMenu}
        aria-label="Back to Menu"
      >
        Back to Menu
      </button>
    </>
  );
}

// ── ScoreBar ─────────────────────────────────────────────────────────────────

interface ScoreBarProps {
  label: string;
  score: number;
  target: number;
  widthPct: number;
  isWinner: boolean;
  colorClass: string;
}

function ScoreBar({
  label,
  score,
  target,
  widthPct,
  isWinner,
  colorClass,
}: ScoreBarProps): ReactElement {
  return (
    <div className={styles.barRow}>
      <span className={`${styles.barLabel} ${isWinner ? styles.barLabelWinner : ""}`}>{label}</span>
      <div className={styles.barTrack}>
        <div
          className={`${styles.barFill} ${colorClass}`}
          style={{ width: `${String(widthPct)}%` }}
        />
      </div>
      <span className={`${styles.barScore} ${isWinner ? styles.barScoreWinner : ""}`}>
        {String(score)}
        {score >= target && <span className={styles.checkMark}> ✓</span>}
      </span>
    </div>
  );
}
