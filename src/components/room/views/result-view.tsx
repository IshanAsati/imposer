"use client";

import { Check, Flame, KeyRound, Skull } from "lucide-react";
import type { OutcomeReason } from "@/lib/game/types";
import { cn, toRoman } from "@/lib/utils";
import { Avatar } from "@/components/game/avatar";
import { TimerBadge } from "@/components/game/timer";
import { Button } from "@/components/ui/button";
import { PhaseHeading } from "../phase-heading";
import { useRoom } from "../room-context";

const RESULT_COPY: Record<
  OutcomeReason,
  { kicker: string; title: string; description: string; tone: "blood" | "moss" | "ember" }
> = {
  survived: {
    kicker: "The uninvited",
    title: "A stranger left with the memory.",
    description:
      "No imposter was caught. The table accused one of its own, and the empty chair walked away with everything.",
    tone: "blood",
  },
  caught: {
    kicker: "The crew",
    title: "The memory holds.",
    description:
      "An imposter was caught — and could not name the memory. The crew takes the round.",
    tone: "moss",
  },
  guessed: {
    kicker: "Caught, but…",
    title: "They named it anyway.",
    description:
      "The imposter was caught, but remembered the word. They still take the round, and the crew is left with nothing.",
    tone: "ember",
  },
  stalemate: {
    kicker: "No accusation",
    title: "The table turned on itself.",
    description:
      "The vote could not settle on one guest. No one was accused, and the imposters take the round.",
    tone: "blood",
  },
};

const TONE_STYLES = {
  blood:
    "border-blood/40 bg-[radial-gradient(ellipse_at_30%_0%,rgba(127,33,29,0.22),transparent_62%)]",
  moss:
    "border-moss/40 bg-[radial-gradient(ellipse_at_30%_0%,rgba(108,116,89,0.16),transparent_62%)]",
  ember:
    "border-ember/40 bg-[radial-gradient(ellipse_at_30%_0%,rgba(208,161,93,0.16),transparent_62%)]",
} as const;

export function ResultView() {
  const { view, act, isPending } = useRoom();
  const round = view.round;

  if (!round) {
    return null;
  }

  const reason = round.outcomeReason ?? "stalemate";
  const copy = RESULT_COPY[reason];
  const eliminated = view.players.find(
    (player) => player.id === round.eliminatedId,
  );
  const imposterIds = new Set(round.imposterIds ?? []);
  const points = round.pointsAwarded ?? {};
  const readySet = new Set(round.readyIds);
  const alreadyReady = readySet.has(view.you.playerId);
  const isFinalRound = round.number >= view.settings.rounds;

  const rows = [...view.players].sort((left, right) => {
    const earned = (points[right.id] ?? 0) - (points[left.id] ?? 0);
    return earned !== 0 ? earned : right.score - left.score;
  });

  return (
    <div className="space-y-5">
      <PhaseHeading
        eyebrow={`Round ${toRoman(round.number)} · The account`}
        title="The house remembers."
        description="The memory is revealed, the points are counted, and the next round waits at the edge of the candlelight."
        aside={
          <TimerBadge
            deadline={view.deadline}
            serverNow={view.serverNow}
            label="Next round timer"
          />
        }
      />

      <section
        className={cn(
          "relative overflow-hidden border px-5 py-6 sm:px-7 sm:py-8",
          TONE_STYLES[copy.tone],
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-halftone opacity-15"
          aria-hidden="true"
        />
        <div className="relative">
          <p
            className={cn(
              "font-label text-[0.56rem] uppercase tracking-[0.2em]",
              copy.tone === "blood"
                ? "text-[#d08a7e]"
                : copy.tone === "moss"
                  ? "text-[#a7b28c]"
                  : "text-ember",
            )}
          >
            {copy.kicker}
          </p>
          <h2 className="mt-2 max-w-xl font-display text-[clamp(2.35rem,6vw,3.8rem)] leading-[0.92] text-bone">
            {copy.title}
          </h2>
          <p className="mt-3 max-w-xl text-[1.02rem] leading-snug text-ash/75">
            {copy.description}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="inline-flex items-baseline gap-2">
              <span className="font-label text-[0.48rem] uppercase tracking-[0.16em] text-ash/40">
                Crew
              </span>
              <span className="font-display text-3xl leading-none text-bone">
                {view.roundWins.crew}
              </span>
            </span>
            <span className="inline-flex items-baseline gap-2">
              <span className="font-label text-[0.48rem] uppercase tracking-[0.16em] text-ash/40">
                Imposters
              </span>
              <span className="font-display text-3xl leading-none text-bone">
                {view.roundWins.imposters}
              </span>
            </span>
            {eliminated ? (
              <span className="inline-flex items-center gap-2">
                <Avatar id={eliminated.avatar} size="xs" />
                <span className="font-label text-[0.48rem] uppercase tracking-[0.14em] text-ash/50">
                  Accused · {eliminated.name}
                </span>
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-[1.05fr_0.95fr]">
        <div className="paper relative overflow-hidden p-5 sm:p-6">
          <p className="font-label text-[0.52rem] uppercase tracking-[0.18em] text-[#6d5b43]">
            The memory was
          </p>
          <p className="mt-2 break-words font-display text-[clamp(2rem,5vw,3rem)] leading-[0.95] text-[#19140e]">
            {round.word ?? "—"}
          </p>
          <div className="thread my-4 opacity-70" />
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-label text-[0.48rem] uppercase tracking-[0.16em] text-[#7a6750]">
                Category
              </p>
              <p className="mt-1 font-display text-xl text-[#33271b]">
                {round.category}
              </p>
            </div>
            <span className="stamp">Closed</span>
          </div>
        </div>

        <div className="border border-bone/10 bg-black/15 p-5">
          <p className="font-label text-[0.52rem] uppercase tracking-[0.18em] text-ash/55">
            Those without a memory
          </p>
          <ul className="mt-3 space-y-2">
            {(round.imposterIds ?? []).map((id) => {
              const player = view.players.find((entry) => entry.id === id);
              if (!player) {
                return null;
              }
              return (
                <li
                  key={id}
                  className="flex items-center gap-2.5 border border-blood/20 bg-black/20 px-2.5 py-2"
                >
                  <Avatar id={player.avatar} size="xs" />
                  <span className="font-display text-lg leading-none text-bone">
                    {player.name}
                  </span>
                  <span className="ml-auto font-label text-[0.44rem] uppercase tracking-[0.12em] text-[#cf8577]">
                    Liar
                  </span>
                </li>
              );
            })}
          </ul>
          {round.guess ? (
            <p className="mt-4 border-t border-bone/10 pt-3 text-sm leading-snug text-ash/60">
              They guessed{" "}
              <span className="font-display text-lg text-bone">
                {round.guess}
              </span>{" "}
              — {round.guessCorrect ? "and remembered." : "and missed."}
            </p>
          ) : null}
        </div>
      </div>

      <section className="border border-bone/10 bg-black/15">
        <header className="flex items-center justify-between gap-3 border-b border-bone/10 px-4 py-3">
          <p className="font-label text-[0.54rem] uppercase tracking-[0.18em] text-ash/60">
            The account
          </p>
          <span className="font-label text-[0.48rem] uppercase tracking-[0.12em] text-ash/30">
            Round points · total
          </span>
        </header>
        <ul className="divide-y divide-bone/[0.07]">
          {rows.map((player) => {
            const earned = points[player.id] ?? 0;
            const isYou = player.id === view.you.playerId;
            return (
              <li
                key={player.id}
                className="flex items-center gap-3 px-4 py-2.5"
              >
                <Avatar id={player.avatar} size="sm" />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate font-display text-lg leading-tight",
                      isYou ? "text-ember" : "text-bone",
                    )}
                  >
                    {player.name}
                    {isYou ? " · you" : ""}
                  </p>
                  {imposterIds.has(player.id) ? (
                    <p className="font-label text-[0.44rem] uppercase tracking-[0.12em] text-[#cf8577]/70">
                      Imposter
                    </p>
                  ) : null}
                </div>
                <span
                  className={cn(
                    "w-10 text-right font-label text-[0.62rem] tabular-nums tracking-[0.06em]",
                    earned > 0 ? "text-ember" : "text-ash/25",
                  )}
                >
                  +{earned}
                </span>
                <span className="w-14 text-right font-display text-lg tabular-nums leading-none text-bone/80">
                  {player.score} pts
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="flex flex-col gap-3 border-t border-bone/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-2xl leading-tight text-bone">
            {isFinalRound
              ? "The last memory has been told."
              : "The next memory is waiting."}
          </p>
          <p className="mt-1 text-sm leading-snug text-ash/55">
            {round.readyIds.length} of {view.players.length} are ready. If
            everyone continues, the next round begins immediately.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant={view.you.isHost ? "ghost" : "primary"}
            className="w-full sm:w-auto"
            disabled={alreadyReady || isPending}
            onClick={() => void act({ type: "ready" })}
          >
            <Check className="size-3.5" />
            {alreadyReady ? "Ready" : "Continue"}
          </Button>
          {view.you.isHost ? (
            <Button
              className="w-full sm:w-auto"
              disabled={isPending}
              onClick={() => void act({ type: "nextRound" })}
            >
              <Flame className="size-3.5" />
              {isFinalRound ? "Close the wake" : "Begin the next round"}
            </Button>
          ) : null}
        </div>
      </div>

      {reason === "caught" ? (
        <p className="flex items-center justify-center gap-2 text-center font-label text-[0.5rem] uppercase tracking-[0.16em] text-ash/30">
          <Skull className="size-3" />
          The memory was hidden well enough
        </p>
      ) : null}
      {reason === "guessed" ? (
        <p className="flex items-center justify-center gap-2 text-center font-label text-[0.5rem] uppercase tracking-[0.16em] text-ash/30">
          <KeyRound className="size-3" />
          The empty chair still knew the word
        </p>
      ) : null}
    </div>
  );
}
