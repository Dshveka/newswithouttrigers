import {
  getLocalLatestDigest,
  getLocalTopUpdates,
  saveLocalClusters,
  saveLocalDigest,
  saveLocalSourceItems
} from "@/lib/localStore";
import { env } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { DigestRow, EventCluster, SourceItem, TopUpdate } from "@/lib/types";

const urgencyKeywords = [
  "פיקוד העורף",
  "הנחיות",
  "אזהרה",
  "אזעקה",
  "ירי",
  "חירום",
  "חסימה",
  "סגירה",
  "תקלה",
  "השבתה",
  "שביתה",
  "בריאות",
  "משרד הבריאות",
  "תחבורה",
  "רכבת",
  "כביש",
  "חשמל",
  "מים"
];

function urgencyScore(title: string, snippet: string, publishedAt: string): number {
  const text = `${title} ${snippet}`.toLowerCase();
  const keywordScore = urgencyKeywords.reduce((sum, keyword) => {
    return sum + (text.includes(keyword.toLowerCase()) ? 3 : 0);
  }, 0);

  const ageHours = Math.max(0, (Date.now() - new Date(publishedAt).getTime()) / 36e5);
  const freshnessScore = Math.max(0, 5 - ageHours * 0.5);
  return keywordScore + freshnessScore;
}

export async function saveSourceItems(items: SourceItem[]) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return saveLocalSourceItems(items);
  }

  if (!items.length) return;

  const { error } = await supabase.from("source_items").upsert(items, { onConflict: "hash" });
  if (error) throw error;
}

export async function saveClusteredEvents(clusters: EventCluster[]) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return saveLocalClusters(clusters);
  }

  if (!clusters.length) return;

  const rows = clusters.map((cluster) => ({
    ...cluster,
    created_at: new Date().toISOString()
  }));

  const { error } = await supabase.from("clustered_events").insert(rows);
  if (error) throw error;
}

export async function saveDigest(digest: DigestRow) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return saveLocalDigest(digest);
  }

  const { error } = await supabase.from("digests").insert(digest);
  if (error) throw error;
}

export async function getLatestDigest(): Promise<DigestRow | null> {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return getLocalLatestDigest();
    }

    const { data, error } = await supabase
      .from("digests")
      .select("created_at,digest_text,sources")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return null;
    }
    if (!data) return null;

    return {
      created_at: data.created_at,
      digest_text: data.digest_text,
      sources: Array.isArray(data.sources) ? (data.sources as string[]) : []
    };
  } catch {
    return null;
  }
}

export async function getTopUpdates(limit = 5): Promise<TopUpdate[]> {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return getLocalTopUpdates(limit);
    }

    const { data, error } = await supabase
      .from("source_items")
      .select("title,url,source,published_at,content_snippet")
      .order("published_at", { ascending: false })
      .limit(120);

    if (error || !data) {
      return [];
    }

    const mapped = data.map((item) => ({
      title: item.title,
      url: item.url,
      source: item.source,
      published_at: item.published_at,
      content_snippet: item.content_snippet ?? ""
    }));

    if (!env.useMockSources) {
      const realOnly = mapped.filter((item) => !item.url.includes("example.com"));
      const deduped = new Map<string, (typeof realOnly)[number]>();
      for (const item of realOnly) {
        if (!deduped.has(item.url)) {
          deduped.set(item.url, item);
        }
      }

      return Array.from(deduped.values())
        .sort((a, b) => urgencyScore(b.title, b.content_snippet, b.published_at) - urgencyScore(a.title, a.content_snippet, a.published_at))
        .slice(0, limit)
        .map((item) => item);
    }

    return mapped.slice(0, limit).map((item) => item);
  } catch {
    return [];
  }
}
