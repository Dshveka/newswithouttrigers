export type SecurityStatus = "פתוח" | "בטיפול" | "נגמר";

export type AreaLabel =
  | "מרכז"
  | "ירושלים"
  | "צפון"
  | "דרום"
  | "שפלה"
  | "השרון"
  | "עוטף"
  | "גוש דן";

export type SourceItem = {
  id?: string;
  source: string;
  title: string;
  url: string;
  published_at: string;
  fetched_at: string;
  content_snippet: string;
  hash: string;
};

export type EventCluster = {
  event_key: string;
  vital_now: boolean;
  area: AreaLabel | null;
  security_status: SecurityStatus | null;
  sources: string[];
  summary_sentence: string;
};

export type DigestRow = {
  id?: string;
  created_at: string;
  digest_text: string;
  sources: string[];
};

export type LatestDigestResponse = {
  updatedAt: string;
  digestText: string;
  sources: string[];
};

export type TopUpdate = {
  title: string;
  url: string;
  source: string;
  published_at: string;
  content_snippet?: string;
};
