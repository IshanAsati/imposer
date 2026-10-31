"use client";

import { Gavel, MessageCircle } from "lucide-react";
import { toRoman } from "@/lib/utils";
import { Avatar } from "@/components/game/avatar";
import { TimerBadge } from "@/components/game/timer";
import { Button } from "@/components/ui/button";
import { PhaseHeading } from "../phase-heading";
import { useRoom } from "../room-context";

const PROMPTS = [
  "Ask what they saw, not what they know.",
  "The imposter will agree too quickly.",
  "A clue can be a confession. Read it twice.",
];

export function DiscussionView() {
  const { view, act, isPending, openChat } = useRoom();
  const round = view.round;

  if (!round) {
    return null;
  }

  const host = view.players.find((player) => player.id === view.hostId);
  const cluesByPlayer = new Map(
    round.clues.map((entry) => [entry.playerId, entry.word]),
  );

  return (
    <div className="space-y-5">
      <PhaseHeading
        eyebrow={`Round ${toRoman(round.number)} · Discussion`}
        title="The floor is open."
        description="Compare the clues. Ask for details. Decide who was guessing, and who simply chose a careful word."
        aside={
          <TimerBadge
            deadline={view.deadline}
            serverNow={view.serverNow}
            label="Discussion timer"
          />
        }
      />

      <section>
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <p className="font-label text-[0.54rem] uppercase tracking-[0.18em] text-ash/60">
            What the table said
          </p>
          <span className="font-label text-[0.48rem] uppercase tracking-[0.12em] text-ash/30">
            Category · {round.category}
          </span>
        </div>

        <ul className="grid gap-px overflow-hidden border border-bone/10 bg-bone/10 sm:grid-cols-2">
          {round.clueOrder.map((playerId, index) => {
            const player = view.players.find(
              (candidate) => candidate.id === playerId,
            );
            const clue = cluesByPlayer.get(playerId) ?? null;
            return (
              <li key={playerId} className="bg-[#0d0b09] px-3.5 py-3">
                <div className="flex items-center gap-2">
                  {player ? <Avatar id={player.avatar} size="xs" /> : null}
                  <span className="min-w-0 flex-1 truncate font-label text-[0.52rem] uppercase tracking-[0.12em] text-ash/70">
                    {player?.name ?? "A departed guest"}
                  </span>
                  <span className="font-label text-[0.44rem] tabular-nums tracking-[0.1em] text-ash/25">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <p className="mt-1.5 font-display text-xl leading-tight text-bone">
                  {clue ? `“${clue}”` : "— passed —"}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
        <div className="flex flex-col justify-between gap-3 border border-ember/25 bg-ember/[0.055] p-4">
          <div>
            <p className="font-label text-[0.52rem] uppercase tracking-[0.16em] text-ember/80">
              The host&apos;s call
            </p>
            <p className="mt-1.5 font-display text-xl leading-tight text-bone">
              {view.you.isHost
                ? "When the table has said enough, call the vote."
                : `${host?.name ?? "The host"} will call the vote when the table has said enough.`}
            </p>
          </div>
          {view.you.isHost ? (
            <Button
              className="w-full sm:w-auto"
              disabled={isPending}
              onClick={() => void act({ type: "startVote" })}
            >
              <Gavel className="size-3.5" />
              Call the vote
            </Button>
          ) : (
            <p className="text-sm leading-snug text-ash/60">
              Keep talking until the accusation begins. There is no way to take
              back what the table has heard.
            </p>
          )}
        </div>

        <div className="border border-bone/10 bg-black/15 p-4">
          <p className="font-label text-[0.52rem] uppercase tracking-[0.16em] text-ash/55">
            The wires
          </p>
          <p className="mt-1.5 text-sm leading-snug text-ash/65">
            No voice chat lives inside the wake. Use your usual call, or pass
            notes in the wires.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full lg:hidden"
            onClick={openChat}
          >
            <MessageCircle className="size-3.5" />
            Open the wires
          </Button>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {PROMPTS.map((prompt, index) => (
          <div
            key={prompt}
            className="border border-bone/[0.08] bg-black/10 px-3 py-2.5"
          >
            <span className="font-display text-2xl leading-none text-blood/60">
              {["I", "II", "III"][index]}
            </span>
            <p className="mt-1.5 text-sm leading-snug text-ash/60">{prompt}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
