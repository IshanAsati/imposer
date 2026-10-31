import type { MemoryPackId, PackChoiceId } from "./pack-meta";

export interface MemoryEntry {
  word: string;
  category: string;
  packId: MemoryPackId;
}

interface SourcePack {
  id: MemoryPackId;
  category: string;
  words: string[];
}

/**
 * Keep this module server-side. Importing it from a client component would ship
 * every secret memory to the browser.
 */
const SOURCE_PACKS: SourcePack[] = [
  {
    id: "childhood",
    category: "Childhood",
    words: [
      "Treehouse",
      "Sandbox",
      "Nightlight",
      "Blanket fort",
      "Lemonade stand",
      "Training wheels",
      "Bedtime story",
      "Tooth fairy",
      "Snow day",
      "Hide and seek",
      "Swing set",
      "Mud pie",
      "Birthday candles",
      "Stuffed rabbit",
      "Classroom pet",
      "School bus",
      "Rain boots",
      "Bad dream",
      "Secret club",
      "Glass marble",
      "Firefly jar",
      "Paper crown",
      "Backyard tent",
      "Piano lesson",
      "Snowman",
      "Loose tooth",
      "Kitchen table",
      "Hall closet",
      "First bicycle",
      "Attic trunk",
      "Gully cricket",
      "Paper kite",
      "Carrom board",
      "Ludo board",
      "Lattu",
      "Bucket bath",
    ],
  },
  {
    id: "travel",
    category: "Travel",
    words: [
      "Window seat",
      "Passport stamp",
      "Airport chapel",
      "Night train",
      "Sleeper car",
      "Roadside diner",
      "Paper map",
      "Boarding pass",
      "Lost luggage",
      "Hotel key",
      "Seaside town",
      "Ferry horn",
      "Cable car",
      "Border crossing",
      "Souvenir shop",
      "Red-eye flight",
      "Train platform",
      "Duty free",
      "Foreign accent",
      "Sunburn",
      "Travel journal",
      "Bus stop",
      "Taxi meter",
      "Lighthouse",
      "Postcard",
      "One-way ticket",
      "Customs line",
      "Motel sign",
      "Empty runway",
      "Luggage carousel",
      "Monsoon platform",
      "Sleeper berth",
      "Auto-rickshaw",
      "Hill station",
      "Houseboat",
      "Toy train",
    ],
  },
  {
    id: "food",
    category: "Food",
    words: [
      "Burnt toast",
      "Black coffee",
      "Warm bread",
      "Apple pie",
      "Overripe peach",
      "Pickled onions",
      "Midnight noodles",
      "Grandmother's soup",
      "Cold pizza",
      "Honeycomb",
      "Salted caramel",
      "Kitchen smoke",
      "First oyster",
      "School lunch",
      "Strawberry jam",
      "Fried egg",
      "Spilled wine",
      "Ginger tea",
      "Cinnamon toast",
      "Leftovers",
      "Funeral potatoes",
      "Wedding cake",
      "Sour milk",
      "Birthday cake",
      "Pot of tea",
      "Bread and butter",
      "Orange peel",
      "Church supper",
      "Pickled eggs",
      "Burnt caramel",
      "Cutting chai",
      "Vada pav",
      "Masala dosa",
      "Pani puri",
      "Chole bhature",
      "Biryani",
      "Gulab jamun",
      "Filter coffee",
      "Mithai box",
    ],
  },
  {
    id: "places",
    category: "Places",
    words: [
      "Grandmother's house",
      "Motel room",
      "Hospital corridor",
      "Church basement",
      "Attic",
      "Cellar",
      "Graveyard",
      "Pier at night",
      "Empty theatre",
      "Rail station",
      "Library stacks",
      "Gas station",
      "Laundromat",
      "Diner booth",
      "Motel pool",
      "Cornfield",
      "Toll bridge",
      "Parking garage",
      "Hotel lobby",
      "Chapel",
      "Boiler room",
      "Rooftop",
      "Cemetery gate",
      "Neon sign",
      "Swimming pool",
      "School hallway",
      "Funeral home",
      "Back staircase",
      "Summer cabin",
      "Old kitchen",
      "Gateway of India",
      "India Gate",
      "Taj Mahal",
      "Marine Drive",
      "Charminar",
      "Howrah Bridge",
      "Kirana store",
      "Rangoli",
    ],
  },
  {
    id: "dreams",
    category: "Dreams",
    words: [
      "Falling",
      "Loose teeth",
      "Endless hallway",
      "Flying",
      "Being chased",
      "Door with no handle",
      "Talking mirror",
      "Dead phone",
      "Missing stair",
      "Familiar stranger",
      "Unfinished house",
      "Breathing walls",
      "Train with no driver",
      "Liquid floor",
      "Voice downstairs",
      "Losing keys",
      "Forgotten name",
      "Repeating room",
      "Clock without hands",
      "Crowd of faces",
      "Sunken house",
      "Television static",
      "Empty cradle",
      "Face in window",
      "Walking on water",
      "Unknown language",
      "Falling upward",
      "Locked door",
      "Swarm of moths",
      "Long corridor",
    ],
  },
  {
    id: "objects",
    category: "Objects",
    words: [
      "Music box",
      "Rotary phone",
      "Wedding ring",
      "Pocket watch",
      "Film camera",
      "VHS tape",
      "Sewing box",
      "Brass key",
      "Letter opener",
      "Snow globe",
      "Typewriter",
      "Record player",
      "Taxidermy bird",
      "Iron gate",
      "Porcelain doll",
      "Wedding photo",
      "Candle stub",
      "Family album",
      "Handwritten letter",
      "Broken mirror",
      "Silver locket",
      "Old radio",
      "Prescription bottle",
      "Matchbook",
      "Cuckoo clock",
      "Black umbrella",
      "Stained letter",
      "Rolled film",
      "House key",
      "Empty frame",
      "Steel tiffin",
      "Pressure cooker",
      "Masala dabba",
      "Ceiling fan",
      "Charpai",
      "Matka",
      "Inverter",
      "Gas cylinder",
      "Diwali diya",
      "Dhol",
      "Mehndi",
    ],
  },
  {
    id: "brainrot",
    category: "Internet",
    words: [
      "6-7",
      "Rizz",
      "Aura farming",
      "Crash out",
      "Glazing",
      "Chopped",
      "Cooked",
      "Lock in",
      "Mewing",
      "Looksmaxxing",
      "Sigma",
      "NPC",
      "Touch grass",
      "Rage bait",
      "Slop",
      "Clanker",
      "Delulu",
      "Yapping",
      "Mogging",
      "Choppelganger",
      "Skibidi",
      "Fanum tax",
      "Ohio",
      "Tung Tung Tung Sahur",
    ],
  },
];

export const MEMORY_PACKS: readonly MemoryEntry[] = SOURCE_PACKS.flatMap((pack) =>
  pack.words.map((word) => ({
    word,
    category: pack.category,
    packId: pack.id,
  })),
);

function pickIndex(rng: () => number, length: number): number {
  const value = Math.floor(rng() * length);
  return Math.max(0, Math.min(length - 1, value));
}

function shuffled<T>(items: readonly T[], rng: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = pickIndex(rng, i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function chooseMemory(
  choice: PackChoiceId,
  usedWords: readonly string[],
  rng: () => number,
): MemoryEntry {
  const pool =
    choice === "random"
      ? MEMORY_PACKS
      : MEMORY_PACKS.filter((entry) => entry.packId === choice);
  const used = new Set(usedWords.map((word) => word.toLowerCase()));
  const unused = pool.filter((entry) => !used.has(entry.word.toLowerCase()));
  const candidates = unused.length > 0 ? unused : pool;
  return candidates[pickIndex(rng, candidates.length)];
}

export function chooseGuessOptions(
  entry: MemoryEntry,
  rng: () => number,
): string[] {
  const samePack = MEMORY_PACKS.filter((candidate) => candidate.packId === entry.packId);
  const distractors = shuffled(
    samePack.filter(
      (candidate) => candidate.word.toLowerCase() !== entry.word.toLowerCase(),
    ),
    rng,
  )
    .slice(0, 3)
    .map((candidate) => candidate.word);

  return shuffled([entry.word, ...distractors], rng);
}

export function getCategoryForPack(packId: MemoryPackId): string {
  return (
    SOURCE_PACKS.find((pack) => pack.id === packId)?.category ??
    "A borrowed memory"
  );
}
