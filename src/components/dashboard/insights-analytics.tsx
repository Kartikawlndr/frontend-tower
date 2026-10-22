"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const PRIMARY = "#016db0";
const ACCENT = "#00a8e8";
const TRACK = "#e5e7eb";
const GRID = "#f1f5f9";
const AXIS_TEXT = "#6b7280";

export interface MethodData {
  excelCount: number;
  formCount: number;
  excelPercent: number;
  formPercent: number;
}

export interface CompanyData {
  name: string;
  count: number;
  percentage: number;
}

export interface TrendPoint {
  month: string;
  submissions: number;
  towers: number;
}

export interface ActivityData {
  id: string;
  regNumber: string;
  company: string;
  method: string;
  rows: number;
  timestamp: string;
  status: "Registered" | "Rejected" | "Draft";
}

interface InsightsAnalyticsProps {
  totalSubmissions: number;
  methods: MethodData;
  topCompanies: CompanyData[];
  trends?: TrendPoint[];
  activities: ActivityData[];
}

const FALLBACK_TRENDS: TrendPoint[] = [
  { month: "Jan", submissions: 1, towers: 12 },
  { month: "Feb", submissions: 1, towers: 20 },
  { month: "Mar", submissions: 2, towers: 35 },
  { month: "Apr", submissions: 2, towers: 41 },
  { month: "Mei", submissions: 3, towers: 60 },
  { month: "Jun", submissions: 2, towers: 48 },
  { month: "Jul", submissions: 3, towers: 72 },
  { month: "Agu", submissions: 4, towers: 90 },
  { month: "Sep", submissions: 4, towers: 85 },
  { month: "Okt", submissions: 5, towers: 118 },
];

const formatNumber = (n: number) => n.toLocaleString("id-ID");

const formatPercent = (n: number) => n.toFixed(1).replace(".", ",");

function percentChange(prev: number, current: number): number | null {
  if (prev <= 0) return null;
  return ((current - prev) / prev) * 100;
}

function niceStep(raw: number) {
  if (raw <= 1) return 1;
  const p = 10 ** Math.floor(Math.log10(raw));
  const n = raw / p;
  const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return m * p;
}

function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(Math.floor(el.getBoundingClientRect().width));
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.floor(entry.contentRect.width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

function DeltaChip({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-2xs text-muted">Tanpa pembanding</span>;
  }
  const flat = value === 0;
  const up = value > 0;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  const tone = flat
    ? "bg-canvas text-muted"
    : up
    ? "bg-emerald-100 text-emerald-800"
    : "bg-danger-bg text-danger";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold ${tone}`}
    >
      <Icon className="h-3 w-3" />
      {up ? "+" : ""}
      {formatPercent(value)}%
    </span>
  );
}

function MethodDonut({
  methods,
  total,
}: {
  methods: MethodData;
  total: number;
}) {
  const [hover, setHover] = useState<string | null>(null);

  const segments = useMemo(() => {
    const items = [
      {
        key: "excel",
        label: "Unggah Excel",
        sub: "berkas massal",
        count: methods.excelCount,
        percent: methods.excelPercent,
        color: PRIMARY,
      },
      {
        key: "form",
        label: "Formulir Online",
        sub: "permohonan tunggal",
        count: methods.formCount,
        percent: methods.formPercent,
        color: ACCENT,
      },
    ];
    let offset = 0;
    return items.map((item) => {
      const start = offset;
      offset += item.percent;
      return { ...item, start };
    });
  }, [methods]);

  const gap = segments.every((s) => s.percent > 0) ? 1.4 : 0;
  const active = segments.find((s) => s.key === hover);

  return (
    <div className="rounded-card border border-border-soft bg-surface p-6 shadow-card lg:col-span-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-heading">Metode Pendaftaran</h3>
          <p className="text-2xs text-muted">
            Proporsi unggah Excel vs formulir online
          </p>
        </div>
        <Badge variant="secondary" className="text-2xs">
          {formatNumber(total)} Berkas
        </Badge>
      </div>

      <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row lg:flex-col xl:flex-row">
        <div className="relative h-44 w-44 shrink-0">
          <svg
            className="h-full w-full -rotate-90"
            viewBox="0 0 36 36"
            role="img"
            aria-label={`Unggah Excel ${methods.excelPercent} persen, formulir online ${methods.formPercent} persen`}
          >
            <circle
              cx="18"
              cy="18"
              r="15.9155"
              fill="none"
              stroke={TRACK}
              strokeWidth="3.6"
            />
            {segments.map((s) => {
              if (s.percent <= 0) return null;
              const len = Math.max(s.percent - gap, 0);
              const dimmed = hover !== null && hover !== s.key;
              return (
                <circle
                  key={s.key}
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="none"
                  stroke={s.color}
                  strokeWidth={hover === s.key ? 4.6 : 3.6}
                  strokeDasharray={`${len} ${100 - len}`}
                  strokeDashoffset={-(s.start + gap / 2)}
                  style={{
                    opacity: dimmed ? 0.35 : 1,
                    transition:
                      "stroke-width 150ms ease, opacity 150ms ease, stroke-dasharray 500ms ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={() => setHover(s.key)}
                  onMouseLeave={() => setHover(null)}
                />
              );
            })}
          </svg>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-extrabold tabular-nums text-heading">
              {active ? `${active.percent}%` : formatNumber(total)}
            </span>
            <span className="mt-0.5 max-w-[6.5rem] text-[10px] font-medium text-muted">
              {active ? active.label : "Total Berkas"}
            </span>
          </div>
        </div>

        <div className="w-full space-y-2 text-xs">
          {segments.map((s) => (
            <button
              key={s.key}
              type="button"
              onMouseEnter={() => setHover(s.key)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(s.key)}
              onBlur={() => setHover(null)}
              className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                hover === s.key
                  ? "border-border bg-canvas"
                  : "border-border-soft bg-surface"
              }`}
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-heading">
                  {s.label}
                </span>
                <span className="block text-2xs text-muted">
                  {formatNumber(s.count)} {s.sub}
                </span>
              </span>
              <span className="text-sm font-bold tabular-nums text-heading">
                {s.percent}%
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

type Metric = "submissions" | "towers";

const METRICS: Record<Metric, { label: string; unit: string; color: string }> =
  {
    submissions: { label: "Pengajuan", unit: "berkas", color: PRIMARY },
    towers: { label: "Menara", unit: "menara", color: ACCENT },
  };

function TrendChart({ data }: { data: TrendPoint[] }) {
  const [metric, setMetric] = useState<Metric>("submissions");
  const [active, setActive] = useState<number | null>(null);
  const [wrapRef, width] = useElementWidth<HTMLDivElement>();

  const cfg = METRICS[metric];
  const height = 232;
  const margin = { t: 12, r: 16, b: 28, l: 40 };
  const innerW = Math.max(width - margin.l - margin.r, 0);
  const innerH = height - margin.t - margin.b;

  const values = data.map((d) => d[metric]);
  const max = Math.max(...values, 0);
  const step = niceStep(max / 4);
  const top = step * 4;
  const ticks = [0, 1, 2, 3, 4].map((i) => i * step);

  const x = (i: number) =>
    margin.l + (values.length <= 1 ? innerW / 2 : (i / (values.length - 1)) * innerW);
  const y = (v: number) => margin.t + innerH - (v / top) * innerH;

  const linePath = values
    .map((v, i) => `${i === 0 ? "M" : "L"}${x(i)} ${y(v)}`)
    .join(" ");
  const areaPath = values.length
    ? `${linePath} L${x(values.length - 1)} ${margin.t + innerH} L${x(0)} ${margin.t + innerH} Z`
    : "";

  const focusIdx = active ?? values.length - 1;
  const focusValue = focusIdx >= 0 ? values[focusIdx] : 0;
  const focusDelta =
    focusIdx > 0 ? percentChange(values[focusIdx - 1], focusValue) : null;
  const periodTotal = values.reduce((a, b) => a + b, 0);

  const labelEvery = Math.max(
    1,
    Math.ceil(values.length / Math.max(1, Math.floor(innerW / 52)))
  );

  function handlePointer(e: React.PointerEvent<SVGRectElement>) {
    if (!values.length || !innerW) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / innerW;
    const idx = Math.round(ratio * (values.length - 1));
    setActive(Math.min(values.length - 1, Math.max(0, idx)));
  }

  function handleKey(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!values.length) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setActive((p) => Math.min(values.length - 1, (p ?? values.length - 2) + 1));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setActive((p) => Math.max(0, (p ?? values.length) - 1));
    } else if (e.key === "Escape") {
      setActive(null);
    }
  }

  const tooltipLeft =
    active !== null ? Math.min(Math.max(x(active), 70), Math.max(width - 70, 70)) : 0;
  const tooltipAbove = active !== null ? y(values[active]) > 76 : true;
  const tooltipDelta =
    active !== null && active > 0
      ? percentChange(values[active - 1], values[active])
      : null;

  return (
    <div className="rounded-card border border-border-soft bg-surface p-6 shadow-card lg:col-span-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-heading">
            Grafik Tren Pendaftaran Menara
          </h3>
          <p className="text-2xs text-muted">
            Volume pengajuan data infrastruktur pasif bulanan (2026)
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Pilih metrik"
          className="flex items-center gap-1 rounded-lg border border-border-soft bg-canvas p-0.5"
        >
          {(Object.keys(METRICS) as Metric[]).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={metric === key}
              onClick={() => setMetric(key)}
              className={`rounded-md px-3 py-1 text-2xs font-semibold transition-colors ${
                metric === key
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-muted hover:text-heading"
              }`}
            >
              {METRICS[key].label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-2">
        <div className="flex items-baseline gap-2.5">
          <span className="text-2xl font-bold tabular-nums tracking-tight text-heading">
            {formatNumber(focusValue)}
          </span>
          <span className="text-xs text-muted">
            {cfg.unit}
            {data[focusIdx] ? ` pada ${data[focusIdx].month}` : ""}
          </span>
          <DeltaChip value={focusDelta} />
        </div>
        <span className="text-2xs text-muted">
          Total periode:{" "}
          <span className="font-semibold text-heading">
            {formatNumber(periodTotal)} {cfg.unit}
          </span>
        </span>
      </div>

      <div
        ref={wrapRef}
        tabIndex={0}
        role="group"
        aria-label={`Grafik garis ${cfg.label} bulanan. Gunakan tombol panah untuk berpindah bulan.`}
        onKeyDown={handleKey}
        onBlur={() => setActive(null)}
        className="relative mt-3 w-full rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        style={{ height }}
      >
        {width > 0 && values.length > 0 && (
          <svg width={width} height={height} className="block overflow-visible">
            {ticks.map((t) => (
              <g key={t}>
                <line
                  x1={margin.l}
                  x2={margin.l + innerW}
                  y1={y(t)}
                  y2={y(t)}
                  stroke={t === 0 ? TRACK : GRID}
                  strokeWidth={1}
                />
                <text
                  x={margin.l - 8}
                  y={y(t)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize="10"
                  fill={AXIS_TEXT}
                >
                  {formatNumber(t)}
                </text>
              </g>
            ))}

            <path d={areaPath} fill={cfg.color} fillOpacity={0.08} />
            <path
              d={linePath}
              fill="none"
              stroke={cfg.color}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {active !== null && (
              <line
                x1={x(active)}
                x2={x(active)}
                y1={margin.t}
                y2={margin.t + innerH}
                stroke={cfg.color}
                strokeOpacity={0.4}
                strokeDasharray="3 3"
              />
            )}

            {values.map((v, i) => {
              const isActive = i === active;
              const isLast = active === null && i === values.length - 1;
              return (
                <circle
                  key={i}
                  cx={x(i)}
                  cy={y(v)}
                  r={isActive || isLast ? 5 : 3}
                  fill={isActive || isLast ? cfg.color : "#ffffff"}
                  stroke={cfg.color}
                  strokeWidth={2}
                  style={{ transition: "r 120ms ease" }}
                />
              );
            })}

            {data.map((d, i) =>
              i % labelEvery === 0 ? (
                <text
                  key={`${d.month}-${i}`}
                  x={x(i)}
                  y={height - 8}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight={i === focusIdx ? 700 : 500}
                  fill={i === focusIdx ? PRIMARY : AXIS_TEXT}
                >
                  {d.month}
                </text>
              ) : null
            )}

            <rect
              x={margin.l}
              y={margin.t}
              width={innerW}
              height={innerH}
              fill="transparent"
              style={{ touchAction: "pan-y", cursor: "crosshair" }}
              onPointerMove={handlePointer}
              onPointerDown={handlePointer}
              onPointerLeave={() => setActive(null)}
            />
          </svg>
        )}

        {active !== null && width > 0 && (
          <div
            className="pointer-events-none absolute z-10 min-w-[120px] rounded-lg border border-border-soft bg-surface px-3 py-2 text-xs shadow-pop"
            style={{
              left: tooltipLeft,
              top: tooltipAbove ? y(values[active]) - 12 : y(values[active]) + 14,
              transform: tooltipAbove ? "translate(-50%, -100%)" : "translate(-50%, 0)",
            }}
          >
            <div className="text-2xs font-medium text-muted">
              {data[active].month} 2026
            </div>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: cfg.color }}
              />
              <span className="font-bold tabular-nums text-heading">
                {formatNumber(values[active])}
              </span>
              <span className="text-muted">{cfg.unit}</span>
            </div>
            <div className="mt-1">
              <DeltaChip value={tooltipDelta} />
            </div>
          </div>
        )}

        {values.length === 0 && (
          <div className="flex h-full items-center justify-center text-xs text-muted">
            Belum ada data tren.
          </div>
        )}
      </div>
    </div>
  );
}

function TopCompanies({ items }: { items: CompanyData[] }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const maxCount = Math.max(...items.map((i) => i.count), 1);

  return (
    <div className="rounded-card border border-border-soft bg-surface p-6 shadow-card">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-sm font-bold text-heading">
          Top Penyelenggara Jaringan (Tenants)
        </h3>
        <span className="text-2xs text-muted">Pangsa Menara Aktif</span>
      </div>

      {items.length === 0 ? (
        <div className="py-8 text-center text-xs text-muted">
          Belum ada data penyelenggara.
        </div>
      ) : (
        <ol className="space-y-3.5 text-xs">
          {items.map((item, idx) => (
            <li key={`${item.name}-${idx}`} className="group">
              <div className="mb-1.5 flex items-center gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-nav-active-bg text-[10px] font-bold text-primary">
                  {idx + 1}
                </span>
                <span
                  className="min-w-0 flex-1 truncate font-semibold text-heading"
                  title={item.name}
                >
                  {item.name}
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-heading">
                  {formatNumber(item.count)}
                </span>
                <span className="w-10 shrink-0 text-right tabular-nums text-muted">
                  {item.percentage}%
                </span>
              </div>
              <div className="ml-[30px] h-2 overflow-hidden rounded-full bg-[#f1f5f9]">
                <div
                  className="h-full rounded-full bg-[#016db0] transition-all duration-700 ease-out group-hover:bg-[#00a8e8]"
                  style={{
                    width: ready ? `${(item.count / maxCount) * 100}%` : "0%",
                    transitionDelay: `${idx * 60}ms`,
                  }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

type StatusFilter = "all" | ActivityData["status"];

const STATUS_META: Record<
  ActivityData["status"],
  { label: string; badge: string; dot: string }
> = {
  Registered: {
    label: "Terdaftar",
    badge: "bg-emerald-100 text-emerald-800",
    dot: "bg-emerald-600",
  },
  Draft: {
    label: "Draf",
    badge: "bg-amber text-amber-text",
    dot: "bg-amber-text",
  },
  Rejected: {
    label: "Ditolak",
    badge: "bg-danger-bg text-danger",
    dot: "bg-danger",
  },
};

function methodLabel(method: string) {
  if (method === "Upload Excel") return "Unggah Excel";
  if (method === "Application Form") return "Formulir Pendaftaran";
  return method;
}

function RecentActivities({ items }: { items: ActivityData[] }) {
  const [filter, setFilter] = useState<StatusFilter>("all");

  const counts = useMemo(
    () => ({
      all: items.length,
      Registered: items.filter((i) => i.status === "Registered").length,
      Draft: items.filter((i) => i.status === "Draft").length,
      Rejected: items.filter((i) => i.status === "Rejected").length,
    }),
    [items]
  );

  const visible =
    filter === "all" ? items : items.filter((i) => i.status === filter);

  return (
    <div className="rounded-card border border-border-soft bg-surface p-6 shadow-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
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

      <div className="mb-4 flex flex-wrap items-center gap-1.5 border-b border-border-soft pb-3 text-xs">
        {(["all", "Registered", "Draft", "Rejected"] as StatusFilter[]).map(
          (key) => {
            const label =
              key === "all" ? "Semua" : STATUS_META[key].label;
            const count = counts[key];
            const active = filter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-2xs font-semibold transition-colors ${
                  active
                    ? "bg-primary text-on-primary"
                    : "text-muted hover:bg-canvas hover:text-heading"
                }`}
              >
                <span>{label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    active
                      ? "bg-white/20 text-on-primary"
                      : "bg-[#f1f5f9] text-muted"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          }
        )}
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
            {visible.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-muted">
                  Tidak ada aktivitas dengan status ini.
                </td>
              </tr>
            ) : (
              visible.map((act) => {
                const meta = STATUS_META[act.status];
                return (
                  <tr key={act.id} className="hover:bg-canvas">
                    <td className="py-3 font-semibold text-primary">
                      {act.regNumber}
                      <span className="block text-[10px] font-normal text-muted">
                        {act.timestamp}
                      </span>
                    </td>
                    <td className="py-3 max-w-[150px] truncate text-muted">
                      {act.company}
                    </td>
                    <td className="py-3 text-muted">
                      {methodLabel(act.method)}
                      <span className="block text-[10px] text-muted">
                        {act.rows} baris
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.badge}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${meta.dot}`}
                        />
                        {meta.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function InsightsAnalytics({
  totalSubmissions,
  methods,
  topCompanies,
  trends = FALLBACK_TRENDS,
  activities,
}: InsightsAnalyticsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <MethodDonut methods={methods} total={totalSubmissions} />
        <TrendChart data={trends && trends.length > 0 ? trends : FALLBACK_TRENDS} />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopCompanies items={topCompanies} />
        <RecentActivities items={activities} />
      </div>
    </div>
  );
}