import type { ReactNode } from "react";

interface PhaseHeadingProps {
  eyebrow: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
}

export function PhaseHeading({
  eyebrow,
  title,
  description,
  aside,
}: PhaseHeadingProps) {
  return (
    <header className="border-b border-bone/10 pb-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-3 font-display text-[clamp(2.15rem,5.6vw,3.35rem)] leading-[0.9] text-bone">
            {title}
          </h1>
        </div>
        {aside ? <div className="shrink-0 pt-1">{aside}</div> : null}
      </div>
      {description ? (
        <p className="mt-3 max-w-2xl text-[1.05rem] leading-snug text-ash/80">
          {description}
        </p>
      ) : null}
    </header>
  );
}
