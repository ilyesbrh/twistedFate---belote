import { type ReactElement, useState } from 'react';
import { GameTable } from './components/GameTable/GameTable.js';

/* Preload all 32 Belote card images so they're cached before play */
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
const RANKS = ['7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'] as const;
const CARD_SRCS = SUITS.flatMap((s) => RANKS.map((r) => `${import.meta.env.BASE_URL}cards/${r}_of_${s}.png`));

export default function App(): ReactElement {
  // Incrementing this key remounts GameTable (and its hook) for a fresh game.
  const [gameKey, setGameKey] = useState(0);

  return (
    <>
      {/* Hidden preload: browser loads all 32 images before they appear in the trick area */}
      <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }} aria-hidden="true">
        {CARD_SRCS.map((src) => (
          <img key={src} src={src} alt="" loading="eager" />
        ))}
      </div>
      <GameTable key={gameKey} onPlayAgain={() => { setGameKey((k) => k + 1); }} />
    </>
  );
}
