import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "solid" | "ghost" | "quiet" | "paper";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

const base =
  "inline-flex items-center justify-center gap-2 border font-label uppercase tracking-[0.16em] transition-all duration-200 disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/70 focus-visible:ring-offset-2 focus-visible:ring-offset-void";

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-bone bg-bone text-void shadow-[0_10px_38px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 hover:border-ember hover:bg-ember",
  solid:
    "border-blood bg-blood text-bone shadow-[0_10px_38px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 hover:border-[#a8342b] hover:bg-[#a8342b]",
  ghost:
    "border-bone/20 bg-transparent text-bone hover:border-bone/45 hover:bg-bone/[0.05]",
  quiet:
    "border-transparent bg-transparent text-ash hover:border-bone/15 hover:text-bone",
  paper:
    "border-[#2a2118]/30 bg-[#d8cbb0] text-[#19140f] shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 hover:bg-[#e4d8bd]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3.5 py-2 text-[0.62rem]",
  md: "min-h-11 px-5 py-3 text-[0.68rem]",
  lg: "min-h-13 px-7 py-4 text-[0.72rem]",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: ButtonStyleOptions = {}): string {
  return cn(base, variants[variant], sizes[size], className);
}

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonStyleOptions {
  children: ReactNode;
}

export function Button({
  variant,
  size,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, className })}
      {...props}
    >
      {children}
    </button>
  );
}
