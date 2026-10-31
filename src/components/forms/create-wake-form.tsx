"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import type { AvatarId } from "@/lib/game/types";
import { createRoom } from "@/lib/client/api";
import { notifySessionChanged, saveSession } from "@/lib/client/session";
import { Button } from "@/components/ui/button";
import {
  NameAvatarFields,
  SeatPreview,
} from "./name-avatar-fields";

export function CreateWakeForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<AvatarId>("crow");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (name.trim().length < 2) {
      setError("Give the table a name of at least two characters.");
      return;
    }

    setPending(true);
    try {
      const result = await createRoom(name.trim(), avatar);
      saveSession({
        code: result.code,
        playerId: result.playerId,
        token: result.token,
        name: name.trim(),
        avatar,
        savedAt: Date.now(),
      });
      notifySessionChanged();
      router.push(`/room/${result.code}`);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The candles would not light. Try again.",
      );
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <NameAvatarFields
        name={name}
        avatar={avatar}
        onNameChange={setName}
        onAvatarChange={setAvatar}
        disabled={pending}
        autoFocus
        idPrefix="create"
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

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? (
          <>
            <LoaderCircle className="size-4 animate-spin" />
            Lighting candles…
          </>
        ) : (
          <>
            Open the wake
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>

      <p className="text-center font-label text-[0.55rem] uppercase tracking-[0.16em] text-ash/50">
        You will choose the rules once the first guests arrive.
      </p>
    </form>
  );
}
