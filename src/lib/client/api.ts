import type {
  AvatarId,
  GameAction,
  JoinResult,
  RoomView,
} from "@/lib/game/types";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code = "UNKNOWN") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions {
  method?: "GET" | "POST";
  token?: string;
  body?: unknown;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  let response: Response;
  try {
    response = await fetch(path, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      "The house is unreachable. Check your connection.",
      0,
      "NETWORK",
    );
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // The response was empty or not JSON.
  }

  if (!response.ok) {
    const error = payload as
      | { error?: { code?: string; message?: string } }
      | null;
    throw new ApiError(
      error?.error?.message ?? "Something went wrong in the dark.",
      response.status,
      error?.error?.code ?? "UNKNOWN",
    );
  }

  return payload as T;
}

export async function createRoom(
  name: string,
  avatar: AvatarId,
): Promise<JoinResult> {
  return request<JoinResult>("/api/rooms", {
    method: "POST",
    body: { name, avatar },
  });
}

export async function joinRoom(
  code: string,
  name: string,
  avatar: AvatarId,
): Promise<JoinResult> {
  return request<JoinResult>(`/api/rooms/${encodeURIComponent(code)}/join`, {
    method: "POST",
    body: { name, avatar },
  });
}

export async function fetchRoomState(
  code: string,
  token: string,
): Promise<RoomView> {
  const result = await request<{ view: RoomView }>(
    `/api/rooms/${encodeURIComponent(code)}/state`,
    { token },
  );
  return result.view;
}

export async function sendRoomAction(
  code: string,
  token: string,
  action: GameAction,
): Promise<RoomView | null> {
  const result = await request<{ view: RoomView | null }>(
    `/api/rooms/${encodeURIComponent(code)}/actions`,
    { method: "POST", token, body: { action } },
  );
  return result.view;
}

export async function sendChatMessage(
  code: string,
  token: string,
  body: string,
): Promise<RoomView> {
  const result = await request<{ view: RoomView }>(
    `/api/rooms/${encodeURIComponent(code)}/chat`,
    { method: "POST", token, body: { body } },
  );
  return result.view;
}
