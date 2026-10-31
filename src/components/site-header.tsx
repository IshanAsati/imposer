import Link from "next/link";
import { Menu } from "lucide-react";
import { buttonClasses } from "./ui/button";

export function SiteHeader() {
  return (
    <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
      <Link
        href="/"
        className="group flex items-center gap-3"
        aria-label="IMPOSER home"
      >
        <span className="relative grid size-9 place-items-center rounded-full border border-bone/20">
          <span className="size-2 rounded-full bg-blood shadow-[0_0_12px_rgba(127,33,29,0.8)] transition group-hover:bg-ember" />
          <span className="absolute inset-1 rounded-full border border-bone/10" />
        </span>
        <span className="font-label text-[0.72rem] uppercase tracking-[0.3em] text-bone">
          Imposer
        </span>
      </Link>

      <nav className="flex items-center gap-2 sm:gap-4" aria-label="Primary">
        <Link
          href="/rules"
          className="hidden px-3 py-2 font-label text-[0.6rem] uppercase tracking-[0.2em] text-ash transition hover:text-bone sm:block"
        >
          The rules
        </Link>
        <Link
          href="/join"
          className={buttonClasses({ variant: "ghost", size: "sm" })}
        >
          Join a wake
        </Link>
        <Link
          href="/create"
          className={buttonClasses({
            variant: "primary",
            size: "sm",
            className: "hidden sm:inline-flex",
          })}
        >
          Open a wake
        </Link>
        <Link
          href="/create"
          aria-label="Open a wake"
          className="inline-flex size-9 items-center justify-center border border-bone/20 text-bone sm:hidden"
        >
          <Menu className="size-4" />
        </Link>
      </nav>
    </header>
  );
}
