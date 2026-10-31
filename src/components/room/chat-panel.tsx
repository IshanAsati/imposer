"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { ChevronDown, MessageCircle, Send } from "lucide-react";
import { cn, formatClock } from "@/lib/utils";
import { Avatar } from "@/components/game/avatar";
import { Button } from "@/components/ui/button";
import { useRoom } from "./room-context";

interface ChatPanelProps {
  className?: string;
}

export function ChatPanel({ className }: ChatPanelProps) {
  const { view, sendChat, isChatPending } = useRoom();
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  const messages = view.chat;
  const lastId = messages[messages.length - 1]?.id ?? "";
  const players = new Map(view.players.map((player) => [player.id, player]));

  useEffect(() => {
    const node = listRef.current;
    if (!node || !pinned) {
      return;
    }
    node.scrollTop = node.scrollHeight;
  }, [lastId, pinned]);

  const scrollToBottom = () => {
    const node = listRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
    setPinned(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || isChatPending) {
      return;
    }
    const sent = await sendChat(trimmed);
    if (sent) {
      setBody("");
      setPinned(true);
    }
  };

  return (
    <section
      className={cn(
        "paper-dark flex min-h-0 flex-col overflow-hidden",
        className,
      )}
      aria-label="Table whispers"
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-bone/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="size-3.5 text-ember/75" aria-hidden="true" />
          <p className="font-label text-[0.56rem] uppercase tracking-[0.18em] text-ash/70">
            The wires
          </p>
        </div>
        <span className="font-label text-[0.5rem] uppercase tracking-[0.14em] text-ash/40">
          {messages.length === 1 ? "1 whisper" : `${messages.length} whispers`}
        </span>
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={listRef}
          onScroll={(event) => {
            const node = event.currentTarget;
            const distance =
              node.scrollHeight - node.scrollTop - node.clientHeight;
            setPinned(distance < 64);
          }}
          aria-live="polite"
          aria-relevant="additions"
          className="scroll-thin h-full space-y-3.5 overflow-y-auto px-4 py-4"
        >
          {messages.length === 0 ? (
            <div className="flex h-full min-h-40 flex-col items-center justify-center text-center">
              <MessageCircle
                className="size-6 text-ash/25"
                aria-hidden="true"
              />
              <p className="mt-3 font-display text-xl text-bone/80">
                The wires are quiet.
              </p>
              <p className="mt-1 max-w-56 text-sm leading-snug text-ash/55">
                Say what you noticed. Ask for specifics. The imposter is
                listening too.
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const player = message.playerId
                ? players.get(message.playerId)
                : null;
              const isYou = message.playerId === view.you.playerId;
              return (
                <div key={message.id} className="flex items-start gap-2.5">
                  <Avatar
                    id={player?.avatar ?? "eye"}
                    size="xs"
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <p
                        className={cn(
                          "truncate font-label text-[0.52rem] uppercase tracking-[0.12em]",
                          isYou ? "text-ember/85" : "text-ash/75",
                        )}
                      >
                        {message.name}
                        {isYou ? " · you" : ""}
                      </p>
                      <time
                        dateTime={new Date(message.createdAt).toISOString()}
                        className="shrink-0 font-label text-[0.46rem] tracking-[0.08em] text-ash/30"
                      >
                        {formatClock(message.createdAt)}
                      </time>
                    </div>
                    <p className="mt-0.5 break-words text-[0.98rem] leading-snug text-bone/90">
                      {message.body}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {!pinned ? (
          <button
            type="button"
            onClick={scrollToBottom}
            className="absolute bottom-2 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 border border-ember/35 bg-[#17130f] px-2.5 py-1 font-label text-[0.48rem] uppercase tracking-[0.14em] text-ember shadow-lg"
          >
            <ChevronDown className="size-3" />
            New whispers
          </button>
        ) : null}
      </div>

      <form
        onSubmit={(event) => void submit(event)}
        className="shrink-0 border-t border-bone/10 p-3"
      >
        <div className="flex items-center gap-2">
          <label htmlFor="chat-body" className="sr-only-label">
            Whisper to the table
          </label>
          <input
            id="chat-body"
            name="body"
            type="text"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Whisper to the table…"
            maxLength={240}
            autoComplete="off"
            disabled={isChatPending}
            className="field min-h-11 py-2 text-base"
          />
          <Button
            type="submit"
            size="sm"
            className="min-h-11 shrink-0 px-3"
            disabled={!body.trim() || isChatPending}
            aria-label="Send whisper"
          >
            <Send className="size-3.5" />
          </Button>
        </div>
        <div className="mt-1 flex items-center justify-between gap-3 px-0.5">
          <span className="font-label text-[0.44rem] uppercase tracking-[0.12em] text-ash/30">
            Enter to send
          </span>
          <span
            className={cn(
              "font-label text-[0.44rem] tracking-[0.1em]",
              body.length > 220 ? "text-[#c46a5f]" : "text-ash/30",
            )}
          >
            {body.length}/240
          </span>
        </div>
      </form>
    </section>
  );
}
