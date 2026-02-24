import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoundSummary } from '../src/components/RoundSummary/RoundSummary.js';
import type { LastRoundResult } from '../src/hooks/useGameSession.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeCancelledResult(): LastRoundResult {
  return { wasCancelled: true, contract: null, bidderName: '', roundScore: null };
}

function makeNormalResult(overrides: Partial<{
  suit: string;
  value: number;
  bidderPosition: number;
  coincheLevel: number;
  contractMet: boolean;
  contractingTeamPoints: number;
  opponentTeamPoints: number;
  contractingTeamFinalScore: number;
  opponentTeamFinalScore: number;
  beloteBonusTeam: 'contracting' | 'opponent' | null;
}> = {}): LastRoundResult {
  const {
    suit = 'hearts',
    value = 80,
    bidderPosition = 0,
    coincheLevel = 1,
    contractMet = true,
    contractingTeamPoints = 102,
    opponentTeamPoints = 60,
    contractingTeamFinalScore = 182,
    opponentTeamFinalScore = 0,
    beloteBonusTeam = null,
  } = overrides;

  return {
    wasCancelled: false,
    contract: {
      id: 'c1',
      suit: suit as 'hearts' | 'diamonds' | 'clubs' | 'spades',
      value: value as 80,
      bidderPosition,
      coincheLevel: coincheLevel as 1 | 2 | 4,
    },
    bidderName: 'ElenaP',
    roundScore: {
      contractMet,
      contractingTeamPoints,
      opponentTeamPoints,
      contractingTeamScore: contractMet ? value : 0,
      opponentTeamScore: contractMet ? 0 : 162,
      contractingTeamFinalScore,
      opponentTeamFinalScore,
      beloteBonusTeam,
    },
  };
}

interface RenderOptions {
  roundNumber?: number;
  result?: LastRoundResult;
  nsTotal?: number;
  ewTotal?: number;
  targetScore?: number;
}

function renderRoundSummary(opts: RenderOptions = {}) {
  const props = {
    roundNumber: opts.roundNumber ?? 1,
    result: opts.result ?? makeNormalResult(),
    nsTotal: opts.nsTotal ?? 182,
    ewTotal: opts.ewTotal ?? 0,
    targetScore: opts.targetScore ?? 501,
    onNextRound: vi.fn(),
  };
  const rendered = render(<RoundSummary {...props} />);
  return { ...rendered, onNextRound: props.onNextRound };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('RoundSummary', () => {
  describe('header', () => {
    it('shows the round number', () => {
      renderRoundSummary({ roundNumber: 3 });
      expect(screen.getByText('ROUND 3')).toBeInTheDocument();
    });

    it('shows COMPLETE badge for a normal round', () => {
      renderRoundSummary();
      expect(screen.getByText('COMPLETE')).toBeInTheDocument();
    });

    it('shows CANCELLED badge for a cancelled round', () => {
      renderRoundSummary({ result: makeCancelledResult() });
      expect(screen.getByText('CANCELLED')).toBeInTheDocument();
    });
  });

  describe('cancelled round', () => {
    it('shows the cancellation message', () => {
      renderRoundSummary({ result: makeCancelledResult() });
      expect(screen.getByText(/all players passed/i)).toBeInTheDocument();
    });

    it('does not show contract details', () => {
      renderRoundSummary({ result: makeCancelledResult() });
      expect(screen.queryByText(/contract met/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/contract failed/i)).not.toBeInTheDocument();
    });
  });

  describe('normal round — contract line', () => {
    it('shows the suit symbol for hearts', () => {
      renderRoundSummary({ result: makeNormalResult({ suit: 'hearts' }) });
      expect(screen.getByText('♥')).toBeInTheDocument();
    });

    it('shows the suit symbol for spades', () => {
      renderRoundSummary({ result: makeNormalResult({ suit: 'spades' }) });
      expect(screen.getByText('♠')).toBeInTheDocument();
    });

    it('shows the suit symbol for diamonds', () => {
      renderRoundSummary({ result: makeNormalResult({ suit: 'diamonds' }) });
      expect(screen.getByText('♦')).toBeInTheDocument();
    });

    it('shows the suit symbol for clubs', () => {
      renderRoundSummary({ result: makeNormalResult({ suit: 'clubs' }) });
      expect(screen.getByText('♣')).toBeInTheDocument();
    });

    it('shows the bid value', () => {
      renderRoundSummary({ result: makeNormalResult({ value: 90 }) });
      expect(screen.getByText('90')).toBeInTheDocument();
    });

    it('shows the bidder name', () => {
      renderRoundSummary();
      expect(screen.getByText('ElenaP')).toBeInTheDocument();
    });

    it('shows coinche label when coincheLevel is 2', () => {
      renderRoundSummary({ result: makeNormalResult({ coincheLevel: 2 }) });
      expect(screen.getByText(/×2 COINCHE/)).toBeInTheDocument();
    });

    it('shows surcoinche label when coincheLevel is 4', () => {
      renderRoundSummary({ result: makeNormalResult({ coincheLevel: 4 }) });
      expect(screen.getByText(/×4 SURCOINCHE/)).toBeInTheDocument();
    });

    it('does not show coinche label when coincheLevel is 1', () => {
      renderRoundSummary({ result: makeNormalResult({ coincheLevel: 1 }) });
      expect(screen.queryByText(/COINCHE/)).not.toBeInTheDocument();
      expect(screen.queryByText(/SURCOINCHE/)).not.toBeInTheDocument();
    });
  });

  describe('normal round — result badge', () => {
    it('shows CONTRACT MET when contract is met', () => {
      renderRoundSummary({ result: makeNormalResult({ contractMet: true }) });
      expect(screen.getByText(/CONTRACT MET/)).toBeInTheDocument();
    });

    it('shows CONTRACT FAILED when contract is not met', () => {
      renderRoundSummary({ result: makeNormalResult({ contractMet: false }) });
      expect(screen.getByText(/CONTRACT FAILED/)).toBeInTheDocument();
    });
  });

  describe('normal round — score table', () => {
    it('shows card points for both teams (NS is contracting)', () => {
      renderRoundSummary({
        result: makeNormalResult({
          bidderPosition: 0,
          contractingTeamPoints: 102,
          opponentTeamPoints: 60,
        }),
      });
      expect(screen.getByText('102')).toBeInTheDocument();
      expect(screen.getByText('60')).toBeInTheDocument();
    });

    it('maps EW as contracting team when bidder is position 1', () => {
      renderRoundSummary({
        result: makeNormalResult({
          bidderPosition: 1,
          contractingTeamPoints: 110,
          opponentTeamPoints: 52,
          contractingTeamFinalScore: 190,
          opponentTeamFinalScore: 0,
        }),
      });
      // EW is contracting (position 1), so NS gets opponent points (52)
      expect(screen.getByText('52')).toBeInTheDocument();
      expect(screen.getByText('110')).toBeInTheDocument();
    });

    it('shows belote bonus row when contracting team has belote', () => {
      renderRoundSummary({
        result: makeNormalResult({ bidderPosition: 0, beloteBonusTeam: 'contracting' }),
      });
      expect(screen.getByText('Belote')).toBeInTheDocument();
      expect(screen.getByText('+20')).toBeInTheDocument();
    });

    it('shows belote bonus for opponent team', () => {
      renderRoundSummary({
        result: makeNormalResult({ bidderPosition: 0, beloteBonusTeam: 'opponent' }),
      });
      expect(screen.getByText('Belote')).toBeInTheDocument();
      // Opponent of NS-contracting = EW gets +20
      expect(screen.getByText('+20')).toBeInTheDocument();
    });

    it('does not show belote row when no belote', () => {
      renderRoundSummary({
        result: makeNormalResult({ beloteBonusTeam: null }),
      });
      expect(screen.queryByText('Belote')).not.toBeInTheDocument();
    });

    it('shows round final scores', () => {
      renderRoundSummary({
        nsTotal: 300,
        result: makeNormalResult({
          bidderPosition: 0,
          contractingTeamFinalScore: 182,
          opponentTeamFinalScore: 0,
        }),
      });
      // "182" appears in round score row and "300" in game totals — both distinct
      const all182 = screen.getAllByText('182');
      expect(all182.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('300')).toBeInTheDocument();
    });
  });

  describe('game totals', () => {
    it('shows NS and EW cumulative totals', () => {
      renderRoundSummary({ nsTotal: 250, ewTotal: 130 });
      expect(screen.getByText('250')).toBeInTheDocument();
      expect(screen.getByText('130')).toBeInTheDocument();
    });

    it('shows the target score', () => {
      renderRoundSummary({ targetScore: 501 });
      expect(screen.getByText('/ 501')).toBeInTheDocument();
    });
  });

  describe('next round button', () => {
    it('renders NEXT ROUND button', () => {
      renderRoundSummary();
      expect(screen.getByRole('button', { name: /next round/i })).toBeInTheDocument();
    });

    it('calls onNextRound when clicked', async () => {
      const user = userEvent.setup();
      const { onNextRound } = renderRoundSummary();

      await user.click(screen.getByRole('button', { name: /next round/i }));
      expect(onNextRound).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('has dialog role with aria-modal', () => {
      renderRoundSummary();
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });
  });
});
