import type { QueryClient } from "@tanstack/react-query";
import type { RoomView } from "@/lib/game/types";

export function roomQueryKey(code: string) {
  return ["room", code.toUpperCase()] as const;
}

/**
 * WebSocket pushes, HTTP replies, and manual polls can arrive close together.
 * Never let an older snapshot overwrite a newer one.
 */
export function applyRoomView(
  queryClient: QueryClient,
  code: string,
  view: RoomView,
): void {
  queryClient.setQueryData<RoomView>(roomQueryKey(code), (current) =>
    !current || view.version >= current.version ? view : current,
  );
}
