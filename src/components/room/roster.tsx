"use client";

import { useState, type ReactNode } from "react";
import { Check, Crown, X } from "lucide-react";import { MAX_PLAYERS } from "@/lib/game/constants";
import type { PlayerView } from "@/lib/game/types";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/game/avatar";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useRoom } from "./room-context";

type TagTone = "blood" | "ember" | "moss" | "ash";

function Tag({
  children,
  tone = "ash",
}: {
  children: ReactNode;
  tone?: TagTone;
}) {
  const tones: Record<TagTone, string> = {
    blood: "border-blood/40 text-[#d08a7e]",
    ember: "border-ember/35 text-[#dcbb83]",
    moss: "border-[#5f6848]/45 text-[#a7b28c]",
    ash: "border-bone/12 text-ash/60",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border px-1.5 py-0.5 font-label text-[0.46rem] uppercase leading-none tracking-[0.12em]",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

interface RosterProps {
  className?: string;
}

export function Roster({ className }: RosterProps) {
  const { view, act, isPending, openInvite } = useRoom();
  const [kickTarget, setKickTarget] = useState<PlayerView | null>(null);

  const isLobby = view.phase === "lobby";
  const voting = view.phase === "voting" || view.phase === "runoff";
  const revealed =
    view.phase === "round_result" || view.phase === "final";
  const currentClueId = view.round?.currentCluePlayerId ?? null;
  const votedBy = new Set(view.round?.votedBy ?? []);
  const imposterIds = new Set(revealed ? (view.round?.imposterIds ?? []) : []);
  const eliminatedId = revealed ? (view.round?.eliminatedId ?? null) : null;
  const online = view.players.filter((player) => player.online).length;
  const seats = Math.max(0, MAX_PLAYERS - view.players.length);

  const confirmKick = async () => {
    if (!kickTarget) {
      return;
    }
    const removed = await act({ type: "kick", playerId: kickTarget.id });
    if (removed) {
      setKickTarget(null);
    }
  };

  return (
    <section
      className={cn("paper-dark flex min-h-0 flex-col", className)}
      aria-label="Guests at the wake"
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-bone/10 px-4 py-3">
        <div>
          <p className="font-label text-[0.56rem] uppercase tracking-[0.18em] text-ash/65">
            The table
          </p>
          <p className="mt-0.5 font-display text-lg leading-none text-bone">
            {view.players.length} of {MAX_PLAYERS} seated
          </p>
        </div>
        <span className="font-label text-[0.5rem] uppercase tracking-[0.14em] text-ash/45">
          {online} present
        </span>
      </header>

      <ul className="scroll-thin min-h-0 flex-1 divide-y divide-bone/[0.07] overflow-y-auto">
        {view.players.map((player) => {
          const isYou = player.id === view.you.playerId;
          const speaking = currentClueId === player.id;
          const hasVoted = voting && votedBy.has(player.id);
          const isLiar = imposterIds.has(player.id);
          const isEliminated = eliminatedId === player.id;

          return (
            <li
              key={player.id}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 transition-colors",
                speaking && "bg-ember/[0.06]",
              )}
            >
              <div className="relative">
                <Avatar
                  id={player.avatar}
                  size="sm"
                  dimmed={!player.online}
                />
                <span
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 size-2 rounded-full border border-[#100e0b]",
                    player.online ? "bg-[#9ca982]" : "bg-ash/35",
                  )}
                  title={player.online ? "Present" : "Away"}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p
                    className={cn(
                      "truncate font-display text-lg leading-tight",
                      isYou ? "text-ember" : "text-bone",
                    )}
                  >
                    {player.name}
                  </p>
                  {player.isHost ? (
                    <Crown
                      className="size-3 shrink-0 text-ember/80"
                      aria-label="Host"
                    />
                  ) : null}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  {isYou ? <Tag>You</Tag> : null}
                  {speaking ? (
                    <Tag tone="ember">
                      <span className="size-1 animate-pulse rounded-full bg-ember" />
                      Speaking
                    </Tag>
                  ) : null}
                  {hasVoted ? (
                    <Tag tone="moss">
                      <Check className="size-2.5" />
                      Voted
                    </Tag>
                  ) : null}
                  {isLiar ? <Tag tone="blood">Liar</Tag> : null}
                  {isEliminated ? <Tag tone="blood">Accused</Tag> : null}
                  {!player.online ? <Tag tone="ash">Away</Tag> : null}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <span className="font-label text-[0.52rem] uppercase tracking-[0.08em] text-ash/55">
                  {player.score}
                  <span className="ml-0.5 hidden sm:inline">pts</span>
                </span>
                {view.you.isHost && isLobby && !isYou ? (
                  <button
                    type="button"
                    onClick={() => setKickTarget(player)}
                    aria-label={`Remove ${player.name} from the wake`}
                    title={`Remove ${player.name}`}
                    className="grid size-11 place-items-center text-ash/35 transition hover:text-[#d08a7e] sm:-mr-2"
                  >
                    <X className="size-3.5" />
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-bone/10 px-4 py-2.5">
        <span className="font-label text-[0.5rem] uppercase tracking-[0.14em] text-ash/45">
          {seats === 0 ? "The table is full" : `${seats} seats remain`}
        </span>
        {isLobby ? (
          <button
            type="button"
            onClick={openInvite}
            className="-my-2 inline-flex min-h-11 items-center px-2 font-label text-[0.52rem] uppercase tracking-[0.14em] text-ember/80 underline decoration-ember/30 underline-offset-4 transition hover:text-ember"
          >
            Invite
          </button>
        ) : (
          <span className="font-label text-[0.5rem] uppercase tracking-[0.14em] text-ash/30">
            Round {view.roundNumber} of {view.settings.rounds}
          </span>
        )}
      </footer>

      <Dialog
        open={kickTarget !== null}
        onClose={() => {
          if (!isPending) {
            setKickTarget(null);
          }
        }}
        eyebrow="The host's word"
        title={`Remove ${kickTarget?.name ?? "this guest"}?`}
        description="They will lose their seat and their invitation. They cannot rejoin a wake already in progress."
      >
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="ghost"
            onClick={() => setKickTarget(null)}
            disabled={isPending}
          >
            Keep them
          </Button>
          <Button
            variant="solid"
            onClick={() => void confirmKick()}
            disabled={isPending}
          >
            Remove from the wake
          </Button>
        </div>
      </Dialog>
    </section>
  );
}
