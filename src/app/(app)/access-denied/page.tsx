"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const ROLE_DISPLAY: Record<string, string> = {
  "Normal User": "Pengguna",
  "Web Manager": "Manajer Web",
  "Super Admin": "Super Admin",
  USER: "Pengguna",
  MANAGER: "Manajer Web",
  ADMIN: "Super Admin",
};

export default function AccessDeniedPage() {
  const { user } = useAuth();

  const restrictedScreens =
    user.role === "USER"
      ? "Log Audit, Manajemen Pengguna"
      : user.role === "MANAGER"
      ? "Manajemen Pengguna"
      : "Tidak ada";

  return (
    <div className="space-y-6">
      <h1 className="text-[26px] font-bold text-[#1f2a37]">Akses Ditolak</h1>

      <div className="rounded-[10px] border border-[#e5e7eb] bg-white p-8 shadow-card">
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#f6e8e8] text-[#8f181b]">
            <Lock className="h-6 w-6" />
          </div>

          <h2 className="text-[16px] font-semibold text-[#8f181b]">
            403 - Akses Ditolak
          </h2>

          <p className="mt-2 text-[13px] text-[#6b7280]">
            Peran Anda ({ROLE_DISPLAY[user.roleLabel] || user.roleLabel}) tidak dapat mengakses: {restrictedScreens}
          </p>

          <Link
            href="/dashboard"
            className="mt-6 inline-flex h-9 items-center justify-center rounded-[10px] bg-[#016db0] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#015a92]"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
