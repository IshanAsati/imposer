"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * One shared 500ms clock for every countdown on the page. Each badge syncs the
 * server/client offset from the latest room snapshot, so a phone with a badly
 * set clock still sees the same deadline as everyone else.
 */
let serverOffset = 0;
let currentNow = 0;
let ticker: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1) {
    currentNow = Date.now();
    ticker = setInterval(() => {
      currentNow = Date.now();
      emit();
    }, 500);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && ticker !== null) {
      clearInterval(ticker);
      ticker = null;
    }
  };
}

function getSnapshot(): number {
  return currentNow;
}

function getServerSnapshot(): number {
  return 0;
}

export function useCountdown(
  deadline: number | null,
  serverNow: number,
): number | null {
  useEffect(() => {
    serverOffset = serverNow - Date.now();
  }, [serverNow]);

  const now = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (deadline === null) {
    return null;
  }

  const effectiveNow = now === 0 ? serverNow : now + serverOffset;
  return Math.max(0, deadline - effectiveNow);
}
