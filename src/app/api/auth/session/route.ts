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
    if (response.status === 401) await clearDirectusTokens();
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const payload = (await response.json().catch(() => null)) as
    | {
        data?: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          role?: string;
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
    return NextResponse.json({ authenticated: false }, { status: 403 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: profile.id,
      name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email,
      email: profile.email,
      ...roleMap[profile.role as keyof typeof roleMap],
    },
  });
}
