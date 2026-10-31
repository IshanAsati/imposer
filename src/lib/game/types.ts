import type { MemoryPackId, PackChoiceId } from "./pack-meta";

export const PHASES = [
  "lobby",
  "reveal",
  "clues",
  "discussion",
  "voting",
  "runoff",
  "imposter_guess",
  "round_result",
  "final",
] as const;

export type Phase = (typeof PHASES)[number];
export type Role = "crew" | "imposter";
export type Outcome = "crew" | "imposters";
export type VoteTarget = string | "skip";
export type ConnectionState = "connecting" | "live" | "reconnecting" | "offline";

export const AVATARS = [
  "moth",
  "crow",
  "key",
  "eye",
  "flame",
  "skull",
  "bell",
  "mirror",
  "spider",
  "rose",
  "moon",
  "mask",
] as const;

export type AvatarId = (typeof AVATARS)[number];

export interface Player {
  id: string;
  name: string;
  avatar: AvatarId;
  joinedAt: number;
  score: number;
}

export interface GameSettings {
  imposterCount: number;
  rounds: number;
  packId: PackChoiceId;
  clueSeconds: number;
  discussionSeconds: number;
  voteSeconds: number;
  guessSeconds: number;
  finalGuess: boolean;
}

export interface RoundData {
  number: number;
  packId: MemoryPackId;
  word: string;
  category: string;
  imposterIds: string[];
  clueOrder: string[];
  clues: Record<string, string | null>;
  currentClueIndex: number;
  votes: Record<string, VoteTarget>;
  voteRound: 1 | 2;
  runoffCandidates: string[] | null;
  eliminatedId: string | null;
  tally: Record<string, number> | null;
  guessOptions: string[] | null;
  guess: string | null;
  guessCorrect: boolean | null;
  outcome: Outcome | null;
  outcomeReason: "survived" | "caught" | "guessed" | "stalemate" | null;
  pointsAwarded: Record<string, number> | null;
  readyIds: string[];
  startedAt: number;
  endedAt: number | null;
}

export type OutcomeReason = NonNullable<RoundData["outcomeReason"]>;

export interface RoundSummary {
  number: number;
  word: string;
  category: string;
  imposterIds: string[];
  eliminatedId: string | null;
  outcome: Outcome;
  outcomeReason: OutcomeReason;
  guess: string | null;
  guessCorrect: boolean | null;
  tally: Record<string, number> | null;
  pointsAwarded: Record<string, number> | null;
}

export interface RoomState {
  id: string;
  code: string;
  version: number;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  lastActivityAt: number;
  hostId: string;
  phase: Phase;
  settings: GameSettings;
  players: Player[];
  roundNumber: number;
  round: RoundData | null;
  history: RoundSummary[];
  roundWins: { crew: number; imposters: number };
  usedWords: string[];
  deadline: number | null;
  finalOutcome: Outcome | null;
}

export type AuthMap = Record<string, string>;

export interface StoredRoom {
  room: RoomState;
  auth: AuthMap;
}

export interface ChatMessage {
  id: string;
  playerId: string | null;
  name: string;
  body: string;
  createdAt: number;
  system?: boolean;
}

export interface RoomEvent {
  code: string;
  version: number;
  kind: "state" | "presence" | "chat";
}

export type GameAction =
  | { type: "updateSettings"; settings: Partial<GameSettings> }
  | { type: "startGame" }
  | { type: "beginClues" }
  | { type: "ready" }
  | { type: "submitClue"; clue: string }
  | { type: "skipClue" }
  | { type: "endDiscussion" }
  | { type: "startVote" }
  | { type: "vote"; targetId: VoteTarget }
  | { type: "submitGuess"; word: string }
  | { type: "nextRound" }
  | { type: "rematch" }
  | { type: "claimHost" }
  | { type: "kick"; playerId: string }
  | { type: "leave" }
  | { type: "tick" };

export interface ActionContext {
  now: number;
  rng: () => number;
  hostOnline: boolean;
}

export interface PlayerView {
  id: string;
  name: string;
  avatar: AvatarId;
  score: number;
  online: boolean;
  isHost: boolean;
}

export interface RoundView {
  number: number;
  category: string;
  clueOrder: string[];
  clues: Array<{ playerId: string; word: string | null }>;
  currentCluePlayerId: string | null;
  votedBy: string[];
  runoffCandidates: string[] | null;
  eliminatedId: string | null;
  tally: Record<string, number> | null;
  votes: Record<string, VoteTarget> | null;
  guessOptions: string[] | null;
  guess: string | null;
  guessCorrect: boolean | null;
  outcome: Outcome | null;
  outcomeReason: OutcomeReason | null;
  pointsAwarded: Record<string, number> | null;
  word: string | null;
  imposterIds: string[] | null;
  readyIds: string[];
  startedAt: number;
}

export interface YouView {
  playerId: string;
  isHost: boolean;
  role: Role | null;
  word: string | null;
  category: string | null;
  fellowImposters: string[] | null;
}

export interface RoomView {
  roomId: string;
  code: string;
  version: number;
  phase: Phase;
  hostId: string;
  settings: GameSettings;
  players: PlayerView[];
  roundNumber: number;
  round: RoundView | null;
  history: RoundSummary[];
  roundWins: { crew: number; imposters: number };
  deadline: number | null;
  serverNow: number;
  you: YouView;
  chat: ChatMessage[];
  finalOutcome: Outcome | null;
}

export interface JoinResult {
  code: string;
  playerId: string;
  token: string;
  view: RoomView;
}

export type CreateResult = JoinResult;
