"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileSpreadsheet, ClipboardList } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Table, Th, Td } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const METHODS = [
  {
    value: "upload",
    href: "/submission/upload",
    title: "Unggah Excel",
    description: "Daftarkan banyak data menara sekaligus dari file .xlsx.",
    icon: FileSpreadsheet,
  },
  {
    value: "form",
    href: "/submission/form",
    title: "Formulir Pendaftaran",
    description: "Daftarkan satu data menara dengan mengisi formulir langsung.",
    icon: ClipboardList,
  },
] as const;

type MethodValue = (typeof METHODS)[number]["value"];

const STATUS_VARIANT: Record<string, "success" | "destructive" | "warning"> = {
  Registered: "success",
  Rejected: "destructive",
  Draft: "warning",
};

type SubmissionAttempt = {
  id: string | number;
  status: string;
  registration_code?: string;
  metode_pendaftaran?: string;
  date_created?: string;
  validation_errors?: Array<{
    row?: number | null;
    column?: string | null;
    field?: string;
    message?: string;
  }>;
};

type SubmissionTower = {
  id: string;
  id_menara?: string;
  date_created?: string;
  metode_pendaftaran?: string;
  verification_status?: string;
  registration_attempts?: SubmissionAttempt[];
};

type RecentSubmission = {
  id: string;
  towerId: string | null;
  code: string;
  date: string;
  method: string;
  status: string;
  validationErrors?: SubmissionAttempt["validation_errors"];
};

type SubmissionsResponse = {
  data?: SubmissionTower[];
  rejected_attempts?: SubmissionAttempt[];
  draft_attempt?: { id: string | number; date_updated?: string } | null;
  error?: string;
};

function recentSubmissions(payload: SubmissionsResponse): RecentSubmission[] {
  const rows: RecentSubmission[] = [];
  for (const tower of payload.data ?? []) {
    for (const attempt of tower.registration_attempts ?? []) {
      rows.push({
        id: `${tower.id}-${attempt.id}`,
        towerId: tower.id,
        code: attempt.registration_code || tower.id_menara || "—",
        date: attempt.date_created || tower.date_created || "",
        method: attempt.metode_pendaftaran || tower.metode_pendaftaran || "",
        status: attempt.status,
        validationErrors: attempt.validation_errors,
      });
    }
  }
  for (const attempt of payload.rejected_attempts ?? []) {
    rows.push({
      id: `rejected-${attempt.id}`,
      towerId: null,
      code: "—",
      date: attempt.date_created || "",
      method: attempt.metode_pendaftaran || "",
      status: "Rejected",
      validationErrors: attempt.validation_errors,
    });
  }
  if (payload.draft_attempt) {
    rows.push({
      id: `draft-${payload.draft_attempt.id}`,
      towerId: null,
      code: "—",
      date: payload.draft_attempt.date_updated || "",
      method: "Input Manual",
      status: "Draft",
    });
  }
  return rows.sort((left, right) => right.date.localeCompare(left.date)).slice(0, 4);
}

export default function SubmissionPage() {
  const router = useRouter();
  const [method, setMethod] = useState<MethodValue>("upload");
  const [recent, setRecent] = useState<RecentSubmission[]>([]);
  const [selectedRejection, setSelectedRejection] = useState<RecentSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/towers?limit=10", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as SubmissionsResponse | null;
        if (!response.ok) throw new Error(payload?.error || "Pengajuan terbaru tidak dapat dimuat.");
        if (active) {
          setRecent(recentSubmissions(payload ?? {}));
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Pengajuan terbaru tidak dapat dimuat.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const selected = METHODS.find((m) => m.value === method)!;

  return (
    <div className="mx-auto flex max-w-240 flex-col gap-6">
      <h1 className="text-page-title">Pengajuan Data</h1>

      <Card title="Metode Pengajuan">
        <CardBody className="flex flex-col gap-4 pt-4">
          <p className="text-helper">
            Pilih metode untuk mendaftarkan data menara Anda.
          </p>
          <div
            role="radiogroup"
            aria-label="Metode Pengajuan"
            className="grid gap-4 sm:grid-cols-2"
          >
            {METHODS.map((m) => {
              const isSelected = m.value === method;
              const Icon = m.icon;
              return (
                <label
                  key={m.value}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-card border p-4 transition-colors duration-150 has-focus-visible:ring-2 has-focus-visible:ring-primary/40",
                    isSelected
                      ? "border-primary bg-nav-active-bg"
                      : "border-border-soft bg-surface hover:bg-canvas"
                  )}
                >
                  <input
                    type="radio"
                    name="submission-method"
                    value={m.value}
                    checked={isSelected}
                    onChange={() => setMethod(m.value)}
                    className="mt-1 h-4 w-4 accent-primary"
                  />
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-2 text-base font-semibold text-heading">
                      <Icon className="h-4 w-4 text-primary" strokeWidth={2} />
                      {m.title}
                    </span>
                    <span className="text-helper">{m.description}</span>
                  </div>
                </label>
              );
            })}
          </div>
          <div className="flex justify-end">
            <Button onClick={() => router.push(selected.href)}>Selanjutnya</Button>
          </div>
        </CardBody>
      </Card>

      <Card title="Pengajuan Terbaru Anda">
        <CardBody className="flex flex-col gap-4 pt-4">
          <Table>
            <thead>
              <tr>
                <Th>No. Registrasi</Th>
                <Th>Tanggal</Th>
                <Th>Metode</Th>
                <Th>Status</Th>
                <Th>Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><Td colSpan={5} className="py-8 text-center text-muted">Memuat pengajuan...</Td></tr>
              ) : recent.length === 0 ? (
                <tr><Td colSpan={5} className="py-8 text-center text-muted">{error || "Belum ada data pengajuan."}</Td></tr>
              ) : recent.map((r) => (
                <tr key={r.id}>
                  <Td>{r.code}</Td>
                  <Td>{r.date ? new Date(r.date).toLocaleDateString("id-ID") : "—"}</Td>
                  <Td>
                    {r.method === "Upload Document (.xlsx)"
                      ? r.method
                      : r.method === "Upload Excel"
                        ? "Unggah Excel"
                        : "Formulir Pendaftaran"}
                  </Td>
                  <Td>
                    <Badge variant={STATUS_VARIANT[r.status] ?? "warning"}>
                      {r.status === "Registered" ? "Terdaftar" : r.status === "Rejected" ? "Ditolak" : "Draf"}
                    </Badge>
                  </Td>
                  <Td>
                    {r.status === "Draft" ? (
                      <Link
                        href={`/submission/form?draft_id=${encodeURIComponent(r.id.slice("draft-".length))}`}
                        className="font-semibold text-primary hover:underline"
                      >
                        Lanjutkan
                      </Link>
                    ) : r.towerId ? (
                      <Link
                        href={`/submission/${r.towerId}`}
                        className="font-semibold text-primary hover:underline"
                      >
                        Lihat
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedRejection(r)}
                        className="font-semibold text-primary hover:underline"
                      >
                        Lihat alasan
                      </button>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <div>
            <Link
              href="/submission/history"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Lihat Semua Riwayat
            </Link>
          </div>
        </CardBody>
      </Card>

      <Dialog
        open={selectedRejection !== null}
        onClose={() => setSelectedRejection(null)}
        title="Alasan penolakan"
        description="Periksa rincian berikut sebelum mengirim ulang data."
        footer={
          <Button variant="outline" onClick={() => setSelectedRejection(null)}>
            Tutup
          </Button>
        }
      >
        {selectedRejection?.validationErrors?.some((issue) => issue.message) ? (
          <ul className="list-inside list-disc space-y-2 text-sm text-danger">
            {selectedRejection.validationErrors.map((issue, index) => {
              const context = [
                issue.row ? `Baris ${issue.row}` : "",
                issue.column || issue.field || "",
              ].filter(Boolean).join(", ");
              return (
                <li key={`${selectedRejection.id}-${index}`}>
                  {context ? `${context}: ` : ""}
                  {issue.message}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted">
            Rincian alasan penolakan tidak tersedia.
          </p>
        )}
      </Dialog>
    </div>
  );
}
