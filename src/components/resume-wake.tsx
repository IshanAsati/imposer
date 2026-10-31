"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import {
  clearSession,
  notifySessionChanged,
  readSession,
  type RoomSession,
} from "@/lib/client/session";

export function ResumeWake() {
  const [session, setSession] = useState<RoomSession | null | undefined>(
    undefined,
  );

  useEffect(() => {
    const load = () => setSession(readSession());
    load();
    window.addEventListener("imposter:session", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("imposter:session", load);
      window.removeEventListener("storage", load);
    };
  }, []);

  if (!session) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-4 border border-ember/25 bg-ember/[0.055] px-4 py-3">
      <div className="min-w-0">
        <p className="font-label text-[0.54rem] uppercase tracking-[0.18em] text-ember/80">
          A place is still set for you
        </p>
        <p className="mt-0.5 truncate font-display text-lg text-bone">
          Wake {session.code} · {session.name}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Link
          href={`/room/${session.code}`}
          className="inline-flex min-h-11 items-center gap-1.5 px-2 font-label text-[0.56rem] uppercase tracking-[0.16em] text-bone underline decoration-ember/40 underline-offset-4 hover:text-ember"
        >
          Return
          <ArrowRight className="size-3" />
        </Link>
        <button
          type="button"
          aria-label="Forget saved wake"
          className="-mr-1 grid size-11 place-items-center text-ash/50 hover:text-bone"
          onClick={() => {
            clearSession();
            notifySessionChanged();
            setSession(null);
          }}
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
