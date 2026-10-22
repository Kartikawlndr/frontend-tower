import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TowerRecordsTable } from "@/components/submission/tower-records-table";
import {
  SUBMISSIONS,
  STATUS_VARIANT,
  formatDate,
  makeTowerRows,
} from "@/lib/dummy-submissions";

const EMPTY_MESSAGE = {
  Registered: "Tidak ada rekaman data.",
  Rejected: "Tidak ada data yang disimpan karena pengajuan ini ditolak.",
  Draft: "Draf ini belum dikirimkan.",
} as const;

const STATUS_TEXT: Record<string, string> = {
  Registered: "Terdaftar",
  Rejected: "Ditolak",
  Draft: "Draf",
};

const METHOD_TEXT: Record<string, string> = {
  "Upload Excel": "Unggah Excel",
  "Application Form": "Formulir Pendaftaran",
};

async function SubmissionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const submission = SUBMISSIONS.find((s) => s.reg === decodeURIComponent(id));
  if (!submission) notFound();

  const rows =
    submission.status === "Registered" ? makeTowerRows(submission.rows) : [];

  const summary = [
    { label: "No. Registrasi", value: submission.reg },
    { label: "Diajukan oleh", value: "demo" },
    { label: "Tanggal", value: formatDate(submission.iso) },
    { label: "Metode", value: METHOD_TEXT[submission.method] || submission.method },
    { label: "Total baris", value: String(submission.rows) },
  ];

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
      <h1 className="text-page-title">Detail Pengajuan</h1>

      <Card title="Ringkasan">
        <CardBody className="pt-4">
          <dl className="grid gap-4 sm:grid-cols-3">
            {summary.map((s) => (
              <div key={s.label} className="flex flex-col gap-1">
                <dt className="text-field-label">{s.label}</dt>
                <dd className="text-base text-text">{s.value}</dd>
              </div>
            ))}
            <div className="flex flex-col gap-1">
              <dt className="text-field-label">Status</dt>
              <dd>
                <Badge variant={STATUS_VARIANT[submission.status]}>
                  {STATUS_TEXT[submission.status] || submission.status}
                </Badge>
              </dd>
            </div>
          </dl>
        </CardBody>
      </Card>

      <TowerRecordsTable
        reg={submission.reg}
        rows={rows}
        emptyMessage={EMPTY_MESSAGE[submission.status]}
      />

      <div>
        <Button asChild variant="outline">
          <Link href="/submission/history">Kembali ke riwayat</Link>
        </Button>
      </div>

      <p className="text-caption-note">
        Data contoh. Rekaman data akan diambil dari database setelah terhubung.
      </p>
    </div>
  );
}

export default function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-helper">Memuat data pengajuan...</p>}>
      <SubmissionDetail params={params} />
    </Suspense>
  );
}
