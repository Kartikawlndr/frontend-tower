"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Pagination } from "@/components/ui/pagination";
import { formatDateWib, formatTimeWib } from "@/lib/date-time";

type AuditEntry = {
  id: string | number;
  action: string;
  collection?: string;
  timestamp?: string;
  user?: { first_name?: string; last_name?: string } | null;
};
type AuditResponse = {
  data?: AuditEntry[];
  meta?: { total?: number };
  error?: string;
};

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

function csvCell(value: string) {
  const safeValue = /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replaceAll('"', '""')}"`;
}

export default function AuditLogsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  async function downloadAudit() {
    setDownloading(true);
    setError("");
    try {
      const allEntries: AuditEntry[] = [];
      let total = Number.POSITIVE_INFINITY;
      let page = 1;
      while (allEntries.length < total) {
        const response = await fetch(`/api/audit?page=${page}&limit=100`, {
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => null)) as AuditResponse | null;
        if (!response.ok) {
          throw new Error(payload?.error || "Log audit tidak dapat diunduh.");
        }
        const batch = payload?.data ?? [];
        allEntries.push(...batch);
        total = Number.isFinite(payload?.meta?.total)
          ? Number(payload?.meta?.total)
          : allEntries.length;
        if (batch.length === 0) break;
        page += 1;
      }

      const headers = ["Tanggal", "Waktu", "Pengguna", "Aksi", "Koleksi"];
      const rows = allEntries.map((entry) => [
        formatDateWib(entry.timestamp),
        formatTimeWib(entry.timestamp),
        `${entry.user?.first_name ?? ""} ${entry.user?.last_name ?? ""}`.trim() || "—",
        actionLabel(entry.action),
        entry.collection || "—",
      ]);
      const csv = `\uFEFF${[headers, ...rows]
        .map((row) => row.map(csvCell).join(","))
        .join("\r\n")}`;
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "log-audit.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Log audit tidak dapat diunduh.",
      );
    } finally {
      setDownloading(false);
    }
  }

  useEffect(() => {
    let active = true;
    fetch(`/api/audit?page=${page}&limit=${pageSize}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as AuditResponse | null;
        if (!response.ok) throw new Error(payload?.error || "Log audit tidak dapat dimuat.");
        if (active) {
          setEntries(payload?.data ?? []);
          setTotal(Number.isFinite(payload?.meta?.total) ? Number(payload?.meta?.total) : 0);
        }
      })
      .catch((requestError) => {
        if (active) {
          setEntries([]);
          setTotal(0);
          setError(requestError instanceof Error ? requestError.message : "Log audit tidak dapat dimuat.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, pageSize]);

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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-heading">Aktivitas sistem dan riwayat log</h2>
          <button
            type="button"
            onClick={() => void downloadAudit()}
            disabled={downloading}
            className="inline-flex items-center gap-2 rounded-card bg-primary px-3 py-2 text-xs font-semibold text-on-primary disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {downloading ? "Mengunduh..." : "Unduh"}
          </button>
        </div>
        {error && <div role="alert" className="text-sm text-danger">{error}</div>}
        <div className="overflow-x-auto rounded-input border border-border-soft">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border-soft bg-table-head-bg font-semibold text-heading">
              <tr><th className="p-3.5">Tanggal</th><th className="p-3.5">Waktu</th><th className="p-3.5">Pengguna</th><th className="p-3.5">Aksi</th><th className="p-3.5">Koleksi</th></tr>
            </thead>
            <tbody className="divide-y divide-border-soft text-muted">
              {loading ? <tr><td colSpan={5} className="p-6 text-center">Memuat log...</td></tr> : entries.length === 0 ? <tr><td colSpan={5} className="p-6 text-center">Belum ada aktivitas.</td></tr> : entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="whitespace-nowrap p-3.5">{formatDateWib(entry.timestamp)}</td>
                  <td className="whitespace-nowrap p-3.5">{formatTimeWib(entry.timestamp)}</td>
                  <td className="p-3.5">{`${entry.user?.first_name ?? ""} ${entry.user?.last_name ?? ""}`.trim() || "—"}</td>
                  <td className="p-3.5">{actionLabel(entry.action)}</td>
                  <td className="p-3.5">{entry.collection || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={(nextPage) => {
            setLoading(true);
            setError("");
            setPage(nextPage);
          }}
          onPageSizeChange={(size) => {
            setLoading(true);
            setError("");
            setPageSize(size);
            setPage(1);
          }}
        />
      </section>
    </div>
  );
}
