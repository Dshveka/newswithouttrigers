import OpenAI from "openai";
import { z } from "zod";
import { env, hasOpenAI } from "@/lib/env";
import type { EventCluster, SourceItem } from "@/lib/types";

const areas = ["מרכז", "ירושלים", "צפון", "דרום", "שפלה", "השרון", "עוטף", "גוש דן"] as const;
const statuses = ["פתוח", "בטיפול", "נגמר"] as const;

const clusterSchema = z.object({
  event_key: z.string().min(3),
  vital_now: z.boolean(),
  area: z.enum(areas).nullable(),
  security_status: z.enum(statuses).nullable(),
  sources: z.array(z.string().url()).min(2),
  summary_sentence: z.string().min(8)
});

const clustersSchema = z.object({
  clusters: z.array(clusterSchema)
});

function heuristicClusters(items: SourceItem[]): EventCluster[] {
  const vitalKeywords = [
    "פיקוד העורף",
    "הנחיות",
    "חסימה",
    "כביש",
    "שביתה",
    "השבתה",
    "תקלה",
    "אזהרה",
    "סגירה",
    "בריאות",
    "חירום",
    "ירי",
    "אזעקה"
  ];

  const grouped = new Map<string, SourceItem[]>();
  for (const item of items) {
    const key = item.title.replace(/[^\p{L}\p{N}\s]/gu, "").split(" ").slice(0, 5).join(" ");
    const arr = grouped.get(key) ?? [];
    arr.push(item);
    grouped.set(key, arr);
  }

  const clusters: EventCluster[] = [];
  for (const [eventKey, group] of grouped) {
    const uniqueSources = new Set(group.map((g) => g.source));
    if (uniqueSources.size < 2) continue;

    const body = group.map((g) => `${g.title} ${g.content_snippet}`).join(" ");
    const vital_now = vitalKeywords.some((kw) => body.includes(kw));
    if (!vital_now) continue;

    clusters.push({
      event_key: eventKey,
      vital_now,
      area: body.includes("צפון") ? "צפון" : body.includes("דרום") ? "דרום" : null,
      security_status: body.includes("נגמר") ? "נגמר" : body.includes("בטיפול") ? "בטיפול" : body.includes("פתוח") ? "פתוח" : null,
      sources: group.map((g) => g.url).slice(0, 5),
      summary_sentence: `לפי מספר מקורות, יש עדכון חיוני בנושא ${eventKey}.`
    });
  }

  return clusters;
}

export async function classifyAndCluster(items: SourceItem[]): Promise<EventCluster[]> {
  if (!items.length) return [];
  if (!hasOpenAI) return heuristicClusters(items);

  const client = new OpenAI({ apiKey: env.openaiApiKey });

  const compactItems = items.slice(0, 120).map((item) => ({
    source: item.source,
    title: item.title,
    url: item.url,
    published_at: item.published_at,
    content_snippet: item.content_snippet
  }));

  const prompt = `
אתה עורך חדשות רגוע עבור "חדשות ללא טריגרים".
מיין וקבץ את האירועים לרשימת clusters בפורמט JSON בלבד.
חוקים קשיחים:
1) לכל אירוע חייבים לפחות 2 מקורות עצמאיים שונים.
2) כלול רק vital_now=true אם המידע חיוני מיידית לאזרח בישראל.
3) אל תכלול רכילות, ספורט, פרשנות, דרמה פוליטית, ספקולציות, או אירועים ללא השפעה מיידית.
4) אירוע ביטחוני: אם יש רלוונטיות מיידית בלבד, צרף area מתוך הרשימה הידועה ו-security_status מתוך [פתוח,בטיפול,נגמר].
5) summary_sentence צריך להיות ניטרלי, רגוע, ידידותי וקצר בעברית.
6) sources חייב להיות מערך קישורים (URL) של הפריטים שתומכים באירוע.
7) החזר JSON עם השדה היחיד clusters.
`;

  let raw = "{}";
  try {
    const completion = await client.chat.completions.create({
      model: env.openaiModel,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "החזר JSON תקין בלבד לפי ההוראות." },
        { role: "user", content: `${prompt}\n\nITEMS:\n${JSON.stringify(compactItems)}` }
      ]
    });
    raw = completion.choices[0]?.message?.content ?? "{}";
  } catch {
    return heuristicClusters(items);
  }
  let decoded: unknown = {};
  try {
    decoded = JSON.parse(raw);
  } catch {
    return heuristicClusters(items);
  }

  const parsed = clustersSchema.safeParse(decoded);

  if (!parsed.success) {
    return heuristicClusters(items);
  }

  return parsed.data.clusters.filter((cluster) => cluster.sources.length >= 2);
}

export async function composeDigest(clusters: EventCluster[]): Promise<string> {
  const vital = clusters.filter((c) => c.vital_now);
  if (!vital.length) {
    return "נכון לעדכון האחרון, אין כרגע עדכונים חיוניים חריגים שדורשים פעולה מיידית מצד הציבור. נמשיך לעקוב ולעדכן כאן בשפה רגועה וברורה.";
  }

  if (!hasOpenAI) {
    return vital
      .slice(0, 6)
      .map((c) => {
        const securityMeta = c.security_status && c.area ? ` (סטטוס: ${c.security_status}, אזור: ${c.area})` : "";
        return `${c.summary_sentence}${securityMeta}`;
      })
      .join(" ");
  }

  const client = new OpenAI({ apiKey: env.openaiApiKey });
  try {
    const completion = await client.chat.completions.create({
      model: env.openaiModel,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "כתוב פסקת דיג'סט אחת בעברית, 5-10 משפטים, טון נעים ורגוע. ללא דרמה. אם אירוע ביטחוני קיים, שלב סטטוס ואזור בצורה ניטרלית."
        },
        {
          role: "user",
          content: `סכם רק את האירועים הבאים לפסקה אחת: ${JSON.stringify(vital.slice(0, 8))}`
        }
      ]
    });

    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) {
      return vital.map((c) => c.summary_sentence).join(" ");
    }

    return text.replace(/\s+/g, " ");
  } catch {
    return vital.map((c) => c.summary_sentence).join(" ");
  }
}
