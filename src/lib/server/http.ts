import { NextResponse } from "next/server";
import type { AvatarId, GameAction, GameSettings } from "@/lib/game/types";
import { avatarIsValid, GameError } from "@/lib/game/engine";
import { isPackChoiceId } from "@/lib/game/pack-meta";

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
};

export function jsonResponse(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status, headers: NO_STORE });
}

export function routeErrorResponse(error: unknown): NextResponse {
  if (error instanceof GameError) {
    return jsonResponse(
      { error: { code: error.code, message: error.message } },
      error.status,
    );
  }

  console.error("[imposter] Unhandled route error", error);
  return jsonResponse(
    {
      error: {
        code: "INTERNAL",
        message: "The house has gone quiet. Try again in a moment.",
      },
    },
    500,
  );
}

export function socketErrorResponse(error: unknown): Response {
  if (error instanceof GameError) {
    return new Response(
      JSON.stringify({ error: { code: error.code, message: error.message } }),
      {
        status: error.status,
        headers: { ...NO_STORE, "Content-Type": "application/json" },
      },
    );
  }
  return new Response(
    JSON.stringify({
      error: { code: "INTERNAL", message: "The house has gone quiet." },
    }),
    {
      status: 500,
      headers: { ...NO_STORE, "Content-Type": "application/json" },
    },
  );
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new GameError("BAD_REQUEST", "The request could not be read.", 400);
  }
}

export function requireToken(request: Request): string {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match?.[1]) {
    throw new GameError("UNAUTHORIZED", "You are not at this wake.", 401);
  }
  return match[1];
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") ?? "local";
}

export function parseName(value: unknown): string {
  if (typeof value !== "string") {
    throw new GameError("BAD_REQUEST", "Tell us what to call you.", 422);
  }
  const name = value
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const length = Array.from(name).length;
  if (length < 2 || length > 18) {
    throw new GameError(
      "BAD_REQUEST",
      "Your name must be between 2 and 18 characters.",
      422,
    );
  }
  if (!/[\p{L}\p{N}]/u.test(name)) {
    throw new GameError(
      "BAD_REQUEST",
      "Your name needs at least one letter or number.",
      422,
    );
  }
  return name;
}

export function parseAvatar(value: unknown): AvatarId {
  if (!avatarIsValid(value)) {
    throw new GameError("BAD_REQUEST", "Choose a valid sigil.", 422);
  }
  return value;
}

export function parseRoomCode(value: unknown): string {
  if (typeof value !== "string") {
    throw new GameError("NOT_FOUND", "That wake could not be found.", 404);
  }
  const code = value.trim().toUpperCase();
  if (!/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(code)) {
    throw new GameError("NOT_FOUND", "That wake could not be found.", 404);
  }
  return code;
}

function parseSettingsPatch(value: unknown): Partial<GameSettings> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new GameError("BAD_REQUEST", "Those rules could not be read.", 422);
  }
  const input = value as Record<string, unknown>;
  const patch: Partial<GameSettings> = {};

  const numericKeys = [
    "imposterCount",
    "rounds",
    "clueSeconds",
    "discussionSeconds",
    "voteSeconds",
    "guessSeconds",
  ] as const;
  for (const key of numericKeys) {
    if (key in input) {
      if (typeof input[key] !== "number" || !Number.isFinite(input[key])) {
        throw new GameError("BAD_REQUEST", "Those rules could not be read.", 422);
      }
      patch[key] = input[key];
    }
  }

  if ("packId" in input) {
    if (!isPackChoiceId(input.packId)) {
      throw new GameError("BAD_REQUEST", "That memory drawer does not exist.", 422);
    }
    patch.packId = input.packId;
  }

  if ("finalGuess" in input) {
    if (typeof input.finalGuess !== "boolean") {
      throw new GameError("BAD_REQUEST", "That rule could not be read.", 422);
    }
    patch.finalGuess = input.finalGuess;
  }

  return patch;
}

export function parseGameAction(value: unknown): GameAction {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new GameError("BAD_REQUEST", "That action could not be read.", 422);
  }

  const input = value as Record<string, unknown>;
  const type = input.type;
  if (typeof type !== "string") {
    throw new GameError("BAD_REQUEST", "That action could not be read.", 422);
  }

  switch (type) {
    case "updateSettings":
      return { type, settings: parseSettingsPatch(input.settings) };
    case "startGame":
    case "beginClues":
    case "ready":
    case "skipClue":
    case "endDiscussion":
    case "startVote":
    case "nextRound":
    case "rematch":
    case "claimHost":
    case "leave":
      return { type };
    case "submitClue": {
      if (typeof input.clue !== "string" || input.clue.length > 64) {
        throw new GameError("BAD_REQUEST", "That clue could not be read.", 422);
      }
      return { type, clue: input.clue };
    }
    case "vote": {
      if (
        typeof input.targetId !== "string" ||
        input.targetId.length === 0 ||
        input.targetId.length > 64
      ) {
        throw new GameError("BAD_REQUEST", "That vote could not be read.", 422);
      }
      return { type, targetId: input.targetId };
    }
    case "submitGuess": {
      if (
        typeof input.word !== "string" ||
        input.word.length === 0 ||
        input.word.length > 80
      ) {
        throw new GameError("BAD_REQUEST", "That guess could not be read.", 422);
      }
      return { type, word: input.word };
    }
    case "kick": {
      if (
        typeof input.playerId !== "string" ||
        input.playerId.length === 0 ||
        input.playerId.length > 64
      ) {
        throw new GameError("BAD_REQUEST", "That guest could not be read.", 422);
      }
      return { type, playerId: input.playerId };
    }
    default:
      throw new GameError("BAD_REQUEST", "That action is not part of this wake.", 422);
  }
}

export function parseChatBody(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new GameError("BAD_REQUEST", "That whisper could not be read.", 422);
  }
  const input = value as Record<string, unknown>;
  if (typeof input.body !== "string") {
    throw new GameError("BAD_REQUEST", "That whisper could not be read.", 422);
  }
  const body = input.body
    .normalize("NFKC")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (body.length === 0) {
    throw new GameError("BAD_REQUEST", "An empty whisper is still a whisper.", 422);
  }
  if (body.length > 240) {
    throw new GameError("BAD_REQUEST", "Keep whispers under 240 characters.", 422);
  }
  return body;
}
