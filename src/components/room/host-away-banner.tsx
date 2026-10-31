"use client";

import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRoom } from "./room-context";

export function HostAwayBanner() {
  const { view, act, isPending } = useRoom();
  const host = view.players.find((player) => player.id === view.hostId);

  if (!host || host.id === view.you.playerId || host.online) {
    return null;
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 border border-ember/30 bg-ember/[0.07] px-4 py-3">
      <Crown className="size-4 shrink-0 text-ember" aria-hidden="true" />
      <p className="min-w-40 flex-1 text-sm leading-snug text-ash/85">
        <span className="font-display text-lg text-bone">{host.name}</span>{" "}
        has stepped away. If the candles are unattended, you can keep the wake.
      </p>
      <Button
        size="sm"
        variant="ghost"
        disabled={isPending}
        onClick={() => void act({ type: "claimHost" })}
      >
        Take the host&apos;s chair
      </Button>
    </div>
  );
}
