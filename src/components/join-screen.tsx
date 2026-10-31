"use client";

import { useSearchParams } from "next/navigation";
import { JoinForm } from "@/components/forms/join-form";

export function JoinScreen() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get("code") ?? "";

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 pb-20 pt-8 sm:px-8 sm:pt-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-20">
      <div className="lg:sticky lg:top-10">
        <p className="eyebrow">You have been expected</p>
        <h1 className="mt-5 max-w-md font-display text-[clamp(3.5rem,8vw,6.2rem)] leading-[0.86] text-bone">
          A wake is waiting.
        </h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-ash/80">
          Someone has set a place for you. Enter the code they gave you and the
          name the table will remember.
        </p>

        <div className="mt-9 max-w-md border-l border-blood/40 pl-5">
          <p className="font-label text-[0.56rem] uppercase tracking-[0.18em] text-[#c46a5f]">
            A word of warning
          </p>
          <p className="mt-2 font-display text-xl italic leading-snug text-bone/75">
            If the code is wrong, the door will not open. If the code is right,
            do not ask who sent it.
          </p>
        </div>

        <div className="mt-10 hidden gap-8 font-label text-[0.55rem] uppercase tracking-[0.18em] text-ash/45 sm:flex">
          <span className="inline-flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-blood" />
            Six characters
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-blood" />
            One place
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-blood" />
            No turning back
          </span>
        </div>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute -inset-5 -z-10 border border-bone/[0.045]" />
        <div className="paper-dark p-6 sm:p-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-label text-[0.56rem] uppercase tracking-[0.2em] text-ash/70">
                Admission
              </p>
              <h2 className="mt-2 font-display text-3xl text-bone">
                Give the house your name.
              </h2>
            </div>
            <span className="stamp border-blood/50 text-[#c46a5f]">
              Unverified
            </span>
          </div>
          <div className="hairline my-6" />
          <JoinForm initialCode={initialCode} />
        </div>
      </div>
    </div>
  );
}

export function JoinScreenFallback() {
  return (
    <div className="mx-auto w-full max-w-6xl animate-pulse px-5 pb-20 pt-12 sm:px-8">
      <div className="h-4 w-40 bg-bone/10" />
      <div className="mt-6 h-24 max-w-lg bg-bone/[0.06]" />
      <div className="mt-10 grid gap-12 lg:grid-cols-2">
        <div className="h-52 bg-bone/[0.03]" />
        <div className="h-96 border border-bone/10 bg-bone/[0.03]" />
      </div>
    </div>
  );
}
