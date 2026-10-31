"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  ArrowLeft,
  DoorOpen,
  Flame,
  LoaderCircle,
  RotateCcw,
  Skull,
} from "lucide-react";
import type { RoomView } from "@/lib/game/types";
import { ApiError, fetchRoomState } from "@/lib/client/api";
import { roomQueryKey, applyRoomView } from "@/lib/client/room-query";
import { clearSession, notifySessionChanged } from "@/lib/client/session";
import { useHydrated, useStoredSession } from "@/lib/client/use-stored-session";
import { useRoomActions } from "@/lib/client/use-room-actions";
import { useRoomSocket } from "@/lib/client/use-room-socket";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/site-header";
import { Button, buttonClasses } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { JoinForm } from "@/components/forms/join-form";
import { ChatPanel } from "./chat-panel";
import { HostAwayBanner } from "./host-away-banner";
import { InviteCard } from "./invite-card";
import { MemoryPin } from "./memory-pin";
import { MobileTabs, type MobilePanel } from "./mobile-tabs";
import { PhasePanel } from "./phase-panel";
import { RoomHeader } from "./room-header";
import { RoomProvider, type RoomContextValue } from "./room-context";
import { Roster } from "./roster";

interface RoomScreenProps {
  code: string;
}

export function RoomScreen({ code }: RoomScreenProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const hydrated = useHydrated();
  const session = useStoredSession(code);
  const [sessionLost, setSessionLost] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [panel, setPanel] = useState<MobilePanel>("table");
  const [seenAt, setSeenAt] = useState(0);

  const handleSessionLost = useCallback(
    (message: string) => {
      clearSession();
      notifySessionChanged();
      setSessionLost(message);
      queryClient.removeQueries({ queryKey: roomQueryKey(code) });
    },
    [code, queryClient],
  );

  const token = session?.token ?? "";

  const connection = useRoomSocket({
    code,
    token,
    enabled: hydrated && Boolean(session) && !sessionLost,
    onView: (view) => applyRoomView(queryClient, code, view),
    onSessionLost: () =>
      handleSessionLost("This wake no longer remembers this device."),
  });

  const query = useQuery<RoomView, Error>({
    queryKey: roomQueryKey(code),
    queryFn: () => fetchRoomState(code, token),
    enabled: hydrated && Boolean(session) && !sessionLost,
    refetchInterval: (current) => {
      if (current.state.data?.phase === "final") {
        return false;
      }
      return connection === "live" ? 20_000 : 5_000;
    },
  });

  const authError =
    query.error instanceof ApiError && query.error.status === 401
      ? query.error.message
      : null;
  const roomGone =
    query.error instanceof ApiError && query.error.status === 404;

  // A dead session or an expired room is external state, not render state.
  // Clearing storage lets the session subscription swap the screen for us.
  useEffect(() => {
    if (authError || roomGone) {
      clearSession();
      notifySessionChanged();
    }
  }, [authError, roomGone]);

  const { act, pendingType, isPending, sendChat, isChatPending } =
    useRoomActions({
      code,
      token,
      onSessionLost: handleSessionLost,
    });

  const leaveRoom = useCallback(async () => {
    if (!session) {
      router.push("/");
      return;
    }
    const left = await act({ type: "leave" });
    if (!left) {
      return;
    }
    clearSession();
    notifySessionChanged();
    queryClient.removeQueries({ queryKey: roomQueryKey(code) });
    router.push("/");
  }, [act, code, queryClient, router, session]);

  const handleJoined = useCallback(() => {
    setSessionLost(null);
    setPanel("table");
    setSeenAt(0);
    queryClient.removeQueries({ queryKey: roomQueryKey(code) });
  }, [code, queryClient]);

  const view = query.data;
  const latestChatAt =
    view?.chat.reduce(
      (latest, message) => Math.max(latest, message.createdAt),
      0,
    ) ?? 0;
  const seenThrough =
    panel === "chat" ? Math.max(seenAt, latestChatAt) : seenAt;

  const unread = view
    ? view.chat.filter(
        (message) =>
          message.createdAt > seenThrough &&
          message.playerId !== view.you.playerId,
      ).length
    : 0;

  const openInvite = useCallback(() => setInviteOpen(true), []);
  const openChat = useCallback(() => setPanel("chat"), []);
  const changePanel = useCallback(
    (next: MobilePanel) => {
      setPanel(next);
      setSeenAt((current) =>
        latestChatAt > current ? latestChatAt : current,
      );
    },
    [latestChatAt],
  );

  if (!hydrated) {
    return <RoomLoading label="Lighting the candles…" />;
  }

  if (roomGone) {
    return <EndedScreen code={code} />;
  }

  if (authError) {
    return (
      <JoinGate code={code} message={authError} onJoined={handleJoined} />
    );
  }

  if (!session) {
    return (
      <JoinGate
        code={code}
        message={
          sessionLost ??
          "This device has no place at the table yet. Give the house a name."
        }
        onJoined={handleJoined}
      />
    );
  }

  if (!view) {
    if (query.error && !query.isPending) {
      return (
        <RoomError
          message={query.error.message}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      );
    }
    return <RoomLoading label="Finding your seat…" />;
  }

  const value: RoomContextValue = {
    view,
    act,
    pendingType,
    isPending,
    sendChat,
    isChatPending,
    openInvite,
    openChat,
    leaveRoom,
  };

  return (
    <RoomProvider value={value}>
      <div className="min-h-svh">
        <RoomHeader connection={connection} />
        <MobileTabs active={panel} onChange={changePanel} unread={unread} />

        <main className="mx-auto w-full max-w-7xl px-3 pb-16 pt-4 sm:px-5 lg:px-8">
          <HostAwayBanner />

          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start lg:gap-6 xl:grid-cols-[minmax(0,1fr)_23rem]">
            <div
              className={cn(
                "min-w-0 space-y-3",
                panel !== "table" && "hidden lg:block",
              )}
            >
              <MemoryPin />
              <section className="paper-dark p-4 sm:p-6">
                <PhasePanel />
              </section>
            </div>

            <aside className="mt-4 min-w-0 space-y-4 lg:sticky lg:top-20 lg:mt-0 lg:self-start">
              <div className={cn(panel !== "guests" && "hidden lg:block")}>
                <Roster
                  className={cn(
                    panel === "guests" && "h-[calc(100svh-11rem)]",
                    "lg:h-auto lg:max-h-[38vh]",
                  )}
                />
              </div>

              <div className={cn(panel !== "chat" && "hidden lg:block")}>
                <ChatPanel
                  className={cn(
                    panel === "chat" && "h-[calc(100svh-11rem)]",
                    "lg:h-[42vh] lg:max-h-[30rem]",
                  )}
                />
              </div>
            </aside>
          </div>
        </main>
      </div>

      <Dialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        eyebrow="The invitation"
        title="Call another to the table."
      >
        <InviteCard code={view.code} showQrInitially />
      </Dialog>
    </RoomProvider>
  );
}

function RoomLoading({ label }: { label: string }) {
  return (
    <main className="min-h-svh">
      <SiteHeader />
      <div className="mx-auto flex min-h-[60svh] w-full max-w-md flex-col items-center justify-center px-6 pb-20 text-center">
        <span className="relative grid size-16 place-items-center rounded-full border border-bone/15">
          <span className="absolute inset-0 animate-ping rounded-full border border-ember/20" />
          <LoaderCircle className="size-5 animate-spin text-ember" />
        </span>
        <p className="mt-6 font-display text-3xl leading-tight text-bone">
          {label}
        </p>
        <p className="mt-2 font-label text-[0.54rem] uppercase tracking-[0.2em] text-ash/45">
          The house is listening
        </p>
      </div>
    </main>
  );
}

function EndedScreen({ code }: { code: string }) {
  return (
    <main className="min-h-svh">
      <SiteHeader />
      <div className="mx-auto flex min-h-[60svh] w-full max-w-xl flex-col items-center justify-center px-6 pb-20 text-center">
        <span className="grid size-14 place-items-center rounded-full border border-blood/40 text-[#cf8577]">
          <Skull className="size-6" />
        </span>
        <p className="mt-5 font-label text-[0.56rem] uppercase tracking-[0.22em] text-ash/50">
          Wake {code}
        </p>
        <h1 className="mt-3 font-display text-[clamp(2.8rem,8vw,4.4rem)] leading-[0.9] text-bone">
          This wake has passed.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-[1.02rem] leading-snug text-ash/70">
          The candles burned out, or every guest closed the door behind them.
          Whatever was remembered here is gone now.
        </p>
        <div className="mt-8 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Link
            href="/create"
            className={buttonClasses({ size: "md", className: "w-full sm:w-auto" })}
          >
            <Flame className="size-3.5" />
            Open a new wake
          </Link>
          <Link
            href="/join"
            className={buttonClasses({
              variant: "ghost",
              size: "md",
              className: "w-full sm:w-auto",
            })}
          >
            <DoorOpen className="size-3.5" />
            Join with a code
          </Link>
        </div>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 font-label text-[0.52rem] uppercase tracking-[0.16em] text-ash/45 transition hover:text-bone"
        >
          <ArrowLeft className="size-3" />
          Back to the foyer
        </Link>
      </div>
    </main>
  );
}

function RoomError({
  message,
  onRetry,
  retrying,
}: {
  message: string;
  onRetry: () => void;
  retrying: boolean;
}) {
  return (
    <main className="min-h-svh">
      <SiteHeader />
      <div className="mx-auto flex min-h-[60svh] w-full max-w-xl flex-col items-center justify-center px-6 pb-20 text-center">
        <span className="grid size-14 place-items-center rounded-full border border-ember/35 text-ember">
          <Flame className="size-6" />
        </span>
        <p className="mt-5 font-label text-[0.56rem] uppercase tracking-[0.22em] text-ash/50">
          The house has gone quiet
        </p>
        <h1 className="mt-3 font-display text-[clamp(2.6rem,8vw,4.1rem)] leading-[0.9] text-bone">
          The wires are down.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-[1.02rem] leading-snug text-ash/70">
          {message}
        </p>
        <div className="mt-8 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button size="md" onClick={onRetry} disabled={retrying}>
            {retrying ? (
              <LoaderCircle className="size-3.5 animate-spin" />
            ) : (
              <RotateCcw className="size-3.5" />
            )}
            {retrying ? "Knocking again…" : "Try the door again"}
          </Button>
          <Link
            href="/"
            className={buttonClasses({
              variant: "ghost",
              size: "md",
              className: "w-full sm:w-auto",
            })}
          >
            Back to the foyer
          </Link>
        </div>
      </div>
    </main>
  );
}

function JoinGate({
  code,
  message,
  onJoined,
}: {
  code: string;
  message: string;
  onJoined: () => void;
}) {
  return (
    <main className="min-h-svh">
      <SiteHeader />
      <div className="mx-auto w-full max-w-6xl px-5 pb-20 pt-4 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-label text-[0.58rem] uppercase tracking-[0.18em] text-ash/70 transition hover:text-bone"
        >
          <ArrowLeft className="size-3.5" />
          Back to the foyer
        </Link>

        <div className="mt-10 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <p className="eyebrow">The guest register</p>
            <h1 className="mt-5 max-w-md font-display text-[clamp(3.2rem,8vw,5.4rem)] leading-[0.86] text-bone">
              Take your place.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ash/80">
              {message}
            </p>

            <div className="mt-9 border border-ember/25 bg-[radial-gradient(ellipse_at_15%_0%,rgba(208,161,93,0.12),transparent_65%)] p-5">
              <p className="font-label text-[0.54rem] uppercase tracking-[0.2em] text-ember/85">
                The wake code
              </p>
              <p className="mt-2 font-label text-4xl tracking-[0.34em] text-bone">
                {code}
              </p>
              <p className="mt-3 text-sm leading-snug text-ash/60">
                Six characters open the door. Once the first memory is drawn,
                late guests cannot take a seat.
              </p>
            </div>

            <p className="mt-8 max-w-md border-l-2 border-blood/50 pl-4 text-sm leading-relaxed text-ash/55">
              One guest will be given no memory at all. They will have to invent
              one, one word at a time.
            </p>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute -inset-5 -z-10 border border-bone/[0.045]" />
            <div className="paper-dark p-6 sm:p-8">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-label text-[0.56rem] uppercase tracking-[0.2em] text-ash/70">
                    Wake {code}
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
              <JoinForm
                fixedCode={code}
                showResume={false}
                onJoined={onJoined}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
