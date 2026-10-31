import { Redis } from "@upstash/redis";
import type { ChatMessage, StoredRoom } from "@/lib/game/types";
import { GameError } from "@/lib/game/engine";
import { BlobRoomStore } from "@/lib/server/blob-store";

const PREFIX = "imposter";
const LOCK_TTL_MS = 5_000;
const LOCK_WAIT_MS = 3_500;

export interface RoomStore {
  readonly kind: "redis" | "blob" | "memory";
  createRoom(code: string, data: StoredRoom, ttlSeconds: number): Promise<boolean>;
  getRoom(code: string): Promise<StoredRoom | null>;
  saveRoom(code: string, data: StoredRoom, ttlSeconds: number): Promise<void>;
  deleteRoom(code: string): Promise<void>;
  withLock<T>(code: string, task: () => Promise<T>): Promise<T>;
  getPresence(code: string): Promise<Record<string, number>>;
  touchPresence(code: string, playerId: string, now: number): Promise<void>;
  getChat(code: string): Promise<ChatMessage[]>;
  appendChat(code: string, message: ChatMessage): Promise<void>;
  hitRateLimit(key: string, windowSeconds: number): Promise<number>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface MemoryRoomEntry {
  data: StoredRoom;
  expiresAt: number;
}

interface MemoryChatEntry {
  messages: ChatMessage[];
  expiresAt: number;
}

interface MemoryState {
  rooms: Map<string, MemoryRoomEntry>;
  chats: Map<string, MemoryChatEntry>;
  presence: Map<string, Map<string, number>>;
  rates: Map<string, { count: number; expiresAt: number }>;
  locks: Map<string, Promise<void>>;
}

const globalForStore = globalThis as typeof globalThis & {
  __imposterMemoryStore?: MemoryState;
  __imposterRoomStore?: RoomStore;
};

function memoryState(): MemoryState {
  if (!globalForStore.__imposterMemoryStore) {
    globalForStore.__imposterMemoryStore = {
      rooms: new Map(),
      chats: new Map(),
      presence: new Map(),
      rates: new Map(),
      locks: new Map(),
    };
  }
  return globalForStore.__imposterMemoryStore;
}

class MemoryRoomStore implements RoomStore {
  readonly kind = "memory" as const;

  async createRoom(
    code: string,
    data: StoredRoom,
    ttlSeconds: number,
  ): Promise<boolean> {
    const state = memoryState();
    const existing = state.rooms.get(code);
    if (existing && existing.expiresAt > Date.now()) {
      return false;
    }
    state.rooms.set(code, {
      data: structuredClone(data),
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    return true;
  }

  async getRoom(code: string): Promise<StoredRoom | null> {
    const state = memoryState();
    const entry = state.rooms.get(code);
    if (!entry) {
      return null;
    }
    if (entry.expiresAt <= Date.now()) {
      state.rooms.delete(code);
      return null;
    }
    return structuredClone(entry.data);
  }

  async saveRoom(
    code: string,
    data: StoredRoom,
    ttlSeconds: number,
  ): Promise<void> {
    memoryState().rooms.set(code, {
      data: structuredClone(data),
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async deleteRoom(code: string): Promise<void> {
    const state = memoryState();
    state.rooms.delete(code);
    state.chats.delete(code);
    state.presence.delete(code);
  }

  async withLock<T>(code: string, task: () => Promise<T>): Promise<T> {
    const state = memoryState();
    const previous = state.locks.get(code) ?? Promise.resolve();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const chain = previous.then(() => gate);
    state.locks.set(code, chain);
    await previous;

    try {
      return await task();
    } finally {
      release();
      if (state.locks.get(code) === chain) {
        state.locks.delete(code);
      }
    }
  }

  async getPresence(code: string): Promise<Record<string, number>> {
    return Object.fromEntries(memoryState().presence.get(code) ?? []);
  }

  async touchPresence(code: string, playerId: string, now: number): Promise<void> {
    const state = memoryState();
    let presence = state.presence.get(code);
    if (!presence) {
      presence = new Map();
      state.presence.set(code, presence);
    }
    presence.set(playerId, now);
  }

  async getChat(code: string): Promise<ChatMessage[]> {
    const entry = memoryState().chats.get(code);
    if (!entry || entry.expiresAt <= Date.now()) {
      return [];
    }
    return structuredClone(entry.messages.slice(-80));
  }

  async appendChat(code: string, message: ChatMessage): Promise<void> {
    const state = memoryState();
    const existing = state.chats.get(code);
    const messages = existing ? existing.messages : [];
    messages.push(structuredClone(message));
    state.chats.set(code, {
      messages: messages.slice(-100),
      expiresAt: Date.now() + 6 * 60 * 60 * 1000,
    });
  }

  async hitRateLimit(key: string, windowSeconds: number): Promise<number> {
    const state = memoryState();
    const now = Date.now();
    const entry = state.rates.get(key);
    if (!entry || entry.expiresAt <= now) {
      state.rates.set(key, {
        count: 1,
        expiresAt: now + windowSeconds * 1000,
      });
      return 1;
    }
    entry.count += 1;
    return entry.count;
  }
}

function parseStoredRoom(value: unknown): StoredRoom | null {
  if (!value) {
    return null;
  }
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as StoredRoom;
    } catch {
      return null;
    }
  }
  return value as StoredRoom;
}

function parseChatMessages(values: unknown[]): ChatMessage[] {
  const messages = values
    .map((value) => {
      if (typeof value === "string") {
        try {
          return JSON.parse(value) as ChatMessage;
        } catch {
          return null;
        }
      }
      return value as ChatMessage;
    })
    .filter((value): value is ChatMessage => Boolean(value?.id));
  return messages.reverse();
}

class RedisRoomStore implements RoomStore {
  readonly kind = "redis" as const;
  private readonly redis: Redis;

  constructor(url: string, token: string) {
    this.redis = new Redis({ url, token });
  }

  private roomKey(code: string): string {
    return `${PREFIX}:room:${code}`;
  }

  private presenceKey(code: string): string {
    return `${PREFIX}:presence:${code}`;
  }

  private chatKey(code: string): string {
    return `${PREFIX}:chat:${code}`;
  }

  private lockKey(code: string): string {
    return `${PREFIX}:lock:${code}`;
  }

  async createRoom(
    code: string,
    data: StoredRoom,
    ttlSeconds: number,
  ): Promise<boolean> {
    const result = await this.redis.set(this.roomKey(code), data, {
      nx: true,
      ex: ttlSeconds,
    });
    return result === "OK";
  }

  async getRoom(code: string): Promise<StoredRoom | null> {
    const value = await this.redis.get<StoredRoom | string>(this.roomKey(code));
    return parseStoredRoom(value);
  }

  async saveRoom(
    code: string,
    data: StoredRoom,
    ttlSeconds: number,
  ): Promise<void> {
    await this.redis.set(this.roomKey(code), data, { ex: ttlSeconds });
  }

  async deleteRoom(code: string): Promise<void> {
    await this.redis.del(
      this.roomKey(code),
      this.chatKey(code),
      this.presenceKey(code),
    );
  }

  async withLock<T>(code: string, task: () => Promise<T>): Promise<T> {
    const lockKey = this.lockKey(code);
    const token = `${Date.now()}:${Math.random().toString(36).slice(2)}`;
    const startedAt = Date.now();
    let acquired = false;

    while (Date.now() - startedAt < LOCK_WAIT_MS) {
      const result = await this.redis.set(lockKey, token, {
        nx: true,
        px: LOCK_TTL_MS,
      });
      if (result === "OK") {
        acquired = true;
        break;
      }
      await sleep(40 + Math.random() * 90);
    }

    if (!acquired) {
      throw new GameError(
        "SERVER_BUSY",
        "The table is occupied. Try again in a moment.",
        503,
      );
    }

    try {
      return await task();
    } finally {
      await this.redis
        .eval(
          "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
          [lockKey],
          [token],
        )
        .catch(() => undefined);
    }
  }

  async getPresence(code: string): Promise<Record<string, number>> {
    const values = await this.redis.hgetall<Record<string, string | number>>(
      this.presenceKey(code),
    );
    if (!values) {
      return {};
    }
    return Object.fromEntries(
      Object.entries(values).map(([playerId, value]) => [
        playerId,
        typeof value === "number" ? value : Number(value) || 0,
      ]),
    );
  }

  async touchPresence(code: string, playerId: string, now: number): Promise<void> {
    const key = this.presenceKey(code);
    await this.redis.hset(key, { [playerId]: now });
    await this.redis.expire(key, 60 * 60);
  }

  async getChat(code: string): Promise<ChatMessage[]> {
    const values = await this.redis.lrange<unknown>(this.chatKey(code), 0, 99);
    return parseChatMessages(values).slice(-80);
  }

  async appendChat(code: string, message: ChatMessage): Promise<void> {
    const key = this.chatKey(code);
    await this.redis.lpush(key, message);
    await this.redis.ltrim(key, 0, 99);
    await this.redis.expire(key, 6 * 60 * 60);
  }

  async hitRateLimit(key: string, windowSeconds: number): Promise<number> {
    const redisKey = `${PREFIX}:rate:${key}`;
    const count = await this.redis.incr(redisKey);
    if (count === 1) {
      await this.redis.expire(redisKey, windowSeconds);
    }
    return count;
  }
}

function resolveRedisCredentials(): { url: string; token: string } | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL ?? "";
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN ?? "";

  if (url && token) {
    return { url, token };
  }
  return null;
}

export function getRoomStore(): RoomStore {
  if (globalForStore.__imposterRoomStore) {
    return globalForStore.__imposterRoomStore;
  }

  const credentials = resolveRedisCredentials();
  if (credentials) {
    globalForStore.__imposterRoomStore = new RedisRoomStore(
      credentials.url,
      credentials.token,
    );
    return globalForStore.__imposterRoomStore;
  }

  if (process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID) {
    globalForStore.__imposterRoomStore = new BlobRoomStore();
    return globalForStore.__imposterRoomStore;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Missing shared room storage. Connect a Vercel Blob store to this project (BLOB_READ_WRITE_TOKEN), or set Upstash Redis credentials.",
    );
  }

  console.warn(
    "[imposter] Using the in-memory room store. Connect a Vercel Blob store for shared, durable rooms.",
  );
  globalForStore.__imposterRoomStore = new MemoryRoomStore();
  return globalForStore.__imposterRoomStore;
}

export function resetRoomStoreForTests(): void {
  if (globalForStore.__imposterMemoryStore) {
    globalForStore.__imposterMemoryStore = undefined;
  }
  globalForStore.__imposterRoomStore = undefined;
}
