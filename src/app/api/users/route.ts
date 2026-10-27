import { NextRequest, NextResponse } from "next/server";
import {
  isSameOriginRequest,
  proxyPortalRequest,
} from "@/lib/portal-proxy";

export async function GET(request: NextRequest) {
  const query = new URLSearchParams();
  for (const key of ["page", "limit"]) {
    const value = request.nextUrl.searchParams.get(key);
    if (value) query.set(key, value);
  }
  const suffix = query.size ? `?${query.toString()}` : "";
  return proxyPortalRequest(`/applicant-portal/users${suffix}`);
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 });
  }
  return proxyPortalRequest("/applicant-portal/users/invite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });
}
