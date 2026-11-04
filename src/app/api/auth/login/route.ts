import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/server-env";
import { directusFetch, setDirectusTokens } from "@/lib/directus-session";

const roleMap = {
  Applicant: { role: "USER", roleLabel: "Normal User" },
  "Web Manager": { role: "MANAGER", roleLabel: "Web Manager" },
  Administrator: { role: "ADMIN", roleLabel: "Super Admin" },
} as const;

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 });
  }

  let body: { username?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Data login tidak valid." }, { status: 400 });
  }

  const email = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) {
    return NextResponse.json(
      { error: "Email dan kata sandi wajib diisi." },
      { status: 400 },
    );
  }

  const directusUrl = getServerEnv().directusUrl.replace(/\/$/, "");
  let loginResponse: Response;
  try {
    loginResponse = await fetch(`${directusUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, mode: "json" }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error: "Layanan autentikasi sedang tidak dapat dijangkau." },
      { status: 502 },
    );
  }

  if (!loginResponse.ok) {
    if (loginResponse.status === 401) {
      const loginStatusSecret = process.env.PORTAL_LOGIN_STATUS_SECRET;
      if (!loginStatusSecret) {
        return NextResponse.json(
          { error: "Status akun tidak dapat diverifikasi saat ini. Coba lagi." },
          { status: 503 },
        );
      }

      let statusResponse: Response;
      try {
        statusResponse = await fetch(
          `${directusUrl}/applicant-portal/login-status`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-portal-login-status-secret": loginStatusSecret,
            },
            body: JSON.stringify({ email, password }),
            cache: "no-store",
          },
        );
      } catch {
        return NextResponse.json(
          { error: "Status akun tidak dapat diverifikasi saat ini. Coba lagi." },
          { status: 503 },
        );
      }

      if (statusResponse.status === 429) {
        return NextResponse.json(
          { error: "Terlalu banyak percobaan masuk. Coba lagi beberapa saat." },
          { status: 429 },
        );
      }
      if (!statusResponse.ok) {
        return NextResponse.json(
          { error: "Status akun tidak dapat diverifikasi saat ini. Coba lagi." },
          { status: 503 },
        );
      }

      const statusPayload = (await statusResponse.json().catch(() => null)) as
        | { suspended?: boolean }
        | null;
      if (typeof statusPayload?.suspended !== "boolean") {
        return NextResponse.json(
          { error: "Respons status akun tidak valid." },
          { status: 502 },
        );
      }
      if (statusPayload.suspended) {
        return NextResponse.json(
          { error: "Akun Anda ditangguhkan. Hubungi Admin untuk bantuan." },
          { status: 403 },
        );
      }
    }

    return NextResponse.json(
      { error: "Email atau kata sandi salah." },
      { status: 401 },
    );
  }

  const loginPayload = (await loginResponse.json().catch(() => null)) as
    | { data?: { access_token?: string; refresh_token?: string; expires?: number } }
    | null;
  const tokens = loginPayload?.data;
  if (
    !tokens?.access_token ||
    !tokens.refresh_token ||
    !Number.isFinite(tokens.expires)
  ) {
    return NextResponse.json(
      { error: "Respons autentikasi tidak valid." },
      { status: 502 },
    );
  }

  let profileResponse: Response;
  try {
    profileResponse = await directusFetch(
      "/applicant-portal/profile",
      { method: "GET" },
      tokens.access_token,
    );
  } catch {
    return NextResponse.json(
      { error: "Profil akun tidak dapat diverifikasi saat ini." },
      { status: 502 },
    );
  }
  if (!profileResponse.ok) {
    return NextResponse.json(
      { error: "Akun ditangguhkan atau peran akun tidak diizinkan mengakses portal." },
      { status: 403 },
    );
  }

  const profilePayload = (await profileResponse.json().catch(() => null)) as
    | {
        data?: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          role?: string;
          must_change_password?: boolean;
        };
      }
    | null;
  const profile = profilePayload?.data;
  if (
    !profile?.id ||
    !profile.email ||
    !profile.role ||
    !Object.hasOwn(roleMap, profile.role)
  ) {
    return NextResponse.json(
      { error: "Peran akun tidak diizinkan mengakses portal." },
      { status: 403 },
    );
  }

  await setDirectusTokens(tokens as {
    access_token: string;
    refresh_token: string;
    expires: number;
  });
  const mappedRole = roleMap[profile.role as keyof typeof roleMap];
  return NextResponse.json({
    success: true,
    user: {
      id: profile.id,
      name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email,
      email: profile.email,
      mustChangePassword: profile.must_change_password === true,
      ...mappedRole,
    },
  });
}
