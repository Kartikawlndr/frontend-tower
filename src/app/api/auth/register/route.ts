import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/lib/portal-proxy";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 });
  }

  return NextResponse.json(
    { error: "Akun hanya dapat dibuat melalui undangan Super Admin." },
    { status: 403 },
  );
}
