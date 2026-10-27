import { NextResponse } from "next/server";
import { isSameOriginRequest, proxyPortalRequest } from "@/lib/portal-proxy";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 });
  }
  return proxyPortalRequest("/applicant-portal/towers/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });
}
