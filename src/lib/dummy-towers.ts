import { SUBMISSIONS, makeTowerRows, type TowerRow } from "@/lib/dummy-submissions";
 
export interface TowerRecord extends TowerRow {
  id: string;
  reg: string;
  kapMaks: string;
  kapSewa: string;
  kapSendiri: string;
}
 
function build(): TowerRecord[] {
  const out: TowerRecord[] = [];
  let n = 0;
  for (const s of SUBMISSIONS) {
    if (s.status !== "Registered") continue;
    for (const r of makeTowerRows(s.rows)) {
      n += 1;
      out.push({
        ...r,
        kode: `TWR-${1000 + n}`,
        id: `${s.reg}-${n}`,
        reg: s.reg,
        kapMaks: `${6 + (n % 5)} slot`,
        kapSewa: `${2 + (n % 4)} slot`,
        kapSendiri: `${1 + (n % 2)} slot`,
      });
    }
  }
  return out;
}
 
export const TOWER_RECORDS: TowerRecord[] = build();
 
export const JENIS_OPTIONS = Array.from(
  new Set(TOWER_RECORDS.map((r) => r.jenis))
).sort();
