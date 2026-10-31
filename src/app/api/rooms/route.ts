import type { NextRequest } from "next/server";
import {
  getClientIp,
  jsonResponse,
  parseAvatar,
  parseName,
  readJson,
  routeErrorResponse,
} from "@/lib/server/http";
import {
  createRoom,
  enforceRateLimit,
} from "@/lib/server/room-service";

export async function POST(request: NextRequest) {
  try {
    await enforceRateLimit(`create:${getClientIp(request)}`, 20, 60 * 60);
    const body = await readJson(request);
    const input =
      body && typeof body === "object" && !Array.isArray(body)
        ? (body as Record<string, unknown>)
        : {};
    const name = parseName(input.name);
    const avatar = parseAvatar(input.avatar);
    const result = await createRoom({ name, avatar });
    return jsonResponse(result, 201);
  } catch (error) {
    return routeErrorResponse(error);
  }
}
