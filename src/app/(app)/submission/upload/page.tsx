"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CloudUpload, Paperclip, X, Download } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, Th, Td } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { clientEnv, parsePayloadSize } from "@/lib/env";

const MAX_SIZE = parsePayloadSize(clientEnv.maxPayloadSize);

const TEXT_RULE = "Maksimal 50 karakter";

const COLUMNS = [
  { field: "Kode/ID Menara", type: "Teks", rule: TEXT_RULE },
  { field: "Nama Pemilik Menara", type: "Teks", rule: TEXT_RULE },
  { field: "Tahun Pembangunan", type: "Bilangan Bulat", rule: "4 digit, 1900 sampai tahun saat ini" },
  { field: "Penyelenggara Jaringan (Tenant)", type: "Teks", rule: "Maksimal 50 karakter, satu penyewa per baris" },
  { field: "Longitude", type: "Desimal", rule: "6 desimal, 95 sampai 141" },
  { field: "Latitude", type: "Desimal", rule: "6 desimal, -11 sampai 6" },
  { field: "Alamat", type: "Teks", rule: TEXT_RULE },
  { field: "Jenis Menara", type: "Teks", rule: TEXT_RULE },
  { field: "Tinggi Menara (AGL)", type: "Bilangan Bulat", rule: "Positif, maks 3 digit (meter)" },
  { field: "Kapasitas Maksimal", type: "Teks", rule: TEXT_RULE },
  {
    field: "Kapasitas Disewakan",
    type: "Teks",
    rule: "Total kapasitas menara; harus sama untuk semua baris dengan ID menara yang sama",
  },
  { field: "Kapasitas Digunakan Sendiri", type: "Teks", rule: TEXT_RULE },
];

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function UploadExcelPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const handleDownloadTemplate = () => {
    const link = document.createElement("a");
    link.href = "/Template_Pendaftaran_Menara.xlsx";
    link.download = "template-menara.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  function accept(next: File | undefined) {
    if (!next) return;
    if (!next.name.toLowerCase().endsWith(".xlsx")) {
      setFile(null);
      setError("Hanya file .xlsx yang diterima.");
      return;
    }
    if (next.size > MAX_SIZE) {
      setFile(null);
      setError(`Ukuran file lebih besar dari ${formatSize(MAX_SIZE)}.`);
      return;
    }
    setError("");
    setFile(next);
  }

  function clear() {
    setFile(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function upload() {
    if (!file) return;
    setUploading(true);
    setError("");
    const body = new FormData();
    body.append("file", file);
    try {
      const response = await fetch("/api/towers/bulk", {
        method: "POST",
        body,
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; errors?: Array<{ message?: string }> }
        | null;
      if (!response.ok) {
        const messages = payload?.errors
          ?.map(({ message }) => message)
          .filter(Boolean);
        throw new Error(
          messages?.join(" ") || payload?.error || "Impor Excel gagal.",
        );
      }
      router.push("/submission/history");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Impor Excel gagal.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-6">
      <h1 className="text-page-title">Unggah Excel</h1>

      <Card title="Unggah file">
        <CardBody className="flex flex-col gap-4 pt-4">
          {error && (
            <div
              role="alert"
              className="rounded-card border border-danger bg-danger-bg px-3 py-2 text-sm text-danger"
            >
              {error}
            </div>
          )}

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              accept(e.dataTransfer.files?.[0]);
            }}
            className={cn(
              "flex flex-col items-center gap-3 rounded-card border-2 border-dashed border-primary px-6 py-10 text-center transition-colors duration-150",
              dragging ? "bg-nav-active-bg" : "bg-dropzone-bg"
            )}
          >
            <CloudUpload className="h-10 w-10 text-primary" strokeWidth={1.5} aria-hidden />
            <p className="text-sm font-semibold text-heading">
              Tarik dan lepas file .xlsx di sini
            </p>
            <p className="text-helper">atau</p>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx"
              className="sr-only"
              aria-label="Pilih file .xlsx"
              tabIndex={-1}
              onChange={(e) => accept(e.target.files?.[0])}
            />
            <Button variant="outline" onClick={() => inputRef.current?.click()}>
              <Paperclip className="h-4 w-4" strokeWidth={2} />
              Pilih file
            </Button>
          </div>

          {file && (
            <div className="flex items-center justify-between rounded-card border border-border-soft bg-surface px-3 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <Paperclip className="h-4 w-4 shrink-0 text-muted" strokeWidth={2} />
                <span className="truncate text-sm text-heading">{file.name}</span>
                <span className="shrink-0 text-helper">{formatSize(file.size)}</span>
              </div>
              <button
                type="button"
                onClick={clear}
                aria-label="Hapus file"
                className="cursor-pointer text-danger"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          )}

          <p className="text-helper">
            Satu baris untuk satu penyewa. Jika ID menara sama, seluruh data menara termasuk kapasitas disewakan harus identik.
          </p>
          <div>
            <Button type="button" variant="outline" onClick={handleDownloadTemplate}>
              <Download className="h-4 w-4" strokeWidth={2} />
              Unduh template
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card title="Panduan Kolom Excel">
        <CardBody className="pt-4">
          <Table>
            <thead>
              <tr>
                <Th>No</Th>
                <Th>Kolom / Field</Th>
                <Th>Tipe</Th>
                <Th>Aturan</Th>
                <Th>Wajib</Th>
              </tr>
            </thead>
            <tbody>
              {COLUMNS.map((c, i) => (
                <tr key={c.field}>
                  <Td>{i + 1}</Td>
                  <Td>{c.field}</Td>
                  <Td>{c.type}</Td>
                  <Td>{c.rule}</Td>
                  <Td>Ya</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardBody>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.push("/submission")}>
          Batal
        </Button>
        <Button
          disabled={!file || uploading}
          onClick={upload}
        >
          {uploading ? "Memproses..." : "Unggah / Kirim"}
        </Button>
      </div>
    </div>
  );
}
