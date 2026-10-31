"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { GameAction, RoomView } from "@/lib/game/types";

export interface RoomContextValue {
  view: RoomView;
  act: (action: GameAction) => Promise<boolean>;
  pendingType: GameAction["type"] | null;
  isPending: boolean;
  sendChat: (body: string) => Promise<boolean>;
  isChatPending: boolean;
  openInvite: () => void;
  openChat: () => void;
  leaveRoom: () => Promise<void>;
}

const RoomContext = createContext<RoomContextValue | null>(null);

export function RoomProvider({
  value,
  children,
}: {
  value: RoomContextValue;
  children: ReactNode;
}) {
  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

export function useRoom(): RoomContextValue {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error("useRoom must be used inside a RoomProvider");
  }
  return context;
}
