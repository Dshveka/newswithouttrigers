import type { SourceItem } from "@/lib/types";

export function dedupeByHash(items: SourceItem[]): SourceItem[] {
  const map = new Map<string, SourceItem>();
  for (const item of items) {
    if (!map.has(item.hash)) {
      map.set(item.hash, item);
    }
  }
  return Array.from(map.values());
}
