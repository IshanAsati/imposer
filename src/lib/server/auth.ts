import {
  createHash,
  randomBytes,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import type { StoredRoom } from "@/lib/game/types";

const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function createRoomCode(): string {
  let code = "";
  for (let index = 0; index < 6; index += 1) {
    code += ROOM_ALPHABET[randomInt(ROOM_ALPHABET.length)];
  }
  return code;
}

export function createPlayerId(): string {
  return `p_${randomBytes(8).toString("hex")}`;
}

export function createRoomId(): string {
  return `r_${randomBytes(8).toString("hex")}`;
}

export function createToken(): string {
  return randomBytes(32).toString("base64url");
}

export function createMessageId(): string {
  return `m_${randomUUID()}`;
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function authenticateToken(
  stored: StoredRoom,
  token: string | null,
): string | null {
  if (!token) {
    return null;
  }
  const hash = hashToken(token);
  for (const [playerId, storedHash] of Object.entries(stored.auth)) {
    if (
      safeEqual(hash, storedHash) &&
      stored.room.players.some((player) => player.id === playerId)
    ) {
      return playerId;
    }
  }
  return null;
}
