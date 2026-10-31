"use client";

import { Flame, Lock, MoonStar, UsersRound } from "lucide-react";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  CLUE_TIME_OPTIONS,
  DISCUSSION_TIME_OPTIONS,
  GUESS_TIME_OPTIONS,
  VOTE_TIME_OPTIONS,
  maxImposters,
} from "@/lib/game/constants";
import { PACK_META, type PackChoiceId } from "@/lib/game/pack-meta";
import type { GameSettings, Phase } from "@/lib/game/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { InviteCard } from "../invite-card";
import { PhaseHeading } from "../phase-heading";
import { useRoom } from "../room-context";

const PHASE_ORDER: Phase[] = [
  "lobby",
  "reveal",
  "clues",
  "discussion",
  "voting",
  "runoff",
  "imposter_guess",
  "round_result",
  "final",
];

function isBeforeStart(phase: Phase): boolean {
  return PHASE_ORDER.indexOf(phase) <= PHASE_ORDER.indexOf("lobby");
}

export function LobbyView() {
  const { view } = useRoom();
  const host = view.players.find((player) => player.id === view.hostId);
  const seatsNeeded = Math.max(0, MIN_PLAYERS - view.players.length);

  return (
    <div className="space-y-5">
      <PhaseHeading
        eyebrow="Before the wake"
        title="The table is set."
        description="Share the code, settle the rules, and wait for the last guest. The first memory is drawn only when the host begins."
        aside={
          <span className="inline-flex items-center gap-1.5 border border-bone/15 bg-black/20 px-2.5 py-1.5 font-label text-[0.52rem] uppercase tracking-[0.14em] text-ash/70">
            <UsersRound className="size-3" />
            {view.players.length}/{MAX_PLAYERS}
          </span>
        }
      />

      <InviteCard code={view.code} />

      <section className="border border-bone/10 bg-black/15 p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-bone/10 pb-3">
          <div>
            <p className="font-label text-[0.56rem] uppercase tracking-[0.18em] text-ash/65">
              The rules of the night
            </p>
            <h2 className="mt-1 font-display text-2xl text-bone">
              {view.you.isHost ? "Set the wake to your liking." : "The host keeps the rules."}
            </h2>
          </div>
          <span className="font-label text-[0.5rem] uppercase tracking-[0.14em] text-ash/35">
            Sealed when the first memory is drawn
          </span>
        </div>

        {view.you.isHost ? <LobbySettings /> : <RulesSummary />}
      </section>

      <StartPanel seatsNeeded={seatsNeeded} hostName={host?.name ?? "the host"} />
    </div>
  );
}

function LobbySettings() {
  const { view, act, pendingType } = useRoom();
  const settings = view.settings;
  const disabled = pendingType !== null;
  const max = maxImposters(view.players.length);

  const update = (patch: Partial<GameSettings>) => {
    void act({ type: "updateSettings", settings: patch });
  };

  return (
    <div className="space-y-5 pt-4">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <p className="field-label mb-0">The liars</p>
            <span className="font-label text-[0.48rem] uppercase tracking-[0.12em] text-ash/35">
              max {max}
            </span>
          </div>
          <div
            className="mt-2 grid grid-cols-3 gap-1.5"
            role="group"
            aria-label="Number of imposters"
          >
            {Array.from({ length: max }, (_, index) => index + 1).map(
              (count) => (
                <button
                  key={count}
                  type="button"
                  aria-pressed={settings.imposterCount === count}
                  disabled={disabled}
                  onClick={() => update({ imposterCount: count })}
                  className={cn(
                    "flex min-h-11 items-center justify-center gap-2 border font-label text-[0.62rem] uppercase tracking-[0.14em] transition disabled:opacity-45",
                    settings.imposterCount === count
                      ? "border-blood/60 bg-blood/15 text-[#e2b4a9]"
                      : "border-bone/12 bg-black/20 text-ash/70 hover:border-bone/30 hover:text-bone",
                  )}
                >
                  {count === 1 ? "One" : count === 2 ? "Two" : "Three"}
                </button>
              ),
            )}
          </div>
          <p className="mt-2 text-xs leading-snug text-ash/45">
            One liar for every three guests, up to three liars.
          </p>
        </div>

        <div>
          <label htmlFor="settings-rounds" className="field-label">
            Rounds
          </label>
          <select
            id="settings-rounds"
            value={settings.rounds}
            disabled={disabled}
            onChange={(event) => update({ rounds: Number(event.target.value) })}
            className="field min-h-11 py-2 text-base"
          >
            {Array.from({ length: 8 }, (_, index) => index + 3).map((rounds) => (
              <option key={rounds} value={rounds}>
                {rounds} rounds
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs leading-snug text-ash/45">
            The side with the most round wins takes the wake. A tie favors the
            imposters.
          </p>
        </div>
      </div>

      <div className="hairline" />

      <div>
        <div className="flex items-baseline justify-between gap-3">
          <p className="field-label mb-0">The memory drawer</p>
          <span className="font-label text-[0.48rem] uppercase tracking-[0.12em] text-ash/35">
            Server-side only
          </span>
        </div>
        <div
          className="mt-2 grid gap-1.5 sm:grid-cols-2"
          role="group"
          aria-label="Memory pack"
        >
          {PACK_META.map((pack) => {
            const selected = settings.packId === pack.id;
            return (
              <button
                key={pack.id}
                type="button"
                aria-pressed={selected}
                disabled={disabled}
                onClick={() => update({ packId: pack.id as PackChoiceId })}
                className={cn(
                  "border p-3 text-left transition disabled:opacity-45",
                  selected
                    ? "border-ember/55 bg-ember/[0.08]"
                    : "border-bone/10 bg-black/20 hover:border-bone/25",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "font-display text-lg leading-none",
                      selected ? "text-ember" : "text-bone",
                    )}
                  >
                    {pack.name}
                  </span>
                  {selected ? (
                    <span className="size-1.5 rounded-full bg-ember" />
                  ) : null}
                </div>
                <p className="mt-1 font-label text-[0.46rem] uppercase tracking-[0.14em] text-ash/45">
                  {pack.category ?? "Any category"}
                </p>
                <p className="mt-1.5 text-xs leading-snug text-ash/55">
                  {pack.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <details className="group border border-bone/10 bg-black/15">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 font-label text-[0.54rem] uppercase tracking-[0.14em] text-ash/70 transition hover:text-bone [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-2">
            <MoonStar className="size-3.5 text-ember/70" />
            Pace &amp; final guess
          </span>
          <span className="text-ash/40">
            {settings.clueSeconds}s clues · {settings.discussionSeconds}s talk
          </span>
        </summary>
        <div className="space-y-4 border-t border-bone/10 p-3">
          <div className="grid grid-cols-2 gap-3">
            <TimeSelect
              id="settings-clue"
              label="Clue timer"
              value={settings.clueSeconds}
              options={CLUE_TIME_OPTIONS}
              disabled={disabled}
              onChange={(value) => update({ clueSeconds: value })}
            />
            <TimeSelect
              id="settings-discussion"
              label="Discussion timer"
              value={settings.discussionSeconds}
              options={DISCUSSION_TIME_OPTIONS}
              disabled={disabled}
              onChange={(value) => update({ discussionSeconds: value })}
            />
            <TimeSelect
              id="settings-vote"
              label="Vote timer"
              value={settings.voteSeconds}
              options={VOTE_TIME_OPTIONS}
              disabled={disabled}
              onChange={(value) => update({ voteSeconds: value })}
            />
            <TimeSelect
              id="settings-guess"
              label="Final guess timer"
              value={settings.guessSeconds}
              options={GUESS_TIME_OPTIONS}
              disabled={disabled}
              onChange={(value) => update({ guessSeconds: value })}
            />
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={settings.finalGuess}
            disabled={disabled}
            onClick={() => update({ finalGuess: !settings.finalGuess })}
            className="flex w-full items-center justify-between gap-4 border border-bone/10 bg-black/20 px-3 py-3 text-left transition hover:border-bone/25 disabled:opacity-45"
          >
            <span>
              <span className="block font-display text-lg leading-tight text-bone">
                A final guess
              </span>
              <span className="mt-0.5 block text-xs leading-snug text-ash/50">
                A caught imposter may name the memory from four choices. A
                correct guess still wins them the round.
              </span>
            </span>
            <span
              className={cn(
                "relative h-5 w-9 shrink-0 rounded-full border transition",
                settings.finalGuess
                  ? "border-ember/60 bg-ember/25"
                  : "border-bone/20 bg-black/40",
              )}
              aria-hidden="true"
            >
              <span
                className={cn(
                  "absolute top-0.5 size-3.5 rounded-full transition-all",
                  settings.finalGuess
                    ? "left-[1.1rem] bg-ember"
                    : "left-0.5 bg-ash/60",
                )}
              />
            </span>
          </button>
        </div>
      </details>
    </div>
  );
}

function TimeSelect({
  id,
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  options: readonly number[];
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="field min-h-10 py-1.5 text-base"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option} seconds
          </option>
        ))}
        {!options.includes(value) ? (
          <option value={value}>{value} seconds</option>
        ) : null}
      </select>
    </div>
  );
}

function RulesSummary() {
  const { view } = useRoom();
  const settings = view.settings;
  const pack =
    PACK_META.find((entry) => entry.id === settings.packId) ??
    PACK_META[PACK_META.length - 1];

  const rows = [
    { label: "Liars", value: String(settings.imposterCount) },
    { label: "Rounds", value: String(settings.rounds) },
    { label: "Memory drawer", value: pack.name },
    { label: "Clue timer", value: `${settings.clueSeconds}s` },
    { label: "Discussion", value: `${settings.discussionSeconds}s` },
    { label: "Vote timer", value: `${settings.voteSeconds}s` },
    {
      label: "Final guess",
      value: settings.finalGuess ? "Allowed" : "No final guess",
    },
  ];

  return (
    <div className="pt-4">
      <div className="grid grid-cols-2 gap-px border border-bone/10 bg-bone/10 sm:grid-cols-4">
        {rows.map((row) => (
          <div key={row.label} className="bg-[#0d0b09] px-3 py-3">
            <p className="font-label text-[0.46rem] uppercase tracking-[0.14em] text-ash/40">
              {row.label}
            </p>
            <p className="mt-1 font-display text-lg leading-none text-bone">
              {row.value}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 flex items-center gap-2 text-sm leading-snug text-ash/55">
        <Lock className="size-3.5 shrink-0 text-ash/40" />
        Only the host can change these rules. They lock when the first memory is
        drawn.
      </p>
    </div>
  );
}

function StartPanel({
  seatsNeeded,
  hostName,
}: {
  seatsNeeded: number;
  hostName: string;
}) {
  const { view, act, isPending } = useRoom();
  const canStart = view.players.length >= MIN_PLAYERS && isBeforeStart(view.phase);

  return (
    <div className="flex flex-col gap-4 border-t border-bone/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-display text-2xl leading-tight text-bone">
          {canStart
            ? "The candles are lit."
            : `${seatsNeeded} more ${seatsNeeded === 1 ? "soul" : "souls"} must arrive.`}
        </p>
        <p className="mt-1 max-w-md text-sm leading-snug text-ash/60">
          {canStart
            ? "The rules will seal themselves when the wake begins. At least three guests are at the table."
            : `At least ${MIN_PLAYERS} guests are needed. Share the code and wait for the door to open again.`}
        </p>
      </div>

      {view.you.isHost ? (
        <Button
          size="lg"
          className="w-full sm:w-auto"
          disabled={!canStart || isPending}
          onClick={() => void act({ type: "startGame" })}
        >
          <Flame className="size-4" />
          Begin the wake
        </Button>
      ) : (
        <div className="flex items-center gap-3 border border-bone/10 bg-black/20 px-4 py-3">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-ember/40" />
            <span className="relative inline-flex size-2 rounded-full bg-ember" />
          </span>
          <p className="font-label text-[0.54rem] uppercase tracking-[0.14em] text-ash/65">
            Waiting for {hostName}
          </p>
        </div>
      )}
    </div>
  );
}
