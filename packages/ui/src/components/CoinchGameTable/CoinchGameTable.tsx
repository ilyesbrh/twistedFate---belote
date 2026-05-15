import type { ReactElement } from "react";
import { useCoinchGameSession } from "../../hooks/useCoinchGameSession.js";
import { GameTableView } from "../GameTable/GameTable.js";

interface CoinchGameTableProps {
  readonly onPlayAgain: () => void;
  readonly onBackToMenu?: () => void;
}

export function CoinchGameTable({ onPlayAgain, onBackToMenu }: CoinchGameTableProps): ReactElement {
  const state = useCoinchGameSession();
  return (
    <GameTableView
      state={state}
      onPlayAgain={onPlayAgain}
      onBack={onPlayAgain}
      onBackToMenu={onBackToMenu}
      gameName="Coinche"
      gameSubtitle="SA · TA · Coinché"
      coincheBidding
      gameOverMode={{ kind: "ai", gameVariant: "coinche" }}
    />
  );
}
