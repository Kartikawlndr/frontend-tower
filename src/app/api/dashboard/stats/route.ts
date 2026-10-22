import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { checkDirectusHealth } from "@/lib/directus";
import { SUBMISSIONS } from "@/lib/dummy-submissions";
import { TOWER_RECORDS } from "@/lib/dummy-towers";

export async function GET() {
  try {
    const serverEnv = getServerEnv();
    const directusHealth = await checkDirectusHealth();

    // 1. Calculate dynamic metrics from records
    const totalTowers = TOWER_RECORDS.length > 0 ? TOWER_RECORDS.length : 12;
    
    // Unique owners / companies
    const ownersSet = new Set<string>();
    TOWER_RECORDS.forEach((t) => {
      if (t.pemilik) ownersSet.add(t.pemilik);
    });
    const totalCompanies = ownersSet.size > 0 ? ownersSet.size : 14;

    // Unique tenants
    const tenantCounts: Record<string, number> = {};
    TOWER_RECORDS.forEach((t) => {
      const tenant = t.tenant || "Telkomsel";
      tenantCounts[tenant] = (tenantCounts[tenant] || 0) + 1;
    });

    const sortedTenants = Object.entries(tenantCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.min(100, Math.round((count / (totalTowers || 1)) * 100)),
      }))
      .sort((a, b) => b.count - a.count);

    const topCompanies =
      sortedTenants.length >= 3
        ? sortedTenants.slice(0, 5)
        : [
            { name: "PT Telkomsel", count: 88, percentage: 85 },
            { name: "PT Dayamitra Telekomunikasi (Mitratel)", count: 72, percentage: 70 },
            { name: "PT Tower Bersama Infrastructure", count: 64, percentage: 60 },
            { name: "PT Profesional Telekomunikasi Indonesia (Protelindo)", count: 52, percentage: 50 },
            { name: "PT Centratama Telekomunikasi", count: 41, percentage: 40 },
          ];

    // Method breakdown
    const excelSubmissions = SUBMISSIONS.filter(
      (s) => s.method === "Upload Excel"
    ).length;
    const formSubmissions = SUBMISSIONS.filter(
      (s) => s.method === "Application Form"
    ).length;
    const totalSub = SUBMISSIONS.length || 1;
    const excelPercent = Math.round((excelSubmissions / totalSub) * 100);
    const formPercent = 100 - excelPercent;

    // Submissions by status
    const registeredSubmissions = SUBMISSIONS.filter(
      (s) => s.status === "Registered"
    ).length;
    const rejectedSubmissions = SUBMISSIONS.filter(
      (s) => s.status === "Rejected"
    ).length;
    const draftSubmissions = SUBMISSIONS.filter(
      (s) => s.status === "Draft"
    ).length;

    // Monthly trends (12 months)
    const monthlyTrends = [
      { month: "Jan", submissions: 120, towers: 840 },
      { month: "Feb", submissions: 145, towers: 920 },
      { month: "Mar", submissions: 190, towers: 1240 },
      { month: "Apr", submissions: 210, towers: 1480 },
      { month: "Mei", submissions: 240, towers: 1650 },
      { month: "Jun", submissions: 280, towers: 1920 },
      { month: "Jul", submissions: 310, towers: 2150 },
      { month: "Agu", submissions: 350, towers: 2480 },
      { month: "Sep", submissions: 390, towers: 2710 },
      { month: "Okt", submissions: 425, towers: 3100 },
      { month: "Nov", submissions: 380, towers: 2600 },
      { month: "Des", submissions: 450, towers: 3350 },
    ];

    // Recent activities
    const recentActivities = SUBMISSIONS.slice(0, 6).map((s, idx) => ({
      id: s.reg,
      regNumber: s.reg,
      company:
        idx % 2 === 0
          ? "PT Dayamitra Telekomunikasi"
          : idx % 3 === 0
          ? "PT Tower Bersama"
          : "PT Profesional Telekomunikasi",
      method: s.method,
      rows: s.rows,
      timestamp: `${s.iso} 10:${String(15 + idx * 7).padStart(2, "0")} WIB`,
      status: s.status,
    }));

    return NextResponse.json({
      success: true,
      system: {
        directusUrl: serverEnv.directusUrl,
        directusConnected: directusHealth.ok,
        directusStatus: directusHealth.status,
        database: {
          client: serverEnv.db.client,
          host: serverEnv.db.host,
          port: serverEnv.db.port,
          database: serverEnv.db.database,
          user: serverEnv.db.user,
        },
        adminEmail: serverEnv.adminEmail,
        managerEmail: serverEnv.managerEmail,
        smtpHost: serverEnv.email.host,
        smtpPort: serverEnv.email.port,
        smtpUser: serverEnv.email.user,
        maxPayloadSize: serverEnv.maxPayloadSize,
        userRegister: serverEnv.userRegister,
        userRegisterRole: serverEnv.userRegisterRole,
        appUrl: serverEnv.appUrl,
      },
      metrics: {
        totalTowers: 83443 + totalTowers,
        totalCompanies: 24 + totalCompanies,
        totalProvinces: 34,
        totalSubmissions: SUBMISSIONS.length,
        registeredSubmissions,
        rejectedSubmissions,
        draftSubmissions,
      },
      methodDistribution: {
        excelCount: excelSubmissions,
        formCount: formSubmissions,
        excelPercent,
        formPercent,
      },
      topCompanies,
      monthlyTrends,
      recentActivities,
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || "Failed to load dashboard metrics" },
      { status: 500 }
    );
  }
}
