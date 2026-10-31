import {
  AVATARS,
  type ActionContext,
  type AvatarId,
  type GameAction,
  type GameSettings,
  type Outcome,
  type OutcomeReason,
  type Player,
  type RoomState,
  type RoundData,
  type RoundSummary,
  type VoteTarget,
} from "./types";
import type { PackChoiceId } from "./pack-meta";
import { isPackChoiceId } from "./pack-meta";
import { chooseGuessOptions, chooseMemory, type MemoryEntry } from "./words";
import {
  DEFAULT_SETTINGS,
  MAX_PLAYERS,
  MAX_ROUNDS,
  MIN_PLAYERS,
  MIN_ROUNDS,
  RESULT_MS,
  REVEAL_MS,
  ROOM_TTL_SECONDS,
  maxImposters,
} from "./constants";

export {
  DEFAULT_SETTINGS,
  MAX_PLAYERS,
  MAX_ROUNDS,
  MIN_PLAYERS,
  MIN_ROUNDS,
  RESULT_MS,
  REVEAL_MS,
  ROOM_TTL_SECONDS,
  maxImposters,
};

export type GameErrorCode =
  | "BAD_REQUEST"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "ROOM_FULL"
  | "ROOM_STARTED"
  | "WRONG_PHASE"
  | "NOT_YOUR_TURN"
  | "INVALID_TARGET"
  | "INVALID_CLUE"
  | "INVALID_GUESS"
  | "RATE_LIMITED"
  | "SERVER_BUSY";

export class GameError extends Error {
  readonly code: GameErrorCode;
  readonly status: number;

  constructor(code: GameErrorCode, message: string, status = 400) {
    super(message);
    this.name = "GameError";
    this.code = code;
    this.status = status;
  }
}

export interface CreateRoomStateInput {
  code: string;
  roomId: string;
  host: { id: string; name: string; avatar: AvatarId };
  now: number;
  settings?: Partial<GameSettings>;
}

function cloneRoom(room: RoomState): RoomState {
  return structuredClone(room);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function pickIndex(rng: () => number, length: number): number {
  const value = Math.floor(rng() * length);
  return Math.max(0, Math.min(length - 1, value));
}

function shuffled<T>(items: readonly T[], rng: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = pickIndex(rng, i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function normalizeSettings(
  input: Partial<GameSettings>,
  playerCount: number,
): GameSettings {
  const max = maxImposters(Math.max(MIN_PLAYERS, playerCount));
  const packId: PackChoiceId = isPackChoiceId(input.packId)
    ? input.packId
    : DEFAULT_SETTINGS.packId;

  return {
    imposterCount: clamp(
      input.imposterCount ?? DEFAULT_SETTINGS.imposterCount,
      1,
      max,
    ),
    rounds: clamp(input.rounds ?? DEFAULT_SETTINGS.rounds, MIN_ROUNDS, MAX_ROUNDS),
    packId,
    clueSeconds: clamp(
      input.clueSeconds ?? DEFAULT_SETTINGS.clueSeconds,
      15,
      120,
    ),
    discussionSeconds: clamp(
      input.discussionSeconds ?? DEFAULT_SETTINGS.discussionSeconds,
      30,
      300,
    ),
    voteSeconds: clamp(
      input.voteSeconds ?? DEFAULT_SETTINGS.voteSeconds,
      10,
      120,
    ),
    guessSeconds: clamp(
      input.guessSeconds ?? DEFAULT_SETTINGS.guessSeconds,
      10,
      120,
    ),
    finalGuess: input.finalGuess ?? DEFAULT_SETTINGS.finalGuess,
  };
}

export function createRoomState(input: CreateRoomStateInput): RoomState {
  const host: Player = {
    id: input.host.id,
    name: input.host.name,
    avatar: input.host.avatar,
    joinedAt: input.now,
    score: 0,
  };

  return {
    id: input.roomId,
    code: input.code,
    version: 1,
    createdAt: input.now,
    updatedAt: input.now,
    expiresAt: input.now + ROOM_TTL_SECONDS * 1000,
    lastActivityAt: input.now,
    hostId: host.id,
    phase: "lobby",
    settings: normalizeSettings(input.settings ?? {}, MAX_PLAYERS),
    players: [host],
    roundNumber: 0,
    round: null,
    history: [],
    roundWins: { crew: 0, imposters: 0 },
    usedWords: [],
    deadline: null,
    finalOutcome: null,
  };
}

function requireHost(room: RoomState, actorId: string): void {
  if (room.hostId !== actorId) {
    throw new GameError("FORBIDDEN", "Only the host may do that.", 403);
  }
}

function requirePlayer(room: RoomState, actorId: string): Player {
  const player = room.players.find((candidate) => candidate.id === actorId);
  if (!player) {
    throw new GameError("UNAUTHORIZED", "You are not at this wake.", 401);
  }
  return player;
}

function requireRound(room: RoomState): RoundData {
  if (!room.round) {
    throw new GameError("WRONG_PHASE", "There is no memory in play.", 409);
  }
  return room.round;
}

function currentCluePlayerId(round: RoundData): string | null {
  return round.clueOrder[round.currentClueIndex] ?? null;
}

function startRound(room: RoomState, now: number, rng: () => number): void {
  const memory: MemoryEntry = chooseMemory(room.settings.packId, room.usedWords, rng);
  const imposterIds = shuffled(room.players, rng)
    .slice(0, room.settings.imposterCount)
    .map((player) => player.id);
  const clueOrder = shuffled(room.players, rng).map((player) => player.id);

  room.roundNumber += 1;
  room.round = {
    number: room.roundNumber,
    packId: memory.packId,
    word: memory.word,
    category: memory.category,
    imposterIds,
    clueOrder,
    clues: Object.fromEntries(clueOrder.map((id) => [id, null])),
    currentClueIndex: 0,
    votes: {},
    voteRound: 1,
    runoffCandidates: null,
    eliminatedId: null,
    tally: null,
    guessOptions: null,
    guess: null,
    guessCorrect: null,
    outcome: null,
    outcomeReason: null,
    pointsAwarded: null,
    readyIds: [],
    startedAt: now,
    endedAt: null,
  };
  room.phase = "reveal";
  room.deadline = now + REVEAL_MS;
  room.finalOutcome = null;
  room.usedWords.push(memory.word);
}

function beginClues(room: RoomState, now: number): void {
  const round = requireRound(room);
  if (room.phase !== "reveal") {
    throw new GameError("WRONG_PHASE", "The memories have already been shared.", 409);
  }
  room.phase = "clues";
  round.currentClueIndex = 0;
  round.readyIds = [];
  room.deadline = now + room.settings.clueSeconds * 1000;
}

function completeClues(room: RoomState, now: number): void {
  const round = requireRound(room);
  round.currentClueIndex = round.clueOrder.length;
  room.phase = "discussion";
  room.deadline = now + room.settings.discussionSeconds * 1000;
}

function recordClue(
  room: RoomState,
  actorId: string,
  clue: string | null,
  now: number,
): void {
  const round = requireRound(room);
  if (room.phase !== "clues") {
    throw new GameError("WRONG_PHASE", "The clues have already been given.", 409);
  }

  const current = currentCluePlayerId(round);
  if (current !== actorId) {
    throw new GameError("NOT_YOUR_TURN", "Wait for your turn to speak.", 409);
  }

  round.clues[actorId] = clue;
  round.currentClueIndex += 1;

  if (round.currentClueIndex >= round.clueOrder.length) {
    completeClues(room, now);
  } else {
    room.deadline = now + room.settings.clueSeconds * 1000;
  }
}

function startVoting(room: RoomState, now: number): void {
  const round = requireRound(room);
  if (room.phase !== "discussion") {
    throw new GameError("WRONG_PHASE", "The table is not ready to vote.", 409);
  }
  room.phase = "voting";
  round.voteRound = 1;
  round.votes = {};
  round.runoffCandidates = null;
  round.tally = null;
  room.deadline = now + room.settings.voteSeconds * 1000;
}

function allPlayersVoted(room: RoomState, round: RoundData): boolean {
  return room.players.every((player) => round.votes[player.id] !== undefined);
}

function timeoutGuess(room: RoomState, now: number): void {
  const round = requireRound(room);
  if (room.phase !== "imposter_guess") {
    return;
  }
  round.guess = null;
  round.guessCorrect = false;
  settleRound(room, "crew", "caught", now);
}

function eliminatePlayer(
  room: RoomState,
  playerId: string,
  now: number,
  rng: () => number,
): void {
  const round = requireRound(room);
  round.eliminatedId = playerId;

  if (round.imposterIds.includes(playerId)) {
    if (room.settings.finalGuess) {
      round.guessOptions = chooseGuessOptions(
        {
          word: round.word,
          category: round.category,
          packId: round.packId,
        },
        rng,
      );
      round.guess = null;
      round.guessCorrect = null;
      room.phase = "imposter_guess";
      room.deadline = now + room.settings.guessSeconds * 1000;
      return;
    }

    settleRound(room, "crew", "caught", now);
    return;
  }

  settleRound(room, "imposters", "survived", now);
}

function settleRound(
  room: RoomState,
  outcome: Outcome,
  reason: OutcomeReason,
  now: number,
): void {
  const round = requireRound(room);
  if (round.outcome !== null) {
    return;
  }

  const pointsAwarded: Record<string, number> = Object.fromEntries(
    room.players.map((player) => [player.id, 0]),
  );
  const imposters = new Set(round.imposterIds);
  const award = (playerId: string, points: number) => {
    pointsAwarded[playerId] = (pointsAwarded[playerId] ?? 0) + points;
  };

  if (reason === "survived" || reason === "stalemate") {
    for (const id of round.imposterIds) {
      award(id, 3);
    }
  } else if (reason === "caught") {
    for (const player of room.players) {
      if (!imposters.has(player.id)) {
        award(player.id, 3);
      }
    }
  } else if (reason === "guessed") {
    for (const player of room.players) {
      award(player.id, imposters.has(player.id) ? 2 : 1);
    }
  }

  for (const player of room.players) {
    const points = pointsAwarded[player.id] ?? 0;
    player.score += points;
  }

  round.outcome = outcome;
  round.outcomeReason = reason;
  round.pointsAwarded = pointsAwarded;
  round.readyIds = [];
  round.endedAt = now;
  room.roundWins[outcome] += 1;
  room.phase = "round_result";
  room.deadline = now + RESULT_MS;

  const summary: RoundSummary = {
    number: round.number,
    word: round.word,
    category: round.category,
    imposterIds: [...round.imposterIds],
    eliminatedId: round.eliminatedId,
    outcome,
    outcomeReason: reason,
    guess: round.guess,
    guessCorrect: round.guessCorrect,
    tally: round.tally ? { ...round.tally } : null,
    pointsAwarded: { ...pointsAwarded },
  };
  room.history.push(summary);
}

function resolveVote(room: RoomState, now: number, rng: () => number): void {
  const round = requireRound(room);
  if (room.phase !== "voting" && room.phase !== "runoff") {
    throw new GameError("WRONG_PHASE", "There is no vote to count.", 409);
  }

  const tally: Record<string, number> = { skip: 0 };
  for (const player of room.players) {
    tally[player.id] = 0;
  }
  for (const target of Object.values(round.votes)) {
    tally[target] = (tally[target] ?? 0) + 1;
  }
  round.tally = tally;

  const counts = room.players.map((player) => ({
    id: player.id,
    count: tally[player.id] ?? 0,
  }));
  const highest = Math.max(0, ...counts.map((entry) => entry.count));
  const top = counts
    .filter((entry) => entry.count === highest && highest > 0)
    .map((entry) => entry.id);
  const skipCount = tally.skip ?? 0;

  if (highest === 0 || skipCount >= highest) {
    settleRound(room, "imposters", "stalemate", now);
    return;
  }

  if (top.length > 1) {
    if (round.voteRound === 1) {
      room.phase = "runoff";
      round.voteRound = 2;
      round.runoffCandidates = top;
      round.votes = {};
      round.tally = null;
      round.eliminatedId = null;
      room.deadline = now + room.settings.voteSeconds * 1000;
      return;
    }

    settleRound(room, "imposters", "stalemate", now);
    return;
  }

  eliminatePlayer(room, top[0], now, rng);
}

function finalOutcomeFor(room: RoomState): Outcome {
  return room.roundWins.crew > room.roundWins.imposters ? "crew" : "imposters";
}

function advanceAfterResult(room: RoomState, now: number, rng: () => number): void {
  if (room.phase !== "round_result") {
    throw new GameError("WRONG_PHASE", "The round is still being told.", 409);
  }

  if (room.roundNumber >= room.settings.rounds) {
    room.phase = "final";
    room.finalOutcome = finalOutcomeFor(room);
    room.deadline = null;
    return;
  }

  startRound(room, now, rng);
}

function validateClue(round: RoundData, clue: string): string {
  const trimmed = clue.trim();
  if (trimmed.length === 0 || trimmed.length > 32 || /\s/u.test(trimmed)) {
    throw new GameError(
      "INVALID_CLUE",
      "A clue must be one word of 32 characters or fewer.",
      422,
    );
  }
  if (!/^[\p{L}\p{N}'’-]+$/u.test(trimmed)) {
    throw new GameError(
      "INVALID_CLUE",
      "Use letters, numbers, apostrophes, or hyphens only.",
      422,
    );
  }
  const normalized = trimmed.toLowerCase();
  if (
    normalized === round.word.toLowerCase() ||
    normalized === round.category.toLowerCase()
  ) {
    throw new GameError(
      "INVALID_CLUE",
      "That is too close to the memory itself.",
      422,
    );
  }
  return trimmed;
}

function removePlayer(room: RoomState, playerId: string): void {
  const index = room.players.findIndex((player) => player.id === playerId);
  if (index === -1) {
    throw new GameError("INVALID_TARGET", "That guest is not at the table.", 404);
  }
  room.players.splice(index, 1);
  if (room.hostId === playerId) {
    room.hostId = room.players[0]?.id ?? "";
  }
}

export function applyGameAction(
  state: RoomState,
  actorId: string,
  action: GameAction,
  context: ActionContext,
): RoomState {
  requirePlayer(state, actorId);
  const room = cloneRoom(state);

  switch (action.type) {
    case "updateSettings": {
      requireHost(room, actorId);
      if (room.phase !== "lobby") {
        throw new GameError(
          "WRONG_PHASE",
          "The rules are sealed once the wake begins.",
          409,
        );
      }
      room.settings = normalizeSettings(
        { ...room.settings, ...action.settings },
        room.players.length,
      );
      break;
    }

    case "startGame": {
      requireHost(room, actorId);
      if (room.phase !== "lobby") {
        throw new GameError("WRONG_PHASE", "The wake has already begun.", 409);
      }
      if (room.players.length < MIN_PLAYERS) {
        throw new GameError(
          "WRONG_PHASE",
          `At least ${MIN_PLAYERS} souls are needed.`,
          409,
        );
      }
      room.settings = normalizeSettings(room.settings, room.players.length);
      for (const player of room.players) {
        player.score = 0;
      }
      room.history = [];
      room.roundWins = { crew: 0, imposters: 0 };
      room.usedWords = [];
      room.roundNumber = 0;
      room.finalOutcome = null;
      startRound(room, context.now, context.rng);
      break;
    }

    case "beginClues": {
      requireHost(room, actorId);
      beginClues(room, context.now);
      break;
    }

    case "ready": {
      const round = requireRound(room);
      if (room.phase !== "reveal" && room.phase !== "round_result") {
        throw new GameError("WRONG_PHASE", "There is nothing to acknowledge.", 409);
      }
      if (!round.readyIds.includes(actorId)) {
        round.readyIds.push(actorId);
      }
      if (room.players.every((player) => round.readyIds.includes(player.id))) {
        if (room.phase === "reveal") {
          beginClues(room, context.now);
        } else {
          advanceAfterResult(room, context.now, context.rng);
        }
      }
      break;
    }

    case "submitClue": {
      const round = requireRound(room);
      const clue = validateClue(round, action.clue);
      recordClue(room, actorId, clue, context.now);
      break;
    }

    case "skipClue": {
      recordClue(room, actorId, null, context.now);
      break;
    }

    case "endDiscussion":
    case "startVote": {
      requireHost(room, actorId);
      startVoting(room, context.now);
      break;
    }

    case "vote": {
      const round = requireRound(room);
      if (room.phase !== "voting" && room.phase !== "runoff") {
        throw new GameError("WRONG_PHASE", "The vote has closed.", 409);
      }
      if (action.targetId !== "skip") {
        if (action.targetId === actorId) {
          throw new GameError("INVALID_TARGET", "You cannot accuse yourself.", 422);
        }
        const target = room.players.find(
          (player) => player.id === action.targetId,
        );
        if (!target) {
          throw new GameError("INVALID_TARGET", "That guest is not at the table.", 422);
        }
        if (
          room.phase === "runoff" &&
          !round.runoffCandidates?.includes(action.targetId)
        ) {
          throw new GameError(
            "INVALID_TARGET",
            "Only the tied guests stand accused.",
            422,
          );
        }
      }
      round.votes[actorId] = action.targetId;
      if (allPlayersVoted(room, round)) {
        resolveVote(room, context.now, context.rng);
      }
      break;
    }

    case "submitGuess": {
      const round = requireRound(room);
      if (room.phase !== "imposter_guess") {
        throw new GameError("WRONG_PHASE", "There is no memory to name.", 409);
      }
      if (!round.imposterIds.includes(actorId)) {
        throw new GameError("FORBIDDEN", "You do not get to guess.", 403);
      }
      if (!round.guessOptions?.includes(action.word)) {
        throw new GameError(
          "INVALID_GUESS",
          "Choose one of the memories offered.",
          422,
        );
      }
      round.guess = action.word;
      round.guessCorrect =
        action.word.toLowerCase() === round.word.toLowerCase();
      settleRound(
        room,
        round.guessCorrect ? "imposters" : "crew",
        round.guessCorrect ? "guessed" : "caught",
        context.now,
      );
      break;
    }

    case "nextRound": {
      requireHost(room, actorId);
      advanceAfterResult(room, context.now, context.rng);
      break;
    }

    case "rematch": {
      requireHost(room, actorId);
      if (room.phase !== "final") {
        throw new GameError("WRONG_PHASE", "The wake is not over yet.", 409);
      }
      for (const player of room.players) {
        player.score = 0;
      }
      room.phase = "lobby";
      room.round = null;
      room.roundNumber = 0;
      room.history = [];
      room.roundWins = { crew: 0, imposters: 0 };
      room.usedWords = [];
      room.deadline = null;
      room.finalOutcome = null;
      break;
    }

    case "claimHost": {
      if (room.hostId === actorId) {
        throw new GameError("FORBIDDEN", "You are already the host.", 409);
      }
      if (context.hostOnline) {
        throw new GameError("FORBIDDEN", "The host is still here.", 409);
      }
      room.hostId = actorId;
      break;
    }

    case "kick": {
      requireHost(room, actorId);
      if (room.phase !== "lobby") {
        throw new GameError("WRONG_PHASE", "No one can be removed mid-wake.", 409);
      }
      if (action.playerId === actorId) {
        throw new GameError("INVALID_TARGET", "You cannot dismiss yourself.", 422);
      }
      removePlayer(room, action.playerId);
      room.settings = normalizeSettings(room.settings, room.players.length);
      break;
    }

    case "leave": {
      if (room.phase !== "lobby" && room.phase !== "final") {
        throw new GameError(
          "WRONG_PHASE",
          "You cannot leave a round in progress. You may close the door behind you.",
          409,
        );
      }
      removePlayer(room, actorId);
      room.settings = normalizeSettings(
        room.settings,
        Math.max(MIN_PLAYERS, room.players.length),
      );
      break;
    }

    case "tick": {
      break;
    }

    default: {
      const exhaustive: never = action;
      throw new GameError(
        "BAD_REQUEST",
        `Unknown action: ${String(exhaustive)}`,
        422,
      );
    }
  }

  return room;
}

export interface AdvanceResult {
  room: RoomState;
  changed: boolean;
}

export function advanceRoom(
  state: RoomState,
  now: number,
  rng: () => number,
): AdvanceResult {
  if (state.deadline === null || now < state.deadline) {
    return { room: state, changed: false };
  }

  const room = cloneRoom(state);
  let guard = 0;

  while (
    room.deadline !== null &&
    now >= room.deadline &&
    guard < 50
  ) {
    guard += 1;

    switch (room.phase) {
      case "reveal": {
        beginClues(room, now);
        break;
      }
      case "clues": {
        const round = requireRound(room);
        const current = currentCluePlayerId(round);
        if (current) {
          round.clues[current] = null;
          round.currentClueIndex += 1;
          if (round.currentClueIndex >= round.clueOrder.length) {
            completeClues(room, now);
          } else {
            room.deadline = now + room.settings.clueSeconds * 1000;
          }
        } else {
          completeClues(room, now);
        }
        break;
      }
      case "discussion": {
        startVoting(room, now);
        break;
      }
      case "voting":
      case "runoff": {
        resolveVote(room, now, rng);
        break;
      }
      case "imposter_guess": {
        timeoutGuess(room, now);
        break;
      }
      case "round_result": {
        advanceAfterResult(room, now, rng);
        break;
      }
      default: {
        room.deadline = null;
        break;
      }
    }
  }

  return { room, changed: true };
}

export function avatarIsValid(value: unknown): value is AvatarId {
  return typeof value === "string" && AVATARS.includes(value as AvatarId);
}

export function isEliminated(room: RoomState, playerId: string): boolean {
  return room.round?.eliminatedId === playerId;
}

export function voteTargetIsValid(target: VoteTarget): boolean {
  return target === "skip" || target.length > 0;
}
