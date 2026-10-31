import type { NextRequest } from "next/server";
import {
  jsonResponse,
  parseGameAction,
  parseRoomCode,
  readJson,
  requireToken,
  routeErrorResponse,
} from "@/lib/server/http";
import { performAction } from "@/lib/server/room-service";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ code: string }> },
) {
  try {
    const params = await context.params;
    const code = parseRoomCode(params.code);
    const token = requireToken(request);
    const body = await readJson(request);
    const input =
      body && typeof body === "object" && !Array.isArray(body)
        ? (body as Record<string, unknown>)
        : {};
    const action = parseGameAction(input.action);
    const result = await performAction(code, token, action);
    return jsonResponse({ view: result.view });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
