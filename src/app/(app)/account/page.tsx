"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

const ROLE_DISPLAY: Record<string, string> = {
  "Normal User": "Pengguna",
  "Web Manager": "Manajer Web",
  "Super Admin": "Super Admin",
};

export default function AccountPage() {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await fetch("/api/account/password", { method: "POST" });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Tautan verifikasi tidak dapat dikirim.");
      }
      setSuccess(
        payload?.message ||
          `Tautan verifikasi perubahan kata sandi telah diminta untuk ${user.email}.`,
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Tautan verifikasi tidak dapat dikirim.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-[26px] font-bold text-[#1f2a37]">Akun</h1>

      <div className="rounded-[10px] border border-[#e5e7eb] bg-white p-6">
        <h2 className="mb-4 text-[16px] font-semibold text-[#1f2a37]">
          Profil Pengguna
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#1f2a37]">
              Nama
            </label>
            <input
              type="text"
              disabled
              value={user.name}
              className="h-9 w-full cursor-not-allowed rounded-lg border border-[#d0d5db] bg-[#f5f6f8] px-3 text-[13px] text-[#6b7280]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#1f2a37]">
              Email
            </label>
            <input
              type="email"
              disabled
              value={user.email}
              className="h-9 w-full cursor-not-allowed rounded-lg border border-[#d0d5db] bg-[#f5f6f8] px-3 text-[13px] text-[#6b7280]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#1f2a37]">
              Peran
            </label>
            <input
              type="text"
              disabled
              value={ROLE_DISPLAY[user.roleLabel] || user.roleLabel}
              className="h-9 w-full cursor-not-allowed rounded-lg border border-[#d0d5db] bg-[#f5f6f8] px-3 text-[13px] text-[#6b7280]"
            />
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-[10px] border border-[#e5e7eb] bg-white p-6"
      >
        <h2 className="mb-2 text-[16px] font-semibold text-[#1f2a37]">
          Ubah Kata Sandi
        </h2>
        <p className="mb-4 text-[13px] text-[#6b7280]">
          Untuk keamanan, perubahan kata sandi harus dikonfirmasi melalui tautan
          yang dikirim ke email akun Anda.
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-[#8f181b] bg-[#f6e8e8] px-4 py-2.5 text-[13px] text-[#8f181b]">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg border border-[#016db0] bg-[#eaf5fc] px-4 py-2.5 text-[13px] text-[#016db0]">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="h-10 rounded-lg bg-[#016db0] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#005b96] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Mengirim..." : "Kirim Tautan Verifikasi"}
        </button>
      </form>
    </div>
  );
}
