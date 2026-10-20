"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import {
  Download,
  FileSpreadsheet,
  RotateCcw,
  Search,
  Settings2,
} from "lucide-react";
import type { MapTowerItem } from "@/components/dashboard/tower-map";

const TowerMap = dynamic(() => import("@/components/dashboard/tower-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-95 w-full items-center justify-center rounded-[10px] border border-[#d0d5db] bg-[#e7f3fb] text-[13px] text-[#6b7280]">
      Loading interactive map...
    </div>
  ),
});

interface DashboardTower extends MapTowerItem {
  kapasitasMaks: number;
}

const SAMPLE_DASHBOARD_TOWERS: DashboardTower[] = [
  {
    id: "1",
    kodeId: "TOW-JKT-001",
    namaPemilik: "PT Dayamitra Telekomunikasi",
    tahun: 2019,
    jenisMenara: "Greenfield",
    tenants: "Telkomsel, Indosat",
    longitude: 106.827153,
    latitude: -6.175392,
    alamat: "Jl. Medan Merdeka Barat No. 9, Jakarta Pusat",
    tinggiAgl: 72,
    kapasitasMaks: 4,
    registrationNo: "REG-2026-000101",
  },
  {
    id: "2",
    kodeId: "TOW-BDG-002",
    namaPemilik: "PT Profesional Telekomunikasi",
    tahun: 2020,
    jenisMenara: "Rooftop",
    tenants: "XL Axiata, Smartfren",
    longitude: 107.619123,
    latitude: -6.917464,
    alamat: "Jl. Asia Afrika No. 65, Bandung",
    tinggiAgl: 45,
    kapasitasMaks: 3,
    registrationNo: "REG-2026-000102",
  },
  {
    id: "3",
    kodeId: "TOW-SBY-003",
    namaPemilik: "PT Tower Bersama",
    tahun: 2018,
    jenisMenara: "Monopole",
    tenants: "Telkomsel",
    longitude: 112.752088,
    latitude: -7.257472,
    alamat: "Jl. Pemuda No. 15, Surabaya",
    tinggiAgl: 36,
    kapasitasMaks: 2,
    registrationNo: "REG-2026-000103",
  },
  {
    id: "4",
    kodeId: "TOW-MDN-004",
    namaPemilik: "PT Solusi Tunas Pratama",
    tahun: 2021,
    jenisMenara: "Self-supporting",
    tenants: "Indosat, XL Axiata",
    longitude: 98.672226,
    latitude: 3.595196,
    alamat: "Jl. Balai Kota No. 2, Medan",
    tinggiAgl: 65,
    kapasitasMaks: 4,
    registrationNo: "REG-2026-000104",
  },
  {
    id: "5",
    kodeId: "TOW-MKS-005",
    namaPemilik: "PT Dayamitra Telekomunikasi",
    tahun: 2022,
    jenisMenara: "Greenfield",
    tenants: "Telkomsel, Smartfren",
    longitude: 119.432731,
    latitude: -5.147665,
    alamat: "Jl. Ahmad Yani No. 2, Makassar",
    tinggiAgl: 55,
    kapasitasMaks: 3,
    registrationNo: "REG-2026-000105",
  },
  {
    id: "6",
    kodeId: "TOW-DPS-006",
    namaPemilik: "PT Bali Towerindo Sentra",
    tahun: 2021,
    jenisMenara: "Monopole",
    tenants: "Telkomsel, XL Axiata",
    longitude: 115.212629,
    latitude: -8.670458,
    alamat: "Jl. Raya Puputan No. 10, Denpasar",
    tinggiAgl: 40,
    kapasitasMaks: 3,
    registrationNo: "REG-2026-000106",
  },
  {
    id: "7",
    kodeId: "TOW-BPN-007",
    namaPemilik: "PT Tower Bersama",
    tahun: 2023,
    jenisMenara: "Self-supporting",
    tenants: "Telkomsel, Indosat",
    longitude: 116.8312,
    latitude: -1.265386,
    alamat: "Jl. Jenderal Sudirman No. 1, Balikpapan",
    tinggiAgl: 60,
    kapasitasMaks: 4,
    registrationNo: "REG-2026-000107",
  },
  {
    id: "8",
    kodeId: "TOW-PLM-008",
    namaPemilik: "PT Profesional Telekomunikasi",
    tahun: 2017,
    jenisMenara: "Guyed",
    tenants: "Indosat",
    longitude: 104.745804,
    latitude: -2.990934,
    alamat: "Jl. Kapten A. Rivai, Palembang",
    tinggiAgl: 50,
    kapasitasMaks: 2,
    registrationNo: "REG-2026-000108",
  },
  {
    id: "9",
    kodeId: "TOW-SMG-009",
    namaPemilik: "PT Centratama Menara Indonesia",
    tahun: 2020,
    jenisMenara: "Rooftop",
    tenants: "XL Axiata",
    longitude: 110.4203,
    latitude: -6.966667,
    alamat: "Jl. Pandanaran No. 100, Semarang",
    tinggiAgl: 32,
    kapasitasMaks: 2,
    registrationNo: "REG-2026-000109",
  },
  {
    id: "10",
    kodeId: "TOW-MDO-010",
    namaPemilik: "PT Dayamitra Telekomunikasi",
    tahun: 2022,
    jenisMenara: "Greenfield",
    tenants: "Telkomsel",
    longitude: 124.842079,
    latitude: 1.47483,
    alamat: "Jl. Piere Tendean, Manado",
    tinggiAgl: 58,
    kapasitasMaks: 3,
    registrationNo: "REG-2026-000110",
  },
  {
    id: "11",
    kodeId: "TOW-AMB-011",
    namaPemilik: "PT Tower Bersama",
    tahun: 2024,
    jenisMenara: "Self-supporting",
    tenants: "Telkomsel, Indosat",
    longitude: 128.1814,
    latitude: -3.6954,
    alamat: "Jl. Sultan Hairun, Ambon",
    tinggiAgl: 64,
    kapasitasMaks: 4,
    registrationNo: "REG-2026-000111",
  },
  {
    id: "12",
    kodeId: "TOW-JYP-012",
    namaPemilik: "PT Dayamitra Telekomunikasi",
    tahun: 2023,
    jenisMenara: "Greenfield",
    tenants: "Telkomsel",
    longitude: 140.71813,
    latitude: -2.53371,
    alamat: "Jl. Ahmad Yani, Jayapura",
    tinggiAgl: 70,
    kapasitasMaks: 4,
    registrationNo: "REG-2026-000112",
  },
];

type ColumnKey =
  | "kodeId"
  | "namaPemilik"
  | "tahun"
  | "jenisMenara"
  | "tenants"
  | "longitude"
  | "latitude"
  | "alamat"
  | "tinggiAgl"
  | "registrationNo";

const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "kodeId", label: "Kode/ID" },
  { key: "namaPemilik", label: "Nama pemilik" },
  { key: "tahun", label: "Tahun" },
  { key: "jenisMenara", label: "Jenis menara" },
  { key: "tenants", label: "Penyelenggara" },
  { key: "longitude", label: "Longitude" },
  { key: "latitude", label: "Latitude" },
  { key: "alamat", label: "Alamat" },
  { key: "tinggiAgl", label: "Tinggi AGL (m)" },
  { key: "registrationNo", label: "Registration No." },
];

interface QueryFilters {
  kodeId: string;
  namaPemilik: string;
  tahun: string;
  jenisMenara: string;
  tenant: string;
  alamat: string;
  lonMin: string;
  lonMax: string;
  latMin: string;
  latMax: string;
  tinggiMin: string;
  registrationNo: string;
}

const DEFAULT_FILTERS: QueryFilters = {
  kodeId: "",
  namaPemilik: "",
  tahun: "",
  jenisMenara: "",
  tenant: "",
  alamat: "",
  lonMin: "95",
  lonMax: "141",
  latMin: "-11",
  latMax: "6",
  tinggiMin: "",
  registrationNo: "",
};

export default function DashboardPage() {
  const [draftFilters, setDraftFilters] =
    useState<QueryFilters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<QueryFilters>(DEFAULT_FILTERS);

  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);

  const [visibleCols, setVisibleCols] = useState<Record<ColumnKey, boolean>>({
    kodeId: true,
    namaPemilik: true,
    tahun: true,
    jenisMenara: true,
    tenants: true,
    longitude: true,
    latitude: true,
    alamat: true,
    tinggiAgl: true,
    registrationNo: true,
  });
  const [showColMenu, setShowColMenu] = useState(false);

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filteredTowers = useMemo(() => {
    const lonMin = parseFloat(appliedFilters.lonMin);
    const lonMax = parseFloat(appliedFilters.lonMax);
    const latMin = parseFloat(appliedFilters.latMin);
    const latMax = parseFloat(appliedFilters.latMax);
    const tinggiMin = parseFloat(appliedFilters.tinggiMin);

    return SAMPLE_DASHBOARD_TOWERS.filter((t) => {
      if (
        appliedFilters.kodeId &&
        !t.kodeId.toLowerCase().includes(appliedFilters.kodeId.toLowerCase())
      ) {
        return false;
      }
      if (
        appliedFilters.namaPemilik &&
        !t.namaPemilik
          .toLowerCase()
          .includes(appliedFilters.namaPemilik.toLowerCase())
      ) {
        return false;
      }
      if (
        appliedFilters.tahun &&
        String(t.tahun) !== appliedFilters.tahun.trim()
      ) {
        return false;
      }
      if (
        appliedFilters.jenisMenara &&
        t.jenisMenara !== appliedFilters.jenisMenara
      ) {
        return false;
      }
      if (
        appliedFilters.tenant &&
        !t.tenants.toLowerCase().includes(appliedFilters.tenant.toLowerCase())
      ) {
        return false;
      }
      if (
        appliedFilters.alamat &&
        !t.alamat.toLowerCase().includes(appliedFilters.alamat.toLowerCase())
      ) {
        return false;
      }
      if (!Number.isNaN(lonMin) && t.longitude < lonMin) return false;
      if (!Number.isNaN(lonMax) && t.longitude > lonMax) return false;
      if (!Number.isNaN(latMin) && t.latitude < latMin) return false;
      if (!Number.isNaN(latMax) && t.latitude > latMax) return false;
      if (!Number.isNaN(tinggiMin) && t.tinggiAgl < tinggiMin) return false;
      if (
        appliedFilters.registrationNo &&
        !t.registrationNo
          .toLowerCase()
          .includes(appliedFilters.registrationNo.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [appliedFilters]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTowers.length / rowsPerPage)
  );
  const safePage = Math.min(page, totalPages);
  const paginatedTowers = useMemo(() => {
    const start = (safePage - 1) * rowsPerPage;
    return filteredTowers.slice(start, start + rowsPerPage);
  }, [filteredTowers, safePage, rowsPerPage]);

  function handleQuerySubmit(e: React.FormEvent) {
    e.preventDefault();
    setAppliedFilters(draftFilters);
    setPage(1);
  }

  function handleReset() {
    setDraftFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setSelectedPinId(null);
    setPage(1);
  }

  function toggleColumn(key: ColumnKey) {
    setVisibleCols((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function exportCsv(onlyVisibleColumns: boolean) {
    const cols = onlyVisibleColumns
      ? ALL_COLUMNS.filter((c) => visibleCols[c.key])
      : ALL_COLUMNS;

    const header = cols.map((c) => `"${c.label}"`).join(",");
    const rows = filteredTowers.map((t) =>
      cols
        .map((c) => {
          const val = String(t[c.key] ?? "").replace(/"/g, '""');
          return `"${val}"`;
        })
        .join(",")
    );

    const csvContent = "\uFEFF" + [header, ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = onlyVisibleColumns
      ? "dashboard-towers-export.csv"
      : "dashboard-towers-all.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-[26px] font-bold text-[#1f2a37]">Dashboard</h1>

      {/* 1. Query Data Card */}
      <form
        onSubmit={handleQuerySubmit}
        className="rounded-[10px] border border-[#e5e7eb] bg-white p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-[#1f2a37]">
            Query data
          </h2>
          <span className="text-[12px] text-[#6b7280]">
            Default bbox: Indonesia (Lon 95–141, Lat -11–6)
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#1f2a37]">
              Kode / ID menara
            </label>
            <input
              type="text"
              value={draftFilters.kodeId}
              onChange={(e) =>
                setDraftFilters({ ...draftFilters, kodeId: e.target.value })
              }
              placeholder="e.g. TOW-JKT-001"
              className="h-9 w-full rounded-lg border border-[#d0d5db] bg-white px-3 text-[13px] text-[#1f2a37] placeholder:text-[#6b7280] focus:border-[#016db0] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#1f2a37]">
              Nama pemilik
            </label>
            <input
              type="text"
              value={draftFilters.namaPemilik}
              onChange={(e) =>
                setDraftFilters({
                  ...draftFilters,
                  namaPemilik: e.target.value,
                })
              }
              placeholder="Owner name"
              className="h-9 w-full rounded-lg border border-[#d0d5db] bg-white px-3 text-[13px] text-[#1f2a37] placeholder:text-[#6b7280] focus:border-[#016db0] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#1f2a37]">
              Tahun pembangunan
            </label>
            <input
              type="text"
              value={draftFilters.tahun}
              onChange={(e) =>
                setDraftFilters({ ...draftFilters, tahun: e.target.value })
              }
              placeholder="YYYY"
              className="h-9 w-full rounded-lg border border-[#d0d5db] bg-white px-3 text-[13px] text-[#1f2a37] placeholder:text-[#6b7280] focus:border-[#016db0] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#1f2a37]">
              Jenis menara
            </label>
            <select
              value={draftFilters.jenisMenara}
              onChange={(e) =>
                setDraftFilters({
                  ...draftFilters,
                  jenisMenara: e.target.value,
                })
              }
              className="h-9 w-full rounded-lg border border-[#d0d5db] bg-white px-3 text-[13px] text-[#1f2a37] focus:border-[#016db0] focus:outline-none"
            >
              <option value="">All types</option>
              <option value="Greenfield">Greenfield</option>
              <option value="Rooftop">Rooftop</option>
              <option value="Monopole">Monopole</option>
              <option value="Guyed">Guyed</option>
              <option value="Self-supporting">Self-supporting</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#1f2a37]">
              Penyelenggara (Tenant)
            </label>
            <input
              type="text"
              value={draftFilters.tenant}
              onChange={(e) =>
                setDraftFilters({ ...draftFilters, tenant: e.target.value })
              }
              placeholder="e.g. Telkomsel"
              className="h-9 w-full rounded-lg border border-[#d0d5db] bg-white px-3 text-[13px] text-[#1f2a37] placeholder:text-[#6b7280] focus:border-[#016db0] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#1f2a37]">
              Alamat
            </label>
            <input
              type="text"
              value={draftFilters.alamat}
              onChange={(e) =>
                setDraftFilters({ ...draftFilters, alamat: e.target.value })
              }
              placeholder="Street / City"
              className="h-9 w-full rounded-lg border border-[#d0d5db] bg-white px-3 text-[13px] text-[#1f2a37] placeholder:text-[#6b7280] focus:border-[#016db0] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#1f2a37]">
              Longitude min
            </label>
            <input
              type="number"
              step="any"
              value={draftFilters.lonMin}
              onChange={(e) =>
                setDraftFilters({ ...draftFilters, lonMin: e.target.value })
              }
              className="h-9 w-full rounded-lg border border-[#d0d5db] bg-white px-3 text-[13px] text-[#1f2a37] focus:border-[#016db0] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#1f2a37]">
              Longitude max
            </label>
            <input
              type="number"
              step="any"
              value={draftFilters.lonMax}
              onChange={(e) =>
                setDraftFilters({ ...draftFilters, lonMax: e.target.value })
              }
              className="h-9 w-full rounded-lg border border-[#d0d5db] bg-white px-3 text-[13px] text-[#1f2a37] focus:border-[#016db0] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#1f2a37]">
              Latitude min
            </label>
            <input
              type="number"
              step="any"
              value={draftFilters.latMin}
              onChange={(e) =>
                setDraftFilters({ ...draftFilters, latMin: e.target.value })
              }
              className="h-9 w-full rounded-lg border border-[#d0d5db] bg-white px-3 text-[13px] text-[#1f2a37] focus:border-[#016db0] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#1f2a37]">
              Latitude max
            </label>
            <input
              type="number"
              step="any"
              value={draftFilters.latMax}
              onChange={(e) =>
                setDraftFilters({ ...draftFilters, latMax: e.target.value })
              }
              className="h-9 w-full rounded-lg border border-[#d0d5db] bg-white px-3 text-[13px] text-[#1f2a37] focus:border-[#016db0] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#1f2a37]">
              Tinggi AGL min (m)
            </label>
            <input
              type="number"
              value={draftFilters.tinggiMin}
              onChange={(e) =>
                setDraftFilters({ ...draftFilters, tinggiMin: e.target.value })
              }
              placeholder="e.g. 40"
              className="h-9 w-full rounded-lg border border-[#d0d5db] bg-white px-3 text-[13px] text-[#1f2a37] placeholder:text-[#6b7280] focus:border-[#016db0] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#1f2a37]">
              Registration number
            </label>
            <input
              type="text"
              value={draftFilters.registrationNo}
              onChange={(e) =>
                setDraftFilters({
                  ...draftFilters,
                  registrationNo: e.target.value,
                })
              }
              placeholder="REG-2026-..."
              className="h-9 w-full rounded-lg border border-[#d0d5db] bg-white px-3 text-[13px] text-[#1f2a37] placeholder:text-[#6b7280] focus:border-[#016db0] focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-[10px] border border-[#d0d5db] bg-white px-4 text-[13px] font-medium text-[#1f2a37] transition-colors hover:bg-[#f5f6f8]"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
          <button
            type="submit"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-[10px] bg-[#016db0] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#015a92]"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
        </div>
      </form>

      {/* 2. Real Interactive Tower Map Card (Leaflet + OpenStreetMap) */}
      <div className="rounded-[10px] border border-[#e5e7eb] bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-[#1f2a37]">
            Tower map
          </h2>
          <span className="text-[12px] text-[#6b7280]">
            Showing {filteredTowers.length} tower pins (click a pin or table row to focus)
          </span>
        </div>

        <TowerMap
          towers={filteredTowers}
          selectedPinId={selectedPinId}
          onSelectPin={setSelectedPinId}
          bbox={{
            lonMin: parseFloat(appliedFilters.lonMin),
            lonMax: parseFloat(appliedFilters.lonMax),
            latMin: parseFloat(appliedFilters.latMin),
            latMax: parseFloat(appliedFilters.latMax),
          }}
        />
      </div>

      {/* 3. Tower Data Card */}
      <div className="rounded-[10px] border border-[#e5e7eb] bg-white p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-[16px] font-semibold text-[#1f2a37]">
              Tower data
            </h2>
            <span className="rounded-full bg-[#d6e8f7] px-2.5 py-0.5 text-[12px] font-medium text-[#016db0]">
              Showing your own records
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColMenu((v) => !v)}
                className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-[#d0d5db] bg-white px-3.5 text-[13px] font-medium text-[#1f2a37] hover:bg-[#f5f6f8]"
              >
                <Settings2 className="h-4 w-4 text-[#6b7280]" />
                Configure columns
              </button>

              {showColMenu && (
                <div className="absolute right-0 z-20 mt-1.5 w-56 rounded-[10px] border border-[#e5e7eb] bg-white p-3 shadow-lg">
                  <div className="mb-2 text-[12px] font-semibold text-[#1f2a37]">
                    Visible columns
                  </div>
                  <div className="space-y-1.5">
                    {ALL_COLUMNS.map((col) => (
                      <label
                        key={col.key}
                        className="flex cursor-pointer items-center gap-2 text-[13px] text-[#1f2a37]"
                      >
                        <input
                          type="checkbox"
                          checked={visibleCols[col.key]}
                          onChange={() => toggleColumn(col.key)}
                          className="h-3.5 w-3.5 rounded border-[#d0d5db] text-[#016db0]"
                        />
                        {col.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => exportCsv(false)}
              className="inline-flex h-9 items-center gap-2 rounded-[10px] bg-[#00a8e8] px-4 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
            >
              <Download className="h-4 w-4" />
              Download
            </button>

            <button
              type="button"
              onClick={() => exportCsv(true)}
              className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-[#d0d5db] bg-white px-4 text-[13px] font-medium text-[#1f2a37] hover:bg-[#f5f6f8]"
            >
              <FileSpreadsheet className="h-4 w-4 text-[#016db0]" />
              Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[#e5e7eb]">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#e5e7eb] bg-[#ddeef9] text-[12px] font-semibold text-[#1f2a37]">
                {ALL_COLUMNS.map(
                  (col) =>
                    visibleCols[col.key] && (
                      <th
                        key={col.key}
                        className="whitespace-nowrap px-3.5 py-2.5"
                      >
                        {col.label}
                      </th>
                    )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {paginatedTowers.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      ALL_COLUMNS.filter((c) => visibleCols[c.key]).length || 1
                    }
                    className="px-4 py-8 text-center text-[13px] text-[#6b7280]"
                  >
                    No tower records match the current query filters.
                  </td>
                </tr>
              ) : (
                paginatedTowers.map((tower) => {
                  const isSelected = selectedPinId === tower.id;
                  return (
                    <tr
                      key={tower.id}
                      onClick={() => setSelectedPinId(tower.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-[#eaf5fc]"
                          : "hover:bg-[#f5f6f8]"
                      }`}
                    >
                      {visibleCols.kodeId && (
                        <td className="whitespace-nowrap px-3.5 py-2.5 font-medium text-[#1f2a37]">
                          {tower.kodeId}
                        </td>
                      )}
                      {visibleCols.namaPemilik && (
                        <td className="whitespace-nowrap px-3.5 py-2.5 text-[#1f2a37]">
                          {tower.namaPemilik}
                        </td>
                      )}
                      {visibleCols.tahun && (
                        <td className="whitespace-nowrap px-3.5 py-2.5 text-[#1f2a37]">
                          {tower.tahun}
                        </td>
                      )}
                      {visibleCols.jenisMenara && (
                        <td className="whitespace-nowrap px-3.5 py-2.5 text-[#1f2a37]">
                          {tower.jenisMenara}
                        </td>
                      )}
                      {visibleCols.tenants && (
                        <td className="px-3.5 py-2.5 text-[#1f2a37]">
                          {tower.tenants}
                        </td>
                      )}
                      {visibleCols.longitude && (
                        <td className="whitespace-nowrap px-3.5 py-2.5 font-mono text-[12px] text-[#1f2a37]">
                          {tower.longitude.toFixed(6)}
                        </td>
                      )}
                      {visibleCols.latitude && (
                        <td className="whitespace-nowrap px-3.5 py-2.5 font-mono text-[12px] text-[#1f2a37]">
                          {tower.latitude.toFixed(6)}
                        </td>
                      )}
                      {visibleCols.alamat && (
                        <td className="min-w-55 px-3.5 py-2.5 text-[#6b7280]">
                          {tower.alamat}
                        </td>
                      )}
                      {visibleCols.tinggiAgl && (
                        <td className="whitespace-nowrap px-3.5 py-2.5 text-[#1f2a37]">
                          {tower.tinggiAgl}
                        </td>
                      )}
                      {visibleCols.registrationNo && (
                        <td className="whitespace-nowrap px-3.5 py-2.5 font-mono text-[12px] text-[#016db0]">
                          {tower.registrationNo}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[13px] text-[#6b7280]">
          <div>
            Showing{" "}
            <span className="font-medium text-[#1f2a37]">
              {filteredTowers.length === 0
                ? 0
                : (safePage - 1) * rowsPerPage + 1}
            </span>
            –
            <span className="font-medium text-[#1f2a37]">
              {Math.min(safePage * rowsPerPage, filteredTowers.length)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-[#1f2a37]">
              {filteredTowers.length}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span>Rows per page</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="h-8 rounded-lg border border-[#d0d5db] bg-white px-2 text-[13px] text-[#1f2a37]"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 rounded-lg border border-[#d0d5db] bg-white px-3 text-[13px] text-[#1f2a37] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Prev
              </button>
              <span className="px-2 text-[13px] font-medium text-[#1f2a37]">
                {safePage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 rounded-lg border border-[#d0d5db] bg-white px-3 text-[13px] text-[#1f2a37] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}