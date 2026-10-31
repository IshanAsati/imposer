import type { NextRequest } from "next/server";
import {
  jsonResponse,
  parseRoomCode,
  requireToken,
  routeErrorResponse,
} from "@/lib/server/http";
import { getRoomViewForToken } from "@/lib/server/room-service";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> },
) {
  try {
    const params = await context.params;
    const code = parseRoomCode(params.code);
    const token = requireToken(request);
    const view = await getRoomViewForToken(code, token);
    return jsonResponse({ view });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
