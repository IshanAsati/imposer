const STORAGE_KEY = "imposter.session.v1";

export interface RoomSession {
  code: string;
  playerId: string;
  token: string;
  name: string;
  avatar: string;
  savedAt: number;
}

function isSession(value: unknown): value is RoomSession {
  if (!value || typeof value !== "object") {
    return false;
  }
  const session = value as Record<string, unknown>;
  return (
    typeof session.code === "string" &&
    typeof session.playerId === "string" &&
    typeof session.token === "string" &&
    typeof session.name === "string" &&
    typeof session.avatar === "string"
  );
}

let cachedRaw: string | null = null;
let cachedSession: RoomSession | null = null;

/**
 * `useSyncExternalStore` requires getSnapshot to return a stable value until
 * storage actually changes, so parse each raw payload only once.
 */
export function readSession(code?: string): RoomSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }

  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSession = null;
    if (raw) {
      try {
        const parsed: unknown = JSON.parse(raw);
        if (isSession(parsed)) {
          cachedSession = parsed;
        }
      } catch {
        // A corrupt session is the same as no session.
      }
    }
  }

  if (code && cachedSession?.code.toUpperCase() !== code.toUpperCase()) {
    return null;
  }
  return cachedSession;
}

export function subscribeSession(onChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === STORAGE_KEY) {
      onChange();
    }
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener("imposter:session", onChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("imposter:session", onChange);
  };
}

export function saveSession(session: RoomSession): void {
  if (typeof window === "undefined") {
    return;
  }
  const raw = JSON.stringify(session);
  window.localStorage.setItem(STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedSession = session;
}

export function clearSession(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEY);
  cachedRaw = null;
  cachedSession = null;
}

export function notifySessionChanged(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event("imposter:session"));
}
