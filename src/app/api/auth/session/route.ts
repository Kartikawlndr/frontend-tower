import { NextResponse } from "next/server";
import { clearDirectusTokens, directusFetch } from "@/lib/directus-session";

const roleMap = {
  Applicant: { role: "USER", roleLabel: "Normal User" },
  "Web Manager": { role: "MANAGER", roleLabel: "Web Manager" },
  Administrator: { role: "ADMIN", roleLabel: "Super Admin" },
} as const;

export async function GET() {
  const response = await directusFetch("/applicant-portal/profile");
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      await clearDirectusTokens();
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    return NextResponse.json(
      { authenticated: false, error: "Status sesi tidak dapat diperiksa." },
      { status: 503 },
    );
  }

  const payload = (await response.json().catch(() => null)) as
    | {
        data?: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          role?: string;
          must_change_password?: boolean;
        };
      }
    | null;
  const profile = payload?.data;
  if (
    !profile?.id ||
    !profile.email ||
    !profile.role ||
    !Object.hasOwn(roleMap, profile.role)
  ) {
    await clearDirectusTokens();
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: profile.id,
      name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email,
      email: profile.email,
      mustChangePassword: profile.must_change_password === true,
      ...roleMap[profile.role as keyof typeof roleMap],
    },
  });
}
