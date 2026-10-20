"use client";
 
import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, Th, Td } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { Dialog } from "@/components/ui/dialog";
import {
  TOWER_RECORDS,
  JENIS_OPTIONS,
  type TowerRecord,
} from "@/lib/dummy-towers";
import { downloadCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";
 
type Field = { key: keyof TowerRecord; label: string };
 
const COLUMNS: Field[] = [
  { key: "kode", label: "Kode/ID Menara" },
  { key: "pemilik", label: "Nama Pemilik" },
  { key: "tahun", label: "Tahun" },
  { key: "tenant", label: "Penyelenggara Jaringan" },
  { key: "longitude", label: "Longitude" },
  { key: "latitude", label: "Latitude" },
  { key: "alamat", label: "Alamat" },
  { key: "jenis", label: "Jenis Menara" },
  { key: "tinggi", label: "Tinggi (AGL)" },
];
 
const ALL_FIELDS: Field[] = [
  { key: "reg", label: "Registration number" },
  { key: "kode", label: "Kode/ID Menara" },
  { key: "pemilik", label: "Nama Pemilik Menara" },
  { key: "tahun", label: "Tahun Pembangunan" },
  { key: "tenant", label: "Penyelenggara Jaringan (Tenant)" },
  { key: "longitude", label: "Longitude" },
  { key: "latitude", label: "Latitude" },
  { key: "alamat", label: "Alamat" },
  { key: "jenis", label: "Jenis Menara" },
  { key: "tinggi", label: "Tinggi Menara (AGL)" },
  { key: "kapMaks", label: "Kapasitas Maksimal" },
  { key: "kapSewa", label: "Kapasitas Disewakan" },
  { key: "kapSendiri", label: "Kapasitas Digunakan Sendiri" },
];
 
type Filters = { kode: string; pemilik: string; jenis: string; reg: string };
type Pending = { title: string; ids: string[] } | null;
 
const NO_FILTERS: Filters = { kode: "", pemilik: "", jenis: "", reg: "" };
 
function plural(n: number) {
  return `${n} record${n === 1 ? "" : "s"}`;
}
 
function includes(value: string, query: string) {
  const q = query.trim().toLowerCase();
  return !q || value.toLowerCase().includes(q);
}
 
export default function TowerRecordsPage() {
  const [draft, setDraft] = useState<Filters>(NO_FILTERS);
  const [applied, setApplied] = useState<Filters>(NO_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleted, setDeleted] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewing, setViewing] = useState<TowerRecord | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [message, setMessage] = useState("");
 
  const results = useMemo(
    () =>
      TOWER_RECORDS.filter(
        (r) =>
          !deleted.has(r.id) &&
          includes(r.kode, applied.kode) &&
          includes(r.pemilik, applied.pemilik) &&
          (!applied.jenis || r.jenis === applied.jenis) &&
          includes(r.reg, applied.reg)
      ),
    [applied, deleted]
  );
 
  const pageCount = Math.max(1, Math.ceil(results.length / pageSize));
  const current = Math.min(page, pageCount);
  const visible = results.slice((current - 1) * pageSize, current * pageSize);
 
  const allOnPage = visible.length > 0 && visible.every((r) => selected.has(r.id));
  const someOnPage = visible.some((r) => selected.has(r.id));
 
  function search(e: React.FormEvent) {
    e.preventDefault();
    setApplied(draft);
    setPage(1);
    setSelected(new Set());
    setMessage("");
  }
 
  function reset() {
    setDraft(NO_FILTERS);
    setApplied(NO_FILTERS);
    setPage(1);
    setSelected(new Set());
    setMessage("");
  }
 
  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
 
  function togglePage(checked: boolean) {
    setSelected((s) => {
      const next = new Set(s);
      visible.forEach((r) => (checked ? next.add(r.id) : next.delete(r.id)));
      return next;
    });
  }
 
  function confirmDelete() {
    if (!pending) return;
    const gone = new Set(pending.ids);
    setDeleted((d) => new Set([...Array.from(d), ...Array.from(gone)]));
    setSelected((s) => new Set(Array.from(s).filter((id) => !gone.has(id))));
    setMessage(`${plural(pending.ids.length)} deleted.`);
    setPending(null);
  }
 
  function download() {
    downloadCsv(
      "tower-records.csv",
      ALL_FIELDS.map((f) => f.label),
      results.map((r) => ALL_FIELDS.map((f) => r[f.key]))
    );
  }
 
  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
      <h1 className="text-page-title">Tower Records (own)</h1>
 
      <Card title="Filter">
        <CardBody className="pt-4">
          <form onSubmit={search} className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-4">
              <Input
                id="filter-kode"
                label="Kode/ID Menara"
                value={draft.kode}
                onChange={(e) => setDraft({ ...draft, kode: e.target.value })}
              />
              <Input
                id="filter-pemilik"
                label="Nama Pemilik Menara"
                value={draft.pemilik}
                onChange={(e) => setDraft({ ...draft, pemilik: e.target.value })}
              />
              <Select
                id="filter-jenis"
                label="Jenis Menara"
                value={draft.jenis}
                onChange={(e) => setDraft({ ...draft, jenis: e.target.value })}
              >
                <option value="">All</option>
                {JENIS_OPTIONS.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </Select>
              <Input
                id="filter-reg"
                label="Registration number"
                value={draft.reg}
                onChange={(e) => setDraft({ ...draft, reg: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={reset}>
                Reset
              </Button>
              <Button type="submit">Search</Button>
            </div>
          </form>
        </CardBody>
      </Card>
 
      <Card title="Tower records">
        <CardBody className="flex flex-col gap-4 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-helper">
              {selected.size} selected / Scope: own records
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="download"
                disabled={results.length === 0}
                onClick={download}
              >
                <Download className="h-4 w-4" strokeWidth={2} />
                Download
              </Button>
              <Button
                variant="destructive"
                disabled={selected.size === 0}
                onClick={() =>
                  setPending({
                    title: "Delete selected records",
                    ids: Array.from(selected),
                  })
                }
              >
                Delete selected
              </Button>
              <Button
                variant="danger-outline"
                disabled={results.length === 0}
                onClick={() =>
                  setPending({
                    title: "Delete all matching records",
                    ids: results.map((r) => r.id),
                  })
                }
              >
                Bulk delete
              </Button>
            </div>
          </div>
 
          {message && (
            <div
              role="status"
              className="rounded-card border border-primary bg-nav-active-bg px-3 py-2 text-sm text-primary"
            >
              {message}
            </div>
          )}
 
          <Table>
            <thead>
              <tr>
                <Th className="w-10">
                  <input
                    type="checkbox"
                    aria-label="Select all records on this page"
                    className="h-4 w-4 cursor-pointer accent-primary"
                    checked={allOnPage}
                    ref={(el) => {
                      if (el) el.indeterminate = someOnPage && !allOnPage;
                    }}
                    onChange={(e) => togglePage(e.target.checked)}
                  />
                </Th>
                {COLUMNS.map((c) => (
                  <Th key={c.key}>{c.label}</Th>
                ))}
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <Td colSpan={COLUMNS.length + 2} className="py-8 text-center text-muted">
                    No records found.
                  </Td>
                </tr>
              ) : (
                visible.map((r) => (
                  <tr key={r.id} className={cn(selected.has(r.id) && "bg-dropzone-bg")}>
                    <Td>
                      <input
                        type="checkbox"
                        aria-label={`Select ${r.kode}`}
                        className="h-4 w-4 cursor-pointer accent-primary"
                        checked={selected.has(r.id)}
                        onChange={() => toggle(r.id)}
                      />
                    </Td>
                    {COLUMNS.map((c) => (
                      <Td key={c.key} className="whitespace-nowrap">
                        {r[c.key]}
                      </Td>
                    ))}
                    <Td className="whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setViewing(r)}
                        className="cursor-pointer font-semibold text-primary hover:underline"
                      >
                        View
                      </button>
                      <span className="px-2 text-faint" aria-hidden>
                        |
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setPending({ title: `Delete ${r.kode}`, ids: [r.id] })
                        }
                        className="cursor-pointer font-semibold text-danger hover:underline"
                      >
                        Delete
                      </button>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
 
          <Pagination
            page={current}
            pageSize={pageSize}
            total={results.length}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(1);
            }}
          />
 
          <p className="text-caption-note">
            Delete is a soft delete: the record leaves the active registry and the
            same data can be submitted again.
          </p>
        </CardBody>
      </Card>
 
      <p className="text-caption-note">
        Sample data. Deleted records come back on refresh until the database is
        connected.
      </p>
 
      <Dialog
        open={viewing !== null}
        onClose={() => setViewing(null)}
        title={viewing ? `Tower ${viewing.kode}` : "Tower record"}
        className="max-w-[640px]"
        footer={
          <Button variant="outline" onClick={() => setViewing(null)}>
            Close
          </Button>
        }
      >
        {viewing && (
          <dl className="grid gap-4 sm:grid-cols-2">
            {ALL_FIELDS.map((f) => (
              <div key={f.key} className="flex flex-col gap-1">
                <dt className="text-field-label">{f.label}</dt>
                <dd className="text-sm text-text">{viewing[f.key]}</dd>
              </div>
            ))}
          </dl>
        )}
      </Dialog>
 
      <Dialog
        open={pending !== null}
        onClose={() => setPending(null)}
        title={pending?.title ?? ""}
        description={
          pending
            ? `${plural(pending.ids.length)} will leave the active registry. The same data can be submitted again.`
            : undefined
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </>
        }
      />
    </div>
  );
}
