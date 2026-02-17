import { NextResponse } from "next/server";
import { getLatestDigest } from "@/lib/digestStore";

export async function GET() {
  const digest = await getLatestDigest();

  if (!digest) {
    return NextResponse.json({
      updatedAt: new Date().toISOString(),
      digestText:
        "נכון לעדכון האחרון, אין כרגע עדכונים חיוניים חריגים שדורשים פעולה מיידית מצד הציבור. נמשיך לעקוב ולעדכן כאן בשפה רגועה וברורה.",
      sources: []
    });
  }

  return NextResponse.json({
    updatedAt: digest.created_at,
    digestText: digest.digest_text,
    sources: digest.sources
  });
}
