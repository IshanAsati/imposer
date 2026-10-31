import type { NextRequest } from "next/server";
import {
  getClientIp,
  jsonResponse,
  parseAvatar,
  parseName,
  parseRoomCode,
  readJson,
  routeErrorResponse,
} from "@/lib/server/http";
import { enforceRateLimit, joinRoom } from "@/lib/server/room-service";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ code: string }> },
) {
  try {
    const params = await context.params;
    const code = parseRoomCode(params.code);
    await enforceRateLimit(`join:${getClientIp(request)}`, 40, 5 * 60);
    const body = await readJson(request);
    const input =
      body && typeof body === "object" && !Array.isArray(body)
        ? (body as Record<string, unknown>)
        : {};
    const name = parseName(input.name);
    const avatar = parseAvatar(input.avatar);
    const result = await joinRoom(code, { name, avatar });
    return jsonResponse(result);
  } catch (error) {
    return routeErrorResponse(error);
  }
}
