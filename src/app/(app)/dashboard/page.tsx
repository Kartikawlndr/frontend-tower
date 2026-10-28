"use client";

import { useAuth } from "@/context/AuthContext";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

import {
  Building2,
  Download,
  Globe2,
  MapPin,
  RotateCcw,
  Search,
  Settings2,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InsightsAnalytics } from "@/components/dashboard/insights-analytics";

const ROLE_DISPLAY: Record<string, string> = {
  "Normal User": "Pengguna",
  "Web Manager": "Manajer Web",
  "Super Admin": "Super Admin",
};

// Dynamically import the Leaflet map to avoid SSR window errors
const TowerMap = dynamic(
  () =>
    import("@/components/dashboard/tower-map").then(
      (mod) => mod.default || mod
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-105 w-full items-center justify-center rounded-lg border border-[#d0d5db] bg-[#e7f3fb] text-[13px] text-[#6b7280]">
        Memuat peta interaktif menara...
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
  kab_kota?: string;
  kecamatan?: string;
  kelurahan?: string;
  dateCreated: string;
  tinggiAgl: number;
  kapasitasMaks?: number;
  registrationNo: string;
  status?: "REGISTERED" | "PENDING" | "REJECTED";
}

type ColumnKey =
  | "kodeId"
  | "namaPemilik"
  | "tahun"
  | "jenisMenara"
  | "tenants"
  | "longitude"
  | "latitude"
  | "alamat"
  | "provinsi"
  | "kab_kota"
  | "kecamatan"
  | "kelurahan"
  | "dateCreated"
  | "tinggiAgl"
  | "registrationNo";

const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "kodeId", label: "Kode/ID" },
  { key: "namaPemilik", label: "Nama Pemilik" },
  { key: "tahun", label: "Tahun" },
  { key: "jenisMenara", label: "Jenis Menara" },
  { key: "tenants", label: "Penyelenggara Jaringan" },
  { key: "longitude", label: "Longitude" },
  { key: "latitude", label: "Latitude" },
  { key: "alamat", label: "Alamat" },
  { key: "provinsi", label: "Provinsi" },
  { key: "kab_kota", label: "Kabupaten/Kota" },
  { key: "kecamatan", label: "Kecamatan" },
  { key: "kelurahan", label: "Kelurahan/Desa" },
  { key: "dateCreated", label: "Tanggal Pendaftaran" },
  { key: "tinggiAgl", label: "Tinggi (AGL)" },
  { key: "registrationNo", label: "No. Registrasi" },
];

type QueryFilters = {
  kodeId: string;
  namaPemilik: string;
  tahun: string;
  jenisMenara: string;
  tenant: string;
  alamat: string;
  longitude: string;
  latitude: string;
  date: string;
  tinggiMin: string;
  registrationNo: string;
};

const DEFAULT_FILTERS: QueryFilters = {
  kodeId: "",
  namaPemilik: "",
  tahun: "",
  jenisMenara: "",
  tenant: "",
  alamat: "",
  longitude: "",
  latitude: "",
  date: "",
  tinggiMin: "",
  registrationNo: "",
};

const YEAR_OPTIONS = Array.from(
  { length: 2026 - 1900 + 1 },
  (_, i) => 2026 - i
);

function localDateKey(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

interface DashboardStatsData {
  system: {
    directusConnected: boolean;
    directusStatus: string;
  };
  metrics: {
    totalTowers: number;
    totalCompanies: number;
    totalProvinces: number;
    totalSubmissions: number;
    registeredSubmissions: number;
    rejectedSubmissions: number;
    draftSubmissions: number;
  };
  methodDistribution: {
    excelCount: number;
    formCount: number;
    excelPercent: number;
    formPercent: number;
  };
  topCompanies: {
    name: string;
    count: number;
    percentage: number;
  }[];
  trendRecords: Array<{
    timestamp: string;
    type: "submission" | "tower";
  }>;
  recentActivities: {
    id: string;
    regNumber: string;
    company: string;
    method: string;
    rows: number;
    timestamp: string;
    status: "Registered" | "Rejected" | "Draft";
  }[];
}

type PortalTower = {
  id: string;
  id_menara?: string;
  nama_pemilik?: string;
  tahun_pembangunan?: number | string;
  jenis_menara?: string;
  longitude?: number | string;
  latitude?: number | string;
  alamat?: string;
  provinsi?: string;
  kab_kota?: string;
  kecamatan?: string;
  kelurahan?: string;
  metode_pendaftaran?: string;
  date_created?: string;
  tinggi_menara?: number | string;
  kapasitas_maksimal?: number | string;
  tenants?: Array<{ penyelenggara?: string }>;
};

type TowersResponse = {
  data?: PortalTower[];
  meta?: { total?: number };
  error?: string;
};

export default function DashboardPage() {
  const { role } = useAuth();

  // Role capabilities
  const isSuperAdmin = role === "Super Admin";
  const isWebManager = role === "Web Manager";
  const canViewInsights = isSuperAdmin || isWebManager;

  // Active view tab (Admin can toggle between Insights and Map/Records)
  const [activeTab, setActiveTab] = useState<"insights" | "map">(
    canViewInsights ? "insights" : "map"
  );
  const currentTab = canViewInsights ? activeTab : "map";

  // Dynamic Dashboard Stats from API & .env
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTowers, setLoadingTowers] = useState(true);
  const [dashboardTowers, setDashboardTowers] = useState<TowerRecord[]>([]);
  const [statsError, setStatsError] = useState("");
  const [towersError, setTowersError] = useState("");

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/stats");
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Ringkasan dashboard tidak dapat dimuat.");
      }
      setStats(data);
      setStatsError("");
    } catch (error) {
      setStatsError(
        error instanceof Error
          ? error.message
          : "Ringkasan dashboard tidak dapat dimuat.",
      );
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchTowers = useCallback(async (signal?: AbortSignal) => {
    try {
      const towers: PortalTower[] = [];
      let total = 0;
      let page = 1;
      while (towers.length < total || page === 1) {
        const response = await fetch(`/api/towers?page=${page}&limit=100`, {
          cache: "no-store",
          signal,
        });
        const payload = (await response.json().catch(() => null)) as TowersResponse | null;
        const pageTotal = payload?.meta?.total;
        if (!response.ok) {
          throw new Error(payload?.error || "Data menara tidak dapat dimuat.");
        }
        if (
          !payload ||
          !Array.isArray(payload.data) ||
          typeof pageTotal !== "number" ||
          !Number.isInteger(pageTotal) ||
          pageTotal < 0
        ) {
          throw new Error("Respons daftar menara dari Directus tidak valid.");
        }
        if (page === 1) total = pageTotal;
        if (payload.data.length === 0 && towers.length < total) {
          throw new Error("Daftar menara dari Directus tidak lengkap.");
        }
        towers.push(...payload.data);
        page += 1;
      }
      setTowersError("");
      setDashboardTowers(towers.map((tower) => ({
          id: tower.id,
          kodeId: tower.id_menara || "",
          namaPemilik: tower.nama_pemilik || "",
          tahun: tower.tahun_pembangunan || "",
          jenisMenara: tower.jenis_menara || "",
          tenants: (tower.tenants ?? []).map((tenant) => tenant.penyelenggara || ""),
          longitude: Number(tower.longitude) || 0,
          latitude: Number(tower.latitude) || 0,
          alamat: tower.alamat || "",
          provinsi: tower.provinsi || "",
          kab_kota: tower.kab_kota || "",
          kecamatan: tower.kecamatan || "",
          kelurahan: tower.kelurahan || "",
          dateCreated: tower.date_created || "",
          tinggiAgl: Number(tower.tinggi_menara) || 0,
          kapasitasMaks: Number(tower.kapasitas_maksimal) || 0,
          registrationNo: tower.id_menara || "",
          status: "REGISTERED",
        })));
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setTowersError(
        error instanceof Error
          ? error.message
          : "Data menara tidak dapat dimuat.",
      );
    } finally {
      if (!signal?.aborted) setLoadingTowers(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => {
      if (controller.signal.aborted) return;
      void fetchStats();
      void fetchTowers(controller.signal);
    });
    return () => controller.abort();
  }, [fetchStats, fetchTowers]);

  useEffect(() => {
    function refreshTowersWhenVisible() {
      if (document.visibilityState === "visible") {
        setLoadingTowers(true);
        void fetchTowers();
      }
    }
    document.addEventListener("visibilitychange", refreshTowersWhenVisible);
    return () => document.removeEventListener("visibilitychange", refreshTowersWhenVisible);
  }, [fetchTowers]);

  function refreshDashboard() {
    setLoadingStats(true);
    setLoadingTowers(true);
    setStatsError("");
    setTowersError("");
    void Promise.all([fetchStats(), fetchTowers()]);
  }

  // Query and table state
  const [draftFilters, setDraftFilters] = useState<QueryFilters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<QueryFilters>(DEFAULT_FILTERS);
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
    provinsi: true,
    kab_kota: true,
    kecamatan: true,
    kelurahan: true,
    dateCreated: true,
    tinggiAgl: true,
    registrationNo: true,
  });
  const [showColMenu, setShowColMenu] = useState<boolean>(false);

  const [page, setPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  const filteredTowers = useMemo(() => {
    const longitude = parseFloat(appliedFilters.longitude);
    const latitude = parseFloat(appliedFilters.latitude);
    const tinggiMin = parseFloat(appliedFilters.tinggiMin);

    return dashboardTowers.filter((t) => {
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
        !t.tenants
          .join(", ")
          .toLowerCase()
          .includes(appliedFilters.tenant.toLowerCase())
      ) {
        return false;
      }
      if (
        appliedFilters.alamat &&
        !t.alamat.toLowerCase().includes(appliedFilters.alamat.toLowerCase())
      ) {
        return false;
      }
      if (
        !Number.isNaN(longitude) &&
        Math.abs(t.longitude - longitude) > 0.0000005
      ) return false;
      if (
        !Number.isNaN(latitude) &&
        Math.abs(t.latitude - latitude) > 0.0000005
      ) return false;
      const registrationDate = localDateKey(t.dateCreated);
      if (appliedFilters.date && registrationDate !== appliedFilters.date) return false;
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
  }, [appliedFilters, dashboardTowers]);

  const totalPages = Math.max(1, Math.ceil(filteredTowers.length / rowsPerPage));
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
    setVisibleCols((prev: Record<ColumnKey, boolean>) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  function downloadCsv() {
    const cols = ALL_COLUMNS.filter((c) => visibleCols[c.key]);

    const header = cols.map((c) => `"${c.label}"`).join(",");
    const rows = filteredTowers.map((t) =>
      cols
        .map((c) => {
          const rawVal =
            c.key === "tenants" ? t.tenants.join(", ") : t[c.key];
          const val = String(rawVal ?? "").replace(/"/g, '""');
          return `"${val}"`;
        })
        .join(",")
    );

    const csvContent = "\uFEFF" + [header, ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dashboard-towers.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Fallback metrics if API is still loading
  const displayMetrics = stats?.metrics || {
    totalTowers: 0,
    totalCompanies: 0,
    totalProvinces: 0,
    totalSubmissions: 0,
    registeredSubmissions: 0,
    rejectedSubmissions: 0,
    draftSubmissions: 0,
  };

  const displayMethods = stats?.methodDistribution || {
    excelCount: 0,
    formCount: 0,
    excelPercent: 0,
    formPercent: 0,
  };

  const displayTopCompanies = stats?.topCompanies || [];
  const displayActivities = stats?.recentActivities || [];

  return (
    <div className="space-y-6 pb-12">
      {/* ───── DASHBOARD HEADER ───── */}
      {(statsError || towersError) && (
        <div role="alert" className="rounded-card border border-danger bg-danger-bg px-4 py-3 text-sm text-danger">
          {statsError || towersError}
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-heading">
              Dashboard Infrastruktur Pasif
            </h1>
            <Badge
              suppressHydrationWarning
              variant={isSuperAdmin ? "default" : isWebManager ? "info" : "outline"}
              className="text-[11px]"
            >
              {ROLE_DISPLAY[role] || role}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted">
            Portal Layanan dan Pemantauan Registrasi Menara Telekomunikasi Nasional
          </p>
        </div>

        {/* Action Controls & Backend Status */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Backend health indicator */}
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs text-heading shadow-card">
            <span
              className={`h-2 w-2 rounded-full ${
                stats?.system.directusConnected ? "bg-emerald-500" : "bg-primary animate-pulse"
              }`}
            />
            <span className="font-medium text-xs">
              {stats?.system.directusConnected
                ? "Directus: Online"
                : "Directus: Tidak terhubung"}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={refreshDashboard}
            disabled={loadingStats || loadingTowers}
            title="Segarkan statistik dan data menara"
          >
            <RotateCcw
              className={`h-3.5 w-3.5 text-primary ${loadingStats || loadingTowers ? "animate-spin" : ""}`}
            />
            <span>Segarkan</span>
          </Button>
        </div>
      </div>

      {/* ───── TAB NAVIGATION (For Super Admin & Web Manager) ───── */}
      {canViewInsights && (
        <div className="flex items-center gap-1 rounded-card border border-border-soft bg-surface p-1 shadow-card">
          <button
            type="button"
            onClick={() => setActiveTab("insights")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              currentTab === "insights"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-muted hover:bg-canvas hover:text-heading"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Ringkasan & Analisis Sistem</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("map")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              currentTab === "map"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-muted hover:bg-canvas hover:text-heading"
            }`}
          >
            <Globe2 className="h-4 w-4" />
            <span>Peta & Data Menara</span>
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 1: RINGKASAN & ANALISIS SISTEM (TAB 1)            */}
      {/* ========================================================= */}
      {canViewInsights && currentTab === "insights" && (
        <div className="space-y-6">
          {/* 1.2 TOP 4 KPI CARDS (Styled with Project Palette) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Total Menara */}
            <div className="flex items-center justify-between rounded-card border border-border-soft bg-surface p-5 shadow-card transition-shadow hover:shadow-pop">
              <div>
                <div className="text-xs font-medium text-muted">
                  Total Permohonan Menara
                </div>
                <div className="mt-1 text-2xl font-bold tracking-tight text-primary">
                  {displayMetrics.totalTowers.toLocaleString("id-ID")}
                </div>
                <div className="mt-1 flex items-center gap-1 text-2xs text-muted">
                  <span className="font-semibold text-primary">Aktif</span> dalam basis data nasional
                </div>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-nav-active-bg text-primary">
                <MapPin className="h-6 w-6" />
              </div>
            </div>

            {/* Card 2: Total Perusahaan */}
            <div className="flex items-center justify-between rounded-card border border-border-soft bg-surface p-5 shadow-card transition-shadow hover:shadow-pop">
              <div>
                <div className="text-xs font-medium text-muted">
                  Instansi / Perusahaan
                </div>
                <div className="mt-1 text-2xl font-bold tracking-tight text-[#00a8e8]">
                  {displayMetrics.totalCompanies} Instansi
                </div>
                <div className="mt-1 text-2xs text-muted">
                  Penyelenggara jaringan aktif
                </div>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e0f6ff] text-[#00a8e8]">
                <Building2 className="h-6 w-6" />
              </div>
            </div>

            {/* Card 3: Cakupan Wilayah */}
            <div className="flex items-center justify-between rounded-card border border-border-soft bg-surface p-5 shadow-card transition-shadow hover:shadow-pop">
              <div>
                <div className="text-xs font-medium text-muted">
                  Cakupan Wilayah
                </div>
                <div className="mt-1 text-2xl font-bold tracking-tight text-heading">
                  {displayMetrics.totalProvinces} Provinsi
                </div>
                <div className="mt-1 text-2xs text-muted">
                  514 Kabupaten / Kota
                </div>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#ddeef9] text-primary">
                <Globe2 className="h-6 w-6" />
              </div>
            </div>

            {/* Card 4: Status Kelulusan */}
            <div className="flex items-center justify-between rounded-card border border-border-soft bg-surface p-5 shadow-card transition-shadow hover:shadow-pop">
              <div>
                <div className="text-xs font-medium text-muted">
                  Registrasi Disetujui
                </div>
                <div className="mt-1 text-2xl font-bold tracking-tight text-emerald-600">
                  {displayMetrics.registeredSubmissions} Terdata
                </div>
                <div className="mt-1 text-2xs text-muted">
                  {displayMetrics.rejectedSubmissions} ditolak, {displayMetrics.draftSubmissions} draf
                </div>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* 1.3 MIDDLE ANALYTICS (Donut & Trend Charts) */}
          <InsightsAnalytics
           totalSubmissions={displayMetrics.totalSubmissions}
           methods={displayMethods}
           topCompanies={displayTopCompanies}
           trendRecords={stats?.trendRecords ?? []}
           activities={displayActivities}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 2: PETA & DATA MENARA (TAB 2 OR NORMAL USER)      */}
      {/* ========================================================= */}
      {(!canViewInsights || currentTab === "map") && (
        <div className="space-y-6">
          {/* 2.1 Query Data Card */}
          <form
            onSubmit={handleQuerySubmit}
            className="rounded-card border border-border-soft bg-surface p-6 shadow-card"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-heading">
                Cari Data
              </h2>
              <span className="text-xs text-muted">
                Default bbox: Indonesia (Lon 95–141, Lat -11–6)
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* 1. Kode/ID */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-heading">
                  Kode / ID menara
                </label>
                <input
                  type="text"
                  value={draftFilters.kodeId}
                  onChange={(e) =>
                    setDraftFilters((p: QueryFilters) => ({
                      ...p,
                      kodeId: e.target.value,
                    }))
                  }
                  placeholder="Contoh: TWR-TAHUN-XXXX"
                  className="h-9 w-full rounded-input border border-border bg-white px-3 text-xs text-heading placeholder:text-muted focus:border-primary focus:outline-none"
                />
              </div>

              {/* 2. Nama pemilik */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-heading">
                  Nama pemilik
                </label>
                <input
                  type="text"
                  value={draftFilters.namaPemilik}
                  onChange={(e) =>
                    setDraftFilters((p: QueryFilters) => ({
                      ...p,
                      namaPemilik: e.target.value,
                    }))
                  }
                  placeholder="Nama Pemilik"
                  className="h-9 w-full rounded-input border border-border bg-white px-3 text-xs text-heading placeholder:text-muted focus:border-primary focus:outline-none"
                />
              </div>

              {/* 3. Tahun pembangunan */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-heading">
                  Tahun pembangunan
                </label>
                <select
                  value={draftFilters.tahun}
                  onChange={(e) =>
                    setDraftFilters((p: QueryFilters) => ({
                      ...p,
                      tahun: e.target.value,
                    }))
                  }
                  className="h-9 w-full rounded-input border border-border bg-white px-3 text-xs text-heading focus:border-primary focus:outline-none"
                >
                  <option value="">Semua Tahun</option>
                  {YEAR_OPTIONS.map((year) => (
                    <option key={year} value={String(year)}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Jenis menara */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-heading">
                  Jenis menara
                </label>
                <select
                  value={draftFilters.jenisMenara}
                  onChange={(e) =>
                    setDraftFilters((p: QueryFilters) => ({
                      ...p,
                      jenisMenara: e.target.value,
                    }))
                  }
                  className="h-9 w-full rounded-input border border-border bg-white px-3 text-xs text-heading focus:border-primary focus:outline-none"
                >
                  <option value="">Semua</option>
                  <option value="Greenfield">Greenfield</option>
                  <option value="Rooftop">Rooftop</option>
                  <option value="Monopole">Monopole</option>
                  <option value="Guyed">Guyed</option>
                  <option value="Self-supporting (SST)">
                    Self-supporting (SST)
                  </option>
                </select>
              </div>

              {/* 5. Penyelenggara jaringan (Tenant) */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-heading">
                  Penyelenggara jaringan
                </label>
                <input
                  type="text"
                  value={draftFilters.tenant}
                  onChange={(e) =>
                    setDraftFilters((p: QueryFilters) => ({
                      ...p,
                      tenant: e.target.value,
                    }))
                  }
                  placeholder="Contoh: Telkomsel"
                  className="h-9 w-full rounded-input border border-border bg-white px-3 text-xs text-heading placeholder:text-muted focus:border-primary focus:outline-none"
                />
              </div>

              {/* 6. Alamat */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-heading">
                  Alamat
                </label>
                <input
                  type="text"
                  value={draftFilters.alamat}
                  onChange={(e) =>
                    setDraftFilters((p: QueryFilters) => ({
                      ...p,
                      alamat: e.target.value,
                    }))
                  }
                  placeholder="Jalan / Kota"
                  className="h-9 w-full rounded-input border border-border bg-white px-3 text-xs text-heading placeholder:text-muted focus:border-primary focus:outline-none"
                />
              </div>

              {/* 7. Longitude */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-heading">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={draftFilters.longitude}
                  onChange={(e) =>
                    setDraftFilters((p: QueryFilters) => ({
                      ...p,
                      longitude: e.target.value,
                    }))
                  }
                  placeholder="Contoh: 106.826902"
                  className="h-9 w-full rounded-input border border-border bg-white px-3 text-xs text-heading placeholder:text-muted focus:border-primary focus:outline-none"
                />
              </div>

              {/* 8. Latitude */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-heading">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={draftFilters.latitude}
                  onChange={(e) =>
                    setDraftFilters((p: QueryFilters) => ({
                      ...p,
                      latitude: e.target.value,
                    }))
                  }
                  placeholder="Contoh: -6.174531"
                  className="h-9 w-full rounded-input border border-border bg-white px-3 text-xs text-heading placeholder:text-muted focus:border-primary focus:outline-none"
                />
              </div>

              {/* 9. Tinggi AGL minimum */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-heading">
                  Tinggi AGL min (meter)
                </label>
                <input
                  type="number"
                  value={draftFilters.tinggiMin}
                  onChange={(e) =>
                    setDraftFilters((p: QueryFilters) => ({
                      ...p,
                      tinggiMin: e.target.value,
                    }))
                  }
                  placeholder="Contoh: 30"
                  className="h-9 w-full rounded-input border border-border bg-white px-3 text-xs text-heading placeholder:text-muted focus:border-primary focus:outline-none"
                />
              </div>

              {/* 10. Registration number */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-heading">
                  No. Registrasi
                </label>
                <input
                  type="text"
                  value={draftFilters.registrationNo}
                  onChange={(e) =>
                    setDraftFilters((p: QueryFilters) => ({
                      ...p,
                      registrationNo: e.target.value,
                    }))
                  }
                  placeholder="Contoh: REG-2026-000101"
                  className="h-9 w-full rounded-input border border-border bg-white px-3 text-xs text-heading placeholder:text-muted focus:border-primary focus:outline-none"
                />
              </div>

              {/* 11. Tanggal pendaftaran */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-heading">
                  Tanggal pendaftaran
                </label>
                <input
                  type="date"
                  value={draftFilters.date}
                  onChange={(e) =>
                    setDraftFilters((p: QueryFilters) => ({
                      ...p,
                      date: e.target.value,
                    }))
                  }
                  className="h-9 w-full rounded-input border border-border bg-white px-3 text-xs text-heading focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Filter buttons */}
            <div className="mt-5 flex items-center justify-end gap-3 border-t border-border-soft pt-4">
              <Button type="button" variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Atur Ulang</span>
              </Button>
              <Button type="submit" variant="primary" size="sm">
                <Search className="h-3.5 w-3.5" />
                <span>Terapkan Filter</span>
              </Button>
            </div>
          </form>

          {/* 2.2 Tower Map Card */}
          <div className="rounded-card border border-border-soft bg-surface p-6 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-heading">
                  Peta Menara Telekomunikasi
                </h2>
                <p className="text-xs text-muted">
                  Menampilkan {filteredTowers.length} menara sesuai filter; titik berdekatan dikelompokkan
                </p>
              </div>
              {selectedPinId && (
                <button
                  type="button"
                  onClick={() => setSelectedPinId(null)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Bersihkan pilihan pin
                </button>
              )}
            </div>

            <TowerMap towers={filteredTowers} />
          </div>

          {/* 2.3 Tower Data Table Card */}
          <div className="rounded-card border border-border-soft bg-surface p-6 shadow-card">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-heading">
                  Data Menara Telekomunikasi
                </h2>
                <p className="text-xs text-muted">
                  Menampilkan {filteredTowers.length} rekaman data
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Column configurator toggle */}
                <div className="relative">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowColMenu((v) => !v)}
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                    <span>Kolom</span>
                  </Button>

                  {showColMenu && (
                    <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-card border border-border-soft bg-surface p-3 shadow-pop">
                      <div className="mb-2 text-xs font-semibold text-heading">
                        Tampilkan Kolom
                      </div>
                      <div className="max-h-48 space-y-1.5 overflow-y-auto">
                        {ALL_COLUMNS.map((col) => (
                          <label
                            key={col.key}
                            className="flex cursor-pointer items-center gap-2 text-xs text-heading hover:text-primary"
                          >
                            <input
                              type="checkbox"
                              checked={visibleCols[col.key]}
                              onChange={() => toggleColumn(col.key)}
                              className="rounded text-primary focus:ring-primary"
                            />
                            <span>{col.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Download */}
                <Button
                  type="button"
                  variant="download"
                  size="sm"
                  onClick={downloadCsv}
                  title="Unduh kolom yang sedang tampil"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Unduh</span>
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-input border border-border-soft">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border-soft bg-table-head-bg text-heading font-semibold">
                  <tr>
                    {ALL_COLUMNS.filter((c) => visibleCols[c.key]).map((col) => (
                      <th key={col.key} className="p-3">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft text-heading">
                  {loadingTowers && dashboardTowers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={ALL_COLUMNS.filter((c) => visibleCols[c.key]).length}
                        className="p-8 text-center text-muted"
                      >
                        Memuat data menara...
                      </td>
                    </tr>
                  ) : paginatedTowers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={ALL_COLUMNS.filter((c) => visibleCols[c.key]).length}
                        className="p-8 text-center text-muted"
                      >
                        {dashboardTowers.length === 0
                          ? "Belum ada data menara aktif untuk akun ini."
                          : "Tidak ada data menara yang cocok dengan filter pencarian."}
                      </td>
                    </tr>
                  ) : (
                    paginatedTowers.map((tower) => (
                      <tr
                        key={tower.id}
                        onClick={() => setSelectedPinId(tower.id)}
                        className={`cursor-pointer transition-colors hover:bg-canvas ${
                          selectedPinId === tower.id ? "bg-nav-active-bg" : ""
                        }`}
                      >
                        {visibleCols.kodeId && (
                          <td className="p-3 font-semibold text-primary">
                            {tower.kodeId}
                          </td>
                        )}
                        {visibleCols.namaPemilik && (
                          <td className="p-3">{tower.namaPemilik}</td>
                        )}
                        {visibleCols.tahun && (
                          <td className="p-3">{tower.tahun}</td>
                        )}
                        {visibleCols.jenisMenara && (
                          <td className="p-3">
                            <span className="inline-flex items-center rounded-full bg-[#f1f5f9] px-2 py-0.5 text-2xs font-medium text-heading">
                              {tower.jenisMenara}
                            </span>
                          </td>
                        )}
                        {visibleCols.tenants && (
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {tower.tenants.map((ten, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center rounded bg-nav-active-bg px-1.5 py-0.5 text-2xs font-medium text-primary"
                                >
                                  {ten}
                                </span>
                              ))}
                            </div>
                          </td>
                        )}
                        {visibleCols.longitude && (
                          <td className="p-3 text-muted">{tower.longitude}</td>
                        )}
                        {visibleCols.latitude && (
                          <td className="p-3 text-muted">{tower.latitude}</td>
                        )}
                        {visibleCols.alamat && (
                          <td className="p-3 max-w-[200px] truncate text-muted" title={tower.alamat}>
                            {tower.alamat}
                          </td>
                        )}
                        {visibleCols.provinsi && (
                          <td className="p-3">{tower.provinsi || "—"}</td>
                        )}
                        {visibleCols.kab_kota && (
                          <td className="p-3">{tower.kab_kota || "—"}</td>
                        )}
                        {visibleCols.kecamatan && (
                          <td className="p-3">{tower.kecamatan || "—"}</td>
                        )}
                        {visibleCols.kelurahan && (
                          <td className="p-3">{tower.kelurahan || "—"}</td>
                        )}
                        {visibleCols.dateCreated && (
                          <td className="whitespace-nowrap p-3">
                            {tower.dateCreated
                              ? new Date(tower.dateCreated).toLocaleDateString("id-ID")
                              : "—"}
                          </td>
                        )}
                        {visibleCols.tinggiAgl && (
                          <td className="p-3">{tower.tinggiAgl} m</td>
                        )}
                        {visibleCols.registrationNo && (
                          <td className="p-3 font-mono text-2xs text-muted">
                            {tower.registrationNo}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
              <div className="flex items-center gap-2">
                <span>Baris per halaman:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-8 rounded-input border border-border bg-white px-2 text-xs text-heading focus:border-primary focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Sebelumnya
                </Button>
                <span className="px-2 font-medium text-heading">
                  Halaman {safePage} dari {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
