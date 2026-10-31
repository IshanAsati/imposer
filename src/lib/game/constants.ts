import type { GameSettings } from "./types";

/**
 * Pure game constants shared by the engine and the client. Keep this module
 * free of word-pack imports so client bundles cannot leak secret memories.
 */
export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 12;
export const MIN_ROUNDS = 3;
export const MAX_ROUNDS = 10;
export const REVEAL_MS = 30_000;
export const RESULT_MS = 60_000;
export const ROOM_TTL_SECONDS = 6 * 60 * 60;

export const DEFAULT_SETTINGS: GameSettings = {
  imposterCount: 1,
  rounds: 5,
  packId: "random",
  clueSeconds: 45,
  discussionSeconds: 90,
  voteSeconds: 30,
  guessSeconds: 30,
  finalGuess: true,
};

export function maxImposters(playerCount: number): number {
  return Math.min(3, Math.max(1, Math.floor(playerCount / 3)));
}

export const CLUE_TIME_OPTIONS = [30, 45, 60, 90] as const;
export const DISCUSSION_TIME_OPTIONS = [60, 90, 120, 180] as const;
export const VOTE_TIME_OPTIONS = [20, 30, 45, 60] as const;
export const GUESS_TIME_OPTIONS = [20, 30, 45] as const;
