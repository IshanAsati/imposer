"use client";

import { useState, type FormEvent } from "react";
import { Footprints, Send } from "lucide-react";
import { cn, toRoman } from "@/lib/utils";
import { Avatar } from "@/components/game/avatar";
import { TimerBadge } from "@/components/game/timer";
import { Button } from "@/components/ui/button";
import { PhaseHeading } from "../phase-heading";
import { useRoom } from "../room-context";

function clueError(
  value: string,
  word: string | null,
  category: string,
): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return "A clue cannot be empty.";
  }
  if (/\s/u.test(trimmed)) {
    return "One word only — no spaces.";
  }
  if (Array.from(trimmed).length > 32) {
    return "Keep the clue to 32 characters or fewer.";
  }
  if (!/^[\p{L}\p{N}'’-]+$/u.test(trimmed)) {
    return "Use letters, numbers, apostrophes, or hyphens only.";
  }
  const normalized = trimmed.toLowerCase();
  if (word && normalized === word.toLowerCase()) {
    return "That is the memory itself. Give the table a clue.";
  }
  if (normalized === category.toLowerCase()) {
    return "That is the category, not a clue.";
  }
  return null;
}

export function CluesView() {
  const { view, act, isPending } = useRoom();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const round = view.round;

  if (!round) {
    return null;
  }

  const currentId = round.currentCluePlayerId;
  const currentIndex = currentId
    ? round.clueOrder.indexOf(currentId)
    : round.clueOrder.length;
  const currentPlayer = currentId
    ? view.players.find((player) => player.id === currentId)
    : null;
  const isMyTurn = currentId === view.you.playerId;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = value.trim();
    const nextError = clueError(trimmed, view.you.word, round.category);
    if (nextError) {
      setError(nextError);
      return;
    }
    setError(null);
    const accepted = await act({ type: "submitClue", clue: trimmed });
    if (accepted) {
      setValue("");
    }
  };

  const pass = async () => {
    setError(null);
    await act({ type: "skipClue" });
  };

  return (
    <div className="space-y-5">
      <PhaseHeading
        eyebrow={`Round ${toRoman(round.number)} · Clues`}
        title={isMyTurn ? "One word, then silence." : "The table is listening."}
        description="Every clue is public. Say enough to prove you remember, but not enough to hand the memory to the guest who does not."
        aside={
          <TimerBadge
            deadline={view.deadline}
            serverNow={view.serverNow}
            label="Clue timer"
          />
        }
      />

      <div
        className={cn(
          "flex flex-wrap items-center gap-3 border px-4 py-3",
          isMyTurn
            ? "border-ember/45 bg-ember/[0.08]"
            : "border-bone/10 bg-black/20",
        )}
      >
        {currentPlayer ? (
          <Avatar id={currentPlayer.avatar} size="md" />
        ) : (
          <span className="grid size-11 place-items-center border border-bone/10 text-ash/40">
            <Footprints className="size-4" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-label text-[0.5rem] uppercase tracking-[0.18em] text-ash/55">
            {isMyTurn ? "Your turn to speak" : "Now speaking"}
          </p>
          <p className="mt-0.5 truncate font-display text-2xl leading-tight text-bone">
            {isMyTurn ? "Give one word." : (currentPlayer?.name ?? "The table")}
          </p>
        </div>
        <span className="font-label text-[0.5rem] uppercase tracking-[0.14em] text-ash/40">
          Clue {Math.min(currentIndex + 1, round.clueOrder.length)} of{" "}
          {round.clueOrder.length}
        </span>
      </div>

      <div>
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <p className="font-label text-[0.54rem] uppercase tracking-[0.18em] text-ash/60">
            The order of speaking
          </p>
          <span className="font-label text-[0.48rem] uppercase tracking-[0.12em] text-ash/30">
            One word each
          </span>
        </div>

        <ol className="divide-y divide-bone/[0.07] border border-bone/10 bg-black/15">
          {round.clueOrder.map((playerId, index) => {
            const player = view.players.find(
              (candidate) => candidate.id === playerId,
            );
            const clue = round.clues.find(
              (entry) => entry.playerId === playerId,
            )?.word;
            const given = index < currentIndex;
            const isNow = index === currentIndex;

            return (
              <li
                key={playerId}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5",
                  isNow && "bg-ember/[0.06]",
                )}
              >
                <span className="w-5 shrink-0 text-center font-label text-[0.46rem] tabular-nums tracking-[0.1em] text-ash/30">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {player ? (
                  <Avatar id={player.avatar} size="sm" dimmed={!player.online} />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-lg leading-tight text-bone/90">
                    {player?.name ?? "A departed guest"}
                  </p>
                  <p className="mt-0.5 font-label text-[0.44rem] uppercase tracking-[0.12em] text-ash/35">
                    {isNow
                      ? "Speaking now"
                      : given
                        ? clue
                          ? "Clue given"
                          : "Passed"
                        : "Waiting"}
                  </p>
                </div>
                <div className="max-w-[42%] shrink-0 text-right">
                  {given ? (
                    clue ? (
                      <p className="break-words font-display text-lg leading-tight text-bone">
                        &ldquo;{clue}&rdquo;
                      </p>
                    ) : (
                      <p className="font-display text-base italic text-ash/40">
                        passed
                      </p>
                    )
                  ) : isNow ? (
                    <span className="inline-flex items-center gap-1.5 font-label text-[0.46rem] uppercase tracking-[0.12em] text-ember/75">
                      <span className="size-1 animate-pulse rounded-full bg-ember" />
                      Thinking
                    </span>
                  ) : (
                    <span className="font-label text-[0.5rem] text-ash/20">—</span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {isMyTurn ? (
        <form
          onSubmit={(event) => void submit(event)}
          className="border border-ember/30 bg-ember/[0.05] p-4"
        >
          <label htmlFor="clue-word" className="field-label">
            Your clue
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="clue-word"
              name="clue"
              type="text"
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                if (error) {
                  setError(null);
                }
              }}
              placeholder="one word"
              maxLength={32}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
              disabled={isPending}
              className="field flex-1"
              aria-describedby="clue-hint"
              aria-invalid={Boolean(error)}
            />
            <Button
              type="submit"
              className="sm:min-w-32"
              disabled={!value.trim() || isPending}
            >
              <Send className="size-3.5" />
              Give clue
            </Button>
          </div>
          <div className="mt-2 flex flex-wrap items-start justify-between gap-2">
            <p
              id="clue-hint"
              className="max-w-md text-xs leading-snug text-ash/50"
            >
              One word. 32 characters at most. No spaces, no sentences, never the
              memory itself.
            </p>
            <button
              type="button"
              onClick={() => void pass()}
              disabled={isPending}
              className="font-label text-[0.5rem] uppercase tracking-[0.14em] text-ash/50 underline decoration-bone/20 underline-offset-4 transition hover:text-bone disabled:opacity-40"
            >
              Pass this turn
            </button>
          </div>
          {error ? (
            <p
              role="alert"
              className="mt-3 border-l-2 border-blood bg-blood/10 px-3 py-2 text-sm text-[#e5b9ad]"
            >
              {error}
            </p>
          ) : null}
        </form>
      ) : (
        <div className="border border-bone/10 bg-black/15 px-4 py-3">
          <p className="text-sm leading-snug text-ash/65">
            {currentPlayer ? (
              <>
                <span className="font-display text-lg text-bone">
                  {currentPlayer.name}
                </span>{" "}
                is choosing a word. If the timer runs out, their turn is skipped.
              </>
            ) : (
              "The clues are complete. The table will move to discussion."
            )}
          </p>
        </div>
      )}

      <p className="text-center font-label text-[0.5rem] uppercase tracking-[0.16em] text-ash/35">
        A good clue is particular, not obvious
      </p>
    </div>
  );
}
