"use client";

import { useState } from "react";
import { Check, CircleSlash, Gavel } from "lucide-react";
import type { VoteTarget } from "@/lib/game/types";
import { cn, toRoman } from "@/lib/utils";
import { Avatar } from "@/components/game/avatar";
import { TimerBadge } from "@/components/game/timer";
import { Button } from "@/components/ui/button";
import { PhaseHeading } from "../phase-heading";
import { useRoom } from "../room-context";

export function VotingView() {
  const { view, act, isPending } = useRoom();
  const [selection, setSelection] = useState<{
    key: string;
    value: VoteTarget | null;
  }>({ key: "", value: null });
  const round = view.round;

  const runoff = view.phase === "runoff";
  const runoffKey = round?.runoffCandidates?.join(",") ?? "";
  const roundKey = `${round?.number ?? 0}:${view.phase}:${runoffKey}`;
  const selected = selection.key === roundKey ? selection.value : null;

  const setSelected = (value: VoteTarget | null) => {
    setSelection({ key: roundKey, value });
  };

  if (!round) {
    return null;
  }

  const me = view.you.playerId;
  const isCandidate = Boolean(round.runoffCandidates?.includes(me));
  const candidateIds = runoff
    ? (round.runoffCandidates ?? [])
    : view.players.map((player) => player.id);
  const candidates = candidateIds
    .filter((id) => id !== me)
    .map((id) => view.players.find((player) => player.id === id))
    .filter((player): player is NonNullable<typeof player> => Boolean(player));
  const votedBy = new Set(round.votedBy);
  const hasVoted = votedBy.has(me);
  const selectedPlayer =
    selected && selected !== "skip"
      ? view.players.find((player) => player.id === selected)
      : null;

  const cast = async () => {
    if (!selected) {
      return;
    }
    await act({ type: "vote", targetId: selected });
  };

  return (
    <div className="space-y-5">
      <PhaseHeading
        eyebrow={`Round ${toRoman(round.number)} · ${runoff ? "Runoff" : "The vote"}`}
        title={runoff ? "The tie must break." : "Cast your accusation."}
        description={
          runoff
            ? "Only the tied guests stand accused. A second tie means no one is accused, and the imposters take the round."
            : "One guest receives the most accusations. If the table splits, the tied guests face a runoff. If the table abstains, no one is accused."
        }
        aside={
          <TimerBadge
            deadline={view.deadline}
            serverNow={view.serverNow}
            label="Vote timer"
          />
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-2 border border-bone/10 bg-black/20 px-4 py-2.5">
        <p className="font-label text-[0.52rem] uppercase tracking-[0.14em] text-ash/60">
          {round.votedBy.length} of {view.players.length} accusations cast
        </p>
        {hasVoted ? (
          <span className="inline-flex items-center gap-1.5 font-label text-[0.5rem] uppercase tracking-[0.14em] text-[#a7b28c]">
            <Check className="size-3" />
            Your accusation is in the box
          </span>
        ) : (
          <span className="font-label text-[0.5rem] uppercase tracking-[0.14em] text-ember/70">
            Your vote is still yours
          </span>
        )}
      </div>

      {runoff && isCandidate ? (
        <p className="border border-blood/30 bg-blood/[0.06] px-4 py-3 text-sm leading-snug text-[#e0b1a5]">
          You stand accused. You cannot vote for yourself; you may still vote to
          skip.
        </p>
      ) : null}

      <div
        className="grid gap-2 sm:grid-cols-2"
        role="radiogroup"
        aria-label="Choose a guest to accuse"
      >
        {candidates.map((player) => {
          const chosen = selected === player.id;
          return (
            <button
              key={player.id}
              type="button"
              role="radio"
              aria-checked={chosen}
              disabled={isPending}
              onClick={() => setSelected(player.id)}
              className={cn(
                "flex items-center gap-3 border p-3.5 text-left transition disabled:opacity-60",
                chosen
                  ? "border-blood/65 bg-blood/[0.12]"
                  : "border-bone/10 bg-black/20 hover:border-bone/30",
              )}
            >
              <Avatar
                id={player.avatar}
                size="md"
                dimmed={!player.online}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-xl leading-tight text-bone">
                  {player.name}
                </p>
                <p className="mt-0.5 font-label text-[0.46rem] uppercase tracking-[0.12em] text-ash/40">
                  {votedBy.has(player.id) ? "Has voted" : "Yet to vote"}
                  {player.online ? "" : " · away"}
                </p>
              </div>
              <span
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-full border",
                  chosen
                    ? "border-blood bg-blood text-bone"
                    : "border-bone/20 text-transparent",
                )}
                aria-hidden="true"
              >
                <Check className="size-3" strokeWidth={3} />
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        role="radio"
        aria-checked={selected === "skip"}
        disabled={isPending}
        onClick={() => setSelected("skip")}
        className={cn(
          "flex w-full items-center gap-3 border p-3.5 text-left transition disabled:opacity-60",
          selected === "skip"
            ? "border-ember/60 bg-ember/[0.08]"
            : "border-bone/10 bg-black/15 hover:border-bone/30",
        )}
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-full border border-bone/15 bg-black/25 text-ash/65">
          <CircleSlash className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-xl leading-tight text-bone">
            Skip the accusation
          </p>
          <p className="mt-0.5 text-sm leading-snug text-ash/55">
            No one is accused this round. The imposters take it.
          </p>
        </div>
        <span
          className={cn(
            "size-5 shrink-0 rounded-full border",
            selected === "skip"
              ? "border-ember bg-ember"
              : "border-bone/20",
          )}
          aria-hidden="true"
        />
      </button>

      <div className="flex flex-col gap-3 border-t border-bone/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-md text-sm leading-snug text-ash/60">
          {selectedPlayer ? (
            <>
              You are pointing at{" "}
              <span className="font-display text-lg text-bone">
                {selectedPlayer.name}
              </span>
              .{" "}
              {hasVoted
                ? "You may move your accusation until every vote is cast."
                : "Once every guest has voted, the table's decision is final."}
            </>
          ) : selected === "skip" ? (
            "You are choosing not to accuse anyone. The imposters will win the round if the table follows you."
          ) : (
            "Choose one guest, or choose to skip. You cannot vote for yourself."
          )}
        </p>
        <Button
          className="w-full sm:w-auto sm:min-w-48"
          disabled={!selected || isPending}
          onClick={() => void cast()}
        >
          <Gavel className="size-3.5" />
          {hasVoted ? "Move your accusation" : "Cast the accusation"}
        </Button>
      </div>
    </div>
  );
}
