import { NextResponse } from "next/server";
import { isSameOriginRequest, proxyPortalRequest } from "@/lib/portal-proxy";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 });
  }
  const { id } = await params;
  return proxyPortalRequest(`/applicant-portal/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });
}
