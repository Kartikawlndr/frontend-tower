import "server-only";

import { NextResponse } from "next/server";
import { directusFetch } from "./directus-session";

export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export async function proxyPortalRequest(
  path: string,
  init: RequestInit = {},
): Promise<NextResponse> {
  try {
    const response = await directusFetch(path, init);
    const headers = new Headers();
    const contentType = response.headers.get("content-type");
    const contentDisposition = response.headers.get("content-disposition");
    if (contentType) headers.set("content-type", contentType);
    if (contentDisposition) {
      headers.set("content-disposition", contentDisposition);
    }
    headers.set("cache-control", "no-store");
    return new NextResponse(response.body, {
      status: response.status,
      headers,
    });
  } catch {
    return NextResponse.json(
      { error: "Layanan Directus sedang tidak dapat dijangkau." },
      { status: 502 },
    );
  }
}

export function jsonRequestBody(body: unknown): RequestInit {
  return {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
