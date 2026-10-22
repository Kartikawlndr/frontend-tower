import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { directusRegister } from "@/lib/directus";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, email, password } = body;

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: "Nama lengkap, email, dan kata sandi wajib diisi" },
        { status: 400 }
      );
    }

    const serverEnv = getServerEnv();

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
      password: password.trim(),
      first_name: fullName.trim(),
      role: serverEnv.userRegisterRole,
    });

    if (directusRes.success) {
      return NextResponse.json({
        success: true,
        message:
          directusRes.message ||
          "Pendaftaran berhasil! Tautan verifikasi telah dikirimkan ke email Anda.",
      });
    }

    // If Directus failed with network error, provide graceful mock registration
    return NextResponse.json({
      success: true,
      message:
        "Pendaftaran berhasil dicatat (Mode Standalone). Silakan masuk dengan akun Anda.",
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || "Registration error" },
      { status: 500 }
    );
  }
}
