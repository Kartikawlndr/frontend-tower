import { NextResponse } from "next/server";
import { checkDirectusHealth } from "@/lib/directus";

export async function GET() {
  const directus = await checkDirectusHealth();
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    directus,
  });
}
