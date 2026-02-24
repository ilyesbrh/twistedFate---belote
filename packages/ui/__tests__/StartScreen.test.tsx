import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StartScreen } from '../src/components/StartScreen/StartScreen.js';
import type { PlayerData } from '../src/data/mockGame.js';

const PLAYERS: PlayerData[] = [
  { name: 'ElenaP',    level: 14, avatarUrl: '/a/0.png', isVip: true,  isDealer: true,  position: 'south', cardCount: 0 },
  { name: 'Villy',     level: 17, avatarUrl: '/a/1.png', isVip: true,  isDealer: false, position: 'west',  cardCount: 0 },
  { name: 'DilyanaBl', level: 18, avatarUrl: '/a/2.png', isVip: false, isDealer: false, position: 'north', cardCount: 0 },
  { name: 'Vane_Bane', level: 10, avatarUrl: '/a/3.png', isVip: true,  isDealer: false, position: 'east',  cardCount: 0 },
];

function renderStartScreen(overrides: Partial<{ players: PlayerData[]; targetScore: number; onPlay: () => void }> = {}) {
  const props = {
    players: PLAYERS,
    targetScore: 501,
    onPlay: vi.fn(),
    ...overrides,
  };
  const result = render(<StartScreen {...props} />);
  return { ...result, onPlay: props.onPlay };
}

describe('StartScreen', () => {
  it('renders the BELOTE title', () => {
    renderStartScreen();
    expect(screen.getByText('BELOTE')).toBeInTheDocument();
  });

  it('renders all four suit symbols', () => {
    renderStartScreen();
    expect(screen.getByText('♠')).toBeInTheDocument();
    expect(screen.getByText('♥')).toBeInTheDocument();
    expect(screen.getByText('♦')).toBeInTheDocument();
    expect(screen.getByText('♣')).toBeInTheDocument();
  });

  it('renders all four player names', () => {
    renderStartScreen();
    for (const p of PLAYERS) {
      expect(screen.getByText(p.name)).toBeInTheDocument();
    }
  });

  it('renders player avatars with correct alt text', () => {
    renderStartScreen();
    for (const p of PLAYERS) {
      const img = screen.getByAltText(p.name);
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', p.avatarUrl);
    }
  });

  it('marks south player as "(You)"', () => {
    renderStartScreen();
    expect(screen.getByText('(You)')).toBeInTheDocument();
  });

  it('shows team badges NS and EW', () => {
    renderStartScreen();
    const nsBadges = screen.getAllByText('NS');
    const ewBadges = screen.getAllByText('EW');
    // NS team: south + north = 2 badges
    expect(nsBadges).toHaveLength(2);
    // EW team: west + east = 2 badges
    expect(ewBadges).toHaveLength(2);
  });

  it('shows VIP badge for VIP players only', () => {
    renderStartScreen();
    const vipBadges = screen.getAllByText('VIP');
    // ElenaP, Villy, Vane_Bane are VIP (3 players)
    expect(vipBadges).toHaveLength(3);
  });

  it('shows player levels', () => {
    renderStartScreen();
    expect(screen.getByText('Lv.14')).toBeInTheDocument();
    expect(screen.getByText('Lv.17')).toBeInTheDocument();
    expect(screen.getByText('Lv.18')).toBeInTheDocument();
    expect(screen.getByText('Lv.10')).toBeInTheDocument();
  });

  it('displays the target score', () => {
    renderStartScreen({ targetScore: 501 });
    expect(screen.getByText('501')).toBeInTheDocument();
    expect(screen.getByText(/first to/i)).toBeInTheDocument();
  });

  it('displays a custom target score', () => {
    renderStartScreen({ targetScore: 1001 });
    expect(screen.getByText('1001')).toBeInTheDocument();
  });

  it('renders the PLAY GAME button', () => {
    renderStartScreen();
    expect(screen.getByRole('button', { name: /play game/i })).toBeInTheDocument();
  });

  it('calls onPlay when PLAY GAME is clicked', async () => {
    const user = userEvent.setup();
    const { onPlay } = renderStartScreen();

    await user.click(screen.getByRole('button', { name: /play game/i }));
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  it('shows the VS separator between west and east', () => {
    renderStartScreen();
    expect(screen.getByText('VS')).toBeInTheDocument();
  });
});
