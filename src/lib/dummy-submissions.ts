export type SubmissionStatus = "Registered" | "Rejected" | "Draft";
export type SubmissionMethod = "Upload Excel" | "Application Form";
 
export interface Submission {
  reg: string;
  iso: string;
  method: SubmissionMethod;
  rows: number;
  status: SubmissionStatus;
}
 
export interface TowerRow {
  kode: string;
  pemilik: string;
  tahun: string;
  tenant: string;
  longitude: string;
  latitude: string;
  alamat: string;
  jenis: string;
  tinggi: string;
}
 
export const STATUS_VARIANT = {
  Registered: "success",
  Rejected: "destructive",
  Draft: "warning",
} as const;
 
const TOTAL = 27;
 
export const SUBMISSIONS: Submission[] = Array.from({ length: TOTAL }, (_, i) => {
  const method: SubmissionMethod = i % 3 === 1 ? "Application Form" : "Upload Excel";
  let status: SubmissionStatus = "Registered";
  if (i % 5 === 3) status = "Rejected";
  else if (method === "Application Form" && i % 2 === 1) status = "Draft";
 
  return {
    reg: `REG-2026-${String(TOTAL - i).padStart(6, "0")}`,
    iso: `2026-10-${String(19 - Math.floor(i / 2)).padStart(2, "0")}`,
    method,
    rows: method === "Application Form" ? 1 + (i % 3) : 12 + ((i * 7) % 40),
    status,
  };
});
 
export function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
 
const OWNERS = ["PT Menara Contoh", "PT Sarana Contoh", "PT Infra Contoh"];
const TENANTS = ["Operator A", "Operator B", "Operator C"];
const JENIS = ["Greenfield", "Rooftop", "Monopole", "Guyed"];
 
export function makeTowerRows(count: number): TowerRow[] {
  return Array.from({ length: count }, (_, i) => ({
    kode: `TWR-${1001 + i}`,
    pemilik: OWNERS[i % OWNERS.length],
    tahun: String(2008 + (i % 17)),
    tenant: TENANTS[i % TENANTS.length],
    longitude: (106.5 + ((i * 37) % 100) / 100).toFixed(6),
    latitude: (-6.5 + ((i * 53) % 100) / 100).toFixed(6),
    alamat: `Jl. Contoh No. ${i + 1}, Jakarta`,
    jenis: JENIS[i % JENIS.length],
    tinggi: String(30 + ((i * 7) % 60)),
  }));
}
