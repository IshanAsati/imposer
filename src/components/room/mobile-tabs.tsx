"use client";

import { Flame, MessageCircle, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRoom } from "./room-context";

export type MobilePanel = "table" | "guests" | "chat";

interface MobileTabsProps {
  active: MobilePanel;
  onChange: (panel: MobilePanel) => void;
  unread: number;
}

export function MobileTabs({ active, onChange, unread }: MobileTabsProps) {
  const { view } = useRoom();
  const tabs = [
    { id: "table" as const, label: "Table", icon: Flame },
    {
      id: "guests" as const,
      label: `Guests ${view.players.length}`,
      icon: UsersRound,
    },
    { id: "chat" as const, label: "Wires", icon: MessageCircle },
  ];

  return (
    <nav
      aria-label="Room panels"
      className="sticky top-[var(--room-header-offset)] z-30 border-b border-bone/10 bg-void/95 backdrop-blur lg:hidden"
    >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-3 px-1.5 sm:px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const selected = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-current={selected ? "page" : undefined}
              className={cn(
                "relative flex min-h-12 items-center justify-center gap-1.5 border-b-2 px-1.5 font-label text-[0.56rem] uppercase tracking-[0.12em] transition sm:gap-2 sm:px-2 sm:tracking-[0.14em]",
                selected
                  ? "border-ember text-bone"
                  : "border-transparent text-ash/70 hover:text-bone",
              )}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              {tab.label}
              {tab.id === "chat" && unread > 0 ? (
                <span className="absolute right-3 top-1.5 grid min-w-4 place-items-center rounded-full bg-blood px-1 py-0.5 font-label text-[0.5rem] leading-none text-bone">
                  {unread > 9 ? "9+" : unread}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
