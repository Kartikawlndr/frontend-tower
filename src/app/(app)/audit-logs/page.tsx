"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type AuditEntry = {
  id: string | number;
  action: string;
  collection?: string;
  item?: string;
  timestamp?: string;
  user?: { first_name?: string; last_name?: string } | null;
};
type AuditResponse = { data?: AuditEntry[]; error?: string };

function parseTimestamp(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function formatDate(value?: string) {
  const date = parseTimestamp(value);
  return date ? date.toLocaleDateString("id-ID") : "—";
}

function formatTime(value?: string) {
  const date = parseTimestamp(value);
  return date ? date.toLocaleTimeString("id-ID", { hour12: false }) : "—";
}

function actionLabel(action: string) {
  switch (action) {
    case "create":
      return "Tambah";
    case "update":
      return "Perbarui";
    case "delete":
      return "Hapus";
    default:
      return action;
  }
}

export default function AuditLogsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/audit?limit=100", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as AuditResponse | null;
        if (!response.ok) throw new Error(payload?.error || "Log audit tidak dapat dimuat.");
        if (active) setEntries(payload?.data ?? []);
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Log audit tidak dapat dimuat.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (user.role === "USER") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="max-w-md space-y-4 rounded-card border border-border-soft bg-surface p-10 text-center shadow-card">
          <h2 className="text-lg font-bold text-danger">403 - Akses Ditolak</h2>
          <p className="text-xs text-muted">Log audit hanya dapat diakses Web Manager dan Super Admin.</p>
          <button onClick={() => router.push("/dashboard")} className="rounded-card bg-primary px-4 py-2 text-xs font-semibold text-on-primary">Kembali ke Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-page-title">Log Audit</h1>
      <section className="space-y-4 rounded-card border border-border-soft bg-surface p-6 shadow-card">
        <h2 className="text-sm font-bold text-heading">Aktivitas sistem dan riwayat log</h2>
        {error && <div role="alert" className="text-sm text-danger">{error}</div>}
        <div className="overflow-x-auto rounded-input border border-border-soft">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border-soft bg-table-head-bg font-semibold text-heading">
              <tr><th className="p-3.5">Tanggal</th><th className="p-3.5">Waktu</th><th className="p-3.5">Pengguna</th><th className="p-3.5">Aksi</th><th className="p-3.5">Koleksi</th><th className="p-3.5">Item</th></tr>
            </thead>
            <tbody className="divide-y divide-border-soft text-muted">
              {loading ? <tr><td colSpan={6} className="p-6 text-center">Memuat log...</td></tr> : entries.length === 0 ? <tr><td colSpan={6} className="p-6 text-center">Belum ada aktivitas.</td></tr> : entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="whitespace-nowrap p-3.5">{formatDate(entry.timestamp)}</td>
                  <td className="whitespace-nowrap p-3.5">{formatTime(entry.timestamp)}</td>
                  <td className="p-3.5">{`${entry.user?.first_name ?? ""} ${entry.user?.last_name ?? ""}`.trim() || "—"}</td>
                  <td className="p-3.5">{actionLabel(entry.action)}</td>
                  <td className="p-3.5">{entry.collection || "—"}</td>
                  <td className="p-3.5">{entry.item || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
