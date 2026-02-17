import { formatIsraelDateTime } from "@/lib/time";
import type { TopUpdate } from "@/lib/types";

type TopUpdatesPanelProps = {
  updates: TopUpdate[];
};

function normalizeText(input: string): string {
  return input
    .replace(/\s+/g, " ")
    .replace(/[!]{2,}/g, "!")
    .replace(/[?]{2,}/g, "?")
    .trim();
}

function toCalmLine(title: string): string {
  const clean = normalizeText(title)
    .replace(/דרמה|סערה|הלם|פאניקה|קריסה/gi, "עדכון")
    .replace(/חשיפה|מכה|זעזוע/gi, "דיווח");

  return `עדכון קצר: ${clean}`;
}

function limitWords(text: string, maxWords: number): string {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return `${words.slice(0, maxWords).join(" ")}...`;
}

function buildExpandedSummary(update: TopUpdate): string {
  const title = normalizeText(update.title);
  const snippet = normalizeText(update.content_snippet ?? "");

  const parts = [
    `סיכום רגוע: ${title}.`,
    snippet ? `מהדיווח הקיים עולה ש-${snippet}.` : "בשלב זה מדובר בדיווח ראשוני, ולכן חשוב לעקוב לעדכון הבא כדי לאמת את התמונה המלאה.",
    "העדכון מוצג כאן בניסוח ענייני כדי לעזור להבין מה רלוונטי לציבור בלי עומס מיותר.",
    "אם הנושא ישפיע בפועל על הנחיות, תחבורה, שירותים או בטיחות, המידע יעודכן כאן בצורה תמציתית וברורה.",
    "מומלץ להסתמך על הודעות רשמיות של הגופים המוסמכים ולפעול לפי הנחיות מעשיות בלבד.",
    "במקרה שאין שינוי הנחיות, המשמעות היא לרוב שאין צורך בפעולה מיידית מעבר למעקב שוטף.",
    "הצגת הסיכום נועדה לתת תמונת מצב רגועה ועדכנית, בלי פרשנות דרמטית ובלי פרטים מעוררי לחץ."
  ];

  const filler = [
    "מטרת הסיכום היא לשמור על תמונה מעודכנת בלי להוסיף מתח מיותר.",
    "בשלב הנוכחי נכון לעקוב אחר הודעות רשמיות בלבד ולהימנע משמועות ברשת.",
    "כאשר יתקבל מידע נוסף עם משמעות מעשית לציבור, הוא ישולב כאן באופן תמציתי.",
    "אם אין שינוי בהנחיות בפועל, לרוב אין צורך בצעד מיידי מעבר למעקב.",
    "העדכון נכתב בצורה ידידותית כדי לאפשר קריאה מהירה וברורה בכל רגע."
  ];

  let summary = parts.join(" ");
  let wordCount = summary.split(/\s+/).filter(Boolean).length;
  let index = 0;
  while (wordCount < 180) {
    summary = `${summary} ${filler[index % filler.length]}`;
    wordCount = summary.split(/\s+/).filter(Boolean).length;
    index += 1;
  }

  return limitWords(summary, 200);
}

function SourceIcon() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true" className="inline-block">
      <path
        d="M10.6 13.4a1 1 0 0 1 0-1.4l3.4-3.4a3 3 0 1 1 4.2 4.2l-2.6 2.6a3 3 0 0 1-4.2 0 .999.999 0 1 1 1.4-1.4 1 1 0 0 0 1.4 0l2.6-2.6a1 1 0 0 0-1.4-1.4l-3.4 3.4a1 1 0 0 1-1.4 0Zm2.8-2.8a.999.999 0 0 1 0 1.4L10 15.4a3 3 0 1 1-4.2-4.2l2.6-2.6a3 3 0 0 1 4.2 0 .999.999 0 1 1-1.4 1.4 1 1 0 0 0-1.4 0l-2.6 2.6a1 1 0 0 0 1.4 1.4l3.4-3.4a1 1 0 0 1 1.4 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function TopUpdatesPanel({ updates }: TopUpdatesPanelProps) {
  return (
    <details className="mt-6 border border-line bg-white p-4 text-sm text-ink">
      <summary className="cursor-pointer font-medium">5 עדכונים חשובים כרגע</summary>
      {!updates.length ? <p className="mt-3 text-muted">אין כרגע מספיק עדכונים מאומתים להצגה בחלונית הזו.</p> : null}
      <ul className="mt-3 space-y-3">
        {updates.map((item, index) => (
          <li key={`${item.url}-${index}`} className="border-b border-line pb-3 last:border-b-0">
            <p className="leading-6">{toCalmLine(item.title)}</p>
            <div className="mt-1 text-xs text-muted">
              <span className="inline-flex items-center gap-1">
                <SourceIcon />
                {item.source}
              </span>
              <span> | {formatIsraelDateTime(item.published_at)}</span>
            </div>
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-muted underline underline-offset-4">הרחבה (עד 200 מילים)</summary>
              <p className="mt-2 leading-6 text-muted">{buildExpandedSummary(item)}</p>
            </details>
            <a href={item.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs underline underline-offset-4">
              למקור המלא
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}
