"use client";

import { Wifi, WifiOff } from "lucide-react";
import type { ConnectionState } from "@/lib/game/types";
import { cn } from "@/lib/utils";

const PRESENTATION: Record<
  ConnectionState,
  { label: string; className: string; live: boolean }
> = {
  live: {
    label: "Live",
    className: "border-[#5f6848]/45 bg-[#5f6848]/10 text-[#a7b28c]",
    live: true,
  },
  connecting: {
    label: "Connecting",
    className: "border-bone/15 bg-black/20 text-ash",
    live: false,
  },
  reconnecting: {
    label: "Reconnecting",
    className: "border-ember/35 bg-ember/[0.07] text-[#d9b87d]",
    live: false,
  },
  offline: {
    label: "Offline",
    className: "border-blood/45 bg-blood/10 text-[#d08a7e]",
    live: false,
  },
};

export function ConnectionBadge({ state }: { state: ConnectionState }) {
  const presentation = PRESENTATION[state];
  return (
    <span
      role="status"
      title={`Connection: ${presentation.label}`}
      className={cn(
        "inline-flex min-h-8 items-center gap-1.5 border px-2 py-1 font-label text-[0.5rem] uppercase tracking-[0.16em]",
        presentation.className,
      )}
    >
      {state === "offline" ? (
        <WifiOff className="size-3" aria-hidden="true" />
      ) : (
        <Wifi className="size-3" aria-hidden="true" />
      )}
      <span className="hidden sm:inline">{presentation.label}</span>
      <span
        className={cn(
          "size-1.5 rounded-full",
          presentation.live
            ? "bg-[#a7b28c]"
            : state === "offline"
              ? "bg-[#c46a5f]"
              : "animate-pulse bg-ember",
        )}
        aria-hidden="true"
      />
    </span>
  );
}
