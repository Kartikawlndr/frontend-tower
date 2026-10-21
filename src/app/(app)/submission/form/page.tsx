"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Plus, Send } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// Dynamic import komponen react-leaflet secara aman tanpa SSR
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

// Komponen helper untuk mendeteksi klik di peta
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  const { useMapEvents } = require("react-leaflet");
  useMapEvents({
    click(e: any) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}
 
const JENIS_MENARA = [
  "Greenfield",
  "Rooftop",
  "Monopole",
  "Guyed",
  "Self-supporting (SST)",
];
 
type Values = {
  kode: string;
  pemilik: string;
  tahun: string;
  jenis: string;
  longitude: string;
  latitude: string;
  alamat: string;
  tinggi: string;
  kapMaks: string;
  kapSewa: string;
  kapSendiri: string;
};
 
type Tenant = { id: number; name: string };
 
type Errors = {
  fields: Partial<Record<keyof Values, string>>;
  tenants: Record<number, string>;
};
 
const EMPTY: Values = {
  kode: "",
  pemilik: "",
  tahun: "",
  jenis: "",
  longitude: "",
  latitude: "",
  alamat: "",
  tinggi: "",
  kapMaks: "",
  kapSewa: "",
  kapSendiri: "",
};
 
function textError(value: string) {
  const v = value.trim();
  if (!v) return "Required";
  if (v.length > 50) return "Max 50 characters";
  return undefined;
}
 
function coordError(value: string, min: number, max: number) {
  const v = value.trim();
  if (!v) return "Required";
  if (!/^-?\d+(\.\d{1,6})?$/.test(v)) return "Enter a number with up to 6 decimals";
  const n = Number(v);
  if (n < min || n > max) return `Must be between ${min} and ${max}`;
  return undefined;
}
 
function validate(values: Values, tenants: Tenant[]): Errors {
  const fields: Errors["fields"] = {};
  const set = (key: keyof Values, message: string | undefined) => {
    if (message) fields[key] = message;
  };
 
  set("kode", textError(values.kode));
  set("pemilik", textError(values.pemilik));
  set("jenis", values.jenis ? undefined : "Required");
  set("longitude", coordError(values.longitude, 95, 141));
  set("latitude", coordError(values.latitude, -11, 6));
  set("alamat", textError(values.alamat));
  set("kapMaks", textError(values.kapMaks));
  set("kapSewa", textError(values.kapSewa));
  set("kapSendiri", textError(values.kapSendiri));
 
  const year = new Date().getFullYear();
  const tahun = values.tahun.trim();
  if (!tahun) {
    set("tahun", "Required");
  } else if (!/^\d{4}$/.test(tahun) || Number(tahun) < 1900 || Number(tahun) > year) {
    set("tahun", `Enter a 4-digit year from 1900 to ${year}`);
  }
 
  const tinggi = values.tinggi.trim();
  if (!tinggi) {
    set("tinggi", "Required");
  } else if (!/^\d{1,3}$/.test(tinggi) || Number(tinggi) < 1) {
    set("tinggi", "Enter a whole number from 1 to 999 (meters)");
  }
 
  const tenantErrors: Record<number, string> = {};
  const seen = new Set<string>();
  tenants.forEach((t) => {
    const e = textError(t.name);
    if (e) {
      tenantErrors[t.id] = e;
      return;
    }
    const key = t.name.trim().toLowerCase();
    if (seen.has(key)) tenantErrors[t.id] = "Duplicate tenant";
    else seen.add(key);
  });
 
  return { fields, tenants: tenantErrors };
}
 
function hasErrors(e: Errors) {
  return Object.keys(e.fields).length > 0 || Object.keys(e.tenants).length > 0;
}
 
function YearField({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  error?: string;
}) {
  return (
    <div className="flex w-full flex-col gap-1">
    <label htmlFor="tahun-pembangunan" className="text-field-label">
      Tahun Pembangunan
      <span className="ml-0.5 text-danger">*</span>
    </label>
    <div className="relative">
      <select
        id="tahun-pembangunan"
        value={value}
        onChange={onChange}
        aria-invalid={error ? "true" : "false"}
        aria-describedby="tahun-pembangunan-note"
        className={cn(
          "h-9 w-full rounded-input border border-border bg-surface pl-2.5 pr-9 text-sm text-text transition-colors duration-150 focus:border-primary focus:outline-none appearance-none cursor-pointer",
          error && "border-danger"
        )}
      >
        <option value="" disabled>Pilih tahun pembangunan</option>
        {Array.from({ length: 2026 - 1900 + 1 }, (_, index) => 1900 + index)
          .reverse()
          .map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
      </select>
      
      <svg
        className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
    {error ? (
      <p id="tahun-pembangunan-note" className="text-helper text-danger" role="alert">
        {error}
      </p>
    ) : (
      <p id="tahun-pembangunan-note" className="text-helper">
        Tahun 1900 hingga tahun ini
      </p>
    )}
  </div>
  );
}
 
export default function ApplicationFormPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const nextId = useRef(2);
  const [values, setValues] = useState<Values>(EMPTY);
  const [tenants, setTenants] = useState<Tenant[]>([{ id: 1, name: "" }]);
  const [errors, setErrors] = useState<Errors>({ fields: {}, tenants: {} });
  const [attempted, setAttempted] = useState(false);
  const [notice, setNotice] = useState("");

  const [mapInput, setMapInput] = useState("-6.174531, 106.826902");
  const [isSet, setIsSet] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Pastikan peta hanya dirender di sisi client setelah komponen terpasang
  useEffect(() => {
    setMounted(true);
    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    });
  }, []);

  function revalidate(nextValues: Values, nextTenants: Tenant[]) {
    if (attempted) setErrors(validate(nextValues, nextTenants));
  }
 
  function change(key: keyof Values) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const next = { ...values, [key]: e.target.value };
      setValues(next);
      setNotice("");
      revalidate(next, tenants);
    };
  }

  function handleCoordChange(key: "longitude" | "latitude") {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      const next = { ...values, [key]: val };
      setValues(next);
      setNotice("");
      revalidate(next, tenants);

      if (key === "longitude") {
        setMapInput(`${values.latitude || "-6.174531"}, ${val}`);
      } else {
        setMapInput(`${val}, ${values.longitude || "106.826902"}`);
      }
    };
  }

  const handleApplyCoordinates = () => {
    if (!mapInput.trim()) return;
    const match = mapInput.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
    if (match) {
      const next = { ...values, latitude: match[1], longitude: match[2] };
      setValues(next);
      setIsSet(true);
      revalidate(next, tenants);
    } else {
      alert("Format koordinat tidak valid. Contoh: -6.174531, 106.826902");
    }
  };

  const handleMapClick = (clickedLat: number, clickedLng: number) => {
    const formattedLat = clickedLat.toFixed(6);
    const formattedLng = clickedLng.toFixed(6);
    const next = { ...values, latitude: formattedLat, longitude: formattedLng };
    setValues(next);
    setMapInput(`${formattedLat}, ${formattedLng}`);
    setIsSet(true);
    revalidate(next, tenants);
  };

  const mapPosition: [number, number] = [
    parseFloat(values.latitude) || -6.174531,
    parseFloat(values.longitude) || 106.826902,
  ];
 
  function field(key: keyof Values) {
    return {
      value: values[key],
      onChange: change(key),
      error: errors.fields[key],
    };
  }
 
  function setTenantName(id: number, name: string) {
    const next = tenants.map((t) => (t.id === id ? { ...t, name } : t));
    setTenants(next);
    setNotice("");
    revalidate(values, next);
  }
 
  function addTenant() {
    setTenants([...tenants, { id: nextId.current++, name: "" }]);
  }
 
  function removeTenant(id: number) {
    const next = tenants.filter((t) => t.id !== id);
    setTenants(next);
    revalidate(values, next);
  }
 
  function focusFirstInvalid() {
    requestAnimationFrame(() => {
      formRef.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus();
    });
  }
 
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAttempted(true);
    const result = validate(values, tenants);
    setErrors(result);
    if (hasErrors(result)) {
      setNotice("");
      focusFirstInvalid();
      return;
    }
    router.push("/submission/result/registered");
  }
 
  function handleDraft() {
    setNotice("Drafts will be stored once the database is connected.");
  }
 
  const invalid = attempted && hasErrors(errors);
 
  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      className="mx-auto flex max-w-[960px] flex-col gap-6"
    >
      <h1 className="text-page-title">Application Form</h1>
 
      <Card title="Tower identity">
        <CardBody className="grid gap-4 pt-4 md:grid-cols-2">
          <Input 
            id="kode-menara" 
            label="Kode/ID Menara" 
            placeholder="e.g. TOW-JKT-001" 
            requiredMark 
            {...field("kode")} 
          />
          <Input 
            id="nama-pemilik" 
            label="Nama Pemilik Menara" 
            placeholder="Owner name" 
            requiredMark 
            {...field("pemilik")} 
          />
          <YearField
            value={values.tahun}
            onChange={change("tahun")}
            error={errors.fields.tahun}
          />
          <Select id="jenis-menara" label="Jenis Menara" requiredMark {...field("jenis")}>
            <option value="">Select type</option>
            {JENIS_MENARA.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </Select>
        </CardBody>
      </Card>
 
      <Card title="Penyelenggara">
        <CardBody className="flex flex-col gap-4 pt-4">
          <p className="text-helper">
            Setiap baris mewakili satu data penyewa
          </p>
          {tenants.map((t, i) => (
            <div key={t.id} className="flex items-start gap-3">
              <Input
                id={`tenant-${t.id}`}
                label={`Penyelenggara Jaringan ${i + 1}`}
                requiredMark
                value={t.name}
                onChange={(e) => setTenantName(t.id, e.target.value)}
                error={errors.tenants[t.id]}
              />
              <Button
                type="button"
                variant="danger-outline"
                className="mt-[22px]"
                disabled={tenants.length === 1}
                onClick={() => removeTenant(t.id)}
              >
                Remove
              </Button>
            </div>
          ))}
          <div>
            <Button type="button" variant="outline" onClick={addTenant}>
              <Plus className="h-4 w-4" strokeWidth={2} />
              Add Penyelenggara
            </Button>
          </div>
        </CardBody>
      </Card>
 
      <Card title="Location">
        <CardBody className="flex flex-col gap-5 pt-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">
              Tempel link / koordinat Google Maps
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={mapInput}
                onChange={(e) => setMapInput(e.target.value)}
                placeholder="-6.174531, 106.826902"
                className="flex-1 px-3.5 py-2 border border-border bg-surface rounded-input text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <Button
                type="button"
                onClick={handleApplyCoordinates}
                className="whitespace-nowrap"
              >
                {isSet ? "Titik terpasang ✓" : "Pasang titik"}
              </Button>
            </div>
            <p className="text-xs text-muted">
              Tombol Pasang titik hanya memproses nilai dari kolom ini.
            </p>
          </div>

          <div className="w-full h-64 sm:h-80 rounded-lg overflow-hidden border border-border z-0">
            {mounted && (
              <MapContainer
                key={`${mapPosition[0]}-${mapPosition[1]}`}
                center={mapPosition}
                zoom={13}
                scrollWheelZoom={false}
                className="w-full h-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={mapPosition} />
                <MapClickHandler onMapClick={handleMapClick} />
              </MapContainer>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              id="longitude"
              label="Longitude"
              requiredMark
              inputMode="decimal"
              hint="Antara 95 sampai 141, maks. 6 angka di belakang koma"
              value={values.longitude}
              onChange={handleCoordChange("longitude")}
              error={errors.fields.longitude}
            />
            <Input
              id="latitude"
              label="Latitude"
              requiredMark
              inputMode="decimal"
              hint="Antara -11 sampai 6, maks. 6 angka di belakang koma"
              value={values.latitude}
              onChange={handleCoordChange("latitude")}
              error={errors.fields.latitude}
            />
            <div className="md:col-span-2">
              <Input id="alamat" label="Alamat" requiredMark {...field("alamat")} />
            </div>
          </div>
        </CardBody>
      </Card>
 
      <Card title="Specification">
        <CardBody className="grid gap-4 pt-4 md:grid-cols-2">
          <Input
            id="tinggi-menara"
            label="Tinggi Menara (AGL)"
            requiredMark
            inputMode="numeric"
            hint="Meters, up to 3 digits"
            {...field("tinggi")}
          />
          <Input id="kapasitas-maksimal" label="Kapasitas Maksimal" requiredMark {...field("kapMaks")} />
          <Input id="kapasitas-disewakan" label="Kapasitas Disewakan" requiredMark {...field("kapSewa")} />
          <Input id="kapasitas-sendiri" label="Kapasitas Digunakan Sendiri" requiredMark {...field("kapSendiri")} />
        </CardBody>
      </Card>
 
      {invalid && (
        <div
          role="alert"
          className="rounded-card border border-danger bg-danger-bg px-3 py-2 text-sm text-danger"
        >
          Please fix the highlighted fields before submitting.
        </div>
      )}
      {notice && (
        <div
          role="status"
          className="rounded-card border border-primary bg-nav-active-bg px-3 py-2 text-sm text-primary"
        >
          {notice}
        </div>
      )}
 
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          className="text-primary"
          onClick={() => router.push("/submission")}
        >
          Cancel
        </Button>
        <Button type="button" variant="amber" onClick={handleDraft}>
          Save as draft
        </Button>
        <Button type="submit">
          <Send className="h-4 w-4" strokeWidth={2} />
          Submit
        </Button>
      </div>
    </form>
  );
}