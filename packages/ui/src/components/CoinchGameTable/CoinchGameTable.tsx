import type { ReactElement } from "react";
import { useCoinchGameSession } from "../../hooks/useCoinchGameSession.js";
import { GameTableView } from "../GameTable/GameTable.js";

interface CoinchGameTableProps {
  readonly onPlayAgain: () => void;
}

export function CoinchGameTable({ onPlayAgain }: CoinchGameTableProps): ReactElement {
  const state = useCoinchGameSession();
  return <GameTableView state={state} onPlayAgain={onPlayAgain} />;
}
