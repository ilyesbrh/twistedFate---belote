import { RoundSummary } from "../../components/RoundSummary/RoundSummary.js";
import type { Contract, RoundScore } from "@belote/core";
import type { LastRoundResult } from "../../hooks/useGameSession.js";
import type { Fixture } from "../ScreenViewer/types.js";

const noop = (): void => {
  /* fixture: no-op */
};

function makeContract(over: Partial<Contract> = {}): Contract {
  return {
    id: "fixture-contract",
    suit: "spades",
    value: 110,
    bidderPosition: 0,
    coincheLevel: 1,
    ...over,
  };
}

function makeRoundScore(over: Partial<RoundScore> = {}): RoundScore {
  return {
    contractingTeamPoints: 92,
    opponentTeamPoints: 70,
    contractingTeamRoundedPoints: 90,
    opponentTeamRoundedPoints: 70,
    contractMet: true,
    contractingTeamScore: 200,
    opponentTeamScore: 70,
    beloteBonusTeam: null,
    contractingTeamFinalScore: 200,
    opponentTeamFinalScore: 70,
    ...over,
  };
}

function makeResult(
  contract: Contract | null,
  bidderName: string,
  roundScore: RoundScore | null,
  wasCancelled = false,
): LastRoundResult {
  return { contract, bidderName, roundScore, wasCancelled };
}

export const roundSummaryFixtures: readonly Fixture[] = [
  {
    id: "round-summary-takers-won",
    title: "Takers won simple contract (110 ♠)",
    group: "RoundSummary",
    render: () => (
      <RoundSummary
        roundNumber={3}
        result={makeResult(makeContract(), "ElenaP", makeRoundScore())}
        nsTotal={310}
        ewTotal={170}
        targetScore={501}
        onNextRound={noop}
      />
    ),
  },
  {
    id: "round-summary-takers-lost",
    title: "Takers lost (capot to defenders)",
    group: "RoundSummary",
    render: () => (
      <RoundSummary
        roundNumber={5}
        result={makeResult(
          makeContract({ value: 130 }),
          "Vane_Bane",
          makeRoundScore({
            contractingTeamPoints: 32,
            opponentTeamPoints: 130,
            contractMet: false,
            contractingTeamFinalScore: 0,
            opponentTeamFinalScore: 162 + 130,
          }),
        )}
        nsTotal={460}
        ewTotal={210}
        targetScore={501}
        onNextRound={noop}
      />
    ),
  },
  {
    id: "round-summary-coinche-made",
    title: "Coinche made (×2)",
    group: "RoundSummary",
    render: () => (
      <RoundSummary
        roundNumber={6}
        result={makeResult(
          makeContract({ value: 100, coincheLevel: 2 }),
          "ElenaP",
          makeRoundScore({
            contractingTeamPoints: 110,
            opponentTeamPoints: 52,
            contractMet: true,
            contractingTeamFinalScore: 320,
            opponentTeamFinalScore: 0,
          }),
        )}
        nsTotal={400}
        ewTotal={210}
        targetScore={501}
        onNextRound={noop}
      />
    ),
  },
  {
    id: "round-summary-coinche-failed",
    title: "Coinche failed (×2 against takers)",
    group: "RoundSummary",
    render: () => (
      <RoundSummary
        roundNumber={7}
        result={makeResult(
          makeContract({ value: 100, coincheLevel: 2 }),
          "ElenaP",
          makeRoundScore({
            contractingTeamPoints: 60,
            opponentTeamPoints: 102,
            contractMet: false,
            contractingTeamFinalScore: 0,
            opponentTeamFinalScore: 320,
          }),
        )}
        nsTotal={210}
        ewTotal={420}
        targetScore={501}
        onNextRound={noop}
      />
    ),
  },
  {
    id: "round-summary-surcoinche-made",
    title: "Surcoinche made (×4)",
    group: "RoundSummary",
    render: () => (
      <RoundSummary
        roundNumber={8}
        result={makeResult(
          makeContract({ value: 110, coincheLevel: 4 }),
          "DilyanaBl",
          makeRoundScore({
            contractingTeamPoints: 130,
            opponentTeamPoints: 32,
            contractMet: true,
            contractingTeamFinalScore: 640,
            opponentTeamFinalScore: 0,
            beloteBonusTeam: "contracting",
          }),
        )}
        nsTotal={620}
        ewTotal={120}
        targetScore={501}
        onNextRound={noop}
      />
    ),
  },
  {
    id: "round-summary-cancelled",
    title: "Round cancelled (all passed)",
    group: "RoundSummary",
    render: () => (
      <RoundSummary
        roundNumber={2}
        result={makeResult(null, "", null, true)}
        nsTotal={45}
        ewTotal={50}
        targetScore={501}
        onNextRound={noop}
      />
    ),
  },
  {
    id: "round-summary-coinche-sa",
    title: "Coinche SA (sans-atout) contract met",
    group: "RoundSummary",
    render: () => (
      <RoundSummary
        roundNumber={4}
        result={{
          wasCancelled: false,
          contract: { id: "c1", suit: "hearts", value: 90, bidderPosition: 0, coincheLevel: 1 },
          bidderName: "ElenaP",
          roundScore: makeRoundScore({ contractingTeamFinalScore: 90, opponentTeamFinalScore: 72 }),
          contractType: "sans-atout",
          announcementWinner: "ns",
          announcementPoints: 50,
        }}
        nsTotal={230}
        ewTotal={180}
        targetScore={1000}
        onNextRound={noop}
      />
    ),
  },
  {
    id: "round-summary-coinche-ta",
    title: "Coinche TA (tout-atout) contract failed",
    group: "RoundSummary",
    render: () => (
      <RoundSummary
        roundNumber={5}
        result={{
          wasCancelled: false,
          contract: { id: "c2", suit: "hearts", value: 100, bidderPosition: 1, coincheLevel: 1 },
          bidderName: "Villy",
          roundScore: makeRoundScore({
            contractingTeamPoints: 60,
            opponentTeamPoints: 102,
            contractMet: false,
            contractingTeamFinalScore: 0,
            opponentTeamFinalScore: 260,
          }),
          contractType: "tout-atout",
        }}
        nsTotal={330}
        ewTotal={60}
        targetScore={1000}
        onNextRound={noop}
      />
    ),
  },
  {
    id: "round-summary-coinche-capot",
    title: "Coinche Capot achieved",
    group: "RoundSummary",
    render: () => (
      <RoundSummary
        roundNumber={3}
        result={{
          wasCancelled: false,
          contract: { id: "c3", suit: "spades", value: 160, bidderPosition: 2, coincheLevel: 1 },
          bidderName: "DilyanaBl",
          roundScore: makeRoundScore({
            contractingTeamPoints: 152,
            opponentTeamPoints: 0,
            contractMet: true,
            contractingTeamFinalScore: 500,
            opponentTeamFinalScore: 0,
          }),
          isCapot: true,
        }}
        nsTotal={500}
        ewTotal={0}
        targetScore={1000}
        onNextRound={noop}
      />
    ),
  },
];
