"use client";

import { useSyncExternalStore } from "react";
import {
  readSession,
  subscribeSession,
  type RoomSession,
} from "./session";

export function useStoredSession(code?: string): RoomSession | null {
  return useSyncExternalStore(
    subscribeSession,
    () => readSession(code),
    () => null,
  );
}

const subscribeNothing = () => () => {};

export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
}
