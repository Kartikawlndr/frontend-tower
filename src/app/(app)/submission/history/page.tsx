"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, Th, Td } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { SUBMISSIONS, STATUS_VARIANT, formatDate } from "@/lib/dummy-submissions";

type Filters = { reg: string; from: string; to: string; status: string };

const NO_FILTERS: Filters = { reg: "", from: "", to: "", status: "" };

const STATUS_TEXT: Record<string, string> = {
  Registered: "Terdaftar",
  Rejected: "Ditolak",
  Draft: "Draf",
};

const METHOD_TEXT: Record<string, string> = {
  "Upload Excel": "Unggah Excel",
  "Application Form": "Formulir Pendaftaran",
};

export default function SubmissionHistoryPage() {
  const [draft, setDraft] = useState<Filters>(NO_FILTERS);
  const [applied, setApplied] = useState<Filters>(NO_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const results = useMemo(
    () =>
      SUBMISSIONS.filter((s) => {
        const reg = applied.reg.trim().toLowerCase();
        if (reg && !s.reg.toLowerCase().includes(reg)) return false;
        if (applied.status && s.status !== applied.status) return false;
        if (applied.from && s.iso < applied.from) return false;
        if (applied.to && s.iso > applied.to) return false;
        return true;
      }),
    [applied]
  );

  const visible = results.slice((page - 1) * pageSize, page * pageSize);

  function search(e: React.FormEvent) {
    e.preventDefault();
    setApplied(draft);
    setPage(1);
  }

  function reset() {
    setDraft(NO_FILTERS);
    setApplied(NO_FILTERS);
    setPage(1);
  }

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
      <h1 className="text-page-title">Riwayat Pengajuan (Data Sendiri)</h1>

      <Card title="Filter">
        <CardBody className="pt-4">
          <form onSubmit={search} className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-4">
              <Input
                id="registration-number"
                label="Nomor registrasi"
                value={draft.reg}
                onChange={(e) => setDraft({ ...draft, reg: e.target.value })}
              />
              <Input
                id="date-from"
                type="date"
                label="Dari tanggal"
                value={draft.from}
                onChange={(e) => setDraft({ ...draft, from: e.target.value })}
              />
              <Input
                id="date-to"
                type="date"
                label="Sampai tanggal"
                value={draft.to}
                onChange={(e) => setDraft({ ...draft, to: e.target.value })}
              />
              <Select
                id="status"
                label="Status"
                value={draft.status}
                onChange={(e) => setDraft({ ...draft, status: e.target.value })}
              >
                <option value="">Semua</option>
                <option value="Registered">Terdaftar</option>
                <option value="Rejected">Ditolak</option>
                <option value="Draft">Draf</option>
              </Select>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={reset}>
                Reset
              </Button>
              <Button type="submit">Cari</Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card title="Daftar Pengajuan">
        <CardBody className="flex flex-col gap-4 pt-4">
          <Table>
            <thead>
              <tr>
                <Th>No. Registrasi</Th>
                <Th>Tanggal</Th>
                <Th>Metode</Th>
                <Th>Baris</Th>
                <Th>Status</Th>
                <Th>Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <Td colSpan={6} className="py-8 text-center text-muted">
                    Tidak ada pengajuan yang cocok dengan filter pencarian Anda.
                  </Td>
                </tr>
              ) : (
                visible.map((s) => (
                  <tr key={s.reg}>
                    <Td>{s.reg}</Td>
                    <Td>{formatDate(s.iso)}</Td>
                    <Td>{METHOD_TEXT[s.method] || s.method}</Td>
                    <Td>{s.rows}</Td>
                    <Td>
                      <Badge variant={STATUS_VARIANT[s.status]}>
                        {STATUS_TEXT[s.status] || s.status}
                      </Badge>
                    </Td>
                    <Td>
                      <Link
                        href={`/submission/${s.reg}`}
                        className="font-semibold text-primary hover:underline"
                      >
                        Lihat
                      </Link>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
          <Pagination
            page={page}
            pageSize={pageSize}
            total={results.length}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(1);
            }}
          />
        </CardBody>
      </Card>

      <p className="text-caption-note">
        Data contoh. Pengajuan akan diambil dari database setelah terhubung.
      </p>
    </div>
  );
}
