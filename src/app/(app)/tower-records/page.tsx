"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, Th, Td } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type TowerRecord = {
  id: string;
  reg: string;
  kode: string;
  pemilik: string;
  tahun: string;
  tenant: string;
  longitude: string;
  latitude: string;
  alamat: string;
  provinsi: string;
  kab_kota: string;
  kecamatan: string;
  kelurahan: string;
  dateCreated: string;
  jenis: string;
  tinggi: string;
  kapMaks: string;
  kapSewa: string;
  kapSendiri: string;
};
type PortalTower = {
  id: string;
  id_menara?: string;
  nama_pemilik?: string;
  tahun_pembangunan?: string | number;
  longitude?: string | number;
  latitude?: string | number;
  alamat?: string;
  provinsi?: string;
  kab_kota?: string;
  kecamatan?: string;
  kelurahan?: string;
  date_created?: string;
  jenis_menara?: string;
  tinggi_menara?: string | number;
  kapasitas_maksimal?: string;
  kapasitas_disewakan?: string;
  kapasitas_digunakan_sendiri?: string;
  tenants?: Array<{ penyelenggara?: string }>;
};
type TowerResponse = {
  data?: PortalTower[];
  error?: string;
};
type Field = { key: keyof TowerRecord; label: string };
type Filters = {
  kode: string;
  pemilik: string;
  jenis: string;
  reg: string;
  tanggal: string;
};
type Pending = { title: string; ids: string[]; confirmLabel?: string } | null;

const COLUMNS: Field[] = [
  { key: "kode", label: "Kode/ID Menara" },
  { key: "pemilik", label: "Nama Pemilik" },
  { key: "tahun", label: "Tahun" },
  { key: "tenant", label: "Penyelenggara Jaringan" },
  { key: "longitude", label: "Longitude" },
  { key: "latitude", label: "Latitude" },
  { key: "alamat", label: "Alamat" },
  { key: "provinsi", label: "Provinsi" },
  { key: "kab_kota", label: "Kabupaten/Kota" },
  { key: "kecamatan", label: "Kecamatan" },
  { key: "kelurahan", label: "Kelurahan/Desa" },
  { key: "dateCreated", label: "Tanggal Pendaftaran" },
  { key: "jenis", label: "Jenis Menara" },
  { key: "tinggi", label: "Tinggi (AGL)" },
];
const ALL_FIELDS: Field[] = [
  { key: "reg", label: "ID Menara" },
  ...COLUMNS,
  { key: "kapMaks", label: "Kapasitas Maksimal" },
  { key: "kapSewa", label: "Kapasitas Disewakan (Total Menara)" },
  { key: "kapSendiri", label: "Kapasitas Digunakan Sendiri" },
];
const JENIS_OPTIONS = [
  "Greenfield",
  "Rooftop",
  "Monopole",
  "Guyed",
  "Self-supporting (SST)",
];
const NO_FILTERS: Filters = {
  kode: "",
  pemilik: "",
  jenis: "",
  reg: "",
  tanggal: "",
};

function mapTower(tower: PortalTower): TowerRecord {
  const idMenara = tower.id_menara || "";
  return {
    id: tower.id,
    reg: idMenara,
    kode: idMenara,
    pemilik: tower.nama_pemilik || "",
    tahun: String(tower.tahun_pembangunan ?? ""),
    tenant: (tower.tenants ?? [])
      .map((tenant) => tenant.penyelenggara)
      .filter(Boolean)
      .join(", "),
    longitude: String(tower.longitude ?? ""),
    latitude: String(tower.latitude ?? ""),
    alamat: tower.alamat || "",
    provinsi: tower.provinsi || "",
    kab_kota: tower.kab_kota || "",
    kecamatan: tower.kecamatan || "",
    kelurahan: tower.kelurahan || "",
    dateCreated: tower.date_created || "",
    jenis: tower.jenis_menara || "",
    tinggi: String(tower.tinggi_menara ?? ""),
    kapMaks: tower.kapasitas_maksimal || "",
    kapSewa: tower.kapasitas_disewakan || "",
    kapSendiri: tower.kapasitas_digunakan_sendiri || "",
  };
}

function includes(value: string, query: string) {
  return !query.trim() || value.toLowerCase().includes(query.trim().toLowerCase());
}

function localDateKey(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? date.toLocaleDateString("id-ID")
    : "—";
}

function plural(count: number) {
  return `${count} data`;
}

function csvCell(value: string) {
  let text = value;
  if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function csvForSelectedTowers(towers: TowerRecord[]) {
  const columns: Array<{ label: string; key: keyof TowerRecord }> = [
    { label: "ID menara", key: "reg" },
    { label: "Nama pemilik", key: "pemilik" },
    { label: "Tahun pembangunan", key: "tahun" },
    { label: "Penyelenggara/penyewa", key: "tenant" },
    { label: "Longitude", key: "longitude" },
    { label: "Latitude", key: "latitude" },
    { label: "Alamat", key: "alamat" },
    { label: "Provinsi", key: "provinsi" },
    { label: "Kabupaten/Kota", key: "kab_kota" },
    { label: "Kecamatan", key: "kecamatan" },
    { label: "Kelurahan/Desa", key: "kelurahan" },
    { label: "Jenis menara", key: "jenis" },
    { label: "Tinggi menara", key: "tinggi" },
    { label: "Kapasitas maksimal", key: "kapMaks" },
    { label: "Kapasitas disewakan", key: "kapSewa" },
    { label: "Kapasitas digunakan sendiri", key: "kapSendiri" },
    { label: "Tanggal pendaftaran", key: "dateCreated" },
  ];
  const rows = [
    columns.map(({ label }) => csvCell(label)).join(","),
    ...towers.map((tower) =>
      columns.map(({ key }) => csvCell(tower[key])).join(","),
    ),
  ];
  return `\uFEFF${rows.join("\r\n")}`;
}

export default function TowerRecordsPage() {
  const { role } = useAuth();
  const [draft, setDraft] = useState<Filters>(NO_FILTERS);
  const [applied, setApplied] = useState<Filters>(NO_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [records, setRecords] = useState<TowerRecord[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewing, setViewing] = useState<TowerRecord | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/towers?limit=100", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as TowerResponse | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Data menara tidak dapat dimuat.");
      }
      setRecords((payload?.data ?? []).map(mapTower));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/towers?limit=100", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as TowerResponse | null;
        if (!response.ok) {
          throw new Error(payload?.error || "Data menara tidak dapat dimuat.");
        }
        setRecords((payload?.data ?? []).map(mapTower));
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setMessage(error instanceof Error ? error.message : "Data menara tidak dapat dimuat.");
        setMessageIsError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const results = useMemo(
    () =>
      records.filter(
        (record) => {
          const registrationDate = localDateKey(record.dateCreated);
          if (
            applied.tanggal &&
            !registrationDate
          ) {
            return false;
          }
          return (
          includes(record.kode, applied.kode) &&
          includes(record.pemilik, applied.pemilik) &&
          (!applied.jenis || record.jenis === applied.jenis) &&
          includes(record.reg, applied.reg) &&
          (!applied.tanggal || registrationDate === applied.tanggal)
          );
        },
      ),
    [applied, records],
  );
  const pageCount = Math.max(1, Math.ceil(results.length / pageSize));
  const current = Math.min(page, pageCount);
  const visible = results.slice((current - 1) * pageSize, current * pageSize);
  const allOnPage = visible.length > 0 && visible.every((record) => selected.has(record.id));
  const someOnPage = visible.some((record) => selected.has(record.id));

  function search(event: React.FormEvent) {
    event.preventDefault();
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
    setSelected((currentSelection) => {
      const next = new Set(currentSelection);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePage(checked: boolean) {
    setSelected((currentSelection) => {
      const next = new Set(currentSelection);
      visible.forEach((record) => (checked ? next.add(record.id) : next.delete(record.id)));
      return next;
    });
  }

  async function confirmDelete() {
    if (!pending) return;
    setMessage("");
    try {
      const response =
        pending.ids.length === 1
          ? await fetch(`/api/towers/${encodeURIComponent(pending.ids[0])}`, {
              method: "DELETE",
            })
          : await fetch("/api/towers/delete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ids: pending.ids }),
            });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Data menara tidak dapat diarsipkan.");
      }
      setSelected((currentSelection) =>
        new Set(Array.from(currentSelection).filter((id) => !pending.ids.includes(id))),
      );
      const wasDeleteAction = pending.confirmLabel === "Hapus";
      setPending(null);
      setMessageIsError(false);
      setMessage(
        wasDeleteAction
          ? `${plural(pending.ids.length)} berhasil dihapus dari daftar aktif (diarsipkan).`
          : `${plural(pending.ids.length)} berhasil diarsipkan.`,
      );
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Data menara tidak dapat diarsipkan.");
      setMessageIsError(true);
    }
  }

  async function download() {
    try {
      if (selected.size > 0) {
        const selectedRecords = records.filter((record) => selected.has(record.id));
        if (selectedRecords.length === 0) {
          throw new Error("Data terpilih tidak tersedia untuk diunduh.");
        }
        const blob = new Blob([csvForSelectedTowers(selectedRecords)], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "tower-records-selected.csv";
        link.click();
        URL.revokeObjectURL(url);
        return;
      }

      const response = await fetch("/api/towers/export");
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Ekspor data gagal.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "tower-records.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ekspor data gagal.");
      setMessageIsError(true);
    }
  }

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
      <h1 className="text-page-title">Data Menara</h1>
      <Card title="Filter">
        <CardBody className="pt-4">
          <form onSubmit={search} className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-4">
              <Input id="filter-kode" label="Kode/ID Menara" value={draft.kode} onChange={(event) => setDraft({ ...draft, kode: event.target.value })} />
              <Input id="filter-pemilik" label="Nama Pemilik Menara" value={draft.pemilik} onChange={(event) => setDraft({ ...draft, pemilik: event.target.value })} />
              <Select id="filter-jenis" label="Jenis Menara" value={draft.jenis} onChange={(event) => setDraft({ ...draft, jenis: event.target.value })}>
                <option value="">Semua</option>
                {JENIS_OPTIONS.map((jenis) => <option key={jenis} value={jenis}>{jenis}</option>)}
              </Select>
              <Input id="filter-reg" label="ID Menara" value={draft.reg} onChange={(event) => setDraft({ ...draft, reg: event.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="filter-tanggal" label="Tanggal pendaftaran" type="date" value={draft.tanggal} onChange={(event) => setDraft({ ...draft, tanggal: event.target.value })} />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={reset}>Reset</Button>
              <Button type="submit">Cari</Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card title="Daftar Data Menara">
        <CardBody className="flex flex-col gap-4 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-helper">
              {selected.size} dipilih / Cakupan: {role === "Normal User" ? "data sendiri" : "seluruh data aktif"}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="download" disabled={selected.size === 0 && results.length === 0} onClick={download}>
                <Download className="h-4 w-4" strokeWidth={2} /> {selected.size > 0 ? `Unduh Terpilih (${selected.size})` : "Unduh"}
              </Button>
              <Button variant="destructive" disabled={selected.size === 0} onClick={() => setPending({ title: "Hapus data terpilih", ids: Array.from(selected), confirmLabel: "Hapus" })}>
                Hapus Terpilih
              </Button>
              <Button variant="danger-outline" disabled={results.length === 0} onClick={() => setPending({ title: "Hapus semua data yang cocok", ids: results.map((record) => record.id), confirmLabel: "Hapus" })}>
                Hapus Massal
              </Button>
            </div>
          </div>

          {message && (
            <div role={messageIsError ? "alert" : "status"} className={cn("rounded-card border px-3 py-2 text-sm", messageIsError ? "border-danger bg-danger-bg text-danger" : "border-primary bg-nav-active-bg text-primary")}>
              {message}
            </div>
          )}

          <Table>
            <thead>
              <tr>
                <Th className="w-10">
                  <input type="checkbox" aria-label="Pilih semua data pada halaman ini" className="h-4 w-4 cursor-pointer accent-primary" checked={allOnPage} ref={(element) => { if (element) element.indeterminate = someOnPage && !allOnPage; }} onChange={(event) => togglePage(event.target.checked)} />
                </Th>
                {COLUMNS.map((column) => <Th key={column.key}>{column.label}</Th>)}
                <Th>Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><Td colSpan={COLUMNS.length + 2} className="py-8 text-center text-muted">Memuat data menara...</Td></tr>
              ) : visible.length === 0 ? (
                <tr><Td colSpan={COLUMNS.length + 2} className="py-8 text-center text-muted">Tidak ada data yang ditemukan.</Td></tr>
              ) : visible.map((record) => (
                <tr key={record.id} className={cn(selected.has(record.id) && "bg-dropzone-bg")}>
                  <Td><input type="checkbox" aria-label={`Pilih ${record.kode}`} className="h-4 w-4 cursor-pointer accent-primary" checked={selected.has(record.id)} onChange={() => toggle(record.id)} /></Td>
                  {COLUMNS.map((column) => (
                    <Td key={column.key} className="whitespace-nowrap">
                      {column.key === "dateCreated"
                        ? formatDate(record.dateCreated)
                        : record[column.key]}
                    </Td>
                  ))}
                  <Td className="whitespace-nowrap">
                    <button type="button" onClick={() => setViewing(record)} className="cursor-pointer font-semibold text-primary hover:underline">Lihat</button>
                    <span className="px-2 text-faint" aria-hidden>|</span>
                    <button type="button" onClick={() => setPending({ title: `Arsipkan ${record.kode}`, ids: [record.id] })} className="cursor-pointer font-semibold text-danger hover:underline">Arsipkan</button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>

          <Pagination page={current} pageSize={pageSize} total={results.length} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} />
          <p className="text-caption-note">Pengarsipan bersifat soft delete: data dikeluarkan dari registri aktif dan tidak dihapus permanen.</p>
        </CardBody>
      </Card>

      <Dialog open={viewing !== null} onClose={() => setViewing(null)} title={viewing ? `Menara ${viewing.kode}` : "Data Menara"} className="max-w-[640px]" footer={<Button variant="outline" onClick={() => setViewing(null)}>Tutup</Button>}>
        {viewing && <dl className="grid gap-4 sm:grid-cols-2">{ALL_FIELDS.map((field) => <div key={field.key} className="flex flex-col gap-1"><dt className="text-field-label">{field.label}</dt><dd className="text-sm text-text">{field.key === "dateCreated" ? formatDate(viewing.dateCreated) : viewing[field.key] || "—"}</dd></div>)}</dl>}
      </Dialog>

      <Dialog
        open={pending !== null}
        onClose={() => setPending(null)}
        title={pending?.title ?? ""}
        description={pending ? `${plural(pending.ids.length)} akan diarsipkan (soft delete), dikeluarkan dari daftar aktif, dan tetap tercatat di log audit.` : undefined}
        footer={<><Button variant="outline" onClick={() => setPending(null)}>Batal</Button><Button variant="destructive" onClick={confirmDelete}>{pending?.confirmLabel ?? "Arsipkan"}</Button></>}
      />
    </div>
  );
}
