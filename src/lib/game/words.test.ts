import { describe, expect, it } from "vitest";
import { MEMORY_PACK_IDS, PACK_META } from "./pack-meta";
import { MEMORY_PACKS, getCategoryForPack } from "./words";

describe("memory packs", () => {
  it("describes every pack in the client-safe metadata", () => {
    const metaIds = new Set(PACK_META.map((pack) => pack.id));
    expect(metaIds).toEqual(new Set([...MEMORY_PACK_IDS, "random"]));
  });

  it("keeps at least four words in every pack", () => {
    for (const id of MEMORY_PACK_IDS) {
      const count = MEMORY_PACKS.filter((entry) => entry.packId === id).length;
      expect(count, id).toBeGreaterThanOrEqual(4);
    }
  });

  it("keeps every secret word unique", () => {
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const entry of MEMORY_PACKS) {
      const key = entry.word.toLowerCase();
      if (seen.has(key)) {
        duplicates.push(entry.word);
      }
      seen.add(key);
    }
    expect(duplicates).toEqual([]);
  });

  it("gives each word the category declared by its pack", () => {
    for (const entry of MEMORY_PACKS) {
      expect(entry.category).toBe(getCategoryForPack(entry.packId));
    }
  });
});
