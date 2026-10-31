import {
  BlobPreconditionFailedError,
  del,
  get,
  head,
  list,
  put,
} from "@vercel/blob";
import type { ChatMessage, StoredRoom } from "@/lib/game/types";
import { GameError } from "@/lib/game/engine";
import type { RoomStore } from "@/lib/server/store";

const PREFIX = "imposter";
const LOCK_TTL_MS = 15_000;
const LOCK_WAIT_MS = 8_000;
const CACHE_SECONDS = 60;

const JSON_OPTIONS = {
  access: "private" as const,
  contentType: "application/json",
  addRandomSuffix: false,
  cacheControlMaxAge: CACHE_SECONDS,
};

interface BlobValue<T> {
  value: T;
  etag: string;
}

interface LockValue {
  token: string;
  expiresAt: number;
}

interface RateValue {
  count: number;
  expiresAt: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function roomPath(code: string): string {
  return `${PREFIX}/rooms/${code}.json`;
}

function presencePath(code: string): string {
  return `${PREFIX}/presence/${code}.json`;
}

function chatPath(code: string): string {
  return `${PREFIX}/chat/${code}.json`;
}

function lockPath(code: string): string {
  return `${PREFIX}/locks/${code}.json`;
}

function ratePath(key: string): string {
  return `${PREFIX}/rates/${encodeURIComponent(key)}.json`;
}

/**
 * Vercel Blob-backed room storage.
 *
 * Blob has no native multi-key transactions, so room mutations are serialized
 * with a short-lived, create-only lock blob. The lock is conditional so a
 * crashed request cannot hold a table forever: an expired lock can be broken
 * by the next writer.
 */
export class BlobRoomStore implements RoomStore {
  readonly kind = "blob" as const;

  private async readJson<T>(pathname: string): Promise<BlobValue<T> | null> {
    const result = await get(pathname, {
      access: "private",
      useCache: false,
    });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return null;
    }
    const text = await new Response(result.stream).text();
    if (!text) {
      return null;
    }
    try {
      return { value: JSON.parse(text) as T, etag: result.blob.etag };
    } catch {
      return null;
    }
  }

  private async blobExists(pathname: string): Promise<boolean> {
    try {
      return Boolean(await head(pathname));
    } catch {
      return false;
    }
  }

  private async createOnly(pathname: string, value: unknown): Promise<boolean> {
    try {
      await put(pathname, JSON.stringify(value), {
        ...JSON_OPTIONS,
        allowOverwrite: false,
      });
      return true;
    } catch (error) {
      if (await this.blobExists(pathname)) {
        return false;
      }
      throw error;
    }
  }

  async createRoom(code: string, data: StoredRoom): Promise<boolean> {
    const pathname = roomPath(code);
    const existing = await this.readJson<StoredRoom>(pathname).catch(() => null);

    if (existing) {
      if (existing.value.room?.expiresAt > Date.now()) {
        return false;
      }
      await del(pathname, { ifMatch: existing.etag }).catch(() => undefined);
    }

    return this.createOnly(pathname, data);
  }

  async getRoom(code: string): Promise<StoredRoom | null> {
    const pathname = roomPath(code);
    const result = await this.readJson<StoredRoom>(pathname);
    if (!result) {
      return null;
    }
    if (result.value.room?.expiresAt <= Date.now()) {
      await del(pathname, { ifMatch: result.etag }).catch(() => undefined);
      return null;
    }
    return result.value;
  }

  async saveRoom(code: string, data: StoredRoom): Promise<void> {
    await put(roomPath(code), JSON.stringify(data), {
      ...JSON_OPTIONS,
      allowOverwrite: true,
    });
  }

  async deleteRoom(code: string): Promise<void> {
    const paths = [roomPath(code), presencePath(code), chatPath(code)];
    for (const prefix of [
      `${PREFIX}/presence/${code}/`,
      `${PREFIX}/chat/${code}/`,
    ]) {
      try {
        const result = await list({ prefix, limit: 1_000 });
        paths.push(...result.blobs.map((blob) => blob.pathname));
      } catch {
        // Best-effort cleanup; a stale helper blob is harmless.
      }
    }
    try {
      await del(paths);
    } catch {
      // Best-effort cleanup.
    }
    await del(lockPath(code)).catch(() => undefined);
  }

  async withLock<T>(code: string, task: () => Promise<T>): Promise<T> {
    const pathname = lockPath(code);
    const token = `${Date.now()}:${Math.random().toString(36).slice(2)}`;
    const startedAt = Date.now();
    let lockEtag = "";

    while (Date.now() - startedAt < LOCK_WAIT_MS) {
      try {
        const blob = await put(
          pathname,
          JSON.stringify({
            token,
            expiresAt: Date.now() + LOCK_TTL_MS,
          } satisfies LockValue),
          {
            ...JSON_OPTIONS,
            allowOverwrite: false,
          },
        );
        lockEtag = blob.etag;
        break;
      } catch (error) {
        const existing = await this.readJson<LockValue>(pathname).catch(
          () => null,
        );
        if (existing && existing.value.expiresAt <= Date.now()) {
          await del(pathname, { ifMatch: existing.etag }).catch(() => undefined);
          continue;
        }
        if (!existing && !(await this.blobExists(pathname))) {
          throw error;
        }
        await sleep(50 + Math.random() * 100);
      }
    }

    if (!lockEtag) {
      throw new GameError(
        "SERVER_BUSY",
        "The table is occupied. Try again in a moment.",
        503,
      );
    }

    try {
      return await task();
    } finally {
      await del(pathname, { ifMatch: lockEtag }).catch(() => undefined);
    }
  }

  async getPresence(code: string): Promise<Record<string, number>> {
    const result = await this.readJson<Record<string, number>>(
      presencePath(code),
    ).catch(() => null);
    return result?.value ?? {};
  }

  async touchPresence(
    code: string,
    playerId: string,
    now: number,
  ): Promise<void> {
    const pathname = presencePath(code);

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const current = await this.readJson<Record<string, number>>(pathname).catch(
        () => null,
      );
      const presence = { ...(current?.value ?? {}), [playerId]: now };
      for (const [id, seenAt] of Object.entries(presence)) {
        if (now - seenAt > 10 * 60 * 1000) {
          delete presence[id];
        }
      }

      try {
        await put(pathname, JSON.stringify(presence), {
          ...JSON_OPTIONS,
          allowOverwrite: Boolean(current),
          ...(current ? { ifMatch: current.etag } : {}),
        });
        return;
      } catch (error) {
        if (
          error instanceof BlobPreconditionFailedError ||
          (await this.blobExists(pathname))
        ) {
          continue;
        }
        console.warn("[imposter] presence update skipped", error);
        return;
      }
    }

    console.warn("[imposter] presence update gave up after contention");
  }

  async getChat(code: string): Promise<ChatMessage[]> {
    const result = await this.readJson<ChatMessage[]>(chatPath(code)).catch(
      () => null,
    );
    if (!Array.isArray(result?.value)) {
      return [];
    }
    return result.value.slice(-80);
  }

  async appendChat(code: string, message: ChatMessage): Promise<void> {
    const pathname = chatPath(code);

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const current = await this.readJson<ChatMessage[]>(pathname).catch(
        () => null,
      );
      const messages = [...(Array.isArray(current?.value) ? current.value : []), message]
        .filter((entry) => entry.createdAt > Date.now() - 6 * 60 * 60 * 1000)
        .slice(-100);

      try {
        await put(pathname, JSON.stringify(messages), {
          ...JSON_OPTIONS,
          allowOverwrite: Boolean(current),
          ...(current ? { ifMatch: current.etag } : {}),
        });
        return;
      } catch (error) {
        if (
          error instanceof BlobPreconditionFailedError ||
          (await this.blobExists(pathname))
        ) {
          continue;
        }
        throw error;
      }
    }

    throw new Error("Could not save the chat message.");
  }

  async hitRateLimit(key: string, windowSeconds: number): Promise<number> {
    const pathname = ratePath(key);
    const now = Date.now();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const current = await this.readJson<RateValue>(pathname).catch(() => null);
      const count =
        current && current.value.expiresAt > now ? current.value.count + 1 : 1;
      const value: RateValue = {
        count,
        expiresAt:
          current && current.value.expiresAt > now
            ? current.value.expiresAt
            : now + windowSeconds * 1000,
      };

      try {
        await put(pathname, JSON.stringify(value), {
          ...JSON_OPTIONS,
          allowOverwrite: Boolean(current),
          ...(current ? { ifMatch: current.etag } : {}),
        });
        return count;
      } catch (error) {
        if (
          error instanceof BlobPreconditionFailedError ||
          (await this.blobExists(pathname))
        ) {
          continue;
        }
        // Rate limiting must never take the game down.
        return count;
      }
    }

    return 1;
  }
}
