import { upgradeWebSocket } from "@vercel/functions";
import type { WebSocket } from "ws";
import { GameError } from "@/lib/game/engine";
import type { RoomView } from "@/lib/game/types";
import {
  parseRoomCode,
  socketErrorResponse,
} from "@/lib/server/http";
import {
  authenticateRoom,
  getRoomViewForToken,
} from "@/lib/server/room-service";

export const maxDuration = 300;

const POLL_MS = 3_000;
const IDLE_PUSH_MS = 15_000;

function send(ws: WebSocket, payload: unknown): void {
  if (ws.readyState === 1) {
    ws.send(JSON.stringify(payload));
  }
}

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const code = parseRoomCode(url.searchParams.get("code"));
    const token = url.searchParams.get("token");
    if (!token) {
      throw new GameError("UNAUTHORIZED", "You are not at this wake.", 401);
    }
    await authenticateRoom(code, token);

    return await upgradeWebSocket(async (ws) => {
      let closed = false;
      let busy = false;
      let lastVersion = -1;
      let lastChatId = "";
      let lastSentAt = 0;

      const pushView = async (force = false): Promise<void> => {
        if (closed || busy) {
          return;
        }
        busy = true;
        try {
          const view: RoomView = await getRoomViewForToken(code, token);
          const chatId = view.chat[view.chat.length - 1]?.id ?? "";
          const changed = view.version !== lastVersion || chatId !== lastChatId;
          if (force || changed || Date.now() - lastSentAt >= IDLE_PUSH_MS) {
            lastVersion = view.version;
            lastChatId = chatId;
            lastSentAt = Date.now();
            send(ws, { type: "view", view });
          }
        } catch (error) {
          if (error instanceof GameError && [401, 404].includes(error.status)) {
            send(ws, {
              type: "error",
              code: error.code,
              message: error.message,
            });
            if (ws.readyState === 1) {
              ws.close(4001, "Wake ended");
            }
          } else {
            console.error("[imposter] websocket refresh failed", error);
          }
        } finally {
          busy = false;
        }
      };

      await pushView(true);
      const interval = setInterval(() => {
        void pushView();
      }, POLL_MS);

      ws.on("message", (data) => {
        const text = data.toString();
        if (text === "ping") {
          send(ws, { type: "pong" });
          return;
        }
        try {
          const message = JSON.parse(text) as { type?: string };
          if (message.type === "ping") {
            send(ws, { type: "pong" });
          }
        } catch {
          // A stray message is not worth closing a wake over.
        }
      });

      ws.on("close", () => {
        closed = true;
        clearInterval(interval);
      });

      ws.on("error", () => {
        closed = true;
        clearInterval(interval);
      });
    });
  } catch (error) {
    return socketErrorResponse(error);
  }
}
