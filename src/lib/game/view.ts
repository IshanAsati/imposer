import type {
  ChatMessage,
  Role,
  RoomState,
  RoomView,
  RoundData,
  RoundView,
} from "./types";

export const PRESENCE_MS = 30_000;

export function buildRoundView(
  round: RoundData,
  viewerId: string,
  room: RoomState,
): RoundView {
  const isImposter = round.imposterIds.includes(viewerId);
  const revealAll = room.phase === "round_result" || room.phase === "final";
  const viewerCanSeeWord = revealAll || !isImposter;
  const isClueTurn = room.phase === "clues";

  return {
    number: round.number,
    category: round.category,
    clueOrder: [...round.clueOrder],
    clues: round.clueOrder.map((playerId) => ({
      playerId,
      word: round.clues[playerId] ?? null,
    })),
    currentCluePlayerId: isClueTurn
      ? round.clueOrder[round.currentClueIndex] ?? null
      : null,
    votedBy: Object.keys(round.votes),
    runoffCandidates: round.runoffCandidates ? [...round.runoffCandidates] : null,
    eliminatedId: round.eliminatedId,
    tally: revealAll && round.tally ? { ...round.tally } : null,
    votes: revealAll ? { ...round.votes } : null,
    guessOptions:
      room.phase === "imposter_guess" && isImposter
        ? round.guessOptions
          ? [...round.guessOptions]
          : null
        : null,
    guess: revealAll ? round.guess : null,
    guessCorrect: revealAll ? round.guessCorrect : null,
    outcome: round.outcome,
    outcomeReason: round.outcomeReason,
    pointsAwarded: revealAll ? round.pointsAwarded : null,
    word: viewerCanSeeWord ? round.word : null,
    imposterIds: revealAll ? [...round.imposterIds] : null,
    readyIds: [...round.readyIds],
    startedAt: round.startedAt,
  };
}

export function buildRoomView(
  room: RoomState,
  viewerId: string,
  presence: Record<string, number>,
  chat: ChatMessage[],
  now: number,
): RoomView {
  const viewer = room.players.find((player) => player.id === viewerId);
  if (!viewer) {
    throw new Error("Viewer is not in this room");
  }

  const round = room.round;
  const role: Role | null =
    round && room.phase !== "lobby"
      ? round.imposterIds.includes(viewerId)
        ? "imposter"
        : "crew"
      : null;
  const isImposter = role === "imposter";
  const revealAll = room.phase === "round_result" || room.phase === "final";
  const word =
    round && room.phase !== "lobby" && (!isImposter || revealAll)
      ? round.word
      : null;

  const you = {
    playerId: viewerId,
    isHost: room.hostId === viewerId,
    role,
    word,
    category: round && room.phase !== "lobby" ? round.category : null,
    fellowImposters:
      isImposter && round
        ? round.imposterIds.filter((id) => id !== viewerId)
        : null,
  };

  return {
    roomId: room.id,
    code: room.code,
    version: room.version,
    phase: room.phase,
    hostId: room.hostId,
    settings: { ...room.settings },
    players: room.players.map((player) => ({
      id: player.id,
      name: player.name,
      avatar: player.avatar,
      score: player.score,
      online: now - (presence[player.id] ?? 0) <= PRESENCE_MS,
      isHost: player.id === room.hostId,
    })),
    roundNumber: room.roundNumber,
    round: round ? buildRoundView(round, viewerId, room) : null,
    history: structuredClone(room.history),
    roundWins: { ...room.roundWins },
    deadline: room.deadline,
    serverNow: now,
    you,
    chat: [...chat],
    finalOutcome: room.finalOutcome,
  };
}
