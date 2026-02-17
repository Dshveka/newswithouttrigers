import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { DigestRow, EventCluster, SourceItem, TopUpdate } from "@/lib/types";

type LocalDb = {
  source_items: SourceItem[];
  clustered_events: (EventCluster & { created_at: string })[];
  digests: DigestRow[];
};

const DB_PATH = process.env.VERCEL
  ? path.join("/tmp", "newswithouttrigers-dev-db.json")
  : path.join(process.cwd(), ".data", "dev-db.json");

async function readDb(): Promise<LocalDb> {
  try {
    const raw = await readFile(DB_PATH, "utf-8");
    return JSON.parse(raw) as LocalDb;
  } catch {
    return { source_items: [], clustered_events: [], digests: [] };
  }
}

async function writeDb(db: LocalDb) {
  await mkdir(path.dirname(DB_PATH), { recursive: true });
  await writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

export async function saveLocalSourceItems(items: SourceItem[]) {
  const db = await readDb();
  const known = new Set(db.source_items.map((i) => i.hash));
  for (const item of items) {
    if (!known.has(item.hash)) {
      db.source_items.push(item);
      known.add(item.hash);
    }
  }
  await writeDb(db);
}

export async function saveLocalClusters(clusters: EventCluster[]) {
  const db = await readDb();
  const created_at = new Date().toISOString();
  for (const cluster of clusters) {
    db.clustered_events.push({ ...cluster, created_at });
  }
  await writeDb(db);
}

export async function saveLocalDigest(digest: DigestRow) {
  const db = await readDb();
  db.digests.push(digest);
  await writeDb(db);
}

export async function getLocalLatestDigest(): Promise<DigestRow | null> {
  const db = await readDb();
  if (!db.digests.length) return null;
  return db.digests.sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;
}

export async function getLocalTopUpdates(limit = 5): Promise<TopUpdate[]> {
  const db = await readDb();
  return db.source_items
    .sort((a, b) => b.published_at.localeCompare(a.published_at))
    .slice(0, limit)
    .map((item) => ({
      title: item.title,
      url: item.url,
      source: item.source,
      published_at: item.published_at,
      content_snippet: item.content_snippet
    }));
}
