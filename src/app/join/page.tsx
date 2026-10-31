import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { JoinScreen, JoinScreenFallback } from "@/components/join-screen";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Join a wake",
  description:
    "Enter a six-character wake code and take your place at the table.",
};

export default function JoinPage() {
  return (
    <main className="min-h-svh">
      <SiteHeader />
      <Link
        href="/"
        className="mx-auto flex min-h-11 w-full max-w-6xl items-center gap-2 px-5 pt-6 font-label text-[0.58rem] uppercase tracking-[0.18em] text-ash/70 transition hover:text-bone sm:px-8 sm:pt-8"
      >
        <ArrowLeft className="size-3.5" />
        Back to the foyer
      </Link>
      <Suspense fallback={<JoinScreenFallback />}>
        <JoinScreen />
      </Suspense>
    </main>
  );
}
