import { NextResponse } from "next/server";
import { directusVerifyEmail } from "@/lib/directus";
import { getServerEnv } from "@/lib/server-env";

const INVALID_LINK_MESSAGE = "Tautan verifikasi tidak valid atau kedaluwarsa.";

export async function GET(request: Request) {
  let redirectUrl: URL;

  try {
    redirectUrl = new URL("/", getServerEnv().appUrl);
    if (!["http:", "https:"].includes(redirectUrl.protocol)) {
      throw new Error("App URL must use HTTP or HTTPS.");
    }
  } catch (error) {
    console.error("App URL is invalid for email verification:", error);
    return NextResponse.json(
      { error: "Konfigurasi layanan verifikasi tidak valid." },
      { status: 500 },
    );
  }

  const token = new URL(request.url).searchParams.get("token");
  if (!token || token.length > 4096) {
    redirectUrl.searchParams.set("verified", "false");
    redirectUrl.searchParams.set("error", INVALID_LINK_MESSAGE);
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const result = await directusVerifyEmail(token);
    redirectUrl.searchParams.set("verified", String(result.success));
    if (!result.success) {
      redirectUrl.searchParams.set("error", INVALID_LINK_MESSAGE);
    }
  } catch (error) {
    console.error("Directus email verification request failed:", {
      error: error instanceof Error ? error.name : "Unknown error",
    });
    redirectUrl.searchParams.set("verified", "false");
    redirectUrl.searchParams.set(
      "error",
      "Layanan verifikasi sedang tidak tersedia. Coba lagi nanti.",
    );
  }

  return NextResponse.redirect(redirectUrl);
}
