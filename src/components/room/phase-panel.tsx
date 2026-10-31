"use client";

import { CluesView } from "./views/clues-view";
import { DiscussionView } from "./views/discussion-view";
import { FinalView } from "./views/final-view";
import { GuessView } from "./views/guess-view";
import { LobbyView } from "./views/lobby-view";
import { ResultView } from "./views/result-view";
import { RevealView } from "./views/reveal-view";
import { VotingView } from "./views/voting-view";
import { useRoom } from "./room-context";

export function PhasePanel() {
  const { view } = useRoom();

  switch (view.phase) {
    case "lobby":
      return <LobbyView />;
    case "reveal":
      return <RevealView />;
    case "clues":
      return <CluesView />;
    case "discussion":
      return <DiscussionView />;
    case "voting":
    case "runoff":
      return <VotingView />;
    case "imposter_guess":
      return <GuessView />;
    case "round_result":
      return <ResultView />;
    case "final":
      return <FinalView />;
    default:
      return null;
  }
}
