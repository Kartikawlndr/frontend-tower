import { NextResponse } from "next/server";
import { clearDirectusTokens } from "@/lib/directus-session";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 });
  }

  await clearDirectusTokens();
  return NextResponse.json({ success: true });
}
