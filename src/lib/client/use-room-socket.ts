import { useEffect, useRef, useState } from "react";
import type { ConnectionState, RoomView } from "@/lib/game/types";

interface UseRoomSocketOptions {
  code: string;
  token: string;
  onView: (view: RoomView) => void;
  onSessionLost?: () => void;
  enabled?: boolean;
}

export function useRoomSocket({
  code,
  token,
  onView,
  onSessionLost,
  enabled = true,
}: UseRoomSocketOptions): ConnectionState {
  const [status, setStatus] = useState<ConnectionState>("connecting");
  const onViewRef = useRef(onView);
  const onSessionLostRef = useRef(onSessionLost);

  useEffect(() => {
    onViewRef.current = onView;
    onSessionLostRef.current = onSessionLost;
  }, [onView, onSessionLost]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }
    if (typeof WebSocket === "undefined") {
      return;
    }

    let socket: WebSocket | null = null;
    let stopped = false;
    let attempts = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let heartbeat: ReturnType<typeof setInterval> | null = null;

    const clearTimers = () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      if (heartbeat) {
        clearInterval(heartbeat);
        heartbeat = null;
      }
    };

    const connect = () => {
      if (stopped) {
        return;
      }
      if (!navigator.onLine) {
        setStatus("offline");
        return;
      }

      setStatus(attempts === 0 ? "connecting" : "reconnecting");
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const url = `${protocol}//${window.location.host}/api/ws?code=${encodeURIComponent(
        code,
      )}&token=${encodeURIComponent(token)}`;

      try {
        socket = new WebSocket(url);
      } catch {
        scheduleReconnect();
        return;
      }

      socket.onopen = () => {
        attempts = 0;
        setStatus("live");
        heartbeat = setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "ping" }));
          }
        }, 20_000);
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data as string) as {
            type?: string;
            view?: RoomView;
            code?: string;
          };
          if (message.type === "view" && message.view?.code === code) {
            onViewRef.current(message.view);
          }
          if (message.type === "error") {
            onSessionLostRef.current?.();
          }
        } catch {
          // Ignore malformed messages and keep the fallback polling alive.
        }
      };

      socket.onclose = () => {
        if (heartbeat) {
          clearInterval(heartbeat);
          heartbeat = null;
        }
        socket = null;
        if (stopped) {
          return;
        }
        setStatus(navigator.onLine ? "reconnecting" : "offline");
        scheduleReconnect();
      };

      socket.onerror = () => {
        socket?.close();
      };
    };

    const scheduleReconnect = () => {
      if (stopped) {
        return;
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      const delay = Math.min(20_000, 1_000 * 2 ** Math.min(attempts, 5));
      attempts += 1;
      reconnectTimer = setTimeout(connect, delay);
    };

    const handleOnline = () => {
      attempts = 0;
      if (!socket || socket.readyState === WebSocket.CLOSED) {
        connect();
      }
    };
    const handleOffline = () => setStatus("offline");
    const handleVisibility = () => {
      if (
        document.visibilityState === "visible" &&
        (!socket || socket.readyState === WebSocket.CLOSED)
      ) {
        attempts = 0;
        connect();
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisibility);
    connect();

    return () => {
      stopped = true;
      clearTimers();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (socket) {
        socket.onclose = null;
        socket.close(1000, "Leaving the room");
      }
    };
  }, [code, token, enabled]);

  return typeof WebSocket === "undefined" ? "offline" : status;
}
