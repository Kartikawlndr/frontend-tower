"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
<<<<<<< Updated upstream
import { useMemo, useState } from "react";
import {
  Download,
  FileSpreadsheet,
  RotateCcw,
=======
import {
>>>>>>> Stashed changes
  Search,
  RotateCcw,
  Download,
  SlidersHorizontal,
  RefreshCw,
  Radio,
  Building2,
  Users,
  AlertCircle,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Card } from "@/components/ui/card"
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card-parts"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select-radix"
import { Table } from "@/components/ui/table"
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table-parts"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog-radix"

// Dynamically import the Leaflet map to avoid SSR window errors
const TowerMap = dynamic(
  () => import("@/components/dashboard/tower-map").then((mod) => mod.default || mod),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] w-full items-center justify-center rounded-lg border border-[#e5e7eb] bg-[#f5f6f8] text-sm text-[#6b7280]">
        Loading interactive tower map...
      </div>
    ),
  }
);

export interface TowerRecord {
  id: string;
  kodeId: string;
  namaPemilik: string;
  tahun: number | string;
  jenisMenara: string;
  tenants: string[];
  longitude: number;
  latitude: number;
  alamat: string;
  provinsi?: string;
  kabupaten?: string;
  kecamatan?: string;
  tinggiAgl: number;
  registrationNo: string;
  status?: "REGISTERED" | "PENDING" | "REJECTED";
}

interface DashboardStats {
  totalTowers: number;
  registeredTowers: number;
  totalTenants: number;
  pendingOrRejected: number;
}

interface FilterState {
  kodeId: string;
  namaPemilik: string;
  tahun: string;
  jenisMenara: string;
  tenants: string;
  longitude: string;
  latitude: string;
  alamat: string;
  provinsi: string;
  kabupaten: string;
  tinggiAgl: string;
  registrationNo: string;
}

const INITIAL_FILTERS: FilterState = {
  kodeId: "",
  namaPemilik: "",
  tahun: "",
  jenisMenara: "ALL",
  tenants: "",
  longitude: "",
  latitude: "",
  alamat: "",
  provinsi: "",
  kabupaten: "",
  tinggiAgl: "",
  registrationNo: "",
};

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
  { key: "kodeId", label: "Kode ID" },
  { key: "namaPemilik", label: "Nama Pemilik" },
  { key: "tahun", label: "Tahun" },
  { key: "jenisMenara", label: "Jenis Menara" },
  { key: "tenants", label: "Tenants" },
  { key: "longitude", label: "Longitude" },
  { key: "latitude", label: "Latitude" },
  { key: "alamat", label: "Alamat" },
  { key: "tinggiAgl", label: "Tinggi AGL (m)" },
  { key: "registrationNo", label: "No. Registrasi" },
];

// Normalize raw API item to TowerRecord
function normalizeTowerRecord(raw: Record<string, any>, idx: number): TowerRecord {
  const rawTenants = raw.tenants ?? raw.operator ?? [];
  const tenantsArray = Array.isArray(rawTenants)
    ? rawTenants
    : typeof rawTenants === "string" && rawTenants.trim().length > 0
    ? rawTenants.split(",").map((t) => t.trim())
    : [];

  return {
    id: String(raw.id ?? raw.kodeId ?? raw.kode_id ?? `row-${idx}`),
    kodeId: String(raw.kodeId ?? raw.kode_id ?? raw.towerId ?? "-"),
    namaPemilik: String(raw.namaPemilik ?? raw.nama_pemilik ?? raw.ownerName ?? "-"),
    tahun: raw.tahun ?? raw.year ?? "-",
    jenisMenara: String(raw.jenisMenara ?? raw.jenis_menara ?? raw.towerType ?? "-"),
    tenants: tenantsArray,
    longitude: Number(raw.longitude ?? raw.lng ?? raw.lon ?? 0),
    latitude: Number(raw.latitude ?? raw.lat ?? 0),
    alamat: String(raw.alamat ?? raw.address ?? "-"),
    provinsi: raw.provinsi ?? raw.province ?? "",
    kabupaten: raw.kabupaten ?? raw.city ?? "",
    kecamatan: raw.kecamatan ?? raw.district ?? "",
    tinggiAgl: Number(raw.tinggiAgl ?? raw.tinggi_agl ?? raw.height ?? 0),
    registrationNo: String(
      raw.registrationNo ?? raw.registration_no ?? raw.noRegistrasi ?? "-"
    ),
    status: raw.status ?? "REGISTERED",
  };
}

export default function AdminDashboardPage() {
  // Dynamic data states (No hardcoded sample data)
  const [towers, setTowers] = useState<TowerRecord[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [apiStats, setApiStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

<<<<<<< Updated upstream
export default function DashboardPage() {
  const [draftFilters, setDraftFilters] =
    useState<QueryFilters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<QueryFilters>(DEFAULT_FILTERS);

  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);

  const [visibleCols, setVisibleCols] = useState<Record<ColumnKey, boolean>>({
=======
  // Filter & query states
  const [draftFilters, setDraftFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(INITIAL_FILTERS);

  // Table pagination & selection states
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>({
>>>>>>> Stashed changes
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

  // Dynamic options extracted from real data (or API metadata)
  const [towerTypes, setTowerTypes] = useState<string[]>([]);

  const fetchDashboardData = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);

      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
        const params = new URLSearchParams();

        params.set("page", String(page));
        params.set("limit", String(pageSize));

        Object.entries(appliedFilters).forEach(([key, value]) => {
          const trimmed = value.trim();
          if (trimmed && trimmed !== "ALL") {
            params.set(key, trimmed);
          }
        });

        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;

        const response = await fetch(`${baseUrl}/api/towers?${params.toString()}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          cache: "no-store",
          signal,
        });

        if (!response.ok) {
          throw new Error(
            `Failed to fetch tower data (${response.status} ${response.statusText})`
          );
        }

        const payload = await response.json();

        // Support both `{ data: [...], total, stats }` and direct array `[...]` responses
        const rawList: Record<string, any>[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.towers)
          ? payload.towers
          : [];

        const normalized = rawList.map(normalizeTowerRecord);
        setTowers(normalized);
        setTotalCount(
          typeof payload?.total === "number"
            ? payload.total
            : typeof payload?.meta?.total === "number"
            ? payload.meta.total
            : normalized.length
        );

        if (payload?.stats) {
          setApiStats(payload.stats);
        }

        // Populate distinct tower types dynamically from live records
        setTowerTypes((prev) => {
          const set = new Set(prev);
          normalized.forEach((item) => {
            if (item.jenisMenara && item.jenisMenara !== "-") {
              set.add(item.jenisMenara);
            }
          });
          return Array.from(set);
        });
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        setError(err?.message || "Unable to load live tower records from server.");
        setTowers([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    },
    [appliedFilters, page, pageSize]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchDashboardData(controller.signal);
    return () => controller.abort();
  }, [fetchDashboardData]);

  // Derived KPI metrics from real API response
  const stats: DashboardStats = useMemo(() => {
    if (apiStats) return apiStats;
    const uniqueTenants = new Set<string>();
    let registered = 0;
    let flagged = 0;

    towers.forEach((t) => {
      t.tenants.forEach((op) => uniqueTenants.add(op));
      if (t.status === "REJECTED" || t.status === "PENDING") {
        flagged += 1;
      } else {
        registered += 1;
      }
    });

    return {
      totalTowers: totalCount || towers.length,
      registeredTowers: registered,
      totalTenants: uniqueTenants.size,
      pendingOrRejected: flagged,
    };
  }, [apiStats, towers, totalCount]);

  // Client-side fallback filter if backend returns full list without server-side filtering
  const filteredTowers = useMemo(() => {
    return towers.filter((t) => {
      if (
        appliedFilters.kodeId &&
        !t.kodeId.toLowerCase().includes(appliedFilters.kodeId.toLowerCase())
      )
        return false;
      if (
        appliedFilters.namaPemilik &&
        !t.namaPemilik
          .toLowerCase()
          .includes(appliedFilters.namaPemilik.toLowerCase())
      )
        return false;
      if (
        appliedFilters.tahun &&
        !String(t.tahun).includes(appliedFilters.tahun.trim())
      )
        return false;
      if (
        appliedFilters.jenisMenara !== "ALL" &&
        t.jenisMenara.toLowerCase() !== appliedFilters.jenisMenara.toLowerCase()
      )
        return false;
      if (
        appliedFilters.tenants &&
        !t.tenants
          .join(", ")
          .toLowerCase()
          .includes(appliedFilters.tenants.toLowerCase())
      )
        return false;
      if (
        appliedFilters.alamat &&
        !t.alamat.toLowerCase().includes(appliedFilters.alamat.toLowerCase())
      )
        return false;
      if (
        appliedFilters.provinsi &&
        !(t.provinsi || "")
          .toLowerCase()
          .includes(appliedFilters.provinsi.toLowerCase())
      )
        return false;
      if (
        appliedFilters.kabupaten &&
        !(t.kabupaten || "")
          .toLowerCase()
          .includes(appliedFilters.kabupaten.toLowerCase())
      )
        return false;
      if (
        appliedFilters.registrationNo &&
        !t.registrationNo
          .toLowerCase()
          .includes(appliedFilters.registrationNo.toLowerCase())
      )
        return false;
      if (
        appliedFilters.longitude &&
        !String(t.longitude).includes(appliedFilters.longitude.trim())
      )
        return false;
      if (
        appliedFilters.latitude &&
        !String(t.latitude).includes(appliedFilters.latitude.trim())
      )
        return false;
      if (
        appliedFilters.tinggiAgl &&
        Number(t.tinggiAgl) < Number(appliedFilters.tinggiAgl)
      )
        return false;
      return true;
    });
  }, [towers, appliedFilters]);

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setAppliedFilters({ ...draftFilters });
  };

  const handleResetFilters = () => {
    setDraftFilters(INITIAL_FILTERS);
    setAppliedFilters(INITIAL_FILTERS);
    setPage(1);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTowers.length && filteredTowers.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTowers.map((t) => t.id)));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExportCsv = () => {
    const rowsToExport =
      selectedIds.size > 0
        ? filteredTowers.filter((t) => selectedIds.has(t.id))
        : filteredTowers;

    if (rowsToExport.length === 0) return;

    const activeCols = ALL_COLUMNS.filter((c) => visibleColumns[c.key]);
    const header = activeCols.map((c) => `"${c.label}"`).join(",");
    const csvRows = rowsToExport.map((row) =>
      activeCols
        .map((c) => {
          const val =
            c.key === "tenants" ? row.tenants.join("; ") : (row as any)[c.key];
          return `"${String(val ?? "").replace(/"/g, '""')}"`;
        })
        .join(",")
    );

    const csvContent = [header, ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `tower-records-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.max(
    1,
    Math.ceil((totalCount || filteredTowers.length) / pageSize)
  );

  return (
<<<<<<< Updated upstream
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

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Tahun pembangunan</label>
            <select 
              className="h-9 w-full rounded-lg border border-[#d0d5db] bg-white px-3"
              defaultValue=""
            >
              <option value="" disabled>Tahun</option>
              {Array.from({ length: 2026 - 1900 + 1 }, (_, i) => 2026 - i).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
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
              Penyelenggara 
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
=======
    <div className="min-h-screen bg-[#f5f6f8] p-6 text-[#1f2a37]">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Top Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1f2a37]">
              Admin Dashboard
            </h1>
            <p className="text-sm text-[#6b7280]">
              Real-time telecommunications tower spatial monitoring & record management
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => fetchDashboardData()}
              disabled={loading}
              className="border-[#d0d5db] bg-[#ffffff] text-[#1f2a37] hover:bg-[#f5f6f8]"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 text-[#016db0] ${
                  loading ? "animate-spin" : ""
                }`}
              />
              Refresh Data
            </Button>
            <Button
              type="button"
              onClick={handleExportCsv}
              disabled={filteredTowers.length === 0}
              className="bg-[#016db0] text-white hover:bg-[#01588f]"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
            </Button>
          </div>
        </div>

        {/* Error Alert Banner (Project Red #8f181b) */}
        {error && (
          <Card className="border-[#8f181b]/30 bg-[#8f181b]/5 shadow-none">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3 text-[#8f181b]">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Failed to load live data</p>
                  <p className="text-xs opacity-90">{error}</p>
>>>>>>> Stashed changes
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fetchDashboardData()}
                className="border-[#8f181b]/40 bg-[#ffffff] text-[#8f181b] hover:bg-[#8f181b]/10"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Dynamic KPI Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-[#e5e7eb] bg-[#ffffff] shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-xs font-medium uppercase tracking-wider text-[#6b7280]">
                Total Tower Records
              </CardDescription>
              <div className="rounded-md bg-[#016db0]/10 p-2 text-[#016db0]">
                <Radio className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1f2a37]">
                {loading ? "—" : stats.totalTowers.toLocaleString()}
              </div>
              <p className="mt-1 text-xs text-[#6b7280]">
                Live records synced from database
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#e5e7eb] bg-[#ffffff] shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-xs font-medium uppercase tracking-wider text-[#6b7280]">
                Registered & Verified
              </CardDescription>
              <div className="rounded-md bg-[#016db0]/10 p-2 text-[#016db0]">
                <Building2 className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#016db0]">
                {loading ? "—" : stats.registeredTowers.toLocaleString()}
              </div>
              <p className="mt-1 text-xs text-[#6b7280]">
                Active towers in current query
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#e5e7eb] bg-[#ffffff] shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-xs font-medium uppercase tracking-wider text-[#6b7280]">
                Active Operators / Tenants
              </CardDescription>
              <div className="rounded-md bg-[#016db0]/10 p-2 text-[#016db0]">
                <Users className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1f2a37]">
                {loading ? "—" : stats.totalTenants.toLocaleString()}
              </div>
              <p className="mt-1 text-xs text-[#6b7280]">
                Distinct network tenants
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#e5e7eb] bg-[#ffffff] shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-xs font-medium uppercase tracking-wider text-[#6b7280]">
                Pending / Flagged
              </CardDescription>
              <div className="rounded-md bg-[#8f181b]/10 p-2 text-[#8f181b]">
                <AlertCircle className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#8f181b]">
                {loading ? "—" : stats.pendingOrRejected.toLocaleString()}
              </div>
              <p className="mt-1 text-xs text-[#6b7280]">
                Requires review or validation
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 12-Field Query Data Filter Card */}
        <Card className="border-[#e5e7eb] bg-[#ffffff] shadow-xs">
          <CardHeader className="border-b border-[#e5e7eb] pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-[#1f2a37]">
                  Query Tower Data
                </CardTitle>
                <CardDescription className="text-xs text-[#6b7280]">
                  Filter live tower database across 12 spatial and administrative parameters
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="border-[#016db0]/30 bg-[#016db0]/10 text-[#016db0]"
              >
                Live Query
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={handleApplyFilters} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {/* 1. Kode ID */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[#6b7280]">
                    Kode ID Menara
                  </Label>
                  <Input
                    placeholder="e.g. TWR-JKT-001"
                    value={draftFilters.kodeId}
                    onChange={(e) =>
                      setDraftFilters((p) => ({ ...p, kodeId: e.target.value }))
                    }
                    className="border-[#d0d5db] bg-[#ffffff] text-[#1f2a37] focus-visible:ring-[#016db0]"
                  />
                </div>

                {/* 2. Nama Pemilik */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[#6b7280]">
                    Nama Pemilik
                  </Label>
                  <Input
                    placeholder="Owner / Provider name"
                    value={draftFilters.namaPemilik}
                    onChange={(e) =>
                      setDraftFilters((p) => ({ ...p, namaPemilik: e.target.value }))
                    }
                    className="border-[#d0d5db] bg-[#ffffff] text-[#1f2a37] focus-visible:ring-[#016db0]"
                  />
                </div>

                {/* 3. Tahun */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[#6b7280]">
                    Tahun Pembangunan
                  </Label>
                  <Input
                    type="number"
                    placeholder="e.g. 2023"
                    value={draftFilters.tahun}
                    onChange={(e) =>
                      setDraftFilters((p) => ({ ...p, tahun: e.target.value }))
                    }
                    className="border-[#d0d5db] bg-[#ffffff] text-[#1f2a37] focus-visible:ring-[#016db0]"
                  />
                </div>

                {/* 4. Jenis Menara */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[#6b7280]">
                    Jenis Menara
                  </Label>
                  <Select
                    value={draftFilters.jenisMenara}
                    onValueChange={(value) =>
                      setDraftFilters((p) => ({ ...p, jenisMenara: value }))
                    }
                  >
                    <SelectTrigger className="border-[#d0d5db] bg-[#ffffff] text-[#1f2a37] focus:ring-[#016db0]">
                      <SelectValue placeholder="All Tower Types" />
                    </SelectTrigger>
                    <SelectContent className="border-[#e5e7eb] bg-[#ffffff] text-[#1f2a37]">
                      <SelectItem value="ALL">All Tower Types</SelectItem>
                      {towerTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 5. Tenants */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[#6b7280]">
                    Tenants / Operator
                  </Label>
                  <Input
                    placeholder="e.g. Telkomsel, Indosat"
                    value={draftFilters.tenants}
                    onChange={(e) =>
                      setDraftFilters((p) => ({ ...p, tenants: e.target.value }))
                    }
                    className="border-[#d0d5db] bg-[#ffffff] text-[#1f2a37] focus-visible:ring-[#016db0]"
                  />
                </div>

                {/* 6. No. Registrasi */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[#6b7280]">
                    No. Registrasi
                  </Label>
                  <Input
                    placeholder="Registration number"
                    value={draftFilters.registrationNo}
                    onChange={(e) =>
                      setDraftFilters((p) => ({
                        ...p,
                        registrationNo: e.target.value,
                      }))
                    }
                    className="border-[#d0d5db] bg-[#ffffff] text-[#1f2a37] focus-visible:ring-[#016db0]"
                  />
                </div>

                {/* 7. Provinsi */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[#6b7280]">
                    Provinsi
                  </Label>
                  <Input
                    placeholder="Province"
                    value={draftFilters.provinsi}
                    onChange={(e) =>
                      setDraftFilters((p) => ({ ...p, provinsi: e.target.value }))
                    }
                    className="border-[#d0d5db] bg-[#ffffff] text-[#1f2a37] focus-visible:ring-[#016db0]"
                  />
                </div>

                {/* 8. Kabupaten / Kota */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[#6b7280]">
                    Kabupaten / Kota
                  </Label>
                  <Input
                    placeholder="City / Regency"
                    value={draftFilters.kabupaten}
                    onChange={(e) =>
                      setDraftFilters((p) => ({ ...p, kabupaten: e.target.value }))
                    }
                    className="border-[#d0d5db] bg-[#ffffff] text-[#1f2a37] focus-visible:ring-[#016db0]"
                  />
                </div>

                {/* 9. Alamat */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[#6b7280]">
                    Alamat Lokasi
                  </Label>
                  <Input
                    placeholder="Street / Village address"
                    value={draftFilters.alamat}
                    onChange={(e) =>
                      setDraftFilters((p) => ({ ...p, alamat: e.target.value }))
                    }
                    className="border-[#d0d5db] bg-[#ffffff] text-[#1f2a37] focus-visible:ring-[#016db0]"
                  />
                </div>

                {/* 10. Longitude */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[#6b7280]">
                    Longitude
                  </Label>
                  <Input
                    placeholder="e.g. 106.8271"
                    value={draftFilters.longitude}
                    onChange={(e) =>
                      setDraftFilters((p) => ({ ...p, longitude: e.target.value }))
                    }
                    className="border-[#d0d5db] bg-[#ffffff] text-[#1f2a37] focus-visible:ring-[#016db0]"
                  />
                </div>

                {/* 11. Latitude */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[#6b7280]">
                    Latitude
                  </Label>
                  <Input
                    placeholder="e.g. -6.1751"
                    value={draftFilters.latitude}
                    onChange={(e) =>
                      setDraftFilters((p) => ({ ...p, latitude: e.target.value }))
                    }
                    className="border-[#d0d5db] bg-[#ffffff] text-[#1f2a37] focus-visible:ring-[#016db0]"
                  />
                </div>

                {/* 12. Min Tinggi AGL */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[#6b7280]">
                    Min. Tinggi AGL (m)
                  </Label>
                  <Input
                    type="number"
                    placeholder="e.g. 45"
                    value={draftFilters.tinggiAgl}
                    onChange={(e) =>
                      setDraftFilters((p) => ({ ...p, tinggiAgl: e.target.value }))
                    }
                    className="border-[#d0d5db] bg-[#ffffff] text-[#1f2a37] focus-visible:ring-[#016db0]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-[#e5e7eb] pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetFilters}
                  className="border-[#d0d5db] bg-[#ffffff] text-[#6b7280] hover:bg-[#f5f6f8] hover:text-[#1f2a37]"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset Filter
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-[#016db0] text-white hover:bg-[#01588f]"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Apply Query
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Spatial Distribution Map Card */}
        <Card className="border-[#e5e7eb] bg-[#ffffff] shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between border-b border-[#e5e7eb] pb-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#016db0]" />
              <div>
                <CardTitle className="text-base font-semibold text-[#1f2a37]">
                  Tower Spatial Distribution
                </CardTitle>
                <CardDescription className="text-xs text-[#6b7280]">
                  Showing {filteredTowers.length} live coordinates on map
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <TowerMap towers={filteredTowers as any} />
          </CardContent>
        </Card>

        {/* Live Data Table Card */}
        <Card className="border-[#e5e7eb] bg-[#ffffff] shadow-xs">
          <CardHeader className="flex flex-col gap-3 border-b border-[#e5e7eb] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-[#1f2a37]">
                Tower Data Records
              </CardTitle>
              <CardDescription className="text-xs text-[#6b7280]">
                {loading
                  ? "Fetching records from database..."
                  : `Showing ${filteredTowers.length} of ${
                      totalCount || filteredTowers.length
                    } records`}
              </CardDescription>
            </div>

            {/* Column Visibility Dialog (Shadcn Dialog) */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#d0d5db] bg-[#ffffff] text-[#1f2a37] hover:bg-[#f5f6f8]"
                >
                  <SlidersHorizontal className="mr-2 h-4 w-4 text-[#016db0]" />
                  Columns
                </Button>
              </DialogTrigger>
              <DialogContent className="border-[#e5e7eb] bg-[#ffffff] text-[#1f2a37] sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-[#1f2a37]">
                    Configure Visible Columns
                  </DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3 py-3">
                  {ALL_COLUMNS.map((col) => (
                    <label
                      key={col.key}
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-[#e5e7eb] p-2.5 text-sm hover:bg-[#f5f6f8]"
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns[col.key]}
                        onChange={(e) =>
                          setVisibleColumns((prev) => ({
                            ...prev,
                            [col.key]: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded border-[#d0d5db] accent-[#016db0]"
                      />
                      <span className="text-xs font-medium text-[#1f2a37]">
                        {col.label}
                      </span>
                    </label>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-[#f5f6f8]">
                  <TableRow className="border-b border-[#e5e7eb]">
                    <TableHead className="w-10 px-4">
                      <input
                        type="checkbox"
                        checked={
                          filteredTowers.length > 0 &&
                          selectedIds.size === filteredTowers.length
                        }
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-[#d0d5db] accent-[#016db0]"
                      />
                    </TableHead>
                    {visibleColumns.kodeId && (
                      <TableHead className="text-xs font-semibold text-[#6b7280]">
                        Kode ID
                      </TableHead>
                    )}
                    {visibleColumns.namaPemilik && (
                      <TableHead className="text-xs font-semibold text-[#6b7280]">
                        Nama Pemilik
                      </TableHead>
                    )}
                    {visibleColumns.tahun && (
                      <TableHead className="text-xs font-semibold text-[#6b7280]">
                        Tahun
                      </TableHead>
                    )}
                    {visibleColumns.jenisMenara && (
                      <TableHead className="text-xs font-semibold text-[#6b7280]">
                        Jenis Menara
                      </TableHead>
                    )}
                    {visibleColumns.tenants && (
                      <TableHead className="text-xs font-semibold text-[#6b7280]">
                        Tenants
                      </TableHead>
                    )}
                    {visibleColumns.longitude && (
                      <TableHead className="text-xs font-semibold text-[#6b7280]">
                        Longitude
                      </TableHead>
                    )}
                    {visibleColumns.latitude && (
                      <TableHead className="text-xs font-semibold text-[#6b7280]">
                        Latitude
                      </TableHead>
                    )}
                    {visibleColumns.alamat && (
                      <TableHead className="text-xs font-semibold text-[#6b7280]">
                        Alamat
                      </TableHead>
                    )}
                    {visibleColumns.tinggiAgl && (
                      <TableHead className="text-xs font-semibold text-[#6b7280]">
                        Tinggi AGL
                      </TableHead>
                    )}
                    {visibleColumns.registrationNo && (
                      <TableHead className="text-xs font-semibold text-[#6b7280]">
                        No. Registrasi
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <TableRow key={idx} className="border-b border-[#e5e7eb]">
                        <TableCell colSpan={11} className="py-4">
                          <div className="h-5 w-full animate-pulse rounded bg-[#f5f6f8]" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredTowers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={11}
                        className="py-12 text-center text-sm text-[#6b7280]"
                      >
                        No tower records found matching the current query.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTowers.map((tower) => (
                      <TableRow
                        key={tower.id}
                        className="border-b border-[#e5e7eb] hover:bg-[#f5f6f8]/60"
                      >
                        <TableCell className="px-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(tower.id)}
                            onChange={() => toggleSelectRow(tower.id)}
                            className="h-4 w-4 rounded border-[#d0d5db] accent-[#016db0]"
                          />
                        </TableCell>
                        {visibleColumns.kodeId && (
                          <TableCell className="font-medium text-[#016db0]">
                            {tower.kodeId}
                          </TableCell>
                        )}
                        {visibleColumns.namaPemilik && (
                          <TableCell className="text-[#1f2a37]">
                            {tower.namaPemilik}
                          </TableCell>
                        )}
                        {visibleColumns.tahun && (
                          <TableCell className="text-[#6b7280]">
                            {tower.tahun}
                          </TableCell>
                        )}
                        {visibleColumns.jenisMenara && (
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="border-[#d0d5db] bg-[#f5f6f8] text-[#1f2a37]"
                            >
                              {tower.jenisMenara}
                            </Badge>
                          </TableCell>
                        )}
                        {visibleColumns.tenants && (
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {tower.tenants.length > 0 ? (
                                tower.tenants.map((tenant, i) => (
                                  <Badge
                                    key={i}
                                    className="bg-[#016db0]/10 text-[#016db0] hover:bg-[#016db0]/20"
                                  >
                                    {tenant}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-xs text-[#6b7280]">-</span>
                              )}
                            </div>
                          </TableCell>
                        )}
                        {visibleColumns.longitude && (
                          <TableCell className="font-mono text-xs text-[#6b7280]">
                            {tower.longitude.toFixed(5)}
                          </TableCell>
                        )}
                        {visibleColumns.latitude && (
                          <TableCell className="font-mono text-xs text-[#6b7280]">
                            {tower.latitude.toFixed(5)}
                          </TableCell>
                        )}
                        {visibleColumns.alamat && (
                          <TableCell className="max-w-[240px] truncate text-[#1f2a37]">
                            {tower.alamat}
                          </TableCell>
                        )}
                        {visibleColumns.tinggiAgl && (
                          <TableCell className="text-[#1f2a37]">
                            {tower.tinggiAgl} m
                          </TableCell>
                        )}
                        {visibleColumns.registrationNo && (
                          <TableCell className="font-mono text-xs text-[#1f2a37]">
                            {tower.registrationNo}
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Footer */}
            <div className="flex flex-col items-center justify-between gap-4 border-t border-[#e5e7eb] px-6 py-4 sm:flex-row">
              <div className="flex items-center gap-2 text-xs text-[#6b7280]">
                <span>Rows per page:</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(val) => {
                    setPageSize(Number(val));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-[72px] border-[#d0d5db] bg-[#ffffff] text-xs text-[#1f2a37]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-[#e5e7eb] bg-[#ffffff] text-[#1f2a37]">
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#6b7280]">
                  Page <strong className="text-[#1f2a37]">{page}</strong> of{" "}
                  <strong className="text-[#1f2a37]">{totalPages}</strong>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 border-[#d0d5db] bg-[#ffffff] text-[#1f2a37] hover:bg-[#f5f6f8]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 border-[#d0d5db] bg-[#ffffff] text-[#1f2a37] hover:bg-[#f5f6f8]"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}