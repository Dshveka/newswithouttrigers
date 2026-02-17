# חדשות ללא טריגרים

MVP של אפליקציית חדשות רגועה: עמוד יחיד שמציג פסקת דיג'סט אחת בעברית עם עדכונים חיוניים בלבד, בלי פיד, בלי תמונות ובלי שפה דרמטית.

## Tech Stack

- Next.js (TypeScript, App Router)
- Tailwind (מראה B/W/gray מינימלי)
- Supabase Postgres (ברירת מחדל) עם fallback מקומי לקובץ JSON לפיתוח
- OpenAI API לסיווג חיוניות, clustering וסיכום רגוע
- Vercel Cron כל 15 דקות

## MVP כולל

- `GET /` עמוד יחיד עם:
  - כותרת: "חדשות ללא טריגרים"
  - חותמת זמן עדכון אחרון
  - פסקת דיג'סט אחת
  - כפתור "מקורות" לפתיחת רשימת קישורים טקסטואלית
- `GET /api/digest/latest` מחזיר `{ updatedAt, digestText, sources[] }`
- `POST /api/cron/ingest` (מוגן `CRON_SECRET`) מבצע:
  1. Fetch ל-RSS
  2. Dedupe
  3. סיווג vital now
  4. אימות מינימום 2 מקורות עצמאיים לכל אירוע
  5. סיכום רגוע ושמירה ל-DB

## התקנה

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Environment Variables

- `OPENAI_API_KEY` - מפתח OpenAI
- `OPENAI_MODEL` - ברירת מחדל: `gpt-4.1-mini`
- `SUPABASE_URL` - URL של פרויקט Supabase
- `SUPABASE_KEY` - Service Role Key
- `CRON_SECRET` - סוד לאימות `POST /api/cron/ingest`
- `USE_MOCK_SOURCES` - אם `true`, ingestion משתמש בנתוני mock (לבדיקות מקומיות)

## Supabase Setup

הרץ את הסכמה:

```sql
-- copy/paste from supabase/schema.sql
```

הקובץ: `supabase/schema.sql`

טבלאות:
- `source_items`
- `clustered_events`
- `digests`

## הרצת ingest מקומית

עם mock mode (`USE_MOCK_SOURCES=true`):

```bash
npm run ingest:mock
```

עם RSS אמיתי, הגדר `USE_MOCK_SOURCES=false`.

## Cron

ב־Vercel מוגדר ב־`vercel.json`:

- כל 15 דקות: `POST /api/cron/ingest`

כדי להפעיל ידנית:

```bash
curl -X POST "http://localhost:3000/api/cron/ingest?secret=YOUR_CRON_SECRET"
```

## הערות אמינות

- המערכת כוללת כלל קשיח: אירוע נכנס לדיג'סט רק עם 2 מקורות לפחות.
- אם אין עדכון חיוני, מוצגת הודעת "אין עדכונים חיוניים חריגים" בטון רגוע.
- אם OpenAI לא זמין, יש fallback היוריסטי בסיסי לשמירה על רציפות שירות.
