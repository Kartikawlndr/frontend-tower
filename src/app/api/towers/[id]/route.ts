import { NextResponse } from "next/server";
import {
  isSameOriginRequest,
  proxyPortalRequest,
} from "@/lib/portal-proxy";

type RouteContext = { params: Promise<{ id: string }> };

async function getPath(params: RouteContext["params"]) {
  const { id } = await params;
  return `/applicant-portal/towers/${encodeURIComponent(id)}`;
}

export async function GET(_request: Request, { params }: RouteContext) {
  return proxyPortalRequest(await getPath(params));
}

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 });
  }
  return proxyPortalRequest(await getPath(params), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });
}

export async function DELETE(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 });
  }
  return proxyPortalRequest(await getPath(params), { method: "DELETE" });
}
