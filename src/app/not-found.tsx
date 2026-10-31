import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, DoorOpen, Flame, Skull } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Lost in the house",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <main className="min-h-svh">
      <SiteHeader />
      <div className="mx-auto flex min-h-[62svh] w-full max-w-xl flex-col items-center justify-center px-6 pb-20 text-center">
        <span className="grid size-16 place-items-center rounded-full border border-blood/40 text-[#cf8577]">
          <Skull className="size-7" />
        </span>
        <p className="mt-6 font-label text-[0.56rem] uppercase tracking-[0.24em] text-ash/50">
          No such door
        </p>
        <h1 className="mt-3 font-display text-[clamp(3rem,9vw,4.8rem)] leading-[0.88] text-bone">
          The house has no room by that name.
        </h1>
        <p className="mx-auto mt-5 max-w-md text-[1.02rem] leading-snug text-ash/70">
          Check the six characters again, or ask the host to read the code
          aloud. The wake may have ended, or it may never have been opened at
          all.
        </p>
        <div className="mt-8 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Link
            href="/join"
            className={buttonClasses({ size: "md", className: "w-full sm:w-auto" })}
          >
            <DoorOpen className="size-3.5" />
            Join with a code
          </Link>
          <Link
            href="/create"
            className={buttonClasses({
              variant: "ghost",
              size: "md",
              className: "w-full sm:w-auto",
            })}
          >
            <Flame className="size-3.5" />
            Open a wake
          </Link>
        </div>
        <Link
          href="/"
          className="mt-7 inline-flex items-center gap-2 font-label text-[0.52rem] uppercase tracking-[0.16em] text-ash/45 transition hover:text-bone"
        >
          <ArrowLeft className="size-3" />
          Back to the foyer
        </Link>
      </div>
    </main>
  );
}
