export const MEMORY_PACK_IDS = [
  "childhood",
  "travel",
  "food",
  "places",
  "dreams",
  "objects",
  "brainrot",
] as const;

export type MemoryPackId = (typeof MEMORY_PACK_IDS)[number];
export type PackChoiceId = "random" | MemoryPackId;

export interface PackMeta {
  id: PackChoiceId;
  name: string;
  category: string | null;
  description: string;
}

export const PACK_META: readonly PackMeta[] = [
  {
    id: "childhood",
    name: "Small Hours",
    category: "Childhood",
    description: "Back gardens, night lights, and things you were told to forget.",
  },
  {
    id: "travel",
    name: "The Long Road",
    category: "Travel",
    description: "Platforms, passports, and places you only passed through.",
  },
  {
    id: "food",
    name: "The Last Supper",
    category: "Food",
    description: "Recipes, rituals, and the taste of a kitchen after midnight.",
  },
  {
    id: "places",
    name: "Rooms Remembered",
    category: "Places",
    description: "Some rooms keep everyone who has ever walked through them.",
  },
  {
    id: "dreams",
    name: "What Sleep Brings",
    category: "Dreams",
    description: "The half-remembered logic of a house that does not exist.",
  },
  {
    id: "objects",
    name: "Things Left Behind",
    category: "Objects",
    description: "Heirlooms, evidence, and ordinary objects with a history.",
  },
  {
    id: "brainrot",
    name: "The Feed",
    category: "Internet",
    description: "Words that escaped the timeline and moved into everyday speech.",
  },
  {
    id: "random",
    name: "The Unremembered",
    category: null,
    description: "Draw a different memory from every room in the house.",
  },
];

export function getPackMeta(id: PackChoiceId): PackMeta {
  return PACK_META.find((pack) => pack.id === id) ?? PACK_META[PACK_META.length - 1];
}

export function isPackChoiceId(value: unknown): value is PackChoiceId {
  return typeof value === "string" && PACK_META.some((pack) => pack.id === value);
}
