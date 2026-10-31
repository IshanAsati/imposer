"use client";

import { AVATARS, type AvatarId } from "@/lib/game/types";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/game/avatar";

const AVATAR_NAMES: Record<AvatarId, string> = {
  moth: "Moth",
  crow: "Crow",
  key: "Key",
  eye: "Eye",
  flame: "Flame",
  skull: "Skull",
  bell: "Bell",
  mirror: "Mirror",
  spider: "Spider",
  rose: "Rose",
  moon: "Moon",
  mask: "Mask",
};

interface NameAvatarFieldsProps {
  name: string;
  avatar: AvatarId;
  onNameChange: (name: string) => void;
  onAvatarChange: (avatar: AvatarId) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  nameLabel?: string;
  idPrefix?: string;
}

export function NameAvatarFields({
  name,
  avatar,
  onNameChange,
  onAvatarChange,
  disabled = false,
  autoFocus = false,
  nameLabel = "What shall we call you?",
  idPrefix = "wake",
}: NameAvatarFieldsProps) {
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor={`${idPrefix}-name`} className="field-label">
          {nameLabel}
        </label>
        <input
          id={`${idPrefix}-name`}
          name="name"
          type="text"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="A name the house will remember"
          autoComplete="nickname"
          maxLength={18}
          disabled={disabled}
          autoFocus={autoFocus}
          className="field"
        />
        <p className="mt-2 font-label text-[0.58rem] uppercase tracking-[0.13em] text-ash/60">
          2–18 characters. This is how the table will know you.
        </p>
      </div>

      <div>
        <p className="field-label">Choose a sigil</p>
        <div
          className="grid grid-cols-6 gap-2"
          role="group"
          aria-label="Choose an avatar sigil"
        >
          {AVATARS.map((id) => (
            <button
              key={id}
              type="button"
              className="avatar-choice"
              data-selected={avatar === id}
              onClick={() => onAvatarChange(id)}
              disabled={disabled}
              aria-label={AVATAR_NAMES[id]}
              aria-pressed={avatar === id}
              title={AVATAR_NAMES[id]}
            >
              <Avatar id={id} size="md" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SeatPreview({
  name,
  avatar,
  className,
}: {
  name: string;
  avatar: AvatarId;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 border border-bone/10 bg-black/15 px-3 py-2.5",
        className,
      )}
    >
      <Avatar id={avatar} size="sm" />
      <div className="min-w-0">
        <p className="truncate font-display text-lg leading-none text-bone">
          {name.trim() || "Unnamed guest"}
        </p>
        <p className="mt-1 font-label text-[0.52rem] uppercase tracking-[0.18em] text-ash/70">
          A place at the table
        </p>
      </div>
    </div>
  );
}
