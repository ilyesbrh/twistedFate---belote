import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HistoryScreen } from "../src/components/HistoryScreen/HistoryScreen.js";
import type { MatchSummary } from "../src/online/api/matches.js";

const ALICE_ID = "u_alice";
const BOB_ID = "u_bob";

function makeMatch(overrides: Partial<MatchSummary> = {}): MatchSummary {
  return {
    id: "m_1",
    code: "ABCD",
    startedAt: 1_000,
    endedAt: 2_000,
    targetScore: 501,
    finalScoreNs: 510,
    finalScoreEw: 220,
    winnerTeam: 0,
    seats: [
      { seat: 0, userId: ALICE_ID, guestId: null, nickname: "Alice" },
      { seat: 1, userId: "u_x", guestId: null, nickname: "Xavier" },
      { seat: 2, userId: BOB_ID, guestId: null, nickname: "Bob" },
      { seat: 3, userId: "u_y", guestId: null, nickname: "Yvette" },
    ],
    ...overrides,
  };
}

describe("HistoryScreen", () => {
  it("shows the loading state when loading", () => {
    render(
      <HistoryScreen matches={[]} loading error={null} currentUserId={ALICE_ID} onBack={vi.fn()} />,
    );
    expect(screen.getByTestId("history-loading")).toBeInTheDocument();
  });

  it("shows the empty state when no matches", () => {
    render(
      <HistoryScreen
        matches={[]}
        loading={false}
        error={null}
        currentUserId={ALICE_ID}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByTestId("history-empty")).toBeInTheDocument();
  });

  it("renders a list of matches with code and final score", () => {
    const matches: MatchSummary[] = [makeMatch({ id: "m_a" }), makeMatch({ id: "m_b" })];
    render(
      <HistoryScreen
        matches={matches}
        loading={false}
        error={null}
        currentUserId={ALICE_ID}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByTestId("history-row-m_a")).toBeInTheDocument();
    expect(screen.getByTestId("history-row-m_b")).toBeInTheDocument();
  });

  it("shows a 'Win' badge when the current user's team won", () => {
    // Alice is seat 0 (team 0 / NS). winnerTeam = 0 → Alice's team won.
    render(
      <HistoryScreen
        matches={[makeMatch({ id: "m_w", winnerTeam: 0 })]}
        loading={false}
        error={null}
        currentUserId={ALICE_ID}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByTestId("history-badge-m_w")).toHaveTextContent(/win/i);
  });

  it("shows a 'Loss' badge when the other team won", () => {
    render(
      <HistoryScreen
        matches={[makeMatch({ id: "m_l", winnerTeam: 1 })]}
        loading={false}
        error={null}
        currentUserId={ALICE_ID}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByTestId("history-badge-m_l")).toHaveTextContent(/loss/i);
  });

  it("clicking Back fires onBack", async () => {
    const user = userEvent.setup({ delay: 0 });
    const onBack = vi.fn();
    render(
      <HistoryScreen
        matches={[]}
        loading={false}
        error={null}
        currentUserId={ALICE_ID}
        onBack={onBack}
      />,
    );
    await user.click(screen.getByTestId("history-back"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("shows an error message when error is non-null", () => {
    render(
      <HistoryScreen
        matches={[]}
        loading={false}
        error="couldn't load"
        currentUserId={ALICE_ID}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByTestId("history-error")).toBeInTheDocument();
  });
});
