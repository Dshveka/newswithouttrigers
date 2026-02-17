import Parser from "rss-parser";
import { createHash } from "node:crypto";
import { env } from "@/lib/env";
import type { SourceItem } from "@/lib/types";

type FeedConfig = {
  source: string;
  url: string;
};

const parser = new Parser();

const FEEDS: FeedConfig[] = [
  { source: "ynet", url: "https://www.ynet.co.il/Integration/StoryRss2.xml" },
  { source: "N12", url: "https://www.mako.co.il/rss-news-israel.xml" },
  { source: "כאן 11", url: "https://www.kan.org.il/rss/main" },
  { source: "הארץ", url: "https://www.haaretz.co.il/srv/htz-rss" },
  { source: "גלובס", url: "https://www.globes.co.il/webservice/rss/rssfeeder.asmx/FeederNode?iID=2" },
  { source: "TheMarker", url: "https://www.themarker.com/cmlink/1.1816986" }
];

function toHash(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

function normalizeItem(source: string, raw: Parser.Item): SourceItem | null {
  const title = raw.title?.trim();
  const url = raw.link?.trim();
  if (!title || !url) return null;

  const publishedAt = raw.pubDate ? new Date(raw.pubDate).toISOString() : new Date().toISOString();
  const snippet = (raw.contentSnippet ?? raw.content ?? "").toString().replace(/\s+/g, " ").slice(0, 450);

  return {
    source,
    title,
    url,
    published_at: publishedAt,
    fetched_at: new Date().toISOString(),
    content_snippet: snippet,
    hash: toHash(`${source}|${url}|${title}`)
  };
}

function mockItems(): SourceItem[] {
  const now = new Date().toISOString();
  const base = [
    {
      source: "ynet",
      title: "פיקוד העורף עדכן הנחיות באזור הצפון",
      url: "https://example.com/ynet-1",
      published_at: now,
      fetched_at: now,
      content_snippet: "שינוי בהנחיות התקהלות ולימודים במספר יישובים בצפון"
    },
    {
      source: "כאן 11",
      title: "עדכון רשמי: הגבלות זמניות בצפון",
      url: "https://example.com/kan-1",
      published_at: now,
      fetched_at: now,
      content_snippet: "בהנחיית פיקוד העורף, שינוי זמני בהתקהלויות באזור"
    },
    {
      source: "גלובס",
      title: "שביתה בנמלים מחריפה ומשפיעה על אספקה",
      url: "https://example.com/globes-1",
      published_at: now,
      fetched_at: now,
      content_snippet: "דיון חירום על השפעה לציבור ועל זמני הגעת סחורות"
    },
    {
      source: "TheMarker",
      title: "הפרעות באספקה עקב שביתה בנמלים",
      url: "https://example.com/themarker-1",
      published_at: now,
      fetched_at: now,
      content_snippet: "חברות מדווחות על עיכובים בפעילות לוגיסטית"
    }
  ];

  return base.map((item) => ({ ...item, hash: toHash(`${item.source}|${item.url}|${item.title}`) }));
}

export async function fetchSourceItems(limitPerFeed = 15): Promise<SourceItem[]> {
  if (env.useMockSources) {
    return mockItems();
  }

  const perFeedItems = await Promise.all(
    FEEDS.map(async ({ source, url }) => {
      try {
        const feed = await parser.parseURL(url);
        return (feed.items ?? [])
          .slice(0, limitPerFeed)
          .map((item) => normalizeItem(source, item))
          .filter((item): item is SourceItem => Boolean(item));
      } catch {
        return [];
      }
    })
  );

  return perFeedItems.flat();
}
