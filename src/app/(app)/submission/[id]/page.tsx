"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { INDONESIAN_REGIONS } from "@/lib/indonesian-administrative-regions";

function YearField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
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

  return (
    <div className="flex flex-col gap-1">
      <span className="text-field-label">Tahun Pembangunan</span>
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          role="combobox"
          aria-label="Tahun Pembangunan"
          aria-expanded={open}
          aria-controls="edit-tahun-pembangunan-options"
          aria-haspopup="listbox"
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" && !open) {
              event.preventDefault();
              setOpen(true);
            }
          }}
          onClick={() => setOpen((isOpen) => !isOpen)}
          className="flex h-10 w-full cursor-pointer items-center justify-between rounded-input border border-border bg-surface px-3 text-left text-sm text-text focus:border-primary focus:outline-none"
        >
          <span className={cn(!value && "text-muted")}>
            {value || "Pilih tahun pembangunan"}
          </span>
          <ChevronDown
            aria-hidden
            className={cn(
              "h-4 w-4 text-muted transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
        {open && (
          <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-input border border-border bg-surface shadow-lg">
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
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      setActiveIndex((index) =>
                        Math.min(index + 1, years.length - 1),
                      );
                    } else if (event.key === "ArrowUp") {
                      event.preventDefault();
                      setActiveIndex((index) => Math.max(index - 1, 0));
                    } else if (
                      event.key === "Enter" &&
                      years[activeIndex] !== undefined
                    ) {
                      event.preventDefault();
                      selectYear(years[activeIndex]);
                    }
                  }}
                  placeholder="Cari"
                  className="h-9 w-full rounded-input border border-border bg-surface pl-9 pr-3 text-sm text-text focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <div
              id="edit-tahun-pembangunan-options"
              role="listbox"
              aria-label="Tahun pembangunan"
              className="max-h-60 overflow-y-auto p-1"
            >
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
      </div>
    </div>
  );
}

type Tower = {
  id: string;
  id_menara: string;
  nama_pemilik?: string;
  tahun_pembangunan?: string | number;
  longitude?: string | number;
  latitude?: string | number;
  alamat?: string;
  provinsi?: string;
  kab_kota?: string;
  kecamatan?: string;
  kelurahan?: string;
  jenis_menara?: string;
  tinggi_menara?: string | number;
  kapasitas_maksimal?: string;
  kapasitas_disewakan?: string;
  kapasitas_digunakan_sendiri?: string;
  metode_pendaftaran?: string;
  verification_status?: string;
  date_created?: string;
  tenants?: Array<{ penyelenggara?: string; kapasitas_disewakan?: string }>;
};
type TowerResponse = { data?: Tower; error?: string };
type EditableValues = {
  nama_pemilik: string;
  tahun_pembangunan: string;
  longitude: string;
  latitude: string;
  alamat: string;
  provinsi: string;
  kab_kota: string;
  kecamatan: string;
  kelurahan: string;
  jenis_menara: string;
  tinggi_menara: string;
  kapasitas_maksimal: string;
  kapasitas_disewakan: string;
  kapasitas_digunakan_sendiri: string;
  tenants: string;
};

function editValues(tower: Tower): EditableValues {
  return {
    nama_pemilik: tower.nama_pemilik || "",
    tahun_pembangunan: String(tower.tahun_pembangunan ?? ""),
    longitude: String(tower.longitude ?? ""),
    latitude: String(tower.latitude ?? ""),
    alamat: tower.alamat || "",
    provinsi: tower.provinsi || "",
    kab_kota: tower.kab_kota || "",
    kecamatan: tower.kecamatan || "",
    kelurahan: tower.kelurahan || "",
    jenis_menara: tower.jenis_menara || "",
    tinggi_menara: String(tower.tinggi_menara ?? ""),
    kapasitas_maksimal: tower.kapasitas_maksimal || "",
    kapasitas_disewakan: tower.kapasitas_disewakan || "",
    kapasitas_digunakan_sendiri: tower.kapasitas_digunakan_sendiri || "",
    tenants: (tower.tenants ?? [])
      .map((tenant) => tenant.penyelenggara)
      .filter(Boolean)
      .join("\n"),
  };
}

export default function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [tower, setTower] = useState<Tower | null>(null);
  const [values, setValues] = useState<EditableValues | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`/api/towers/${encodeURIComponent(id)}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as TowerResponse | null;
        if (!response.ok || !payload?.data) {
          throw new Error(payload?.error || "Detail menara tidak ditemukan.");
        }
        if (active) {
          setTower(payload.data);
          setValues(editValues(payload.data));
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Detail menara tidak dapat dimuat.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  async function saveChanges(event: React.FormEvent) {
    event.preventDefault();
    if (!tower || !values) return;
    const tenantNames = values.tenants
      .split(/\r?\n/)
      .map((name) => name.trim())
      .filter(Boolean);
    if (tenantNames.length === 0) {
      setError("Minimal satu penyelenggara harus diisi.");
      return;
    }

    setWorking(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/towers/${encodeURIComponent(tower.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_menara: tower.id_menara,
          ...values,
          tahun_pembangunan: Number(values.tahun_pembangunan),
          longitude: Number(values.longitude),
          latitude: Number(values.latitude),
          tinggi_menara: Number(values.tinggi_menara),
          penyelenggara: tenantNames[0],
          tenants: tenantNames.map((penyelenggara) => ({
            penyelenggara,
            kapasitas_disewakan: values.kapasitas_disewakan,
          })),
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string; errors?: Array<{ message?: string }> } | null;
      if (!response.ok) {
        throw new Error(payload?.errors?.map((issue) => issue.message).filter(Boolean).join(" ") || payload?.error || "Perubahan data gagal disimpan.");
      }
      setMessage("Perubahan berhasil disimpan.");
      setEditing(false);
      const updatedResponse = await fetch(`/api/towers/${encodeURIComponent(tower.id)}`, { cache: "no-store" });
      const updatedPayload = (await updatedResponse.json()) as TowerResponse;
      if (!updatedResponse.ok || !updatedPayload.data) {
        throw new Error(updatedPayload.error || "Data tersimpan, tetapi detail terbaru tidak dapat dimuat.");
      }
      setTower(updatedPayload.data);
      setValues(editValues(updatedPayload.data));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Perubahan data gagal disimpan.");
    } finally {
      setWorking(false);
    }
  }

  async function archiveTower() {
    if (!tower) return;
    if (!window.confirm(`Arsipkan menara ${tower.id_menara}?`)) return;
    setWorking(true);
    setError("");
    try {
      const response = await fetch(`/api/towers/${encodeURIComponent(tower.id)}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error || "Menara tidak dapat diarsipkan.");
      router.push("/tower-records");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Menara tidak dapat diarsipkan.");
    } finally {
      setWorking(false);
    }
  }

  if (loading) return <p className="text-helper">Memuat detail menara...</p>;
  if (!tower || !values) {
    return <div role="alert" className="text-sm text-danger">{error || "Detail menara tidak ditemukan."}</div>;
  }

  const readOnlyFields = [
    ["ID Menara", tower.id_menara],
    ["Status", tower.verification_status || "Registered"],
    ["Metode pendaftaran", tower.metode_pendaftaran || "—"],
    ["Tanggal", tower.date_created ? new Date(tower.date_created).toLocaleDateString("id-ID") : "—"],
  ];
  const editableFields: Array<[keyof EditableValues, string]> = [
    ["nama_pemilik", "Nama Pemilik"],
    ["tahun_pembangunan", "Tahun Pembangunan"],
    ["longitude", "Longitude"],
    ["latitude", "Latitude"],
    ["provinsi", "Provinsi"],
    ["kab_kota", "Kabupaten/Kota"],
    ["kecamatan", "Kecamatan"],
    ["kelurahan", "Kelurahan/Desa"],
    ["alamat", "Alamat"],
    ["jenis_menara", "Jenis Menara"],
    ["tinggi_menara", "Tinggi Menara (AGL)"],
    ["kapasitas_maksimal", "Kapasitas Maksimal"],
    ["kapasitas_disewakan", "Kapasitas Disewakan (Total Menara)"],
    ["kapasitas_digunakan_sendiri", "Kapasitas Digunakan Sendiri"],
  ];
  const selectedProvince = INDONESIAN_REGIONS.find(
    (region) => region.name.toLocaleUpperCase("id-ID") === values.provinsi,
  );
  const selectedRegency = selectedProvince?.kabKota.find(
    (regency) => regency.name.toLocaleUpperCase("id-ID") === values.kab_kota,
  );
  const selectedDistrict = selectedRegency?.kecamatan.find(
    (district) => district.name.toLocaleUpperCase("id-ID") === values.kecamatan,
  );

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
      <h1 className="text-page-title">Detail Menara</h1>
      {error && <div role="alert" className="rounded-card border border-danger bg-danger-bg px-4 py-3 text-sm text-danger">{error}</div>}
      {message && <div role="status" className="rounded-card border border-primary bg-nav-active-bg px-4 py-3 text-sm text-primary">{message}</div>}
      <Card title="Ringkasan">
        <CardBody className="pt-4">
          <dl className="grid gap-4 sm:grid-cols-3">
            {readOnlyFields.map(([label, value]) => (
              <div key={label} className="flex flex-col gap-1">
                <dt className="text-field-label">{label}</dt>
                <dd className="text-sm text-text">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 flex flex-wrap gap-3">
            {user.role === "USER" && !editing && <Button onClick={() => setEditing(true)}>Ubah Data</Button>}
            {user.role !== "USER" && (
              <Button variant="danger-outline" disabled={working} onClick={archiveTower}>Arsipkan</Button>
            )}
          </div>
        </CardBody>
      </Card>

      <Card title={editing ? "Ubah Data Menara" : "Data Menara"}>
        <CardBody className="pt-4">
          {editing ? (
            <form onSubmit={saveChanges} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {editableFields.map(([key, label]) => key === "provinsi" ? (
                  <Select
                    key={key}
                    id="provinsi"
                    label={label}
                    requiredMark
                    value={values.provinsi}
                    onChange={(event) => setValues({
                      ...values,
                      provinsi: event.target.value,
                      kab_kota: "",
                      kecamatan: "",
                      kelurahan: "",
                    })}
                  >
                    <option value="">Pilih provinsi</option>
                    {INDONESIAN_REGIONS.map((region) => (
                      <option key={region.code} value={region.name.toLocaleUpperCase("id-ID")}>
                        {region.name}
                      </option>
                    ))}
                  </Select>
                ) : key === "kab_kota" ? (
                  <Select
                    key={key}
                    id="kab-kota"
                    label={label}
                    requiredMark
                    value={values.kab_kota}
                    onChange={(event) => setValues({
                      ...values,
                      kab_kota: event.target.value,
                      kecamatan: "",
                      kelurahan: "",
                    })}
                    disabled={!selectedProvince}
                  >
                    <option value="">
                      {selectedProvince
                        ? "Pilih kabupaten/kota"
                        : "Pilih provinsi terlebih dahulu"}
                    </option>
                    {selectedProvince?.kabKota.map((kabKota) => (
                      <option key={kabKota.code} value={kabKota.name.toLocaleUpperCase("id-ID")}>
                        {kabKota.name}
                      </option>
                    ))}
                  </Select>
                ) : key === "kecamatan" ? (
                  <Select
                    key={key}
                    id="kecamatan"
                    label={label}
                    requiredMark
                    value={values.kecamatan}
                    onChange={(event) => setValues({
                      ...values,
                      kecamatan: event.target.value,
                      kelurahan: "",
                    })}
                    disabled={!selectedRegency}
                  >
                    <option value="">
                      {selectedRegency
                        ? "Pilih kecamatan"
                        : "Pilih kabupaten/kota terlebih dahulu"}
                    </option>
                    {selectedRegency?.kecamatan.map((district) => (
                      <option key={district.code} value={district.name.toLocaleUpperCase("id-ID")}>
                        {district.name}
                      </option>
                    ))}
                  </Select>
                ) : key === "kelurahan" ? (
                  <Select
                    key={key}
                    id="kelurahan"
                    label={label}
                    requiredMark
                    value={values.kelurahan}
                    onChange={(event) => setValues({ ...values, kelurahan: event.target.value })}
                    disabled={!selectedDistrict}
                  >
                    <option value="">
                      {selectedDistrict
                        ? "Pilih kelurahan/desa"
                        : "Pilih kecamatan terlebih dahulu"}
                    </option>
                    {selectedDistrict?.kelurahan.map((village) => (
                      <option key={village.code} value={village.name.toLocaleUpperCase("id-ID")}>
                        {village.name}
                      </option>
                    ))}
                  </Select>
                ) : key === "tahun_pembangunan" ? (
                  <YearField
                    key={key}
                    value={values.tahun_pembangunan}
                    onChange={(tahun_pembangunan) =>
                      setValues({ ...values, tahun_pembangunan })
                    }
                  />
                ) : (
                  <label key={key} className="flex flex-col gap-1 text-field-label">
                    <input
                      required
                      value={values[key]}
                      onChange={(event) => setValues({ ...values, [key]: event.target.value })}
                      className="h-10 rounded-input border border-border bg-surface px-3 text-sm text-text"
                    />
                  </label>
                ))}
                <label className="flex flex-col gap-1 text-field-label md:col-span-2">
                  Penyelenggara (satu nama per baris; kapasitas disewakan berlaku untuk total menara)
                  <textarea required rows={4} value={values.tenants} onChange={(event) => setValues({ ...values, tenants: event.target.value })} className="rounded-input border border-border bg-surface px-3 py-2 text-sm text-text" />
                </label>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => { setValues(editValues(tower)); setEditing(false); }}>Batal</Button>
                <Button type="submit" disabled={working}>{working ? "Menyimpan..." : "Simpan Perubahan"}</Button>
              </div>
            </form>
          ) : (
            <dl className="grid gap-4 sm:grid-cols-2">
              {editableFields.filter(([key]) => key !== "tenants").map(([key, label]) => (
                <div key={key} className="flex flex-col gap-1">
                  <dt className="text-field-label">{label}</dt>
                  <dd className="text-sm text-text">{values[key] || "—"}</dd>
                </div>
              ))}
              <div className="flex flex-col gap-1 sm:col-span-2">
                <dt className="text-field-label">Penyelenggara</dt>
                <dd className="text-sm text-text">{values.tenants.split(/\r?\n/).filter(Boolean).join(", ") || "—"}</dd>
              </div>
            </dl>
          )}
        </CardBody>
      </Card>

      <div><Button asChild variant="outline"><Link href="/submission/history">Kembali ke riwayat</Link></Button></div>
    </div>
  );
}
