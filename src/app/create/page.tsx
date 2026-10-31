import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Eye, Flame, MoonStar, UsersRound } from "lucide-react";
import { CreateWakeForm } from "@/components/forms/create-wake-form";
import { SiteHeader } from "@/components/site-header";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Open a wake",
  description:
    "Set a place at the table and invite 2–11 friends to a game of borrowed memories.",
};

export default function CreatePage() {
  return (
    <main className="min-h-svh">
      <SiteHeader />

      <div className="mx-auto w-full max-w-6xl px-5 pb-20 pt-8 sm:px-8 sm:pt-12">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 font-label text-[0.58rem] uppercase tracking-[0.18em] text-ash/70 transition hover:text-bone"
        >
          <ArrowLeft className="size-3.5" />
          Back to the foyer
        </Link>

        <div className="mt-10 grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <p className="eyebrow">The host&apos;s duty</p>
            <h1 className="mt-5 max-w-md font-display text-[clamp(3.4rem,8vw,6rem)] leading-[0.86] text-bone">
              Open a wake.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ash/80">
              You will keep the candles lit, choose the rules once your guests
              arrive, and begin the first round. The house handles the secrets.
            </p>

            <div className="mt-10 space-y-4">
              <div className="flex gap-4 border-t border-bone/10 pt-4">
                <UsersRound className="mt-0.5 size-4 shrink-0 text-ember/75" />
                <div>
                  <p className="font-display text-xl text-bone">
                    Gather 3–12 guests
                  </p>
                  <p className="mt-1 text-sm leading-snug text-ash/65">
                    Everyone joins from their own phone using the room code or
                    invite link.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 border-t border-bone/10 pt-4">
                <Eye className="mt-0.5 size-4 shrink-0 text-ember/75" />
                <div>
                  <p className="font-display text-xl text-bone">
                    Set the number of liars
                  </p>
                  <p className="mt-1 text-sm leading-snug text-ash/65">
                    One imposter for three to five guests, up to three for a full
                    table of nine or more.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 border-t border-bone/10 pt-4">
                <MoonStar className="mt-0.5 size-4 shrink-0 text-ember/75" />
                <div>
                  <p className="font-display text-xl text-bone">
                    Five rounds, give or take
                  </p>
                  <p className="mt-1 text-sm leading-snug text-ash/65">
                    Default is five rounds. You can change the rules in the lobby
                    before the first memory is drawn.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 border border-blood/25 bg-blood/[0.055] p-5">
              <p className="font-label text-[0.56rem] uppercase tracking-[0.18em] text-[#c46a5f]">
                The one rule that matters
              </p>
              <p className="mt-2 font-display text-xl leading-snug text-bone/90">
                Never say the memory aloud. A clue is one word. Not a sentence.
                Not a synonym. One word.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute -inset-5 -z-10 border border-bone/[0.045]" />
            <div className="paper-dark p-6 sm:p-8">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-label text-[0.56rem] uppercase tracking-[0.2em] text-ash/70">
                    Guest register
                  </p>
                  <h2 className="mt-2 font-display text-3xl text-bone">
                    First, your name.
                  </h2>
                </div>
                <div className="wax-seal scale-90" aria-hidden="true">
                  I
                </div>
              </div>
              <div className="hairline my-6" />
              <CreateWakeForm />
            </div>
            <p className="mt-5 text-center font-label text-[0.52rem] uppercase tracking-[0.18em] text-ash/40">
              No account. No email. No memory of your own.
            </p>
          </div>
        </div>
      </div>

      <footer className="mx-auto flex w-full max-w-6xl items-center justify-between border-t border-bone/[0.07] px-5 py-6 font-label text-[0.52rem] uppercase tracking-[0.16em] text-ash/40 sm:px-8">
        <span className="inline-flex items-center gap-2">
          <Flame className="size-3" />
          The house is listening
        </span>
        <Link
          href="/rules"
          className={buttonClasses({ variant: "quiet", size: "sm" })}
        >
          Read the rules
        </Link>
      </footer>
    </main>
  );
}
