"use client";

import { Eye, Skull } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRoom } from "./room-context";

export function MemoryPin() {
  const { view } = useRoom();
  const round = view.round;

  if (
    !round ||
    view.phase === "lobby" ||
    view.phase === "final"
  ) {
    return null;
  }

  const revealed = view.phase === "round_result";
  const isImposter = view.you.role === "imposter";
  const word = view.you.word ?? (revealed ? round.word : null);
  const empty = !word;

  return (
    <section
      className={cn(
        "flex items-center gap-3 border px-4 py-3",
        empty
          ? "border-blood/30 bg-[linear-gradient(110deg,rgba(127,33,29,0.12),rgba(0,0,0,0.18))]"
          : "border-bone/12 bg-[linear-gradient(110deg,rgba(208,161,93,0.08),rgba(0,0,0,0.16))]",
      )}
      aria-label={empty ? "You have no memory" : `Your memory: ${word}`}
    >
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center border",
          empty
            ? "border-blood/35 text-[#c46a5f]"
            : "border-bone/15 text-ember",
        )}
        aria-hidden="true"
      >
        {empty ? <Skull className="size-4" /> : <Eye className="size-4" />}
      </span>

      <div className="min-w-0 flex-1">
        <p className="font-label text-[0.5rem] uppercase tracking-[0.18em] text-ash/55">
          {revealed
            ? "The memory was"
            : isImposter
              ? "Your memory"
              : "Your memory"}
        </p>
        <p
          className={cn(
            "truncate font-display text-xl leading-tight sm:text-2xl",
            empty ? "italic text-ash/65" : "text-bone",
          )}
        >
          {empty ? "You remember nothing" : word}
        </p>
      </div>

      <div className="shrink-0 border-l border-bone/10 pl-3 text-right">
        <p className="font-label text-[0.46rem] uppercase tracking-[0.16em] text-ash/40">
          Category
        </p>
        <p className="font-display text-base leading-tight text-bone/85">
          {round.category}
        </p>
      </div>
    </section>
  );
}
