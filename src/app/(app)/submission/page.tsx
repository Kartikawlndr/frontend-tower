"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileSpreadsheet, ClipboardList } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const STATUS_VARIANT = {
  Terdaftar: "success",
  Ditolak: "destructive",
} as const;

export default function SubmissionPage() {
  const router = useRouter();
  const [method, setMethod] = useState<MethodValue>("upload");
  const [recent, setRecent] = useState<Array<{
    id: string;
    code: string;
    date: string;
    method: string;
    status: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/towers?limit=10", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as {
          data?: Array<{
            id: string;
            id_menara?: string;
            date_created?: string;
            verification_status?: string;
            metode_pendaftaran?: string;
          }>;
          error?: string;
        } | null;
        if (!response.ok) throw new Error(payload?.error || "Pengajuan terbaru tidak dapat dimuat.");
        if (active) {
          setRecent((payload?.data ?? []).map((tower) => ({
            id: tower.id,
            code: tower.id_menara || "—",
            date: tower.date_created ? new Date(tower.date_created).toLocaleDateString("id-ID") : "—",
            method: tower.metode_pendaftaran || "",
            status: tower.verification_status || "Registered",
          })));
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
                  <Td>{r.date}</Td>
                  <Td>{r.method === "Upload Excel" ? "Unggah Excel" : "Formulir Pendaftaran"}</Td>
                  <Td>
                    <Badge variant={STATUS_VARIANT[r.status === "Registered" ? "Terdaftar" : "Ditolak"]}>
                      {r.status === "Registered" ? "Terdaftar" : r.status}
                    </Badge>
                  </Td>
                  <Td>
                    <Link
                      href={`/submission/${r.id}`}
                      className="font-semibold text-primary hover:underline"
                    >
                      Lihat
                    </Link>
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
    </div>
  );
}
