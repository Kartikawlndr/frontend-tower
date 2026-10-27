import { NextResponse } from "next/server";
import { directusFetch } from "@/lib/directus-session";

type Attempt = {
  status?: string;
  metode_pendaftaran?: string;
  date_created?: string;
};
type Tower = {
  id: string;
  id_menara?: string;
  nama_pemilik?: string;
  metode_pendaftaran?: string;
  tenants?: Array<{ penyelenggara?: string }>;
  registration_attempts?: Attempt[];
};

export async function GET() {
  let response: Response;
  try {
    response = await directusFetch("/applicant-portal/towers?limit=100");
  } catch {
    return NextResponse.json(
      { error: "Data dashboard tidak dapat dimuat dari Directus." },
      { status: 502 },
    );
  }
  if (!response.ok) {
    return NextResponse.json(
      { error: "Data dashboard tidak dapat dimuat dari Directus." },
      { status: response.status },
    );
  }

  const payload = (await response.json().catch(() => null)) as
    | {
        data?: Tower[];
        meta?: { total?: number };
        rejected_attempts?: Attempt[];
        draft_attempt?: { id?: string | number } | null;
      }
    | null;
  const towers = payload?.data ?? [];
  const attempts = towers.flatMap((tower) => tower.registration_attempts ?? []);
  const methodCounts = attempts.reduce(
    (counts, attempt) => {
      if (attempt.metode_pendaftaran === "Upload Excel") counts.excel += 1;
      else if (attempt.metode_pendaftaran === "Input Manual") counts.manual += 1;
      return counts;
    },
    { excel: 0, manual: 0 },
  );
  const methodTotal = methodCounts.excel + methodCounts.manual;
  const tenantCounts = new Map<string, number>();
  for (const tower of towers) {
    for (const tenant of tower.tenants ?? []) {
      if (!tenant.penyelenggara) continue;
      tenantCounts.set(
        tenant.penyelenggara,
        (tenantCounts.get(tenant.penyelenggara) ?? 0) + 1,
      );
    }
  }
  const topCompanies = Array.from(tenantCounts, ([name, count]) => ({
    name,
    count,
    percentage: towers.length ? Math.round((count / towers.length) * 100) : 0,
  }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 5);
  const totalTowers = payload?.meta?.total ?? towers.length;

  return NextResponse.json({
    success: true,
    system: { directusConnected: true, directusStatus: "healthy" },
    metrics: {
      totalTowers,
      totalCompanies: new Set(towers.map((tower) => tower.nama_pemilik).filter(Boolean)).size,
      totalProvinces: 0,
      totalSubmissions: attempts.length + (payload?.rejected_attempts?.length ?? 0),
      registeredSubmissions: attempts.filter((attempt) => attempt.status === "Registered").length,
      rejectedSubmissions: (payload?.rejected_attempts?.length ?? 0) +
        attempts.filter((attempt) => attempt.status === "Rejected").length,
      draftSubmissions: payload?.draft_attempt ? 1 : 0,
    },
    methodDistribution: {
      excelCount: methodCounts.excel,
      formCount: methodCounts.manual,
      excelPercent: methodTotal ? Math.round((methodCounts.excel / methodTotal) * 100) : 0,
      formPercent: methodTotal ? Math.round((methodCounts.manual / methodTotal) * 100) : 0,
    },
    topCompanies,
    monthlyTrends: [],
    recentActivities: attempts.slice(0, 6).map((attempt, index) => ({
      id: String(index),
      regNumber: towers[index]?.id_menara || "—",
      company: towers[index]?.nama_pemilik || "—",
      method: attempt.metode_pendaftaran || "—",
      rows: 1,
      timestamp: attempt.date_created || "",
      status: attempt.status || "—",
    })),
  });
}
