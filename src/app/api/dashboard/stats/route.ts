import { NextResponse } from "next/server";
import { directusFetch } from "@/lib/directus-session";

type Attempt = {
  id?: string | number;
  status?: string;
  attempt_type?: string;
  registration_code?: string | null;
  metode_pendaftaran?: string;
  date_created?: string;
  date_updated?: string;
  submission_data?: { nama_pemilik?: string };
  user_first_name?: string;
  user_last_name?: string;
};
type Tower = {
  id: string;
  id_menara?: string;
  nama_pemilik?: string;
  provinsi?: string;
  metode_pendaftaran?: string;
  date_created?: string;
  tenants?: Array<{ penyelenggara?: string }>;
  registration_attempts?: Attempt[];
};
type DashboardActivity = Attempt & {
  towerId: string | null;
  towerCode: string;
  owner: string;
};

function getActivityTimestamp(activity: DashboardActivity) {
  return activity.status === "Draft"
    ? activity.date_updated || activity.date_created || ""
    : activity.date_created || activity.date_updated || "";
}

export async function GET() {
  let towers: Tower[] = [];
  let totalTowers = 0;
  let rejectedAttempts: Attempt[] = [];
  let draftCount = 0;
  let page = 1;
  try {
    do {
      const response = await directusFetch(
        `/applicant-portal/towers?page=${page}&limit=100`,
      );
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
            draft_count?: number;
          }
        | null;
      const pageTotal = payload?.meta?.total;
      if (
        !payload ||
        !Array.isArray(payload.data) ||
        typeof payload.draft_count !== "number" ||
        !Number.isInteger(payload.draft_count) ||
        payload.draft_count < 0 ||
        typeof pageTotal !== "number" ||
        !Number.isInteger(pageTotal) ||
        pageTotal < 0
      ) {
        return NextResponse.json(
          { error: "Respons data dashboard dari Directus tidak valid." },
          { status: 502 },
        );
      }
      if (page === 1) {
        totalTowers = pageTotal;
        rejectedAttempts = payload.rejected_attempts ?? [];
        draftCount = payload.draft_count;
      }
      if (payload.data.length === 0 && towers.length < totalTowers) {
        return NextResponse.json(
          { error: "Daftar data dashboard dari Directus tidak lengkap." },
          { status: 502 },
        );
      }
      towers = towers.concat(payload.data);
      page += 1;
    } while (towers.length < totalTowers);
  } catch {
    return NextResponse.json(
      { error: "Data dashboard tidak dapat dimuat dari Directus." },
      { status: 502 },
    );
  }
  const attempts: DashboardActivity[] = towers.flatMap((tower) =>
    (tower.registration_attempts ?? [])
      .filter((attempt) => attempt.status !== "Draft")
      .map((attempt) => ({
        ...attempt,
        towerId: tower.id,
        towerCode: tower.id_menara || "—",
        owner: tower.nama_pemilik || "—",
      })),
  );
  const registrationCodeByTowerId = new Map<string, string>();
  for (const attempt of attempts) {
    if (
      attempt.towerId &&
      attempt.status === "Registered" &&
      attempt.attempt_type === "New Registration" &&
      attempt.registration_code &&
      !registrationCodeByTowerId.has(attempt.towerId)
    ) {
      registrationCodeByTowerId.set(
        attempt.towerId,
        attempt.registration_code,
      );
    }
  }
  const registeredTowersWithoutRegisteredAttempt = towers.filter(
    (tower) =>
      !(tower.registration_attempts ?? []).some(
        (attempt) =>
          attempt.status === "Registered" || attempt.status === "Draft",
      ),
  );
  const fallbackRegisteredAttempts: DashboardActivity[] =
    registeredTowersWithoutRegisteredAttempt.map((tower) => ({
      id: `tower-${tower.id}`,
      status: "Registered",
      metode_pendaftaran: tower.metode_pendaftaran,
      date_created: tower.date_created,
      submission_data: { nama_pemilik: tower.nama_pemilik },
      towerId: tower.id,
      towerCode: tower.id_menara || "—",
      owner: tower.nama_pemilik || "—",
    }));
  const detachedRejectedAttempts: DashboardActivity[] = rejectedAttempts.map((attempt) => ({
    ...attempt,
    towerId: null,
    towerCode: "—",
    owner:
      attempt.submission_data?.nama_pemilik ||
      [attempt.user_first_name, attempt.user_last_name].filter(Boolean).join(" ") ||
      "—",
  }));
  const allActivities: DashboardActivity[] = [
    ...attempts,
    ...fallbackRegisteredAttempts,
    ...detachedRejectedAttempts,
  ];
  const methodCounts = allActivities.reduce(
    (counts, attempt) => {
      if (
        attempt.metode_pendaftaran === "Upload Excel" ||
        attempt.metode_pendaftaran === "Upload Document (.xlsx)"
      ) counts.excel += 1;
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
  const provinceKeys = new Set(
    towers
      .map((tower) => tower.provinsi?.trim().toLocaleLowerCase("id-ID"))
      .filter((province): province is string => Boolean(province)),
  );
  const trendRecords = [
    ...towers
      .filter((tower) => Boolean(tower.date_created))
      .map((tower) => ({
        timestamp: tower.date_created!,
        type: "tower" as const,
      })),
    ...allActivities
      .filter(
        (activity) =>
          (activity.status === "Registered" || activity.status === "Rejected") &&
          Boolean(getActivityTimestamp(activity)),
      )
      .map((activity) => ({
        timestamp: getActivityTimestamp(activity),
        type: "submission" as const,
      })),
  ];
  return NextResponse.json({
    success: true,
    system: { directusConnected: true, directusStatus: "healthy" },
    metrics: {
      totalTowers,
      totalCompanies: tenantCounts.size,
      totalProvinces: provinceKeys.size,
      totalSubmissions: allActivities.length + draftCount,
      registeredSubmissions: towers.length,
      rejectedSubmissions: rejectedAttempts.length +
        attempts.filter((attempt) => attempt.status === "Rejected").length,
      draftSubmissions: draftCount,
    },
    methodDistribution: {
      excelCount: methodCounts.excel,
      formCount: methodCounts.manual,
      excelPercent: methodTotal ? Math.round((methodCounts.excel / methodTotal) * 100) : 0,
      formPercent: methodTotal ? Math.round((methodCounts.manual / methodTotal) * 100) : 0,
    },
    topCompanies,
    trendRecords,
    recentActivities: allActivities
      .sort((left, right) =>
        getActivityTimestamp(right).localeCompare(getActivityTimestamp(left)),
      )
      .map((attempt) => ({
        id: `${attempt.towerId ?? "attempt"}-${attempt.id}`,
        regNumber:
          attempt.registration_code ||
          (attempt.towerId
            ? registrationCodeByTowerId.get(attempt.towerId)
            : undefined) ||
          "—",
        company: attempt.owner,
        method: attempt.metode_pendaftaran || "—",
        rows: 1,
        timestamp: getActivityTimestamp(attempt),
        status: attempt.status || "—",
      })),
  });
}
