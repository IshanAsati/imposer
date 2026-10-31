"use client";

import { useState } from "react";
import { Eye, Hourglass, KeyRound, Skull } from "lucide-react";
import { cn, toRoman } from "@/lib/utils";
import { Avatar } from "@/components/game/avatar";
import { TimerBadge } from "@/components/game/timer";
import { Button } from "@/components/ui/button";
import { PhaseHeading } from "../phase-heading";
import { useRoom } from "../room-context";

export function GuessView() {
  const { view, act, isPending } = useRoom();
  const [picked, setPicked] = useState<{
    round: number;
    value: string | null;
  }>({ round: -1, value: null });
  const round = view.round;
  const choice =
    round && picked.round === round.number ? picked.value : null;

  const choose = (value: string) => {
    if (round) {
      setPicked({ round: round.number, value });
    }
  };

  if (!round) {
    return null;
  }

  const isImposter = view.you.role === "imposter";
  const options = isImposter ? round.guessOptions : null;
  const eliminated = view.players.find(
    (player) => player.id === round.eliminatedId,
  );
  const canAnswer = Boolean(options && options.length > 0);

  if (!canAnswer) {
    return (
      <div className="space-y-5">
        <PhaseHeading
          eyebrow={`Round ${toRoman(round.number)} · The final guess`}
          title="The accused reaches for a memory."
          description="Four memories have been set before them. One is real. If they name it, the imposters still take the round."
          aside={
            <TimerBadge
              deadline={view.deadline}
              serverNow={view.serverNow}
              label="Guess timer"
            />
          }
        />

        <div className="relative overflow-hidden border border-bone/12 bg-[radial-gradient(ellipse_at_50%_20%,rgba(127,33,29,0.18),transparent_60%)] px-5 py-12 text-center">
          <div className="relative mx-auto grid size-16 place-items-center rounded-full border border-blood/35">
            <span className="absolute inset-0 animate-ping rounded-full border border-blood/20" />
            <Hourglass className="size-6 text-[#c46a5f]" />
          </div>
          <p className="mt-6 font-label text-[0.54rem] uppercase tracking-[0.2em] text-ash/55">
            The table holds its breath
          </p>
          <p className="mx-auto mt-2 max-w-md font-display text-3xl leading-tight text-bone">
            {eliminated?.name ?? "The accused"} is choosing between four
            memories.
          </p>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-snug text-ash/55">
            You cannot see the choices. If the guess is right, the imposters win
            the round. If it is wrong, the crew does.
          </p>
        </div>

        {round.eliminatedId ? (
          <div className="flex items-center justify-center gap-3 border border-bone/10 bg-black/15 px-4 py-3">
            {eliminated ? <Avatar id={eliminated.avatar} size="sm" /> : null}
            <p className="font-label text-[0.52rem] uppercase tracking-[0.14em] text-ash/55">
              Accused ·{" "}
              <span className="font-display text-base normal-case tracking-normal text-bone">
                {eliminated?.name ?? "A guest"}
              </span>
            </p>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PhaseHeading
        eyebrow={`Round ${toRoman(round.number)} · Caught`}
        title="Name the memory."
        description={
          view.you.fellowImposters && view.you.fellowImposters.length > 0
            ? "You were caught, but the night is not over. Any liar may answer — one answer binds you all."
            : "You were caught, but the night is not over. Name the memory and you still take the round."
        }
        aside={
          <TimerBadge
            deadline={view.deadline}
            serverNow={view.serverNow}
            label="Guess timer"
          />
        }
      />

      <div className="flex items-start gap-3 border border-blood/30 bg-blood/[0.07] px-4 py-3">
        <Skull className="mt-0.5 size-4 shrink-0 text-[#c46a5f]" />
        <div>
          <p className="font-label text-[0.5rem] uppercase tracking-[0.16em] text-[#cf8577]">
            The accusation
          </p>
          <p className="mt-1 text-sm leading-snug text-ash/75">
            The table believes{" "}
            <span className="font-display text-lg text-bone">
              {eliminated?.name ?? "an imposter"}
            </span>{" "}
            has no memory. Choose the true one. A wrong answer gives the round to
            the crew.
          </p>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <p className="font-label text-[0.54rem] uppercase tracking-[0.18em] text-ash/60">
            The memories offered
          </p>
          <span className="font-label text-[0.48rem] uppercase tracking-[0.12em] text-ash/30">
            One is real
          </span>
        </div>
        <div
          className="grid gap-2 sm:grid-cols-2"
          role="radiogroup"
          aria-label="Choose the real memory"
        >
          {options?.map((option, index) => {
            const selected = choice === option;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={isPending}
                onClick={() => choose(option)}
                className={cn(
                  "flex items-center gap-3 border px-4 py-4 text-left transition disabled:opacity-60",
                  selected
                    ? "border-ember/60 bg-ember/[0.09]"
                    : "border-bone/10 bg-black/20 hover:border-bone/30",
                )}
              >
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center border font-label text-[0.6rem]",
                    selected
                      ? "border-ember/50 text-ember"
                      : "border-bone/15 text-ash/45",
                  )}
                >
                  {["A", "B", "C", "D"][index] ?? "?"}
                </span>
                <span
                  className={cn(
                    "font-display text-xl leading-tight",
                    selected ? "text-bone" : "text-bone/85",
                  )}
                >
                  {option}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-bone/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-sm text-sm leading-snug text-ash/55">
          A correct guess wins the round for the imposters. A wrong guess — or no
          answer before the timer ends — gives it to the crew.
        </p>
        <Button
          className="w-full sm:w-auto sm:min-w-44"
          disabled={!choice || isPending}
          onClick={() => {
            if (choice) {
              void act({ type: "submitGuess", word: choice });
            }
          }}
        >
          <KeyRound className="size-3.5" />
          Name the memory
        </Button>
      </div>

      <p className="flex items-center justify-center gap-2 text-center font-label text-[0.5rem] uppercase tracking-[0.16em] text-ash/35">
        <Eye className="size-3" />
        The crew cannot see these choices
      </p>
    </div>
  );
}
