"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, Th, Td } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";

type Filters = { search: string; from: string; to: string; status: string };
type RegistrationRow = {
  id: string;
  towerId: string | null;
  towerCode: string;
  date: string;
  method: string;
  status: string;
  validationErrors?: Array<{
    row?: number | null;
    column?: string | null;
    field?: string;
    message?: string;
  }>;
};
type PortalAttempt = {
  id: string | number;
  status: string;
  attempt_type?: string;
  metode_pendaftaran?: string;
  date_created?: string;
  validation_errors?: RegistrationRow["validationErrors"];
};
type PortalTower = {
  id: string;
  id_menara: string;
  date_created?: string;
  registration_attempts?: PortalAttempt[];
};
type HistoryResponse = {
  data?: PortalTower[];
  rejected_attempts?: PortalAttempt[];
  draft_attempt?: { id: string | number; date_updated?: string } | null;
  error?: string;
};

const EMPTY_FILTERS: Filters = { search: "", from: "", to: "", status: "" };
const STATUS_TEXT: Record<string, string> = {
  Registered: "Terdaftar",
  Rejected: "Ditolak",
  Draft: "Draf",
};
const STATUS_VARIANT: Record<string, "success" | "destructive" | "warning"> = {
  Registered: "success",
  Rejected: "destructive",
  Draft: "warning",
};
const METHOD_TEXT: Record<string, string> = {
  "Upload Excel": "Unggah Excel",
  "Upload Document (.xlsx)": "Upload Document (.xlsx)",
  "Input Manual": "Formulir Pendaftaran",
};

function toDate(value?: string) {
  return value ? value.slice(0, 10) : "";
}

function compareNewestFirst(a: RegistrationRow, b: RegistrationRow) {
  const aTime = Date.parse(a.date);
  const bTime = Date.parse(b.date);
  const aValid = Number.isFinite(aTime);
  const bValid = Number.isFinite(bTime);

  if (aValid && bValid && aTime !== bTime) return bTime - aTime;
  if (aValid !== bValid) return aValid ? -1 : 1;
  return b.id.localeCompare(a.id, undefined, { numeric: true });
}

function toRows(payload: HistoryResponse): RegistrationRow[] {
  const rows: RegistrationRow[] = [];
  for (const tower of payload.data ?? []) {
    for (const attempt of tower.registration_attempts ?? []) {
      rows.push({
        id: String(attempt.id),
        towerId: tower.id,
        towerCode: tower.id_menara,
        date: attempt.date_created ?? tower.date_created ?? "",
        method: attempt.metode_pendaftaran ?? "",
        status: attempt.status,
        validationErrors: attempt.validation_errors,
      });
    }
  }
  for (const attempt of payload.rejected_attempts ?? []) {
    rows.push({
      id: String(attempt.id),
      towerId: null,
      towerCode: "—",
      date: attempt.date_created ?? "",
      method: attempt.metode_pendaftaran ?? "",
      status: "Rejected",
      validationErrors: attempt.validation_errors,
    });
  }
  if (payload.draft_attempt) {
    rows.push({
      id: String(payload.draft_attempt.id),
      towerId: null,
      towerCode: "—",
      date: payload.draft_attempt.date_updated ?? "",
      method: "Input Manual",
      status: "Draft",
    });
  }
  return rows.sort(compareNewestFirst);
}

export default function SubmissionHistoryPage() {
  const { role } = useAuth();
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [rows, setRows] = useState<RegistrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/towers?limit=100", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as HistoryResponse | null;
        if (!response.ok) {
          throw new Error(payload?.error || "Riwayat pengajuan tidak dapat dimuat.");
        }
        setRows(toRows(payload ?? {}));
      })
      .catch((requestError) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Riwayat pengajuan tidak dapat dimuat.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const results = useMemo(
    () =>
      rows.filter((row) => {
        const search = applied.search.trim().toLowerCase();
        if (search && !row.towerCode.toLowerCase().includes(search)) return false;
        if (applied.status && row.status !== applied.status) return false;
        const date = toDate(row.date);
        if (applied.from && date < applied.from) return false;
        if (applied.to && date > applied.to) return false;
        return true;
      }),
    [applied, rows],
  );

  const visible = results.slice((page - 1) * pageSize, page * pageSize);

  function search(event: React.FormEvent) {
    event.preventDefault();
    setApplied(draft);
    setPage(1);
  }

  function reset() {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setPage(1);
  }

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
      <h1 className="text-page-title">
        Riwayat Pengajuan {role === "Normal User" ? "(Data Sendiri)" : ""}
      </h1>

      <Card title="Filter">
        <CardBody className="pt-4">
          <form onSubmit={search} className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-4">
              <Input
                id="tower-id"
                label="ID Menara"
                value={draft.search}
                onChange={(event) => setDraft({ ...draft, search: event.target.value })}
              />
              <Input
                id="date-from"
                type="date"
                label="Dari tanggal"
                value={draft.from}
                onChange={(event) => setDraft({ ...draft, from: event.target.value })}
              />
              <Input
                id="date-to"
                type="date"
                label="Sampai tanggal"
                value={draft.to}
                onChange={(event) => setDraft({ ...draft, to: event.target.value })}
              />
              <Select
                id="status"
                label="Status"
                value={draft.status}
                onChange={(event) => setDraft({ ...draft, status: event.target.value })}
              >
                <option value="">Semua</option>
                <option value="Registered">Terdaftar</option>
                <option value="Rejected">Ditolak</option>
                <option value="Draft">Draf</option>
              </Select>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={reset}>Reset</Button>
              <Button type="submit">Cari</Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card title="Daftar Pengajuan">
        <CardBody className="flex flex-col gap-4 pt-4">
          {error && <div role="alert" className="text-sm text-danger">{error}</div>}
          <Table>
            <thead>
              <tr>
                <Th>ID Menara</Th>
                <Th>Tanggal</Th>
                <Th>Metode</Th>
                <Th>Status</Th>
                <Th>Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><Td colSpan={5} className="py-8 text-center text-muted">Memuat riwayat...</Td></tr>
              ) : visible.length === 0 ? (
                <tr><Td colSpan={5} className="py-8 text-center text-muted">Tidak ada pengajuan yang cocok dengan filter pencarian Anda.</Td></tr>
              ) : visible.map((row) => (
                <tr key={`${row.towerId ?? "attempt"}-${row.id}`}>
                  <Td>{row.towerCode}</Td>
                  <Td>{row.date ? new Date(row.date).toLocaleDateString("id-ID") : "—"}</Td>
                  <Td>{METHOD_TEXT[row.method] || row.method || "—"}</Td>
                  <Td>
                    <Badge variant={STATUS_VARIANT[row.status] ?? "warning"}>
                      {STATUS_TEXT[row.status] || row.status}
                    </Badge>
                  </Td>
                  <Td>
                    {row.towerId ? (
                      <Link href={`/submission/${row.towerId}`} className="font-semibold text-primary hover:underline">Lihat</Link>
                    ) : row.status === "Draft" ? (
                      <Link
                        href={`/submission/form?draft_id=${encodeURIComponent(row.id)}`}
                        className="font-semibold text-primary hover:underline"
                      >
                        Lanjutkan
                      </Link>
                    ) : row.validationErrors?.some((issue) => issue.message) ? (
                      <details className="group">
                        <summary className="cursor-pointer list-none font-semibold text-primary hover:underline">
                          Lihat alasan
                        </summary>
                        <ul className="mt-2 min-w-56 max-w-sm list-inside list-disc space-y-1 text-left text-xs text-danger">
                          {row.validationErrors.map((issue, index) => {
                            const context = [
                              issue.row ? `Baris ${issue.row}` : "",
                              issue.column || issue.field || "",
                            ].filter(Boolean).join(", ");
                            return (
                              <li key={`${row.id}-${index}`}>
                                {context ? `${context}: ` : ""}
                                {issue.message}
                              </li>
                            );
                          })}
                        </ul>
                      </details>
                    ) : "—"}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination
            page={page}
            pageSize={pageSize}
            total={results.length}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </CardBody>
      </Card>
    </div>
  );
}
