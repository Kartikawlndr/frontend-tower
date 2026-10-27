import { NextRequest } from "next/server";
import { proxyPortalRequest } from "@/lib/portal-proxy";

export async function GET(request: NextRequest) {
  const query = new URLSearchParams();
  for (const key of ["page", "limit"]) {
    const value = request.nextUrl.searchParams.get(key);
    if (value) query.set(key, value);
  }
  const suffix = query.size ? `?${query.toString()}` : "";
  return proxyPortalRequest(`/applicant-portal/audit${suffix}`);
}
