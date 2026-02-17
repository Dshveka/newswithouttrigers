import SourcesToggle from "./components/SourcesToggle";
import TopUpdatesPanel from "./components/TopUpdatesPanel";
import { getLatestDigest, getTopUpdates } from "@/lib/digestStore";
import { formatIsraelDateTime } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [digest, topUpdates] = await Promise.all([getLatestDigest(), getTopUpdates(5)]);

  const fallbackText =
    "נכון לעדכון האחרון, אין כרגע עדכונים חיוניים חריגים שדורשים פעולה מיידית מצד הציבור. נמשיך לעקוב ולעדכן כאן בשפה רגועה וברורה.";

  const updatedAt = digest?.created_at ?? new Date().toISOString();
  const digestText = digest?.digest_text ?? fallbackText;
  const sources = digest?.sources ?? [];
  const updates = topUpdates.slice(0, 5);

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-4 py-10 sm:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">חדשות ללא טריגרים</h1>
      <p className="mt-3 text-sm text-muted">עודכן לאחרונה: {formatIsraelDateTime(updatedAt)}</p>
      <article className="mt-8 border border-line bg-white p-5 leading-8 text-ink sm:p-6 sm:text-lg">
        <p>{digestText}</p>
      </article>
      <TopUpdatesPanel updates={updates} />
      <SourcesToggle sources={sources} />
    </main>
  );
}
