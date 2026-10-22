import { NextRequest, NextResponse } from "next/server";
import { directusVerifyEmail } from "@/lib/directus";
import { clientEnv } from "@/lib/env";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get("token");

  if (!token) {
    const errorUrl = new URL("/", clientEnv.appUrl);
    errorUrl.searchParams.set("verified", "false");
    errorUrl.searchParams.set("error", "Token verifikasi tidak ditemukan");
    return NextResponse.redirect(errorUrl);
  }

  const result = await directusVerifyEmail(token);

  const redirectUrl = new URL("/", clientEnv.appUrl);
  if (result.success) {
    redirectUrl.searchParams.set("verified", "true");
  } else {
    redirectUrl.searchParams.set("verified", "false");
    redirectUrl.searchParams.set(
      "error",
      result.error || "Token verifikasi kedaluwarsa atau tidak valid"
    );
  }

  return NextResponse.redirect(redirectUrl);
}
