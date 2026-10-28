import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/server-env";
import { directusRegister } from "@/lib/directus";
import { isSameOriginRequest } from "@/lib/portal-proxy";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 });
  }

  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Data pendaftaran tidak valid." }, { status: 400 });
    }
    const { fullName, email, password } = body;

    if (
      typeof fullName !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !fullName.trim() ||
      !email.trim() ||
      !password
    ) {
      return NextResponse.json(
        { error: "Nama lengkap, email, dan kata sandi wajib diisi" },
        { status: 400 }
      );
    }

    const serverEnv = getServerEnv();
    const nameParts = fullName.trim().split(/\s+/);
    const [firstName, ...lastNameParts] = nameParts;
    const lastName = lastNameParts.join(" ");

    // Check if registration is enabled in .env
    if (!serverEnv.userRegister) {
      return NextResponse.json(
        { error: "Pendaftaran akun baru saat ini sedang dinonaktifkan." },
        { status: 403 }
      );
    }

    // Call Directus registration API
    const directusRes = await directusRegister({
      email: email.trim(),
      password,
      first_name: firstName,
      last_name: lastName,
      verification_url: new URL(
        "/api/verify-email",
        serverEnv.appUrl,
      ).toString(),
    });

    if (directusRes.success) {
      return NextResponse.json({
        success: true,
        message:
          directusRes.message ||
          "Pendaftaran berhasil! Tautan verifikasi telah dikirimkan ke email Anda.",
      });
    }

    return NextResponse.json(
      { error: directusRes.error || "Pendaftaran ke Directus gagal." },
      { status: 502 },
    );
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || "Registration error" },
      { status: 500 }
    );
  }
}
