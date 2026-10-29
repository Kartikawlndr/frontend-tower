"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAuth } from "@/context/AuthContext";

function SetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authenticated, loading: sessionLoading, user, setUser } = useAuth();
  const token = searchParams.get("token") ?? "";
  const mode = searchParams.get("mode");
  const forcedChange = mode === "forced";
  const validMode = mode === "invite" || mode === "reset" || forcedChange;
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSuccess(false);
    if (password.length < 12 || password.length > 128) {
      setMessage("Password harus berisi 12 sampai 128 karakter.");
      return;
    }
    if (password !== confirmation) {
      setMessage("Konfirmasi password belum sama.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        forcedChange ? "/api/account/forced-password" : "/api/account/complete-password",
        {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          forcedChange ? { password } : { token, password, mode },
        ),
      });
      const result = (await response.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;
      if (!response.ok) {
        throw new Error(result?.error || result?.message || "Password tidak dapat disimpan.");
      }
      setMessage(result?.message || "Password berhasil disimpan.");
      setSuccess(true);
      setPassword("");
      setConfirmation("");
      if (forcedChange) {
        setUser({ ...user, mustChangePassword: false });
        router.replace("/dashboard");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Password tidak dapat disimpan.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <section className="w-full max-w-lg space-y-6 rounded-card border border-border-soft bg-surface p-8 shadow-card">
        <header>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Portal Infrastruktur Pasif</p>
          <h1 className="mt-2 text-2xl font-bold text-heading">
            {mode === "invite"
              ? "Aktifkan akun"
              : forcedChange
                ? "Ganti password sementara"
                : "Atur password baru"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {mode === "invite"
              ? "Buat password untuk menyelesaikan undangan akun."
              : forcedChange
                ? "Super Admin mengatur password sementara untuk akun Anda. Buat password baru untuk melanjutkan."
                : "Buat password baru untuk akun Anda."}
          </p>
        </header>
        {forcedChange && sessionLoading ? (
          <p role="status" className="text-sm text-muted">Memeriksa sesi akun...</p>
        ) : forcedChange && !authenticated ? (
          <p role="alert" className="text-sm text-danger">
            Sesi login tidak ditemukan. Silakan login kembali untuk mengganti password sementara.
          </p>
        ) : forcedChange && !user.mustChangePassword ? (
          <p role="status" className="text-sm text-muted">
            Tidak ada kewajiban mengganti password. <Link href="/dashboard" className="font-semibold text-primary">Kembali ke portal</Link>
          </p>
        ) : !validMode || (!forcedChange && !token) ? (
          <p role="alert" className="text-sm text-danger">Tautan tidak lengkap atau tidak valid. Minta Super Admin mengirim tautan baru.</p>
        ) : success ? (
          <div role="status" className="space-y-4">
            <p className="text-sm text-primary">{message}</p>
            <Link href={forcedChange ? "/dashboard" : "/"} className="inline-flex rounded-card bg-primary px-4 py-2 text-sm font-semibold text-on-primary">{forcedChange ? "Lanjut ke portal" : "Lanjut ke login"}</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <label className="flex flex-col gap-2 text-sm font-medium text-heading">
              Password baru
              <input autoComplete="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={12} maxLength={128} required className="h-10 rounded-input border border-border px-3" />
              <span className="text-xs text-muted">Minimal 12 karakter.</span>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-heading">
              Ulangi password baru
              <input autoComplete="new-password" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={12} maxLength={128} required className="h-10 rounded-input border border-border px-3" />
            </label>
            {message && <p role="alert" className="text-sm text-danger">{message}</p>}
            <button type="submit" disabled={submitting} className="rounded-card bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-50">
              {submitting ? "Menyimpan..." : "Simpan password"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-helper">Memeriksa tautan...</p>}>
      <SetPasswordForm />
    </Suspense>
  );
}
