import { NextRequest, NextResponse } from "next/server";
import {
  isSameOriginRequest,
  proxyPortalRequest,
} from "@/lib/portal-proxy";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.toString();
  return proxyPortalRequest(
    `/applicant-portal/towers/drafts${search ? `?${search}` : ""}`,
  );
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 });
  }
  return proxyPortalRequest("/applicant-portal/towers/drafts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });
}
