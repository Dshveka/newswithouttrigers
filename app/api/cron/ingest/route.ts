import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { runIngestion } from "@/lib/ingest";

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  const querySecret = request.nextUrl.searchParams.get("secret")?.trim() ?? null;
  const envSecret = env.cronSecret?.trim();

  if (!envSecret) {
    return false;
  }

  return bearer === envSecret || querySecret === envSecret;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runIngestion();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
