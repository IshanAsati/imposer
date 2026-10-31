"use client";

import { Clock } from "lucide-react";
import { useCountdown } from "@/lib/client/use-countdown";
import { cn, formatCountdown } from "@/lib/utils";

interface TimerBadgeProps {
  deadline: number | null;
  serverNow: number;
  label?: string;
  className?: string;
}

export function TimerBadge({
  deadline,
  serverNow,
  label = "Remaining",
  className,
}: TimerBadgeProps) {
  const remainingMs = useCountdown(deadline, serverNow);
  const urgent = remainingMs !== null && remainingMs <= 10_000;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 border px-3 py-1.5 font-label text-[0.62rem] uppercase tracking-[0.18em]",
        urgent
          ? "border-blood/70 bg-blood/10 text-[#e9b7aa]"
          : "border-bone/15 bg-black/20 text-ash",
        className,
      )}
    >
      <Clock className={cn("size-3.5", urgent && "animate-pulse")} />
      <span className="sr-only">{label}: </span>
      <span className="tabular-nums">{formatCountdown(remainingMs)}</span>
    </span>
  );
}
