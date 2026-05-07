/**
 * Warm the browser cache with every card face PNG used by Belote (32 cards:
 * 7-ace × 4 suits). Without this, the first cold game shows blank/popping
 * cards while each `<img>` fetches on first mount. Fired-and-forgotten from
 * `main.tsx` during app bootstrap.
 */

const SUITS = ["hearts", "diamonds", "clubs", "spades"] as const;
const RANKS = ["7", "8", "9", "10", "jack", "queen", "king", "ace"] as const;

let started = false;

export function preloadCardAssets(): void {
  if (started) return;
  started = true;
  const base = import.meta.env.BASE_URL;
  for (const rank of RANKS) {
    for (const suit of SUITS) {
      const img = new Image();
      img.decoding = "async";
      img.src = `${base}cards/${rank}_of_${suit}.png`;
    }
  }
}
