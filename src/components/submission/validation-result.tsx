import Link from "next/link";
import { CircleAlert, CircleCheck } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, Th, Td } from "@/components/ui/table";

const SAMPLE_NOTE =
  "Data contoh. Hasil validasi akan diambil dari sistem pengajuan setelah terhubung.";

const REJECTED_ROWS = [
  { row: 4, field: "Longitude", value: "142.5", error: "Harus antara 95 dan 141", kind: "invalid" },
  { row: 7, field: "Tahun Pembangunan", value: "2031", error: "Masukkan 4 digit tahun dari 1900 hingga tahun saat ini", kind: "invalid" },
  { row: 9, field: "Tinggi Menara (AGL)", value: "1200", error: "Masukkan bilangan bulat 1 sampai 999 (meter)", kind: "invalid" },
  { row: 12, field: "Kode/ID Menara", value: "TWR-0005", error: "Duplikat dari baris 5 pada file ini", kind: "duplicate" },
] as const;

const SUMMARY = [
  { label: "No. Registrasi", value: "REG-2026-000004" },
  { label: "Diajukan oleh", value: "demo" },
  { label: "Tanggal", value: "19/10/2026" },
  { label: "Metode", value: "Unggah Excel" },
  { label: "Total baris", value: "12" },
];

export function RejectedResult() {
  const invalid = REJECTED_ROWS.filter((r) => r.kind === "invalid").length;
  const duplicate = REJECTED_ROWS.filter((r) => r.kind === "duplicate").length;

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-6">
      <h1 className="text-page-title">Hasil Validasi</h1>

      <Card>
        <CardBody className="flex flex-col gap-4">
          <div
            role="alert"
            className="flex items-center gap-2 rounded-card border border-danger bg-danger-bg px-3 py-2 text-sm font-semibold text-danger"
          >
            <CircleAlert className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
            Pengajuan ditolak: {invalid} baris tidak valid, {duplicate} baris duplikat
          </div>
          <p className="text-helper">
            Tidak ada data yang disimpan. Perbaiki baris di bawah ini dan ajukan kembali.
          </p>
          <Table>
            <thead>
              <tr>
                <Th>Baris</Th>
                <Th>Kolom / Field</Th>
                <Th>Nilai</Th>
                <Th>Keterangan Kesalahan</Th>
              </tr>
            </thead>
            <tbody>
              {REJECTED_ROWS.map((r) => (
                <tr key={`${r.row}-${r.field}`}>
                  <Td>{r.row}</Td>
                  <Td>{r.field}</Td>
                  <Td>{r.value}</Td>
                  <Td className="text-danger">{r.error}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <div className="flex justify-end gap-3">
            <Button asChild variant="outline">
              <Link href="/submission">Kembali</Link>
            </Button>
            <Button asChild>
              <Link href="/submission/upload">Unggah Ulang</Link>
            </Button>
          </div>
        </CardBody>
      </Card>

      <p className="text-caption-note">{SAMPLE_NOTE}</p>
    </div>
  );
}

export function RegisteredResult() {
  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-6">
      <h1 className="text-page-title">Hasil Validasi</h1>

      <Card>
        <CardBody className="flex flex-col gap-4">
          <div
            role="status"
            className="flex items-center gap-2 rounded-card border border-primary bg-nav-active-bg px-3 py-2 text-sm font-semibold text-primary"
          >
            <CircleCheck className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
            Pengajuan berhasil terdaftar
          </div>
          <dl className="grid gap-4 sm:grid-cols-3">
            {SUMMARY.map((s) => (
              <div key={s.label} className="flex flex-col gap-1">
                <dt className="text-field-label">{s.label}</dt>
                <dd className="text-base text-text">{s.value}</dd>
              </div>
            ))}
            <div className="flex flex-col gap-1">
              <dt className="text-field-label">Status</dt>
              <dd>
                <Badge variant="success">Terdaftar</Badge>
              </dd>
            </div>
          </dl>
          <p className="text-helper">Konfirmasi telah dikirimkan ke email yang terdaftar.</p>
          <div className="flex justify-end gap-3">
            <Button asChild variant="outline">
              <Link href="/submission">Pengajuan Baru</Link>
            </Button>
            <Button asChild>
              <Link href="/submission/REG-2026-000004">Lihat Rincian</Link>
            </Button>
          </div>
        </CardBody>
      </Card>

      <p className="text-caption-note">{SAMPLE_NOTE}</p>
    </div>
  );
}
