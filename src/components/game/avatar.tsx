import {
  Bell,
  Bird,
  Bug,
  CircleDot,
  Eye,
  Flame,
  KeyRound,
  Moon,
  Network,
  Rose,
  Skull,
  VenetianMask,
  type LucideIcon,
} from "lucide-react";
import type { AvatarId } from "@/lib/game/types";
import { cn } from "@/lib/utils";

const AVATAR_ICONS: Record<AvatarId, LucideIcon> = {
  moth: Bug,
  crow: Bird,
  key: KeyRound,
  eye: Eye,
  flame: Flame,
  skull: Skull,
  bell: Bell,
  mirror: CircleDot,
  spider: Network,
  rose: Rose,
  moon: Moon,
  mask: VenetianMask,
};

const SIZES = {
  xs: "size-7 [&_svg]:size-3.5",
  sm: "size-9 [&_svg]:size-4",
  md: "size-11 [&_svg]:size-5",
  lg: "size-14 [&_svg]:size-6",
  xl: "size-20 [&_svg]:size-9",
} as const;

interface AvatarProps {
  id: AvatarId;
  size?: keyof typeof SIZES;
  dimmed?: boolean;
  className?: string;
}

export function Avatar({
  id,
  size = "md",
  dimmed = false,
  className,
}: AvatarProps) {
  const Icon = AVATAR_ICONS[id] ?? Eye;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border border-bone/20 bg-[radial-gradient(circle_at_35%_30%,rgba(212,177,112,0.18),rgba(13,11,9,0.9))] text-bone/80 shadow-[inset_0_0_18px_rgba(0,0,0,0.5)]",
        dimmed && "opacity-40 grayscale",
        SIZES[size],
        className,
      )}
      aria-hidden="true"
    >
      <Icon strokeWidth={1.4} />
    </span>
  );
}
