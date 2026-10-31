"use client";

import { Check, Eye, KeyRound, Skull } from "lucide-react";
import { toRoman } from "@/lib/utils";
import { Avatar } from "@/components/game/avatar";
import { TimerBadge } from "@/components/game/timer";
import { Button } from "@/components/ui/button";
import { PhaseHeading } from "../phase-heading";
import { useRoom } from "../room-context";

export function RevealView() {
  const { view, act, isPending } = useRoom();
  const round = view.round;
  if (!round) {
    return null;
  }

  const isImposter = view.you.role === "imposter";
  const self = view.players.find(
    (player) => player.id === view.you.playerId,
  );
  const readySet = new Set(round.readyIds);
  const alreadyReady = readySet.has(view.you.playerId);
  const readyCount = round.readyIds.length;
  const fellowImposters = (view.you.fellowImposters ?? [])
    .map((id) => view.players.find((player) => player.id === id))
    .filter((player): player is NonNullable<typeof player> => Boolean(player));

  return (
    <div className="space-y-5">
      <PhaseHeading
        eyebrow={`Round ${toRoman(round.number)} of ${toRoman(view.settings.rounds)}`}
        title={isImposter ? "You remember nothing." : "Hold it close."}
        description={
          isImposter
            ? "You only know the category. Invent a memory that fits it, and do not let the table see you reaching for it."
            : "This memory is yours alone. One word at a time, prove that you remember it without handing it to the guest who does not."
        }
        aside={
          <TimerBadge
            deadline={view.deadline}
            serverNow={view.serverNow}
            label="Reveal timer"
          />
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.12fr_0.88fr]">
        <div
          className="paper relative overflow-hidden p-6 sm:p-8"
          aria-label={isImposter ? "Your role card: imposter" : "Your memory card"}
        >
          <div className="flex items-start justify-between gap-4 border-b border-[#3b2c1d]/20 pb-3">
            <div>
              <p className="font-label text-[0.54rem] uppercase tracking-[0.2em] text-[#6d5b43]">
                Private memory
              </p>
              <p className="mt-1 font-label text-[0.46rem] uppercase tracking-[0.16em] text-[#7f211d]/70">
                For {self?.name ?? "you"} only
              </p>
            </div>
            <span className="stamp shrink-0">
              {isImposter ? "Empty" : "Remember"}
            </span>
          </div>

          <div className="mt-6">
            <p className="font-label text-[0.54rem] uppercase tracking-[0.2em] text-[#6d5b43]">
              {isImposter ? "What you will remember" : "The memory"}
            </p>
            {isImposter ? (
              <p className="mt-2 font-display text-[clamp(2.8rem,9vw,4.4rem)] leading-[0.9] text-[#5a201b]">
                Nothing.
              </p>
            ) : (
              <p className="mt-2 break-words font-display text-[clamp(2.4rem,8vw,4.1rem)] leading-[0.92] text-[#19140e]">
                {view.you.word ?? round.word}
              </p>
            )}
          </div>

          <div className="thread my-6 opacity-70" />

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-label text-[0.5rem] uppercase tracking-[0.18em] text-[#7a6750]">
                Category
              </p>
              <p className="mt-1 font-display text-2xl text-[#33271b]">
                {round.category}
              </p>
            </div>
            <div className="flex max-w-56 items-start gap-2 text-right text-xs leading-snug text-[#5a4936]/80">
              {isImposter ? (
                <Skull className="mt-0.5 size-3.5 shrink-0 text-[#7f211d]" />
              ) : (
                <Eye className="mt-0.5 size-3.5 shrink-0 text-[#7f211d]" />
              )}
              <span>
                {isImposter
                  ? "Use the category as your only anchor. Let the others speak first if you can."
                  : "Do not read the memory aloud. A clue is one word, never the memory itself."}
              </span>
            </div>
          </div>

          <div className="wax-seal absolute -bottom-3 -right-2 scale-75" aria-hidden="true">
            I
          </div>
        </div>

        <div className="space-y-4">
          {fellowImposters.length > 0 ? (
            <section className="border border-blood/30 bg-[linear-gradient(120deg,rgba(127,33,29,0.12),rgba(0,0,0,0.15))] p-4">
              <p className="font-label text-[0.52rem] uppercase tracking-[0.16em] text-[#cf8577]">
                Not alone in the dark
              </p>
              <p className="mt-1.5 text-sm leading-snug text-ash/75">
                These guests also remember nothing. Protect them if you can, but
                never make it obvious.
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {fellowImposters.map((player) => (
                  <li
                    key={player.id}
                    className="flex items-center gap-2 border border-blood/25 bg-black/20 px-2 py-1.5"
                  >
                    <Avatar id={player.avatar} size="xs" />
                    <span className="font-display text-base text-bone">
                      {player.name}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : isImposter ? (
            <section className="border border-blood/30 bg-blood/[0.07] p-4">
              <p className="font-label text-[0.52rem] uppercase tracking-[0.16em] text-[#cf8577]">
                The only empty chair
              </p>
              <p className="mt-1.5 text-sm leading-snug text-ash/75">
                Every other guest remembers the same thing. You are the only one
                who must invent it.
              </p>
            </section>
          ) : (
            <section className="border border-moss/25 bg-moss/[0.05] p-4">
              <p className="font-label text-[0.52rem] uppercase tracking-[0.16em] text-[#a7b28c]">
                You are with the crew
              </p>
              <p className="mt-1.5 text-sm leading-snug text-ash/75">
                Everyone at this table was given this memory except one. Give a
                clue particular enough to prove you know it.
              </p>
            </section>
          )}

          <section className="paper-dark p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-label text-[0.52rem] uppercase tracking-[0.16em] text-ash/65">
                Ready at the table
              </p>
              <span className="font-label text-[0.5rem] tabular-nums tracking-[0.1em] text-ash/45">
                {readyCount}/{view.players.length}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {view.players.map((player) => {
                const ready = readySet.has(player.id);
                return (
                  <span
                    key={player.id}
                    className="relative"
                    title={`${player.name} ${ready ? "is ready" : "is still reading"}`}
                  >
                    <Avatar
                      id={player.avatar}
                      size="xs"
                      dimmed={!ready}
                    />
                    {ready ? (
                      <span className="absolute -bottom-0.5 -right-0.5 grid size-3.5 place-items-center rounded-full border border-[#100e0b] bg-moss text-void">
                        <Check className="size-2" strokeWidth={3} />
                      </span>
                    ) : null}
                  </span>
                );
              })}
            </div>

            <div className="mt-4 space-y-2">
              <Button
                className="w-full"
                disabled={alreadyReady || isPending}
                onClick={() => void act({ type: "ready" })}
              >
                <KeyRound className="size-3.5" />
                {alreadyReady ? "You are ready" : "I have it"}
              </Button>
              {view.you.isHost ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  disabled={isPending}
                  onClick={() => void act({ type: "beginClues" })}
                >
                  Begin the clues now
                </Button>
              ) : null}
            </div>

            <p className="mt-3 text-xs leading-snug text-ash/45">
              Clues begin when every guest is ready, the host begins them, or the
              timer runs out.
            </p>
          </section>

          <p className="text-center font-label text-[0.5rem] uppercase tracking-[0.16em] text-ash/35">
            Keep this card to yourself
          </p>
        </div>
      </div>
    </div>
  );
}
