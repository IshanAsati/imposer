"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function Dialog({
  open,
  onClose,
  title,
  eyebrow,
  description,
  children,
  className,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open || typeof document === "undefined") {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      className={cn(
        "fade-up m-auto w-[calc(100%-2rem)] max-w-lg border border-bone/15 bg-[#100e0b] p-0 text-bone shadow-[0_40px_120px_rgba(0,0,0,0.75)] backdrop:bg-black/80 backdrop:backdrop-blur-sm",
        className,
      )}
    >
      <div className="max-h-[85svh] overflow-y-auto">
        <header className="flex items-start justify-between gap-4 border-b border-bone/10 px-5 py-4">
          <div>
            {eyebrow ? (
              <p className="font-label text-[0.54rem] uppercase tracking-[0.2em] text-ember/80">
                {eyebrow}
              </p>
            ) : null}
            <h2
              id={titleId}
              className="mt-1 font-display text-2xl leading-tight text-bone"
            >
              {title}
            </h2>
            {description ? (
              <p
                id={descriptionId}
                className="mt-1 text-sm leading-snug text-ash/75"
              >
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 shrink-0 place-items-center border border-bone/15 text-ash transition hover:border-bone/35 hover:text-bone"
          >
            <X className="size-4" />
          </button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </dialog>
  );
}
