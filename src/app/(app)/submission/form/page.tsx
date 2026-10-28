"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ChevronDown, Plus, Search, Send } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// Dynamic import dengan destructuring komponen react-leaflet secara langsung
const MapWithLeaflet = dynamic(
  async () => {
    const L = await import("leaflet");

    function LeafletMapComponent({
      position,
      isLocked,
      onMapClick,
    }: {
      position: [number, number];
      isLocked: boolean;
      onMapClick: (lat: number, lng: number) => void;
    }) {
      const containerRef = useRef<HTMLDivElement>(null);
      const mapRef = useRef<ReturnType<typeof L.map> | null>(null);
      const markerRef = useRef<ReturnType<typeof L.marker> | null>(null);
      const initialPosition = useRef(position);
      const onMapClickRef = useRef(onMapClick);
      const isLockedRef = useRef(isLocked);
      const [latitude, longitude] = position;

      useEffect(() => {
        onMapClickRef.current = onMapClick;
        isLockedRef.current = isLocked;
      }, [onMapClick, isLocked]);

      useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const map = L.map(container, {
          center: initialPosition.current,
          zoom: 13,
          dragging: !isLockedRef.current,
          scrollWheelZoom: !isLockedRef.current,
          touchZoom: !isLockedRef.current,
          doubleClickZoom: true,
        });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        const marker = L.marker(initialPosition.current, {
          icon: L.icon({
            iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
            iconRetinaUrl:
              "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
            shadowUrl:
              "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          }),
        }).addTo(map);
        const handleClick = (event: L.LeafletMouseEvent) => {
          if (!isLockedRef.current) {
            onMapClickRef.current(event.latlng.lat, event.latlng.lng);
          }
        };
        map.on("click", handleClick);
        mapRef.current = map;
        markerRef.current = marker;

        const resizeFrame = requestAnimationFrame(() => map.invalidateSize());
        return () => {
          cancelAnimationFrame(resizeFrame);
          map.off("click", handleClick);
          map.remove();
          mapRef.current = null;
          markerRef.current = null;
        };
      }, []);

      useEffect(() => {
        const map = mapRef.current;
        const marker = markerRef.current;
        if (!map || !marker) return;

        const nextPosition: [number, number] = [latitude, longitude];
        marker.setLatLng(nextPosition);
        map.panTo(nextPosition);
      }, [latitude, longitude]);

      useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const setInteraction = isLocked ? "disable" : "enable";
        map.dragging[setInteraction]();
        map.scrollWheelZoom[setInteraction]();
        map.touchZoom[setInteraction]();
      }, [isLocked]);

      return <div ref={containerRef} className="w-full h-full" />;
    }

    return LeafletMapComponent;
  },
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-slate-100 text-sm text-slate-500">
        Memuat peta...
      </div>
    ),
  }
);

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
  if (!v) return "Wajib diisi";
  if (v.length > 50) return "Maksimal 50 karakter";
  return undefined;
}

function coordError(value: string, min: number, max: number) {
  const v = value.trim();
  if (!v) return "Wajib diisi";
  if (!/^-?\d+(\.\d{1,6})?$/.test(v)) return "Masukkan angka hingga 6 desimal";
  const n = Number(v);
  if (n < min || n > max) return `Harus antara ${min} dan ${max}`;
  return undefined;
}

function validate(values: Values, tenants: Tenant[]): Errors {
  const fields: Errors["fields"] = {};
  const set = (key: keyof Values, message: string | undefined) => {
    if (message) fields[key] = message;
  };

  set("kode", textError(values.kode));
  set("pemilik", textError(values.pemilik));
  set("jenis", values.jenis ? undefined : "Wajib diisi");
  set("longitude", coordError(values.longitude, 95, 141));
  set("latitude", coordError(values.latitude, -11, 6));
  set("alamat", textError(values.alamat));
  set("kapMaks", textError(values.kapMaks));
  set("kapSewa", textError(values.kapSewa));
  set("kapSendiri", textError(values.kapSendiri));

  const year = new Date().getFullYear();
  const tahun = values.tahun.trim();
  if (!tahun) {
    set("tahun", "Wajib diisi");
  } else if (!/^\d{4}$/.test(tahun) || Number(tahun) < 1900 || Number(tahun) > year) {
    set("tahun", `Masukkan 4 digit tahun dari 1900 hingga ${year}`);
  }

  const tinggi = values.tinggi.trim();
  if (!tinggi) {
    set("tinggi", "Wajib diisi");
  } else if (!/^\d{1,3}$/.test(tinggi) || Number(tinggi) < 1) {
    set("tinggi", "Masukkan bilangan bulat dari 1 sampai 999 (meter)");
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
    if (seen.has(key)) tenantErrors[t.id] = "Penyelenggara duplikat";
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
  onChange: (value: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 1900 + 1 },
    (_, index) => currentYear - index,
  ).filter((year) => year.toString().includes(search.trim()));
  const selectedLabel = value || "Pilih tahun pembangunan";

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function closeOnOutsideClick(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !dropdownRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function selectYear(year: number) {
    onChange(String(year));
    setOpen(false);
    setSearch("");
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, years.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && open && years[activeIndex] !== undefined) {
      event.preventDefault();
      selectYear(years[activeIndex]);
    }
  }

  return (
    <div className="flex w-full flex-col gap-1">
      <label htmlFor="tahun-pembangunan" className="text-field-label">
        Tahun Pembangunan
        <span className="ml-0.5 text-danger">*</span>
      </label>
      <div ref={dropdownRef} className="relative">
        <button
          id="tahun-pembangunan"
          type="button"
          role="combobox"
          aria-label="Tahun Pembangunan"
          aria-expanded={open}
          aria-controls="tahun-pembangunan-options"
          aria-haspopup="listbox"
          aria-invalid={error ? "true" : "false"}
          aria-describedby="tahun-pembangunan-note"
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" && !open) {
              event.preventDefault();
              setOpen(true);
            }
          }}
          onClick={() => setOpen((isOpen) => !isOpen)}
          className={cn(
            "flex h-9 w-full cursor-pointer items-center justify-between rounded-input border border-border bg-surface px-2.5 text-left text-sm text-text transition-colors duration-150 focus:border-primary focus:outline-none",
            error && "border-danger",
          )}
        >
          <span className={cn(!value && "text-muted")}>{selectedLabel}</span>
          <ChevronDown
            aria-hidden
            className={cn("h-4 w-4 text-muted transition-transform", open && "rotate-180")}
          />
        </button>
        {open && (
          <div
            className="absolute z-30 mt-1 w-full overflow-hidden rounded-input border border-border bg-surface shadow-lg"
          >
            <div className="border-b border-border-soft p-2">
              <div className="relative">
                <Search
                  aria-hidden
                  className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                />
                <input
                  ref={searchRef}
                  type="search"
                  aria-label="Cari tahun pembangunan"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setActiveIndex(0);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Cari"
                  className="h-9 w-full rounded-input border border-border bg-surface pl-9 pr-3 text-sm text-text focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <div id="tahun-pembangunan-options" role="listbox" aria-label="Tahun pembangunan" className="max-h-60 overflow-y-auto p-1">
              {years.length > 0 ? (
                years.map((year, index) => (
                  <button
                    key={year}
                    type="button"
                    role="option"
                    aria-selected={value === String(year)}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectYear(year)}
                    className={cn(
                      "flex min-h-8 w-full items-center rounded-input px-2.5 text-left text-sm text-text hover:bg-nav-active-bg",
                      activeIndex === index && "bg-nav-active-bg",
                      value === String(year) && "font-semibold text-primary",
                    )}
                  >
                    {year}
                  </button>
                ))
              ) : (
                <p className="px-2.5 py-3 text-sm text-muted">
                  Tahun tidak ditemukan.
                </p>
              )}
            </div>
          </div>
        )}
        <input type="hidden" name="tahun_pembangunan" value={value} />
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

function ApplicationFormContent({
  requestedDraftId,
}: {
  requestedDraftId: string | null;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);
  const nextId = useRef(2);
  const [values, setValues] = useState<Values>(EMPTY);
  const [tenants, setTenants] = useState<Tenant[]>([{ id: 1, name: "" }]);
  const [errors, setErrors] = useState<Errors>({ fields: {}, tenants: {} });
  const [attempted, setAttempted] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeIsError, setNoticeIsError] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<{
    title: string;
    messages: string[];
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(Boolean(requestedDraftId));
  const [draftId, setDraftId] = useState<string | null>(null);

  const [mapInput, setMapInput] = useState("");
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (!requestedDraftId) return;

    let active = true;
    fetch(`/api/towers/drafts?id=${encodeURIComponent(requestedDraftId)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as
          | {
              data?: {
                id: string;
                submission_data?: Record<string, unknown>;
              } | null;
              error?: string;
            }
          | null;
        if (!response.ok || !payload?.data) {
          throw new Error(payload?.error || "Draf tidak ditemukan atau sudah dikirim.");
        }
        if (!active) return;

        const data = payload.data.submission_data ?? {};
        const text = (value: unknown) =>
          typeof value === "string" || typeof value === "number" ? String(value) : "";
        const nextValues: Values = {
          kode: text(data.id_menara),
          pemilik: text(data.nama_pemilik),
          tahun: text(data.tahun_pembangunan),
          jenis: text(data.jenis_menara),
          longitude: text(data.longitude),
          latitude: text(data.latitude),
          alamat: text(data.alamat),
          tinggi: text(data.tinggi_menara),
          kapMaks: text(data.kapasitas_maksimal),
          kapSewa: text(data.kapasitas_disewakan),
          kapSendiri: text(data.kapasitas_digunakan_sendiri),
        };
        const restoredTenants = Array.isArray(data.tenants)
          ? data.tenants.map((tenant, index) => {
              const entry =
                tenant && typeof tenant === "object"
                  ? (tenant as Record<string, unknown>)
                  : {};
              return { id: index + 1, name: text(entry.penyelenggara) };
            })
          : [];
        setValues(nextValues);
        setMapInput(
          nextValues.latitude && nextValues.longitude
            ? `${nextValues.latitude}, ${nextValues.longitude}`
            : "",
        );
        setTenants(
          restoredTenants.length > 0 ? restoredTenants : [{ id: 1, name: "" }],
        );
        nextId.current = Math.max(restoredTenants.length, 1) + 1;
        setDraftId(payload.data.id);
        setNotice("Draf berhasil dimuat. Anda dapat melanjutkan pengisian.");
      })
      .catch((loadError) => {
        if (!active) return;
        setDraftId(null);
        setNotice(
          loadError instanceof Error
            ? loadError.message
            : "Draf tidak dapat dimuat.",
        );
        setNoticeIsError(true);
      })
      .finally(() => {
        if (active) setIsLoadingDraft(false);
      });

    return () => {
      active = false;
    };
  }, [requestedDraftId]);

  function revalidate(nextValues: Values, nextTenants: Tenant[]) {
    if (attempted) setErrors(validate(nextValues, nextTenants));
  }

  function change(key: keyof Values) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      if (isLocked && (key === "longitude" || key === "latitude")) return;
      const value =
        key === "tinggi"
          ? e.target.value.replace(/[^0-9]/g, "").slice(0, 3)
          : e.target.value;
      const next = {
        ...values,
        [key]: value,
      };
      setValues(next);
      setNotice("");
      revalidate(next, tenants);
    };
  }

  // Pengetikan manual di input Latitude / Longitude
  function handleCoordChange(key: "longitude" | "latitude") {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isLocked) return;
      const val = e.target.value;
      const next = { ...values, [key]: val };
      setValues(next);
      setNotice("");
      revalidate(next, tenants);

      if (key === "longitude") {
        const lat = next.latitude || "";
        setMapInput(lat ? `${lat}, ${val}` : val);
      } else {
        const lng = next.longitude || "";
        setMapInput(lng ? `${val}, ${lng}` : val);
      }
    };
  }

  // Pengetikan di kotak atas (Tempel link/koordinat) dengan pemisahan koma yang akurat saat dihapus
  const handleMapInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLocked) return;
    const val = e.target.value;
    setMapInput(val);

    const parts = val.split(",");
    const latVal = parts[0] !== undefined ? parts[0].trim() : "";
    const lngVal = parts[1] !== undefined ? parts[1].trim() : "";

    const next = {
      ...values,
      latitude: latVal,
      longitude: lngVal,
    };
    setValues(next);
    revalidate(next, tenants);
  };

  const handleApplyCoordinates = () => {
    if (isLocked) {
      setIsLocked(false);
      return;
    }

    if (!mapInput.trim()) return;
    const match = mapInput.match(/(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
    if (match) {
      const latitude = Number(match[1]).toFixed(6);
      const longitude = Number(match[2]).toFixed(6);
      const next = { ...values, latitude, longitude };
      setValues(next);
      setMapInput(`${latitude}, ${longitude}`);
      setIsLocked(true);
      revalidate(next, tenants);
    } else {
      alert("Format koordinat tidak valid. Contoh: -6.174531, 106.826902");
    }
  };

  const handleMapClick = (clickedLat: number, clickedLng: number) => {
    if (isLocked) return;
    const formattedLat = clickedLat.toFixed(6);
    const formattedLng = clickedLng.toFixed(6);
    const next = { ...values, latitude: formattedLat, longitude: formattedLng };
    setValues(next);
    setMapInput(`${formattedLat}, ${formattedLng}`);
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
      disabled: isLocked && (key === "longitude" || key === "latitude"),
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAttempted(true);
    const result = validate(values, tenants);
    setErrors(result);
    if (hasErrors(result)) {
      setNotice("");
      focusFirstInvalid();
      return;
    }

    setIsSubmitting(true);
    setNotice("");
    setNoticeIsError(false);
    setDraftSaved(false);
    setSubmissionFeedback(null);
    try {
      const response = await fetch("/api/towers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(draftId ? { draft_id: draftId } : {}),
          id_menara: values.kode,
          nama_pemilik: values.pemilik,
          tahun_pembangunan: Number(values.tahun),
          penyelenggara: tenants[0].name,
          longitude: Number(values.longitude),
          latitude: Number(values.latitude),
          alamat: values.alamat,
          jenis_menara: values.jenis,
          tinggi_menara: Number(values.tinggi),
          kapasitas_maksimal: values.kapMaks,
          kapasitas_disewakan: values.kapSewa,
          kapasitas_digunakan_sendiri: values.kapSendiri,
          tenants: tenants.map(({ name }) => ({
            penyelenggara: name,
            kapasitas_disewakan: values.kapSewa,
          })),
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; errors?: Array<{ message?: string }> }
        | null;
      if (!response.ok) {
        const messages = payload?.errors
          ?.map(({ message }) => message)
          .filter((message): message is string => Boolean(message)) ?? [];
        setSubmissionFeedback({
          title:
            response.status === 409 || response.status === 422
              ? "Pengajuan Ditolak"
              : "Pengajuan Belum Berhasil",
          messages:
            messages.length > 0
              ? messages
              : [payload?.error || "Pengajuan tidak dapat disimpan."],
        });
        return;
      }

      router.push("/submission/history");
    } catch (error) {
      setSubmissionFeedback({
        title: "Pengajuan Belum Berhasil",
        messages: [
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat menyimpan pengajuan.",
        ],
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDraft() {
    setNotice("");
    setNoticeIsError(false);
    setDraftSaved(false);
    try {
      const response = await fetch("/api/towers/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(draftId ? { draft_id: draftId } : {}),
          submission_data: {
            id_menara: values.kode,
            nama_pemilik: values.pemilik,
            tahun_pembangunan: values.tahun,
            penyelenggara: tenants[0].name,
            longitude: values.longitude,
            latitude: values.latitude,
            alamat: values.alamat,
            jenis_menara: values.jenis,
            tinggi_menara: values.tinggi,
            kapasitas_maksimal: values.kapMaks,
            kapasitas_disewakan: values.kapSewa,
            kapasitas_digunakan_sendiri: values.kapSendiri,
            tenants: tenants.map(({ name }) => ({
              penyelenggara: name,
              kapasitas_disewakan: values.kapSewa,
            })),
          },
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { data?: { id?: string }; error?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Draf tidak dapat disimpan.");
      }
      if (payload?.data?.id) setDraftId(payload.data.id);
      setNotice("Draf berhasil disimpan.");
      setDraftSaved(true);
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Draf tidak dapat disimpan.",
      );
      setNoticeIsError(true);
    }
  }

  const invalid = attempted && hasErrors(errors);

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      className="mx-auto flex max-w-[960px] flex-col gap-6"
    >
      <h1 className="text-page-title">Formulir Pendaftaran</h1>

      <Card title="Identitas Menara">
        <CardBody className="grid gap-4 pt-4 md:grid-cols-2">
          <Input 
            id="kode-menara" 
            label="Kode/ID Menara" 
            placeholder="Contoh: TWR-TAHUN-XXXX" 
            requiredMark 
            {...field("kode")} 
          />
          <Input 
            id="nama-pemilik" 
            label="Nama Pemilik Menara" 
            placeholder="Nama pemilik menara" 
            requiredMark 
            {...field("pemilik")} 
          />
          <YearField
            value={values.tahun}
            onChange={(year) => {
              const next = { ...values, tahun: year };
              setValues(next);
              setNotice("");
              revalidate(next, tenants);
            }}
            error={errors.fields.tahun}
          />
          <Select id="jenis-menara" label="Jenis Menara" requiredMark {...field("jenis")}>
            <option value="">Pilih jenis menara</option>
            {JENIS_MENARA.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </Select>
        </CardBody>
      </Card>

      <Card title="Penyelenggara Jaringan (Tenant)">
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
                Hapus
              </Button>
            </div>
          ))}
          <div>
            <Button type="button" variant="outline" onClick={addTenant}>
              <Plus className="h-4 w-4" strokeWidth={2} />
              Tambah Penyelenggara
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card title="Lokasi Menara">
        <CardBody className="flex flex-col gap-5 pt-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">
              Tempel link / koordinat Google Maps
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={mapInput}
                disabled={isLocked}
                onChange={handleMapInputChange}
                placeholder="Contoh: -6.174531, 106.826902"
                className="flex-1 px-3.5 py-2 border border-border bg-surface rounded-input text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={handleApplyCoordinates}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shadow-sm ${
                  isLocked
                    ? "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
                    : "bg-primary text-white hover:bg-primary/90"
                }`}
              >
                {isLocked ? "Ubah Titik ✎" : "Pasang Titik"}
              </button>
            </div>
            <p className="text-xs text-muted">
              {isLocked 
                ? "Titik sudah terkunci. Klik 'Ubah Titik' jika ingin mengubah koordinat." 
                : "Geser/zoom peta atau klik lokasi untuk menyesuaikan, lalu klik 'Pasang Titik' untuk mengunci."}
            </p>
          </div>

          <div className="relative w-full h-64 sm:h-80 rounded-lg overflow-hidden border border-border z-0">
            {isLocked && (
              <div className="absolute inset-0 bg-slate-900/10 z-20 flex items-center justify-center pointer-events-none">
                <span className="bg-white/95 text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-full shadow border border-slate-200">
                  🔒 Peta Terkunci
                </span>
              </div>
            )}
            
            <MapWithLeaflet
              position={mapPosition}
              isLocked={isLocked}
              onMapClick={handleMapClick}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              id="longitude"
              label="Longitude"
              requiredMark
              inputMode="decimal"
              placeholder="Contoh: 106.826902"
              hint="Antara 95 sampai 141, maks. 6 angka di belakang koma"
              value={values.longitude}
              onChange={handleCoordChange("longitude")}
              error={errors.fields.longitude}
              disabled={isLocked}
            />
            <Input
              id="latitude"
              label="Latitude"
              requiredMark
              inputMode="decimal"
              placeholder="Contoh: -6.174531"
              hint="Antara -11 sampai 6, maks. 6 angka di belakang koma"
              value={values.latitude}
              onChange={handleCoordChange("latitude")}
              error={errors.fields.latitude}
              disabled={isLocked}
            />
            <div className="md:col-span-2 flex flex-col gap-4">
              <Input
                id="alamat"
                label="Alamat"
                requiredMark
                {...field("alamat")}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card title="Spesifikasi Menara">
        <CardBody className="grid gap-4 pt-4 md:grid-cols-2">
          <Input
            id="tinggi-menara"
            label="Tinggi Menara (AGL)"
            requiredMark
            type="text"
            inputMode="numeric"
            pattern="[0-9]{1,3}"
            maxLength={3}
            hint="Meter, hingga 3 digit"
            {...field("tinggi")}
          />
          <Input id="kapasitas-maksimal" label="Kapasitas Maksimal" requiredMark {...field("kapMaks")} />
          <Input id="kapasitas-disewakan" label="Kapasitas Disewakan (Total Menara)" requiredMark {...field("kapSewa")} />
          <Input id="kapasitas-sendiri" label="Kapasitas Digunakan Sendiri" requiredMark {...field("kapSendiri")} />
        </CardBody>
      </Card>

      {invalid && (
        <div
          role="alert"
          className="rounded-card border border-danger bg-danger-bg px-3 py-2 text-sm text-danger"
        >
          Mohon perbaiki kolom yang ditandai sebelum mengirimkan formulir.
        </div>
      )}
      {notice && (
        <div
          role={noticeIsError ? "alert" : "status"}
          className={`rounded-card border px-3 py-2 text-sm ${
            noticeIsError
              ? "border-danger bg-danger-bg text-danger"
              : "border-primary bg-nav-active-bg text-primary"
          }`}
        >
          {notice}
          {draftSaved && !noticeIsError && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="submit"
                variant="outline"
                disabled={isSubmitting || isLoadingDraft}
              >
                Lanjutkan pengiriman
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/submission/history")}
              >
                Kembali ke riwayat
              </Button>
            </div>
          )}
        </div>
      )}
      <Dialog
        open={submissionFeedback !== null}
        onClose={() => setSubmissionFeedback(null)}
        title={submissionFeedback?.title ?? "Pengajuan Belum Berhasil"}
        description={
          submissionFeedback?.title === "Pengajuan Ditolak"
            ? "Pengajuan belum dapat diproses karena alasan berikut:"
            : "Periksa informasi berikut, lalu coba lagi jika diperlukan."
        }
        footer={
          <Button
            type="button"
            variant="outline"
            onClick={() => setSubmissionFeedback(null)}
          >
            Tutup
          </Button>
        }
      >
        <ul
          role="alert"
          className="list-inside list-disc space-y-1 text-sm text-danger"
        >
          {(submissionFeedback?.messages ?? []).map((reason, index) => (
            <li key={`${index}-${reason}`}>{reason}</li>
          ))}
        </ul>
      </Dialog>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          className="text-primary"
          onClick={() => router.push("/submission")}
        >
          Batal
        </Button>
        {user.role === "USER" && (
          <Button
            type="button"
            variant="amber"
            onClick={handleDraft}
            disabled={isLoadingDraft || isSubmitting}
          >
            Simpan sebagai Draf
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || isLoadingDraft}>
          <Send className="h-4 w-4" strokeWidth={2} />
          {isLoadingDraft ? "Memuat draf..." : isSubmitting ? "Mengirim..." : "Kirim Pengajuan"}
        </Button>
      </div>
    </form>
  );
}

function ApplicationFormWithSearchParams() {
  const searchParams = useSearchParams();
  const requestedDraftId = searchParams.get("draft_id");
  return (
    <ApplicationFormContent
      key={requestedDraftId ?? "new"}
      requestedDraftId={requestedDraftId}
    />
  );
}

export default function ApplicationFormPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-helper">Memuat formulir...</p>}>
      <ApplicationFormWithSearchParams />
    </Suspense>
  );
}
