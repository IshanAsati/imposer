import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LoaderCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { RoomScreen } from "@/components/room/room-screen";

const CODE_PATTERN = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;

export const metadata: Metadata = {
  title: "The wake",
  description: "A table of borrowed memories. One guest remembers nothing.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function RoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  return (
    <Suspense fallback={<RoomRouteFallback />}>
      <RoomRoute params={params} />
    </Suspense>
  );
}

async function RoomRoute({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const normalized = code.trim().toUpperCase();

  if (!CODE_PATTERN.test(normalized)) {
    notFound();
  }

  return <RoomScreen key={normalized} code={normalized} />;
}

function RoomRouteFallback() {
  return (
    <main className="min-h-svh">
      <SiteHeader />
      <div className="mx-auto flex min-h-[60svh] w-full max-w-md flex-col items-center justify-center px-6 pb-20 text-center">
        <span className="relative grid size-16 place-items-center rounded-full border border-bone/15">
          <span className="absolute inset-0 animate-ping rounded-full border border-ember/20" />
          <LoaderCircle className="size-5 animate-spin text-ember" />
        </span>
        <p className="mt-6 font-display text-3xl leading-tight text-bone">
          Lighting the candles…
        </p>
        <p className="mt-2 font-label text-[0.54rem] uppercase tracking-[0.2em] text-ash/45">
          The house is listening
        </p>
      </div>
    </main>
  );
}
