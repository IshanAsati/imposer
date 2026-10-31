"use client";

import { useState } from "react";
import { Copy, Crown, DoorOpen, Flame, RotateCcw, Skull } from "lucide-react";
import { copyToClipboard, toRoman } from "@/lib/utils";
import { Avatar } from "@/components/game/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { PhaseHeading } from "../phase-heading";
import { useRoom } from "../room-context";
import { cn } from "@/lib/utils";

const REASON_LABEL: Record<string, string> = {
  survived: "The table accused its own",
  caught: "Caught without the word",
  guessed: "Caught, but remembered",
  stalemate: "No one was accused",
};

export function FinalView() {
  const { view, act, isPending, leaveRoom } = useRoom();
  const { toast } = useToast();
  const [leaving, setLeaving] = useState(false);

  const winner =
    view.finalOutcome ??
    (view.roundWins.crew > view.roundWins.imposters ? "crew" : "imposters");
  const crewWon = winner === "crew";
  const sorted = [...view.players].sort((left, right) => right.score - left.score);
  const mostPersuasive = sorted[0];

  const shareSummary = async () => {
    const lines = [
      `IMPOSER — Wake ${view.code}`,
      crewWon ? "The crew kept the memory." : "The uninvited left with the memory.",
      `Crew ${view.roundWins.crew} — ${view.roundWins.imposters} Imposters`,
      "",
      ...sorted.map(
        (player, index) => `${index + 1}. ${player.name} — ${player.score} pts`,
      ),
    ];
    const copied = await copyToClipboard(lines.join("\n"));
    toast(
      copied ? "The account was copied." : "The house could not reach the clipboard.",
      copied ? "success" : "error",
    );
  };

  const leave = async () => {
    setLeaving(true);
    await leaveRoom();
    setLeaving(false);
  };

  return (
    <div className="space-y-5">
      <PhaseHeading
        eyebrow="The wake is over"
        title={crewWon ? "The house remembers." : "The house forgets."}
        description={
          crewWon
            ? "The crew kept the memory. The empty chair was found before it could leave with the word."
            : "The uninvited left with the memory. What the table remembers is only what they chose to believe."
        }
        aside={
          <span className="inline-flex items-center gap-2 border border-bone/15 bg-black/25 px-3 py-2 font-label text-[0.55rem] uppercase tracking-[0.16em] text-ash/70">
            <Crown className="size-3.5 text-ember" />
            Wake {view.code}
          </span>
        }
      />

      <section
        className={cn(
          "relative overflow-hidden border px-5 py-8 text-center sm:px-8 sm:py-10",
          crewWon
            ? "border-moss/40 bg-[radial-gradient(ellipse_at_50%_0%,rgba(108,116,89,0.18),transparent_65%)]"
            : "border-blood/40 bg-[radial-gradient(ellipse_at_50%_0%,rgba(127,33,29,0.22),transparent_65%)]",
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-halftone opacity-15"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-2xl">
          <span
            className={cn(
              "mx-auto grid size-14 place-items-center rounded-full border",
              crewWon
                ? "border-moss/45 text-[#b9c39c]"
                : "border-blood/45 text-[#cf8577]",
            )}
          >
            {crewWon ? (
              <Crown className="size-6" />
            ) : (
              <Skull className="size-6" />
            )}
          </span>
          <p className="mt-5 font-label text-[0.56rem] uppercase tracking-[0.22em] text-ash/55">
            {crewWon ? "The crew takes the wake" : "The imposters take the wake"}
          </p>
          <h2 className="mt-2 font-display text-[clamp(2.9rem,8vw,5rem)] leading-[0.88] text-bone">
            {crewWon ? "Every memory accounted for." : "One memory unaccounted for."}
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[1.05rem] leading-snug text-ash/70">
            {crewWon
              ? "The candles burned down to the quick, and the table was still whole."
              : "The candles burned down to the quick, and one chair was emptier than the rest."}
          </p>

          <div className="mt-7 flex items-center justify-center gap-8">
            <span>
              <span className="block font-label text-[0.48rem] uppercase tracking-[0.16em] text-ash/40">
                Crew
              </span>
              <span className="mt-1 block font-display text-4xl leading-none text-bone">
                {view.roundWins.crew}
              </span>
            </span>
            <span className="h-10 w-px bg-bone/15" />
            <span>
              <span className="block font-label text-[0.48rem] uppercase tracking-[0.16em] text-ash/40">
                Imposters
              </span>
              <span className="mt-1 block font-display text-4xl leading-none text-bone">
                {view.roundWins.imposters}
              </span>
            </span>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="border border-bone/10 bg-black/15">
          <header className="flex items-center justify-between gap-3 border-b border-bone/10 px-4 py-3">
            <p className="font-label text-[0.54rem] uppercase tracking-[0.18em] text-ash/60">
              The guests, remembered
            </p>
            <button
              type="button"
              onClick={() => void shareSummary()}
              className="inline-flex items-center gap-1.5 font-label text-[0.48rem] uppercase tracking-[0.12em] text-ash/45 transition hover:text-bone"
            >
              <Copy className="size-3" />
              Copy account
            </button>
          </header>
          <ol className="divide-y divide-bone/[0.07]">
            {sorted.map((player, index) => (
              <li
                key={player.id}
                className="flex items-center gap-3 px-4 py-2.5"
              >
                <span className="w-6 shrink-0 text-center font-label text-[0.5rem] tabular-nums tracking-[0.1em] text-ash/30">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <Avatar id={player.avatar} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p
                      className={cn(
                        "truncate font-display text-lg leading-tight",
                        player.id === view.you.playerId
                          ? "text-ember"
                          : "text-bone",
                      )}
                    >
                      {player.name}
                      {player.id === view.you.playerId ? " · you" : ""}
                    </p>
                    {index === 0 && mostPersuasive && mostPersuasive.score > 0 ? (
                      <span className="border border-ember/35 px-1.5 py-0.5 font-label text-[0.44rem] uppercase tracking-[0.1em] text-ember/80">
                        Most persuasive
                      </span>
                    ) : null}
                  </div>
                </div>
                <span className="font-display text-xl tabular-nums leading-none text-bone/85">
                  {player.score}
                  <span className="ml-1 font-label text-[0.46rem] uppercase tracking-[0.08em] text-ash/35">
                    pts
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="border border-bone/10 bg-black/15">
          <header className="flex items-center justify-between gap-3 border-b border-bone/10 px-4 py-3">
            <p className="font-label text-[0.54rem] uppercase tracking-[0.18em] text-ash/60">
              The account of the wake
            </p>
            <span className="font-label text-[0.48rem] uppercase tracking-[0.12em] text-ash/30">
              {view.history.length} rounds
            </span>
          </header>
          <ol className="scroll-thin max-h-80 divide-y divide-bone/[0.07] overflow-y-auto">
            {view.history.map((entry) => {
              const imposterNames = entry.imposterIds
                .map(
                  (id) =>
                    view.players.find((player) => player.id === id)?.name ??
                    "A departed guest",
                )
                .join(", ");
              return (
                <li key={entry.number} className="flex items-start gap-3 px-4 py-3">
                  <span className="w-6 shrink-0 pt-0.5 font-label text-[0.5rem] uppercase tracking-[0.1em] text-ash/30">
                    {toRoman(entry.number)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-lg leading-tight text-bone">
                      {entry.word}
                    </p>
                    <p className="mt-0.5 text-xs leading-snug text-ash/45">
                      {entry.category} · {imposterNames} ·{" "}
                      {REASON_LABEL[entry.outcomeReason] ?? entry.outcomeReason}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 border px-1.5 py-0.5 font-label text-[0.44rem] uppercase tracking-[0.1em]",
                      entry.outcome === "crew"
                        ? "border-moss/40 text-[#a7b28c]"
                        : "border-blood/40 text-[#cf8577]",
                    )}
                  >
                    {entry.outcome === "crew" ? "Crew" : "Liars"}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      <div className="flex flex-col gap-3 border-t border-bone/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-2xl leading-tight text-bone">
            {view.you.isHost
              ? "Light the candles again?"
              : "The host may call for another wake."}
          </p>
          <p className="mt-1 max-w-md text-sm leading-snug text-ash/55">
            A rematch keeps the same table and rules, resets every score, and
            draws a fresh memory.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {view.you.isHost ? (
            <Button
              className="w-full sm:w-auto"
              disabled={isPending}
              onClick={() => void act({ type: "rematch" })}
            >
              <RotateCcw className="size-3.5" />
              Rematch
            </Button>
          ) : null}
          <Button
            variant="ghost"
            className="w-full sm:w-auto"
            disabled={leaving}
            onClick={() => void leave()}
          >
            <DoorOpen className="size-3.5" />
            {leaving ? "Closing the door…" : "Leave the wake"}
          </Button>
        </div>
      </div>

      <p className="flex items-center justify-center gap-2 text-center font-label text-[0.5rem] uppercase tracking-[0.16em] text-ash/30">
        <Flame className="size-3" />
        What the house remembers is not always what happened
      </p>
    </div>
  );
}
