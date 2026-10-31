import {
  applyGameAction,
  advanceRoom,
  createRoomState,
  GameError,
  MAX_PLAYERS,
  ROOM_TTL_SECONDS,
} from "@/lib/game/engine";
import type {
  AvatarId,
  ChatMessage,
  GameAction,
  GameSettings,
  JoinResult,
  RoomView,
  StoredRoom,
} from "@/lib/game/types";
import { buildRoomView, PRESENCE_MS } from "@/lib/game/view";
import {
  authenticateToken,
  createMessageId,
  createPlayerId,
  createRoomCode,
  createRoomId,
  createToken,
  hashToken,
} from "./auth";
import { getRoomStore, type RoomStore } from "./store";

const ROOM_TTL_MS = ROOM_TTL_SECONDS * 1000;

export interface CreateRoomInput {
  name: string;
  avatar: AvatarId;
  settings?: Partial<GameSettings>;
}

export interface JoinRoomInput {
  name: string;
  avatar: AvatarId;
}

export interface ActionOutcome {
  view: RoomView | null;
  playerId: string;
}

function touchRoom(room: StoredRoom["room"], now: number): void {
  room.version += 1;
  room.updatedAt = now;
  room.lastActivityAt = now;
  room.expiresAt = now + ROOM_TTL_MS;
}

function pruneAuth(stored: StoredRoom): void {
  const playerIds = new Set(stored.room.players.map((player) => player.id));
  for (const playerId of Object.keys(stored.auth)) {
    if (!playerIds.has(playerId)) {
      delete stored.auth[playerId];
    }
  }
}

function findPlayer(stored: StoredRoom, playerId: string): boolean {
  return stored.room.players.some((player) => player.id === playerId);
}

async function viewForPlayer(
  store: RoomStore,
  stored: StoredRoom,
  playerId: string,
): Promise<RoomView> {
  const [presence, chat] = await Promise.all([
    store.getPresence(stored.room.code),
    store.getChat(stored.room.code),
  ]);
  return buildRoomView(stored.room, playerId, presence, chat, Date.now());
}

async function saveRoom(store: RoomStore, stored: StoredRoom): Promise<void> {
  await store.saveRoom(stored.room.code, stored, ROOM_TTL_SECONDS);
}

export async function createRoom(input: CreateRoomInput): Promise<JoinResult> {
  const store = getRoomStore();
  const now = Date.now();
  const playerId = createPlayerId();
  const roomId = createRoomId();
  const token = createToken();
  const auth = { [playerId]: hashToken(token) };

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = createRoomCode();
    const room = createRoomState({
      code,
      roomId,
      host: { id: playerId, name: input.name, avatar: input.avatar },
      now,
      settings: input.settings,
    });
    const stored: StoredRoom = { room, auth };
    if (await store.createRoom(code, stored, ROOM_TTL_SECONDS)) {
      await store.touchPresence(code, playerId, now);
      const view = await viewForPlayer(store, stored, playerId);
      return { code, playerId, token, view };
    }
  }

  throw new GameError(
    "SERVER_BUSY",
    "The table could not be set. Try again.",
    503,
  );
}

export async function joinRoom(
  code: string,
  input: JoinRoomInput,
): Promise<JoinResult> {
  const store = getRoomStore();
  const playerId = createPlayerId();
  const token = createToken();
  const now = Date.now();

  const stored = await store.withLock(code, async () => {
    const current = await store.getRoom(code);
    if (!current) {
      throw new GameError("NOT_FOUND", "That wake has passed.", 404);
    }
    if (current.room.phase !== "lobby") {
      throw new GameError(
        "ROOM_STARTED",
        "This wake is already in progress.",
        409,
      );
    }
    if (current.room.players.length >= MAX_PLAYERS) {
      throw new GameError("ROOM_FULL", "This wake is full.", 409);
    }
    if (
      current.room.players.some(
        (player) => player.name.toLowerCase() === input.name.toLowerCase(),
      )
    ) {
      throw new GameError(
        "BAD_REQUEST",
        "Someone at this table already answers to that name.",
        409,
      );
    }

    current.room.players.push({
      id: playerId,
      name: input.name,
      avatar: input.avatar,
      joinedAt: now,
      score: 0,
    });
    current.auth[playerId] = hashToken(token);
    touchRoom(current.room, now);
    await saveRoom(store, current);
    return current;
  });

  await store.touchPresence(code, playerId, now);
  const view = await viewForPlayer(store, stored, playerId);
  return { code, playerId, token, view };
}

async function loadAuthenticated(
  store: RoomStore,
  code: string,
  token: string,
): Promise<{ stored: StoredRoom; playerId: string }> {
  const stored = await store.getRoom(code);
  if (!stored) {
    throw new GameError("NOT_FOUND", "That wake has passed.", 404);
  }
  const playerId = authenticateToken(stored, token);
  if (!playerId) {
    throw new GameError(
      "UNAUTHORIZED",
      "This wake does not remember you.",
      401,
    );
  }
  return { stored, playerId };
}

export async function authenticateRoom(
  code: string,
  token: string,
): Promise<{ playerId: string }> {
  const store = getRoomStore();
  const { playerId } = await loadAuthenticated(store, code, token);
  return { playerId };
}

export async function getRoomViewForToken(
  code: string,
  token: string,
): Promise<RoomView> {
  const store = getRoomStore();
  const { playerId } = await loadAuthenticated(store, code, token);
  const now = Date.now();
  await store.touchPresence(code, playerId, now);

  const current = await syncIfNeeded(store, code);
  if (!current) {
    throw new GameError("NOT_FOUND", "That wake has passed.", 404);
  }
  if (!findPlayer(current, playerId)) {
    throw new GameError("UNAUTHORIZED", "This wake does not remember you.", 401);
  }

  return viewForPlayer(store, current, playerId);
}

async function syncIfNeeded(
  store: RoomStore,
  code: string,
): Promise<StoredRoom | null> {
  const current = await store.getRoom(code);
  if (!current) {
    return null;
  }
  const now = Date.now();
  if (current.room.deadline === null || current.room.deadline > now) {
    return current;
  }

  return store.withLock(code, async () => {
    const stored = await store.getRoom(code);
    if (!stored) {
      return null;
    }
    const lockedNow = Date.now();
    const advanced = advanceRoom(stored.room, lockedNow, Math.random);
    if (!advanced.changed) {
      return stored;
    }
    stored.room = advanced.room;
    touchRoom(stored.room, lockedNow);
    await saveRoom(store, stored);
    return stored;
  });
}

export async function performAction(
  code: string,
  token: string,
  action: GameAction,
): Promise<ActionOutcome> {
  const store = getRoomStore();
  const { stored: initial, playerId } = await loadAuthenticated(store, code, token);
  const now = Date.now();
  await store.touchPresence(code, playerId, now);
  const presence = await store.getPresence(code);
  const hostOnline =
    initial.room.hostId.length > 0 &&
    now - (presence[initial.room.hostId] ?? 0) <= PRESENCE_MS;

  const stored = await store.withLock(code, async () => {
    const current = await store.getRoom(code);
    if (!current) {
      throw new GameError("NOT_FOUND", "That wake has passed.", 404);
    }
    if (!findPlayer(current, playerId)) {
      throw new GameError(
        "UNAUTHORIZED",
        "This wake does not remember you.",
        401,
      );
    }

    const lockedNow = Date.now();
    const advanced = advanceRoom(current.room, lockedNow, Math.random);
    if (advanced.changed) {
      current.room = advanced.room;
      touchRoom(current.room, lockedNow);
      await saveRoom(store, current);
    }

    const nextRoom = applyGameAction(current.room, playerId, action, {
      now: lockedNow,
      rng: Math.random,
      hostOnline,
    });
    current.room = nextRoom;
    touchRoom(current.room, lockedNow);
    pruneAuth(current);

    if (current.room.players.length === 0) {
      await store.deleteRoom(code);
      return null;
    }

    await saveRoom(store, current);
    return current;
  });

  if (!stored || !findPlayer(stored, playerId)) {
    return { view: null, playerId };
  }
  return { view: await viewForPlayer(store, stored, playerId), playerId };
}

export async function sendChat(
  code: string,
  token: string,
  body: string,
): Promise<RoomView> {
  const store = getRoomStore();
  const { playerId } = await loadAuthenticated(store, code, token);
  const now = Date.now();

  const count = await store.hitRateLimit(`chat:${code}:${playerId}`, 10);
  if (count > 8) {
    throw new GameError(
      "RATE_LIMITED",
      "Let the others speak for a moment.",
      429,
    );
  }

  await store.touchPresence(code, playerId, now);
  const stored = await store.withLock(code, async () => {
    const current = await store.getRoom(code);
    if (!current) {
      throw new GameError("NOT_FOUND", "That wake has passed.", 404);
    }
    const player = current.room.players.find((entry) => entry.id === playerId);
    if (!player) {
      throw new GameError(
        "UNAUTHORIZED",
        "This wake does not remember you.",
        401,
      );
    }

    const message: ChatMessage = {
      id: createMessageId(),
      playerId,
      name: player.name,
      body,
      createdAt: now,
    };
    await store.appendChat(code, message);
    touchRoom(current.room, now);
    await saveRoom(store, current);
    return current;
  });

  return viewForPlayer(store, stored, playerId);
}

export async function enforceRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<void> {
  const store = getRoomStore();
  const count = await store.hitRateLimit(key, windowSeconds);
  if (count > limit) {
    throw new GameError(
      "RATE_LIMITED",
      "Too many knocks at the door. Wait a moment.",
      429,
    );
  }
}
