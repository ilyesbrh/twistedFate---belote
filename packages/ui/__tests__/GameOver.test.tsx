import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameOver } from '../src/components/GameOver/GameOver.js';

interface RenderOptions {
  winnerTeamIndex?: 0 | 1;
  nsTotal?: number;
  ewTotal?: number;
  targetScore?: number;
}

function renderGameOver(opts: RenderOptions = {}) {
  const props = {
    winnerTeamIndex: opts.winnerTeamIndex ?? 0,
    nsTotal: opts.nsTotal ?? 520,
    ewTotal: opts.ewTotal ?? 380,
    targetScore: opts.targetScore ?? 501,
    onPlayAgain: vi.fn(),
  };
  const rendered = render(<GameOver {...props} />);
  return { ...rendered, onPlayAgain: props.onPlayAgain };
}

describe('GameOver', () => {
  describe('game over label', () => {
    it('shows GAME OVER text', () => {
      renderGameOver();
      expect(screen.getByText('GAME OVER')).toBeInTheDocument();
    });
  });

  describe('winner announcement — NS wins', () => {
    it('shows NS WINS when NS team wins', () => {
      renderGameOver({ winnerTeamIndex: 0 });
      expect(screen.getByText('NS WINS!')).toBeInTheDocument();
    });

    it('shows the gold trophy when you win (NS)', () => {
      renderGameOver({ winnerTeamIndex: 0 });
      expect(screen.getByText('🏆')).toBeInTheDocument();
    });

    it('shows "You won this game!" message', () => {
      renderGameOver({ winnerTeamIndex: 0 });
      expect(screen.getByText('You won this game!')).toBeInTheDocument();
    });

    it('shows NS player names', () => {
      renderGameOver({ winnerTeamIndex: 0 });
      expect(screen.getByText('ElenaP & DilyanaBl')).toBeInTheDocument();
    });
  });

  describe('winner announcement — EW wins', () => {
    it('shows EW WINS when EW team wins', () => {
      renderGameOver({ winnerTeamIndex: 1 });
      expect(screen.getByText('EW WINS!')).toBeInTheDocument();
    });

    it('shows the silver trophy when you lose', () => {
      renderGameOver({ winnerTeamIndex: 1 });
      expect(screen.getByText('🥈')).toBeInTheDocument();
    });

    it('shows "Better luck next time!" message', () => {
      renderGameOver({ winnerTeamIndex: 1 });
      expect(screen.getByText('Better luck next time!')).toBeInTheDocument();
    });

    it('shows EW player names', () => {
      renderGameOver({ winnerTeamIndex: 1 });
      expect(screen.getByText('Villy & Vane_Bane')).toBeInTheDocument();
    });
  });

  describe('score bars', () => {
    it('shows NS (You) label', () => {
      renderGameOver();
      expect(screen.getByText('NS (You)')).toBeInTheDocument();
    });

    it('shows EW label', () => {
      renderGameOver();
      expect(screen.getByText('EW')).toBeInTheDocument();
    });

    it('displays NS total score', () => {
      renderGameOver({ nsTotal: 520 });
      expect(screen.getByText('520')).toBeInTheDocument();
    });

    it('displays EW total score', () => {
      renderGameOver({ ewTotal: 380 });
      expect(screen.getByText('380')).toBeInTheDocument();
    });

    it('shows target score goal', () => {
      renderGameOver({ targetScore: 501 });
      expect(screen.getByText(/Goal: 501 pts/)).toBeInTheDocument();
    });

    it('shows checkmark for the winning score', () => {
      renderGameOver({ winnerTeamIndex: 0, nsTotal: 520, targetScore: 501 });
      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('does not show checkmark for the losing score', () => {
      renderGameOver({ winnerTeamIndex: 0, nsTotal: 520, ewTotal: 380, targetScore: 501 });
      // Only one checkmark (for NS who reached target)
      const checks = screen.getAllByText('✓');
      expect(checks).toHaveLength(1);
    });
  });

  describe('play again button', () => {
    it('renders PLAY AGAIN button', () => {
      renderGameOver();
      expect(screen.getByRole('button', { name: /play again/i })).toBeInTheDocument();
    });

    it('calls onPlayAgain when clicked', async () => {
      const user = userEvent.setup();
      const { onPlayAgain } = renderGameOver();

      await user.click(screen.getByRole('button', { name: /play again/i }));
      expect(onPlayAgain).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('has dialog role with aria-modal', () => {
      renderGameOver();
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });
  });
});
