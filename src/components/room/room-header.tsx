"use client";

import Link from "next/link";
import { useState } from "react";
import { Copy, LogOut, Share2 } from "lucide-react";
import type { ConnectionState } from "@/lib/game/types";
import { copyToClipboard } from "@/lib/utils";
import { useToast } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ConnectionBadge } from "./connection-badge";
import { useRoom } from "./room-context";

export function RoomHeader({ connection }: { connection: ConnectionState }) {
  const { view, openInvite, leaveRoom } = useRoom();
  const { toast } = useToast();
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const canLeave = view.phase === "lobby" || view.phase === "final";

  const copyCode = async () => {
    const copied = await copyToClipboard(view.code);
    toast(
      copied ? "Wake code copied." : "The clipboard would not open.",
      copied ? "success" : "error",
    );
  };

  const confirmLeave = async () => {
    setLeaving(true);
    await leaveRoom();
    setLeaving(false);
    setLeaveOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-bone/10 bg-void/90 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="Return to the foyer"
          className="group flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 sm:justify-start"
        >
          <span className="relative grid size-8 place-items-center rounded-full border border-bone/20">
            <span className="size-1.5 rounded-full bg-blood shadow-[0_0_10px_rgba(127,33,29,0.9)] transition group-hover:bg-ember" />
            <span className="absolute inset-1 rounded-full border border-bone/10" />
          </span>
          <span className="hidden font-label text-[0.62rem] uppercase tracking-[0.26em] text-bone sm:inline">
            Imposer
          </span>
        </Link>

        <span className="mx-0.5 h-6 w-px bg-bone/10" aria-hidden="true" />

        <button
          type="button"
          onClick={() => void copyCode()}
          title="Copy wake code"
          className="inline-flex min-h-11 items-center gap-2 border border-bone/12 bg-black/25 px-2.5 py-1.5 font-label text-[0.7rem] uppercase tracking-[0.24em] text-bone transition hover:border-ember/40 hover:text-ember"
        >
          {view.code}
          <Copy className="size-3 text-ash/45" aria-hidden="true" />
        </button>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <ConnectionBadge state={connection} />
          <Button
            variant="ghost"
            size="sm"
            onClick={openInvite}
            aria-label="Invite guests"
          >
            <Share2 className="size-3.5" />
            <span className="hidden sm:inline">Invite</span>
          </Button>
          <Button
            variant="quiet"
            size="sm"
            onClick={() => setLeaveOpen(true)}
            disabled={!canLeave}
            title={
              canLeave
                ? "Leave the wake"
                : "You cannot leave a round in progress."
            }
            aria-label="Leave the wake"
          >
            <LogOut className="size-3.5" />
            <span className="hidden sm:inline">Leave</span>
          </Button>
        </div>
      </div>

      <Dialog
        open={leaveOpen}
        onClose={() => {
          if (!leaving) {
            setLeaveOpen(false);
          }
        }}
        eyebrow="The door"
        title="Leave the table?"
        description="Your seat will be given up and this device will forget the wake."
      >
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="ghost"
            onClick={() => setLeaveOpen(false)}
            disabled={leaving}
          >
            Stay
          </Button>
          <Button
            variant="solid"
            onClick={() => void confirmLeave()}
            disabled={leaving}
          >
            {leaving ? "Closing the door…" : "Leave the wake"}
          </Button>
        </div>
      </Dialog>
    </header>
  );
}
