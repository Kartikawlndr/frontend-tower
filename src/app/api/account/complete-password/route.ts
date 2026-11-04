import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/server-env";
import { isSameOriginRequest } from "@/lib/portal-proxy";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "Permintaan tidak valid." }, { status: 403 });
  }

  let body: {
    token?: unknown;
    password?: unknown;
    mode?: unknown;
    first_name?: unknown;
    last_name?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Data password tidak valid." }, { status: 400 });
  }
  const firstName =
    typeof body.first_name === "string" ? body.first_name.trim() : "";
  const lastName =
    typeof body.last_name === "string" ? body.last_name.trim() : "";
  if (
    typeof body.token !== "string" ||
    body.token.length === 0 ||
    body.token.length > 4096 ||
    typeof body.password !== "string" ||
    body.password.length < 12 ||
    body.password.length > 128 ||
    (body.mode !== "invite" && body.mode !== "reset") ||
    (body.mode === "invite" &&
      (!firstName ||
        firstName.length > 50 ||
        !lastName ||
        lastName.length > 50))
  ) {
    return NextResponse.json({ message: "Tautan atau password tidak valid." }, { status: 400 });
  }

  const endpoint =
    body.mode === "invite" ? "accept-invite" : "complete-password-reset";
  const directusUrl = getServerEnv().directusUrl.replace(/\/+$/, "");
  let response: Response;
  try {
    response = await fetch(`${directusUrl}/applicant-portal/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: body.token,
        password: body.password,
        ...(body.mode === "invite"
          ? {
              first_name: firstName,
              last_name: lastName,
            }
          : {}),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return NextResponse.json(
      { message: "Layanan pengaturan password sedang tidak tersedia." },
      { status: 502 },
    );
  }

  if (response.status === 204) {
    return NextResponse.json({ message: "Password berhasil disimpan." });
  }
  const payload = (await response.json().catch(() => null)) as
    | { error?: string }
    | null;
  return NextResponse.json(
    { message: payload?.error || "Tautan tidak valid atau sudah kedaluwarsa." },
    { status: response.status },
  );
}
