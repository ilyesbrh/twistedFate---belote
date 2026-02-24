import type { ReactElement } from 'react';
import type { LastRoundResult } from '../../hooks/useGameSession.js';
import styles from './RoundSummary.module.css';

const SUIT_SYMBOLS: Record<string, string> = {
  clubs: '♣', hearts: '♥', diamonds: '♦', spades: '♠',
};

const RED_SUITS = new Set(['hearts', 'diamonds']);

interface RoundSummaryProps {
  roundNumber: number;
  result: LastRoundResult;
  /** NS cumulative total (after this round). */
  nsTotal: number;
  /** EW cumulative total (after this round). */
  ewTotal: number;
  targetScore: number;
  onNextRound: () => void;
}

export function RoundSummary({
  roundNumber,
  result,
  nsTotal,
  ewTotal,
  targetScore,
  onNextRound,
}: RoundSummaryProps): ReactElement {
  const { wasCancelled, contract, bidderName, roundScore } = result;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.panel}>

        {/* ── Header ── */}
        <div className={styles.header}>
          <span className={styles.roundLabel}>ROUND {String(roundNumber)}</span>
          <span className={`${styles.statusBadge} ${wasCancelled ? styles.cancelled : styles.complete}`}>
            {wasCancelled ? 'CANCELLED' : 'COMPLETE'}
          </span>
        </div>

        {wasCancelled ? (
          /* ── Cancelled body ── */
          <p className={styles.cancelledMsg}>
            All players passed — no points scored.
          </p>
        ) : contract !== null && roundScore !== null ? (
          /* ── Normal round body ── */
          <NormalRoundBody
            contract={contract}
            bidderName={bidderName}
            roundScore={roundScore}
          />
        ) : null}

        {/* ── Game totals ── */}
        <div className={styles.totals}>
          <span className={styles.totalsLabel}>Game total</span>
          <div className={styles.totalsRow}>
            <div className={styles.totalTeam}>
              <span className={styles.totalTeamLabel}>NS</span>
              <span className={styles.totalTeamScore}>{String(nsTotal)}</span>
            </div>
            <span className={styles.totalsDot}>·</span>
            <div className={styles.totalTeam}>
              <span className={styles.totalTeamLabel}>EW</span>
              <span className={styles.totalTeamScore}>{String(ewTotal)}</span>
            </div>
            <span className={styles.totalsGoal}>/ {String(targetScore)}</span>
          </div>
        </div>

        {/* ── Action ── */}
        <button className={styles.nextBtn} onClick={onNextRound}>
          NEXT ROUND
        </button>

      </div>
    </div>
  );
}

// ── NormalRoundBody ──────────────────────────────────────────────────────────

interface NormalRoundBodyProps {
  contract: NonNullable<LastRoundResult['contract']>;
  bidderName: string;
  roundScore: NonNullable<LastRoundResult['roundScore']>;
}

function NormalRoundBody({ contract, bidderName, roundScore }: NormalRoundBodyProps): ReactElement {
  const { suit, value, coincheLevel, bidderPosition } = contract;
  const { contractMet, contractingTeamPoints, opponentTeamPoints,
          contractingTeamFinalScore, opponentTeamFinalScore, beloteBonusTeam } = roundScore;

  // Determine if NS is the contracting team
  const nsIsContracting = bidderPosition === 0 || bidderPosition === 2;
  const contractingTeamLabel = nsIsContracting ? 'NS' : 'EW';
  const bidderTeamLabel = contractingTeamLabel;

  // Map contracting/opponent scores to NS/EW
  const nsScore = nsIsContracting ? contractingTeamFinalScore : opponentTeamFinalScore;
  const ewScore = nsIsContracting ? opponentTeamFinalScore : contractingTeamFinalScore;
  const nsPoints = nsIsContracting ? contractingTeamPoints : opponentTeamPoints;
  const ewPoints = nsIsContracting ? opponentTeamPoints : contractingTeamPoints;

  // Belote bonus mapping
  const nsBelote =
    (beloteBonusTeam === 'contracting' && nsIsContracting) ||
    (beloteBonusTeam === 'opponent' && !nsIsContracting);
  const ewBelote =
    (beloteBonusTeam === 'contracting' && !nsIsContracting) ||
    (beloteBonusTeam === 'opponent' && nsIsContracting);

  // Coinche label
  const coincheLabel =
    coincheLevel === 4 ? ' ×4 SURCOINCHE' :
    coincheLevel === 2 ? ' ×2 COINCHE'    : '';

  const isRed = RED_SUITS.has(suit);

  return (
    <>
      {/* ── Contract line ── */}
      <div className={styles.contractLine}>
        <span className={`${styles.suitSymbol} ${isRed ? styles.suitRed : styles.suitBlack}`}>
          {SUIT_SYMBOLS[suit] ?? '?'}
        </span>
        <span className={styles.bidValue}>{String(value)}</span>
        {coincheLabel.length > 0 && (
          <span className={styles.coincheTag}>{coincheLabel}</span>
        )}
        <span className={styles.contractBy}>
          by <strong>{bidderName}</strong>
          <span className={`${styles.contractTeam} ${bidderTeamLabel === 'NS' ? styles.nsColor : styles.ewColor}`}>
            {' '}{bidderTeamLabel}
          </span>
        </span>
      </div>

      {/* ── Result badge ── */}
      <div className={`${styles.resultBadge} ${contractMet ? styles.resultMet : styles.resultFailed}`}>
        {contractMet ? 'CONTRACT MET ✓' : 'CONTRACT FAILED ✗'}
      </div>

      {/* ── Score table ── */}
      <div className={styles.scoreTable}>
        {/* Header */}
        <div className={styles.scoreRow}>
          <span />
          <span className={`${styles.teamHeader} ${styles.nsColor}`}>NS (You)</span>
          <span className={styles.teamHeader}>EW</span>
        </div>
        {/* Card points */}
        <div className={styles.scoreRow}>
          <span className={styles.rowLabel}>Card pts</span>
          <span className={styles.scoreVal}>{String(nsPoints)}</span>
          <span className={styles.scoreVal}>{String(ewPoints)}</span>
        </div>
        {/* Belote bonus row — only when at least one team has it */}
        {(nsBelote || ewBelote) && (
          <div className={styles.scoreRow}>
            <span className={styles.rowLabel}>Belote</span>
            <span className={`${styles.scoreVal} ${nsBelote ? styles.bonusVal : ''}`}>
              {nsBelote ? '+20' : '—'}
            </span>
            <span className={`${styles.scoreVal} ${ewBelote ? styles.bonusVal : ''}`}>
              {ewBelote ? '+20' : '—'}
            </span>
          </div>
        )}
        {/* Divider */}
        <div className={styles.scoreDivider} />
        {/* Round total */}
        <div className={styles.scoreRow}>
          <span className={styles.rowLabel}>This round</span>
          <span className={`${styles.scoreVal} ${styles.scoreFinal}`}>{String(nsScore)}</span>
          <span className={`${styles.scoreVal} ${styles.scoreFinal}`}>{String(ewScore)}</span>
        </div>
      </div>
    </>
  );
}
