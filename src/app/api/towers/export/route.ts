import { NextRequest } from "next/server";
import { proxyPortalRequest } from "@/lib/portal-proxy";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.toString();
  return proxyPortalRequest(
    `/applicant-portal/towers/export.csv${search ? `?${search}` : ""}`,
  );
}
