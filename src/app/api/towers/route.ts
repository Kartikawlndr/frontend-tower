import { NextRequest, NextResponse } from "next/server";
import {
  isSameOriginRequest,
  proxyPortalRequest,
} from "@/lib/portal-proxy";

export async function GET(request: NextRequest) {
  const query = new URLSearchParams();
  for (const key of ["page", "limit", "search", "status"]) {
    const value = request.nextUrl.searchParams.get(key);
    if (value) query.set(key, value);
  }
  const suffix = query.size ? `?${query.toString()}` : "";
  return proxyPortalRequest(`/applicant-portal/towers${suffix}`);
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 });
  }
  const body = await request.text();
  return proxyPortalRequest("/applicant-portal/towers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}
