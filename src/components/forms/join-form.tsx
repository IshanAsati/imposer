"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, LoaderCircle, Undo2 } from "lucide-react";
import type { AvatarId, JoinResult } from "@/lib/game/types";
import { joinRoom } from "@/lib/client/api";
import {
  notifySessionChanged,
  saveSession,
  type RoomSession,
} from "@/lib/client/session";
import { useStoredSession } from "@/lib/client/use-stored-session";
import { cn } from "@/lib/utils";
import { Button, buttonClasses } from "@/components/ui/button";
import {
  NameAvatarFields,
  SeatPreview,
} from "./name-avatar-fields";

interface JoinFormProps {
  fixedCode?: string;
  initialCode?: string;
  onJoined?: (session: RoomSession) => void;
  className?: string;
  showResume?: boolean;
}

function normalizeCode(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z2-9]/g, "")
    .slice(0, 6);
}

export function JoinForm({
  fixedCode,
  initialCode = "",
  onJoined,
  className,
  showResume = true,
}: JoinFormProps) {
  const router = useRouter();
  const [code, setCode] = useState(normalizeCode(fixedCode ?? initialCode));
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<AvatarId>("moth");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stored = useStoredSession(showResume ? code || undefined : undefined);
  const [dismissedCode, setDismissedCode] = useState<string | null>(null);
  const saved =
    showResume &&
    stored &&
    stored.code === code &&
    dismissedCode !== code
      ? stored
      : null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (code.length !== 6) {
      setError("A wake code is six letters or numbers.");
      return;
    }
    if (name.trim().length < 2) {
      setError("Give the table a name of at least two characters.");
      return;
    }

    setPending(true);
    try {
      const result: JoinResult = await joinRoom(code, name.trim(), avatar);
      const session: RoomSession = {
        code: result.code,
        playerId: result.playerId,
        token: result.token,
        name: name.trim(),
        avatar,
        savedAt: Date.now(),
      };
      saveSession(session);
      notifySessionChanged();
      if (onJoined) {
        onJoined(session);
      } else {
        router.push(`/room/${result.code}`);
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The door would not open. Try again.",
      );
      setPending(false);
    }
  };

  const resume = () => {
    if (saved) {
      router.push(`/room/${saved.code}`);
    }
  };

  return (
    <form onSubmit={submit} className={cn("space-y-6", className)} noValidate>
      {saved && saved.code === code ? (
        <div className="border border-ember/30 bg-ember/[0.06] p-4">
          <p className="font-label text-[0.58rem] uppercase tracking-[0.18em] text-ember">
            You already have a place here
          </p>
          <p className="mt-1 font-display text-xl text-bone">
            Return as {saved.name}?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={resume}>
              <Undo2 className="size-3.5" />
              Return to wake
            </Button>
            <button
              type="button"
              onClick={() => setDismissedCode(code)}
              className={buttonClasses({ variant: "quiet", size: "sm" })}
            >
              Join as someone else
            </button>
          </div>
        </div>
      ) : null}

      {!fixedCode ? (
        <div>
          <label htmlFor="wake-code" className="field-label">
            Wake code
          </label>
          <input
            id="wake-code"
            name="code"
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            value={code}
            onChange={(event) => setCode(normalizeCode(event.target.value))}
            placeholder="——————"
            maxLength={6}
            disabled={pending}
            className="field text-center font-label text-2xl tracking-[0.48em] uppercase placeholder:tracking-[0.34em] placeholder:text-ash/35"
            aria-describedby="wake-code-hint"
          />
          <p
            id="wake-code-hint"
            className="mt-2 font-label text-[0.58rem] uppercase tracking-[0.13em] text-ash/60"
          >
            Six characters. Ask the host if you cannot read it.
          </p>
        </div>
      ) : null}

      <NameAvatarFields
        name={name}
        avatar={avatar}
        onNameChange={setName}
        onAvatarChange={setAvatar}
        disabled={pending}
        autoFocus={Boolean(fixedCode)}
        idPrefix="join"
      />

      <SeatPreview name={name} avatar={avatar} />

      {error ? (
        <p
          role="alert"
          className="border-l-2 border-blood bg-blood/10 px-3 py-2 text-sm text-[#e5b9ad]"
        >
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={pending || code.length !== 6}
      >
        {pending ? (
          <>
            <LoaderCircle className="size-4 animate-spin" />
            Knocking…
          </>
        ) : (
          <>
            Enter the wake
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>

      <p className="text-center font-label text-[0.55rem] uppercase tracking-[0.16em] text-ash/50">
        By entering, you agree to remember what you are told.
      </p>

      <div className="text-center">
        <Link
          href="/create"
          className="text-sm text-ash/80 underline decoration-bone/20 underline-offset-4 transition hover:text-bone"
        >
          Or open a wake of your own
        </Link>
      </div>
    </form>
  );
}
