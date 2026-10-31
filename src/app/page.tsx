import Link from "next/link";
import {
  ArrowRight,
  Eye,
  Flame,
  Footprints,
  KeyRound,
  MoonStar,
  Skull,
  UsersRound,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { ResumeWake } from "@/components/resume-wake";
import { buttonClasses } from "@/components/ui/button";

const STEPS = [
  {
    numeral: "I",
    title: "A memory is chosen",
    body: "Everyone at the wake is given the same memory — a word, a place, a thing half-remembered. One guest is given only its category.",
    icon: Eye,
  },
  {
    numeral: "II",
    title: "One word each",
    body: "Going around the table, every guest offers a single clue. Specific enough to prove you remember. Vague enough to hide what you know.",
    icon: Footprints,
  },
  {
    numeral: "III",
    title: "Suspicion takes the floor",
    body: "Discuss. Interrogate. The imposter must invent a memory they do not have, without being obvious about it.",
    icon: KeyRound,
  },
  {
    numeral: "IV",
    title: "The table votes",
    body: "Cast your accusation. If an imposter is caught, they get one chance to name the memory. If they can, they still walk away.",
    icon: Skull,
  },
];

const SCORING = [
  {
    label: "The imposters escape",
    detail: "No one is caught, or the table turns on its own.",
    points: "+3 each",
    tone: "blood",
  },
  {
    label: "The imposters are caught",
    detail: "They cannot name the memory they never had.",
    points: "+3 crew",
    tone: "moss",
  },
  {
    label: "Caught, but they remember",
    detail: "An imposter names the memory correctly.",
    points: "+2 them / +1 crew",
    tone: "ember",
  },
];

export default function HomePage() {
  return (
    <main className="overflow-hidden">
      <SiteHeader />

      <section className="relative mx-auto grid min-h-[calc(100svh-5.5rem)] w-full max-w-6xl items-center gap-16 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:py-16">
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-70"
          aria-hidden="true"
        >
          <div className="absolute -left-40 top-10 size-[34rem] rounded-full border border-bone/[0.045]" />
          <div className="absolute -left-24 top-24 size-[24rem] rounded-full border border-blood/10" />
          <svg
            className="absolute inset-x-0 top-0 h-full w-full"
            viewBox="0 0 1200 800"
            preserveAspectRatio="none"
          >
            <path
              d="M-40 180 C 250 120, 410 260, 620 210 S 970 90, 1240 180"
              fill="none"
              stroke="#6e201b"
              strokeWidth="1"
              opacity="0.35"
            />
            <path
              d="M-30 640 C 280 560, 470 700, 720 630 S 1010 540, 1240 600"
              fill="none"
              stroke="#6e201b"
              strokeWidth="1"
              opacity="0.18"
            />
            <circle cx="621" cy="210" r="2.5" fill="#a1352c" opacity="0.6" />
            <circle cx="928" cy="159" r="2" fill="#a1352c" opacity="0.45" />
          </svg>
        </div>

        <div className="relative">
          <p className="eyebrow fade-up">A game of borrowed memories</p>

          <div className="relative mt-7">
            <h1 className="text-shadow-glow fade-up fade-up-delay-1 font-display text-[clamp(4.3rem,14.5vw,10rem)] leading-[0.72] tracking-[0.01em] text-bone">
              <span className="block">IM</span>
              <span className="block text-[#d6c6a6]">POSER</span>
            </h1>
            <div className="absolute -right-3 top-[38%] hidden rotate-[-6deg] border border-blood/60 px-2 py-1 font-label text-[0.5rem] uppercase tracking-[0.24em] text-[#b54a40] sm:block">
              No memory
            </div>
          </div>

          <p className="fade-up fade-up-delay-2 mt-8 max-w-xl font-display text-[clamp(1.55rem,3.5vw,2.35rem)] leading-[1.12] text-bone/85">
            Everyone at the wake remembers the same thing.
            <span className="block text-ash">Everyone except one.</span>
          </p>

          <p className="fade-up fade-up-delay-2 mt-5 max-w-lg text-lg leading-relaxed text-ash/85">
            A word-based social deduction game for 3–12 people. Give one clue.
            Hide what you know. Find the guest with an empty memory.
          </p>

          <div className="fade-up fade-up-delay-3 mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/create"
              className={buttonClasses({ size: "lg", className: "sm:min-w-44" })}
            >
              <Flame className="size-4" />
              Open a wake
            </Link>
            <Link
              href="/join"
              className={buttonClasses({
                variant: "ghost",
                size: "lg",
                className: "sm:min-w-40",
              })}
            >
              Join with a code
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="fade-up fade-up-delay-3 mt-8 max-w-lg">
            <ResumeWake />
          </div>

          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2 font-label text-[0.58rem] uppercase tracking-[0.18em] text-ash/55">
            <span className="inline-flex items-center gap-2">
              <UsersRound className="size-3.5" />
              3–12 players
            </span>
            <span className="inline-flex items-center gap-2">
              <MoonStar className="size-3.5" />
              15–25 minutes
            </span>
            <span className="inline-flex items-center gap-2">
              <KeyRound className="size-3.5" />
              No download
            </span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[27rem] lg:mx-0 lg:ml-auto">
          <div className="pointer-events-none absolute inset-0 -z-10 grid place-items-center">
            <div className="spin-slow relative size-[24rem] max-w-[92vw] rounded-full border border-bone/[0.06]">
              <span className="absolute left-1/2 top-0 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blood" />
              <span className="absolute bottom-6 right-4 size-1 rounded-full bg-ember/60" />
            </div>
            <div className="absolute size-[17rem] max-w-[72vw] rounded-full border border-blood/10" />
          </div>

          <div className="drift relative rotate-[1.8deg] bg-[#d7c8aa] p-1.5 shadow-[0_45px_110px_rgba(0,0,0,0.65)]">
            <div className="absolute left-1/2 top-0 z-10 h-6 w-28 -translate-x-1/2 -translate-y-1/2 -rotate-2 bg-[#d9cfbc]/55 backdrop-blur-sm" />
            <div className="paper min-h-[30rem] p-6 sm:p-8">
              <div className="flex items-start justify-between border-b border-[#3b2c1d]/20 pb-3">
                <div>
                  <p className="font-label text-[0.54rem] uppercase tracking-[0.2em] text-[#6d5b43]">
                    Private invitation
                  </p>
                  <p className="mt-1 font-label text-[0.5rem] uppercase tracking-[0.16em] text-[#7f211d]/75">
                    No. 000013
                  </p>
                </div>
                <span className="stamp">Admit one</span>
              </div>

              <div className="mt-7">
                <p className="font-label text-[0.55rem] uppercase tracking-[0.2em] text-[#6d5b43]">
                  For the guest who remembers
                </p>
                <h2 className="mt-2 font-display text-[2.65rem] leading-[0.9] text-[#19140e]">
                  You are invited to remember.
                </h2>
                <div className="thread my-5 opacity-70" />
                <p className="font-display text-[1.22rem] leading-snug text-[#33271b]/85">
                  A memory will be passed around the table. Hold it close. Give
                  nothing away.
                </p>
                <p className="mt-3 text-[1.02rem] italic leading-snug text-[#5a4936]">
                  One guest will receive only the category. They will smile. They
                  will lie. They will try to leave with the memory.
                </p>
              </div>

              <div className="mt-7 grid grid-cols-2 gap-3 border-y border-[#3b2c1d]/20 py-3 font-label text-[0.55rem] uppercase tracking-[0.15em] text-[#5a4936]">
                <span>Dress: dark</span>
                <span className="text-right">Bring: one word</span>
                <span>Doors: 7:00</span>
                <span className="text-right">Leave: changed</span>
              </div>

              <div className="mt-7 flex items-end justify-between">
                <div>
                  <p className="font-display text-xl italic text-[#33271b]">
                    The House
                  </p>
                  <p className="mt-1 font-label text-[0.48rem] uppercase tracking-[0.18em] text-[#7a6750]">
                    Keeper of the wake
                  </p>
                </div>
                <div className="wax-seal" aria-hidden="true">
                  I
                </div>
              </div>
            </div>
          </div>

          <p className="mt-7 text-center font-label text-[0.52rem] uppercase tracking-[0.22em] text-ash/45">
            The first lie is always a formality
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="hairline" />
      </div>

      <section className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
          <div>
            <p className="eyebrow">How the night unfolds</p>
            <h2 className="mt-5 max-w-sm font-display text-[clamp(2.7rem,6vw,4.4rem)] leading-[0.92] text-bone">
              Four turns, one empty memory.
            </h2>
            <p className="mt-6 max-w-sm text-lg leading-relaxed text-ash/80">
              No app to learn. No cards to deal. Everyone gets a phone, a name,
              and a secret they must protect.
            </p>
          </div>

          <div className="grid gap-px overflow-hidden border border-bone/10 bg-bone/10 sm:grid-cols-2">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <article
                  key={step.numeral}
                  className="group relative bg-[#0d0b09] p-6 transition-colors hover:bg-[#11100c] sm:p-7"
                >
                  <div className="flex items-start justify-between">
                    <span className="font-display text-4xl leading-none text-blood/70">
                      {step.numeral}
                    </span>
                    <Icon className="size-4 text-ash/45 transition group-hover:text-ember/70" />
                  </div>
                  <h3 className="mt-9 font-display text-2xl text-bone">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[1.02rem] leading-snug text-ash/75">
                    {step.body}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative border-y border-bone/[0.07] bg-black/20">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-2 lg:items-center lg:gap-20">
          <div>
            <p className="eyebrow">The house keeps score</p>
            <h2 className="mt-5 max-w-md font-display text-[clamp(2.6rem,5.5vw,4rem)] leading-[0.92] text-bone">
              The dead remember everything. The uninvited remember nothing.
            </h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ash/80">
              Each round, the imposters change. Each round, the table has one
              chance to catch a stranger in their own story.
            </p>
            <Link
              href="/rules"
              className={buttonClasses({
                variant: "ghost",
                size: "md",
                className: "mt-7",
              })}
            >
              Read the full rules
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {SCORING.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-5 border border-bone/10 bg-[#0d0b09]/80 px-5 py-4"
              >
                <div>
                  <p className="font-display text-xl text-bone">{row.label}</p>
                  <p className="mt-1 text-sm leading-snug text-ash/65">
                    {row.detail}
                  </p>
                </div>
                <span
                  className={`shrink-0 font-label text-[0.58rem] uppercase tracking-[0.14em] ${
                    row.tone === "blood"
                      ? "text-[#c1655b]"
                      : row.tone === "moss"
                        ? "text-[#9ca982]"
                        : "text-ember"
                  }`}
                >
                  {row.points}
                </span>
              </div>
            ))}
            <p className="pt-2 text-center font-label text-[0.52rem] uppercase tracking-[0.18em] text-ash/40">
              Five rounds by default. Most round wins takes the wake.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="relative overflow-hidden border border-bone/10 bg-[radial-gradient(ellipse_at_65%_20%,rgba(127,33,29,0.18),transparent_55%)] px-6 py-14 text-center sm:px-12 sm:py-20">
          <div
            className="pointer-events-none absolute inset-0 bg-halftone opacity-20"
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-2xl">
            <p className="eyebrow justify-center before:hidden">A place is set</p>
            <h2 className="mt-5 font-display text-[clamp(2.9rem,7vw,5.2rem)] leading-[0.9] text-bone">
              Bring a memory.
              <span className="block text-ash">Leave with someone else&apos;s.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-lg text-ash/80">
              Share a link, gather three friends, and let the house do the rest.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/create"
                className={buttonClasses({ size: "lg", className: "sm:min-w-44" })}
              >
                <Flame className="size-4" />
                Open a wake
              </Link>
              <Link
                href="/join"
                className={buttonClasses({
                  variant: "ghost",
                  size: "lg",
                  className: "sm:min-w-44",
                })}
              >
                I have a code
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-6xl flex-col gap-4 border-t border-bone/[0.07] px-5 py-8 font-label text-[0.54rem] uppercase tracking-[0.16em] text-ash/40 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <span>IMPOSER · A wake for liars</span>
        <span className="inline-flex items-center gap-2">
          <Flame className="size-3" />
          Keep the candles lit
        </span>
      </footer>
    </main>
  );
}
