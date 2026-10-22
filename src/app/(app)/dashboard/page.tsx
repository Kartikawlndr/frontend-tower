"use client";

import { useAuth } from "@/context/AuthContext";
import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { clientEnv } from "@/lib/env";
import {
  Building2,
  Download,
  FileSpreadsheet,
  Globe2,
  MapPin,
  RotateCcw,
  Search,
  Settings2,
  Server,
  Database,
  ShieldCheck,
  CheckCircle2,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  kapasitasMaks?: number;
  registrationNo: string;
  status?: "REGISTERED" | "PENDING" | "REJECTED";
}

const SAMPLE_DASHBOARD_TOWERS: TowerRecord[] = [
  {
    id: "1",
    kodeId: "TOW-JKT-001",
    namaPemilik: "PT Dayamitra Telekomunikasi",
    tahun: 2019,
    jenisMenara: "Greenfield",
    tenants: ["Telkomsel", "Indosat"],
    longitude: 106.827153,
    latitude: -6.175392,
    alamat: "Jl. Medan Merdeka Barat No. 9, Jakarta Pusat",
    tinggiAgl: 72,
    kapasitasMaks: 4,
    registrationNo: "REG-2026-000101",
    status: "REGISTERED",
  },
  {
    id: "2",
    kodeId: "TOW-BDG-002",
    namaPemilik: "PT Profesional Telekomunikasi",
    tahun: 2020,
    jenisMenara: "Rooftop",
    tenants: ["XL Axiata", "Smartfren"],
    longitude: 107.619123,
    latitude: -6.917464,
    alamat: "Jl. Asia Afrika No. 65, Bandung",
    tinggiAgl: 45,
    kapasitasMaks: 3,
    registrationNo: "REG-2026-000102",
    status: "REGISTERED",
  },
  {
    id: "3",
    kodeId: "TOW-SBY-003",
    namaPemilik: "PT Tower Bersama",
    tahun: 2018,
    jenisMenara: "Monopole",
    tenants: ["Telkomsel"],
    longitude: 112.752088,
    latitude: -7.257472,
    alamat: "Jl. Pemuda No. 15, Surabaya",
    tinggiAgl: 36,
    kapasitasMaks: 2,
    registrationNo: "REG-2026-000103",
    status: "REGISTERED",
  },
  {
    id: "4",
    kodeId: "TOW-MDN-004",
    namaPemilik: "PT Dayamitra Telekomunikasi",
    tahun: 2021,
    jenisMenara: "Greenfield",
    tenants: ["Telkomsel", "XL Axiata"],
    longitude: 98.672226,
    latitude: 3.595196,
    alamat: "Jl. Balai Kota No. 1, Medan",
    tinggiAgl: 52,
    kapasitasMaks: 4,
    registrationNo: "REG-2026-000104",
    status: "REGISTERED",
  },
  {
    id: "5",
    kodeId: "TOW-MKS-005",
    namaPemilik: "PT Centratama Telekomunikasi",
    tahun: 2022,
    jenisMenara: "Guyed",
    tenants: ["Indosat"],
    longitude: 119.432732,
    latitude: -5.147665,
    alamat: "Jl. Urip Sumoharjo No. 88, Makassar",
    tinggiAgl: 60,
    kapasitasMaks: 3,
    registrationNo: "REG-2026-000105",
    status: "REGISTERED",
  },
  {
    id: "6",
    kodeId: "TOW-SMG-006",
    namaPemilik: "PT Tower Bersama",
    tahun: 2017,
    jenisMenara: "Greenfield",
    tenants: ["Telkomsel", "Smartfren"],
    longitude: 110.42083,
    latitude: -6.993056,
    alamat: "Jl. Pahlawan No. 7, Semarang",
    tinggiAgl: 48,
    kapasitasMaks: 3,
    registrationNo: "REG-2026-000106",
    status: "REGISTERED",
  },
  {
    id: "7",
    kodeId: "TOW-YOG-007",
    namaPemilik: "PT Profesional Telekomunikasi",
    tahun: 2020,
    jenisMenara: "Rooftop",
    tenants: ["XL Axiata"],
    longitude: 110.36949,
    latitude: -7.79558,
    alamat: "Jl. Malioboro No. 56, Yogyakarta",
    tinggiAgl: 30,
    kapasitasMaks: 2,
    registrationNo: "REG-2026-000107",
    status: "REGISTERED",
  },
  {
    id: "8",
    kodeId: "TOW-DPS-008",
    namaPemilik: "PT Dayamitra Telekomunikasi",
    tahun: 2023,
    jenisMenara: "Monopole",
    tenants: ["Telkomsel", "Indosat"],
    longitude: 115.216667,
    latitude: -8.65,
    alamat: "Jl. Gajah Mada No. 12, Denpasar",
    tinggiAgl: 40,
    kapasitasMaks: 3,
    registrationNo: "REG-2026-000108",
    status: "REGISTERED",
  },
  {
    id: "9",
    kodeId: "TOW-BJM-009",
    namaPemilik: "PT Centratama Telekomunikasi",
    tahun: 2019,
    jenisMenara: "Greenfield",
    tenants: ["Telkomsel"],
    longitude: 114.59075,
    latitude: -3.319389,
    alamat: "Jl. Lambung Mangkurat No. 22, Banjarmasin",
    tinggiAgl: 50,
    kapasitasMaks: 3,
    registrationNo: "REG-2026-000109",
    status: "REGISTERED",
  },
  {
    id: "10",
    kodeId: "TOW-PLM-010",
    namaPemilik: "PT Tower Bersama",
    tahun: 2021,
    jenisMenara: "Rooftop",
    tenants: ["Indosat", "Smartfren"],
    longitude: 104.756554,
    latitude: -2.976074,
    alamat: "Jl. Sudirman No. 100, Palembang",
    tinggiAgl: 38,
    kapasitasMaks: 2,
    registrationNo: "REG-2026-000110",
    status: "REGISTERED",
  },
  {
    id: "11",
    kodeId: "TOW-BPN-011",
    namaPemilik: "PT Profesional Telekomunikasi",
    tahun: 2022,
    jenisMenara: "Greenfield",
    tenants: ["Telkomsel", "XL Axiata"],
    longitude: 116.8312,
    latitude: -1.2675,
    alamat: "Jl. Jenderal Sudirman No. 45, Balikpapan",
    tinggiAgl: 65,
    kapasitasMaks: 4,
    registrationNo: "REG-2026-000111",
    status: "REGISTERED",
  },
  {
    id: "12",
    kodeId: "TOW-JPR-012",
    namaPemilik: "PT Dayamitra Telekomunikasi",
    tahun: 2024,
    jenisMenara: "Self-supporting (SST)",
    tenants: ["Telkomsel"],
    longitude: 140.71813,
    latitude: -2.53371,
    alamat: "Jl. Percetakan Negara No. 3, Jayapura",
    tinggiAgl: 72,
    kapasitasMaks: 4,
    registrationNo: "REG-2026-000112",
    status: "REGISTERED",
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
  { key: "namaPemilik", label: "Nama Pemilik" },
  { key: "tahun", label: "Tahun" },
  { key: "jenisMenara", label: "Jenis Menara" },
  { key: "tenants", label: "Penyelenggara Jaringan" },
  { key: "longitude", label: "Longitude" },
  { key: "latitude", label: "Latitude" },
  { key: "alamat", label: "Alamat" },
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
  lonMin: string;
  lonMax: string;
  latMin: string;
  latMax: string;
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
  lonMin: "95",
  lonMax: "141",
  latMin: "-11",
  latMax: "6",
  tinggiMin: "",
  registrationNo: "",
};

const YEAR_OPTIONS = Array.from(
  { length: 2026 - 1900 + 1 },
  (_, i) => 2026 - i
);

interface DashboardStatsData {
  system: {
    directusUrl: string;
    directusConnected: boolean;
    directusStatus: string;
    database: {
      client: string;
      host: string;
      port: number;
      database: string;
      user: string;
    };
    adminEmail: string;
    managerEmail: string;
    smtpHost: string;
    smtpPort: number;
    maxPayloadSize: string;
    userRegister: boolean;
    userRegisterRole: string;
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
  monthlyTrends: {
    month: string;
    submissions: number;
    towers: number;
  }[];
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
  const [loadingStats, setLoadingStats] = useState(false);

  // Fetch dynamic stats from /api/dashboard/stats
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch("/api/dashboard/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // Fallback already handled
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetch("/api/dashboard/stats")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data) {
          setStats(data);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

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
    tinggiAgl: true,
    registrationNo: true,
  });
  const [showColMenu, setShowColMenu] = useState<boolean>(false);

  const [page, setPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

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

  function exportCsv(onlyVisibleColumns: boolean) {
    const cols = onlyVisibleColumns
      ? ALL_COLUMNS.filter((c) => visibleCols[c.key])
      : ALL_COLUMNS;

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
    a.download = onlyVisibleColumns
      ? "dashboard-towers-export.csv"
      : "dashboard-towers-all.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Fallback metrics if API is still loading
  const displayMetrics = stats?.metrics || {
    totalTowers: 83455,
    totalCompanies: 24,
    totalProvinces: 34,
    totalSubmissions: 27,
    registeredSubmissions: 20,
    rejectedSubmissions: 4,
    draftSubmissions: 3,
  };

  const displayMethods = stats?.methodDistribution || {
    excelCount: 18,
    formCount: 9,
    excelPercent: 67,
    formPercent: 33,
  };

  const displayTopCompanies = stats?.topCompanies || [
    { name: "PT Telkomsel", count: 88, percentage: 85 },
    { name: "PT Dayamitra Telekomunikasi (Mitratel)", count: 72, percentage: 70 },
    { name: "PT Tower Bersama Infrastructure", count: 64, percentage: 60 },
    { name: "PT Profesional Telekomunikasi Indonesia (Protelindo)", count: 52, percentage: 50 },
    { name: "PT Centratama Telekomunikasi", count: 41, percentage: 40 },
  ];

  const displayActivities = stats?.recentActivities || [
    {
      id: "REG-2026-000027",
      regNumber: "REG-2026-000027",
      company: "PT Dayamitra Telekomunikasi",
      method: "Upload Excel",
      rows: 18,
      timestamp: "2026-10-19 12:18 WIB",
      status: "Registered" as const,
    },
    {
      id: "REG-2026-000026",
      regNumber: "REG-2026-000026",
      company: "PT Profesional Telekomunikasi",
      method: "Upload Excel",
      rows: 24,
      timestamp: "2026-10-19 11:45 WIB",
      status: "Registered" as const,
    },
    {
      id: "REG-2026-000025",
      regNumber: "REG-2026-000025",
      company: "PT Tower Bersama",
      method: "Application Form",
      rows: 1,
      timestamp: "2026-10-18 16:30 WIB",
      status: "Draft" as const,
    },
    {
      id: "REG-2026-000024",
      regNumber: "REG-2026-000024",
      company: "PT Centratama Telekomunikasi",
      method: "Upload Excel",
      rows: 32,
      timestamp: "2026-10-18 14:10 WIB",
      status: "Registered" as const,
    },
    {
      id: "REG-2026-000023",
      regNumber: "REG-2026-000023",
      company: "PT Solusi Tunas Pratama",
      method: "Upload Excel",
      rows: 12,
      timestamp: "2026-10-17 09:20 WIB",
      status: "Rejected" as const,
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* ───── DASHBOARD HEADER ───── */}
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
              {role}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted">
            Portal Layanan dan Pemantauan Registrasi Menara Telekomunikasi Nasional
          </p>
        </div>

        {/* Action Controls & Backend Status */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Directus / Standalone Environment Badge */}
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs text-heading shadow-card">
            <span
              className={`h-2 w-2 rounded-full ${
                stats?.system.directusConnected ? "bg-emerald-500" : "bg-primary animate-pulse"
              }`}
            />
            <span className="font-medium text-xs">
              {stats?.system.directusConnected
                ? `Directus: Online (${clientEnv.directusUrl})`
                : `Backend: ${clientEnv.directusUrl}`}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            disabled={loadingStats}
            title="Refresh dashboard data"
          >
            <RotateCcw
              className={`h-3.5 w-3.5 text-primary ${loadingStats ? "animate-spin" : ""}`}
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
          {/* 1.1 INFRASTRUCTURE & .ENV TELEMETRY CARD */}
          <div className="rounded-card border border-border-soft bg-gradient-to-r from-surface via-[#f0f7fc] to-surface p-5 shadow-card">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-nav-active-bg text-primary">
                  <Server className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-heading">
                      Konfigurasi Lingkungan Terintegrasi (.env)
                    </h2>
                    <Badge variant="success" className="text-[10px]">
                      Tersinkronisasi
                    </Badge>
                  </div>
                  <p className="text-xs text-muted">
                    Semua parameter frontend terhubung dengan Directus & PostgreSQL
                  </p>
                </div>
              </div>

              {/* Dynamic Parameter Badges */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center gap-1.5 rounded-lg border border-border-soft bg-white px-2.5 py-1.5 shadow-sm">
                  <Database className="h-3.5 w-3.5 text-primary" />
                  <span className="text-muted">Database:</span>
                  <span className="font-semibold text-heading">
                    {stats?.system.database.client || "pg"}://
                    {stats?.system.database.host || "localhost"}:
                    {stats?.system.database.port || 5432}/
                    {stats?.system.database.database || "directus"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 rounded-lg border border-border-soft bg-white px-2.5 py-1.5 shadow-sm">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#00a8e8]" />
                  <span className="text-muted">Admin:</span>
                  <span className="font-semibold text-heading">
                    {clientEnv.adminEmail}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 rounded-lg border border-border-soft bg-white px-2.5 py-1.5 shadow-sm">
                  <Download className="h-3.5 w-3.5 text-primary" />
                  <span className="text-muted">Max Upload:</span>
                  <span className="font-semibold text-heading uppercase">
                    {clientEnv.maxPayloadSize}
                  </span>
                </div>
              </div>
            </div>
          </div>

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
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            {/* Donut Chart: Metode Pendaftaran (2 Cols) */}
            <div className="rounded-card border border-border-soft bg-surface p-6 shadow-card lg:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-heading">
                    Metode Pendaftaran
                  </h3>
                  <p className="text-2xs text-muted">
                    Proporsi unggah Excel vs formulir online
                  </p>
                </div>
                <Badge variant="secondary" className="text-2xs">
                  {displayMetrics.totalSubmissions} Berkas
                </Badge>
              </div>

              <div className="mt-6 flex flex-col items-center justify-center sm:flex-row sm:gap-6">
                {/* SVG Donut Chart with Project Colors */}
                <div className="relative h-44 w-44">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                    {/* Background Track */}
                    <path
                      className="text-[#e5e7eb]"
                      strokeWidth="3.8"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* Segment 1: Upload Excel (#016db0) */}
                    <path
                      className="text-[#016db0] transition-all duration-500"
                      strokeDasharray={`${displayMethods.excelPercent}, 100`}
                      strokeWidth="3.8"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* Segment 2: Application Form (#00a8e8) */}
                    <path
                      className="text-[#00a8e8] transition-all duration-500"
                      strokeDasharray={`${displayMethods.formPercent}, 100`}
                      strokeDashoffset={`-${displayMethods.excelPercent}`}
                      strokeWidth="3.8"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>

                  {/* Inner text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-extrabold text-heading">
                      {displayMethods.excelPercent}%
                    </span>
                    <span className="text-[10px] font-medium text-muted">
                      Unggah Excel
                    </span>
                  </div>
                </div>

                {/* Legend with Project Palette */}
                <div className="mt-4 space-y-3 text-xs sm:mt-0">
                  <div className="flex items-center gap-2.5">
                    <span className="h-3.5 w-3.5 rounded-full bg-[#016db0]"></span>
                    <div>
                      <div className="font-semibold text-heading">
                        Upload Excel ({displayMethods.excelPercent}%)
                      </div>
                      <div className="text-2xs text-muted">
                        {displayMethods.excelCount} berkas massal
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="h-3.5 w-3.5 rounded-full bg-[#00a8e8]"></span>
                    <div>
                      <div className="font-semibold text-heading">
                        Formulir Online ({displayMethods.formPercent}%)
                      </div>
                      <div className="text-2xs text-muted">
                        {displayMethods.formCount} permohonan tunggal
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Chart: Tren Pendaftaran Bulanan (3 Cols) */}
            <div className="rounded-card border border-border-soft bg-surface p-6 shadow-card lg:col-span-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-heading">
                    Grafik Tren Pendaftaran Menara
                  </h3>
                  <p className="text-2xs text-muted">
                    Volume pengajuan data infrastruktur pasif bulanan (2026)
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-primary font-semibold">
                  <ArrowUpRight className="h-4 w-4" />
                  <span>+18.4% Rata-rata</span>
                </div>
              </div>

              <div className="mt-4 h-48 w-full">
                <svg
                  className="h-full w-full overflow-visible"
                  viewBox="0 0 500 150"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#016db0" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#016db0" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid Lines */}
                  <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="75" x2="500" y2="75" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="120" x2="500" y2="120" stroke="#f1f5f9" strokeWidth="1" />

                  {/* Shaded Area */}
                  <path
                    d="M 0 130 Q 40 85, 80 110 T 160 55 T 240 115 T 320 45 T 400 35 T 500 45 L 500 150 L 0 150 Z"
                    fill="url(#primaryGradient)"
                  />

                  {/* Curved Primary Line */}
                  <path
                    d="M 0 130 Q 40 85, 80 110 T 160 55 T 240 115 T 320 45 T 400 35 T 500 45"
                    fill="none"
                    stroke="#016db0"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {/* Accent Cyan Line for Trend */}
                  <path
                    d="M 0 140 Q 40 100, 80 120 T 160 75 T 240 130 T 320 65 T 400 55 T 500 65"
                    fill="none"
                    stroke="#00a8e8"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                </svg>

                {/* Month labels */}
                <div className="mt-3 flex justify-between text-[11px] font-medium text-muted">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>Mei</span>
                  <span>Jun</span>
                  <span>Jul</span>
                  <span>Agu</span>
                  <span>Sep</span>
                  <span>Okt</span>
                  <span>Nov</span>
                  <span>Des</span>
                </div>
              </div>
            </div>
          </div>

          {/* 1.4 BOTTOM SECTION: TOP COMPANIES & RECENT ACTIVITIES */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Top 5 Penyelenggara Jaringan */}
            <div className="rounded-card border border-border-soft bg-surface p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-heading">
                  Top Penyelenggara Jaringan (Tenants)
                </h3>
                <span className="text-2xs text-muted">Pangsa Menara Aktif</span>
              </div>

              <div className="space-y-4 text-xs">
                {displayTopCompanies.map((item, idx) => (
                  <div key={idx}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="font-semibold text-heading">{item.name}</span>
                      <span className="text-muted font-medium">
                        {item.count} menara ({item.percentage}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-[#f1f5f9] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#016db0] to-[#00a8e8] transition-all duration-500"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Aktivitas Pendaftaran Terbaru */}
            <div className="rounded-card border border-border-soft bg-surface p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-heading">
                    Aktivitas Pendaftaran Terbaru
                  </h3>
                  <p className="text-2xs text-muted">
                    Log permohonan registrasi masuk terkini
                  </p>
                </div>
                <Badge variant="outline" className="text-2xs">
                  Real-time
                </Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border-soft text-muted font-semibold">
                      <th className="pb-2.5">No. Registrasi</th>
                      <th className="pb-2.5">Perusahaan</th>
                      <th className="pb-2.5">Metode</th>
                      <th className="pb-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-soft text-heading">
                    {displayActivities.map((act) => (
                      <tr key={act.id} className="hover:bg-canvas">
                        <td className="py-3 font-semibold text-primary">
                          {act.regNumber}
                        </td>
                        <td className="py-3 max-w-[150px] truncate text-muted">
                          {act.company}
                        </td>
                        <td className="py-3 text-muted">{act.method}</td>
                        <td className="py-3 text-right">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              act.status === "Registered"
                                ? "bg-emerald-100 text-emerald-800"
                                : act.status === "Draft"
                                ? "bg-amber text-amber-text"
                                : "bg-danger-bg text-danger"
                            }`}
                          >
                            {act.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
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
                Query data
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
                  placeholder="e.g. TOW-JKT-001"
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
                  placeholder="Owner name"
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
                  <option value="">All</option>
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
                  placeholder="e.g. Telkomsel"
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
                  placeholder="Street / City"
                  className="h-9 w-full rounded-input border border-border bg-white px-3 text-xs text-heading placeholder:text-muted focus:border-primary focus:outline-none"
                />
              </div>

              {/* 7. Longitude range */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-heading">
                  Longitude (min – max)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    value={draftFilters.lonMin}
                    onChange={(e) =>
                      setDraftFilters((p: QueryFilters) => ({
                        ...p,
                        lonMin: e.target.value,
                      }))
                    }
                    className="h-9 w-1/2 rounded-input border border-border bg-white px-2 text-xs text-heading focus:border-primary focus:outline-none"
                  />
                  <span className="text-muted">–</span>
                  <input
                    type="number"
                    step="any"
                    value={draftFilters.lonMax}
                    onChange={(e) =>
                      setDraftFilters((p: QueryFilters) => ({
                        ...p,
                        lonMax: e.target.value,
                      }))
                    }
                    className="h-9 w-1/2 rounded-input border border-border bg-white px-2 text-xs text-heading focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* 8. Latitude range */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-heading">
                  Latitude (min – max)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    value={draftFilters.latMin}
                    onChange={(e) =>
                      setDraftFilters((p: QueryFilters) => ({
                        ...p,
                        latMin: e.target.value,
                      }))
                    }
                    className="h-9 w-1/2 rounded-input border border-border bg-white px-2 text-xs text-heading focus:border-primary focus:outline-none"
                  />
                  <span className="text-muted">–</span>
                  <input
                    type="number"
                    step="any"
                    value={draftFilters.latMax}
                    onChange={(e) =>
                      setDraftFilters((p: QueryFilters) => ({
                        ...p,
                        latMax: e.target.value,
                      }))
                    }
                    className="h-9 w-1/2 rounded-input border border-border bg-white px-2 text-xs text-heading focus:border-primary focus:outline-none"
                  />
                </div>
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
                  placeholder="e.g. 30"
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
                  placeholder="e.g. REG-2026-000101"
                  className="h-9 w-full rounded-input border border-border bg-white px-3 text-xs text-heading placeholder:text-muted focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Filter buttons */}
            <div className="mt-5 flex items-center justify-end gap-3 border-t border-border-soft pt-4">
              <Button type="button" variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </Button>
              <Button type="submit" variant="primary" size="sm">
                <Search className="h-3.5 w-3.5" />
                <span>Apply query</span>
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
                  Menampilkan {filteredTowers.length} menara aktif dari seluruh Indonesia
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

                {/* Download and Export Buttons */}
                <Button
                  type="button"
                  variant="download"
                  size="sm"
                  onClick={() => exportCsv(true)}
                  title="Unduh kolom yang sedang tampil"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => exportCsv(false)}
                  title="Ekspor seluruh data ke file CSV"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>Export</span>
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
                  {paginatedTowers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={ALL_COLUMNS.filter((c) => visibleCols[c.key]).length}
                        className="p-8 text-center text-muted"
                      >
                        Tidak ada data menara yang cocok dengan filter pencarian.
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
                  Prev
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
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
