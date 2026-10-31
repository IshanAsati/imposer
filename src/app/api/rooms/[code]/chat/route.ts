import type { NextRequest } from "next/server";
import {
  jsonResponse,
  parseChatBody,
  parseRoomCode,
  readJson,
  requireToken,
  routeErrorResponse,
} from "@/lib/server/http";
import { sendChat } from "@/lib/server/room-service";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ code: string }> },
) {
  try {
    const params = await context.params;
    const code = parseRoomCode(params.code);
    const token = requireToken(request);
    const body = parseChatBody(await readJson(request));
    const view = await sendChat(code, token, body);
    return jsonResponse({ view });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
