import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/server-env";
import { isSameOriginRequest } from "@/lib/portal-proxy";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 });
  }

  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Alamat email tidak valid." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (
    email.length === 0 ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return NextResponse.json({ error: "Alamat email tidak valid." }, { status: 400 });
  }

  const directusUrl = getServerEnv().directusUrl.replace(/\/+$/, "");
  let response: Response;
  try {
    response = await fetch(`${directusUrl}/applicant-portal/request-password-reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return NextResponse.json(
      { error: "Layanan reset password sedang tidak dapat dijangkau." },
      { status: 502 },
    );
  }

  const payload = (await response.json().catch(() => null)) as
    | { message?: string; error?: string }
    | null;
  if (!response.ok) {
    return NextResponse.json(
      { error: payload?.error || "Permintaan reset password gagal." },
      { status: response.status },
    );
  }
  return NextResponse.json({
    message:
      payload?.message ||
      "Jika email terdaftar dan akun aktif, tautan reset akan dikirim ke email tersebut.",
  });
}
